/**
 * @fileoverview Security regression tests for modular ZephyrToast.
 *
 * Verifies protection against unsafe SVG markup, malicious
 * image URLs, icon class injection, and untrusted HTML.
 *
 * Tests the modular public API instead of the legacy script.
 *
 * @module tests/zephyr-toast.modular-security
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { JSDOM } from "jsdom";
import ZephyrToast from "../src/index.js";

describe("ZephyrToast Modular Security", () => {
  let dom;
  let toast;

  beforeEach(() => {
    vi.useFakeTimers();

    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
      url: "https://example.com/",
    });

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();

    dom.window.close();
  });

  /**
   * Creates a persistent notification with a custom icon.
   *
   * @param {string|Object} icon - Icon configuration.
   * @returns {HTMLElement} The notification element.
   */
  function renderIcon(icon) {
    return toast.info("Security test", {
      duration: 0,
      icon,
    });
  }

  /**
   * Ensures rejected icons do not insert notifications.
   *
   * @param {string|Object} icon - Unsafe icon configuration.
   * @returns {void}
   */
  function expectRejectedIcon(icon) {
    const previousCount = toast.container.children.length;

    expect(() => {
      renderIcon(icon);
    }).toThrow();

    expect(toast.container.children.length).toBe(previousCount);
  }

  describe("SVG Security", () => {
    it("rejects SVG event handlers", () => {
      expectRejectedIcon({
        svg: '<svg onload="alert(1)"></svg>',
      });
    });

    it("rejects scripts nested inside SVG", () => {
      expectRejectedIcon({
        svg: "<svg><script>alert(1)</script></svg>",
      });
    });

    it("rejects foreignObject with HTML content", () => {
      expectRejectedIcon({
        svg: '<svg><foreignObject><div onclick="alert(1)">Unsafe</div></foreignObject></svg>',
      });
    });

    it("rejects external SVG resource references", () => {
      expectRejectedIcon({
        svg: '<svg><path d="M0 0" fill="url(https://example.com/image.svg)" /></svg>',
      });
    });

    it("accepts safe nested SVG drawing elements", () => {
      const element = renderIcon({
        svg: '<svg viewBox="0 0 24 24"><g><circle cx="12" cy="12" r="8" fill="currentColor" /></g></svg>',
      });

      const svg = element.querySelector(".zephyr-toast-notification-icon svg");

      expect(svg).not.toBeNull();
      expect(svg.querySelector("circle")).not.toBeNull();
      expect(svg.hasAttribute("onload")).toBe(false);
    });
  });

  describe("Image URL Security", () => {
    it("rejects JavaScript image URLs", () => {
      expectRejectedIcon({
        url: "javascript:alert(1)",
      });
    });

    it("rejects data image URLs", () => {
      expectRejectedIcon({
        url: "data:image/svg+xml,<svg></svg>",
      });
    });

    it("accepts HTTPS image URLs", () => {
      const element = renderIcon({
        url: "https://example.com/icon.png",
        width: "24px",
        height: "24px",
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();
      expect(image.getAttribute("src")).toBe("https://example.com/icon.png");

      expect(image.style.width).toBe("24px");
      expect(image.style.height).toBe("24px");
    });
  });

  describe("DOM Injection Protection", () => {
    it("does not interpret icon classes as HTML", () => {
      const element = renderIcon('custom-icon"><img src=x onerror=alert(1)>');

      const icon = element.querySelector(".zephyr-toast-notification-icon");

      expect(icon.querySelector("img")).toBeNull();
      expect(icon.querySelector("[onerror]")).toBeNull();
    });

    it("renders untrusted notification messages as text", () => {
      const element = toast.info('<img src="x" onerror="alert(1)">', {
        duration: 0,
      });

      expect(element.querySelector("img")).toBeNull();

      expect(element.textContent).toContain("<img");
    });
  });
});
