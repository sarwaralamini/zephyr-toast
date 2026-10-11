/**
 * @fileoverview Security regression tests for modular ZephyrToast.
 *
 * Verifies protection against unsafe SVG markup, malicious image
 * URLs, icon class injection, and untrusted HTML content.
 *
 * Covers built-in SVG icons, safe and unsafe icon customization,
 * DOM integrity, and notification container positioning.
 *
 * Tests the source ES module implementation directly using
 * isolated JSDOM environments and Vitest fake timers.
 *
 * @module tests/zephyr-toast.modular-security
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ZephyrToast from "../src/index.js";

/**
 * Verifies secure rendering through the modular public API.
 */
describe("ZephyrToast Modular Security", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {ZephyrToast} */
  let toast;

  /**
   * Initializes an isolated DOM and fake timers.
   *
   * @returns {void}
   */
  beforeEach(() => {
    vi.useFakeTimers();

    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
      url: "https://example.com/",
    });

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  /**
   * Restores timers, mocks, globals, and browser resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    dom.window.close();
  });

  /**
   * Creates a persistent notification with a custom icon.
   *
   * @param {string | Object | null} icon - Icon configuration.
   * @returns {HTMLElement} Rendered notification element.
   */
  function renderIcon(icon) {
    return toast.info("Security test", {
      duration: 0,
      icon,
    });
  }

  /**
   * Verifies that rejected icon content does not modify
   * the notification container or its existing children.
   *
   * @param {string | Object} icon - Unsafe icon configuration.
   * @returns {void}
   */
  function expectRejectedIcon(icon) {
    const previousChildren = [...toast.container.children];
    const previousClassName = toast.container.className;
    const previousPosition = toast.options.position;

    expect(() => {
      renderIcon(icon);
    }).toThrow();

    expect([...toast.container.children]).toEqual(previousChildren);
    expect(toast.container.className).toBe(previousClassName);
    expect(toast.options.position).toBe(previousPosition);
  }

  /**
   * Returns the custom icon container of a notification.
   *
   * @param {HTMLElement} element - Notification element.
   * @returns {HTMLElement} Icon container.
   */
  function getIconContainer(element) {
    const container = element.querySelector(".zephyr-toast-notification-icon");

    expect(container).not.toBeNull();

    return container;
  }

  // ----------------------------------------------------------
  // 1. Custom SVG Security
  // ----------------------------------------------------------

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

    it("rejects SVG animation elements", () => {
      expectRejectedIcon({
        svg: '<svg><animate attributeName="opacity" from="0" to="1" /></svg>',
      });
    });

    it("rejects multiple SVG root elements", () => {
      expectRejectedIcon({
        svg: "<svg></svg><svg></svg>",
      });
    });

    it("rejects inline SVG styles", () => {
      expectRejectedIcon({
        svg: '<svg style="background:red"><path d="M0 0L5 5" /></svg>',
      });
    });

    it("accepts safe nested SVG drawing elements", () => {
      const element = renderIcon({
        svg: '<svg viewBox="0 0 24 24"><g><circle cx="12" cy="12" r="8" fill="currentColor" /></g></svg>',
      });

      const svg = getIconContainer(element).querySelector("svg");

      expect(svg).not.toBeNull();
      expect(svg.querySelector("g")).not.toBeNull();
      expect(svg.querySelector("circle")).not.toBeNull();
      expect(svg.hasAttribute("onload")).toBe(false);
    });

    it("preserves safe SVG drawing attributes", () => {
      const element = renderIcon({
        svg: '<svg viewBox="0 0 24 24"><path d="M2 2L12 12" fill="none" stroke="currentColor" /></svg>',
      });

      const path = getIconContainer(element).querySelector("svg path");

      expect(path).not.toBeNull();
      expect(path.getAttribute("d")).toBe("M2 2L12 12");
      expect(path.getAttribute("fill")).toBe("none");
      expect(path.getAttribute("stroke")).toBe("currentColor");
      expect(path.hasAttribute("onclick")).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 2. Built-In SVG Icon Validation
  // ----------------------------------------------------------

  describe("Built-In SVG Icon Validation", () => {
    it("renders all built-in notification icons through SVG validation", () => {
      const notificationTypes = [
        "success",
        "info",
        "warning",
        "error",
        "zen",
        "void",
      ];

      for (const type of notificationTypes) {
        const element = toast[type]("Built-in SVG test", {
          duration: 0,
        });

        const svg = element.querySelector(
          ".zephyr-toast-notification-icon svg",
        );

        expect(svg).not.toBeNull();

        expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");

        expect(svg.querySelector("path")).not.toBeNull();

        expect(svg.hasAttribute("onload")).toBe(false);
      }
    });

    it("rejects unsafe modifications to built-in SVG icons", () => {
      toast.types.success.icon =
        '<svg onload="alert(1)"><path d="M0 0" /></svg>';

      const previousCount = toast.container.children.length;

      expect(() => {
        toast.success("Unsafe built-in SVG", {
          duration: 0,
        });
      }).toThrow(/svg|unsafe|attribute/i);

      expect(toast.container.children.length).toBe(previousCount);
    });

    it("rejects script elements in modified built-in SVG icons", () => {
      toast.types.info.icon = "<svg><script>alert(1)</script></svg>";

      const previousCount = toast.container.children.length;

      expect(() => {
        toast.info("Unsafe built-in SVG", {
          duration: 0,
        });
      }).toThrow(/svg|unsafe|unsupported/i);

      expect(toast.container.children.length).toBe(previousCount);
    });

    it("accepts safe customizations to built-in SVG icons", () => {
      toast.types.success.icon =
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg>';

      const element = toast.success("Safe SVG customization", {
        duration: 0,
      });

      const svg = element.querySelector(".zephyr-toast-notification-icon svg");

      expect(svg).not.toBeNull();
      expect(svg.querySelector("circle")).not.toBeNull();
      expect(svg.hasAttribute("onload")).toBe(false);
    });

    it("does not affect other notification types after customizing one icon", () => {
      toast.types.success.icon =
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>';

      const success = toast.success("Custom success", {
        duration: 0,
      });

      const info = toast.info("Default info", {
        duration: 0,
      });

      expect(
        success.querySelector(".zephyr-toast-notification-icon svg circle"),
      ).not.toBeNull();

      expect(
        info.querySelector(".zephyr-toast-notification-icon svg path"),
      ).not.toBeNull();
    });
  });

  // ----------------------------------------------------------
  // 3. Image URL Security
  // ----------------------------------------------------------

  describe("Image URL Security", () => {
    it.each([
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:image/svg+xml,<svg></svg>",
      "file:///etc/passwd",
    ])("rejects unsafe image URL protocols", (url) => {
      expectRejectedIcon({ url });
    });

    it("accepts HTTPS image URLs", () => {
      const element = renderIcon({
        url: "https://example.com/icon.png",
        width: "24px",
        height: "24px",
      });

      const image = getIconContainer(element).querySelector("img");

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe("https://example.com/icon.png");

      expect(image.style.width).toBe("24px");
      expect(image.style.height).toBe("24px");

      expect(image.hasAttribute("onerror")).toBe(false);
    });

    it("accepts relative image URLs", () => {
      const element = renderIcon({
        url: "/assets/icons/check.png",
      });

      const image = getIconContainer(element).querySelector("img");

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe("/assets/icons/check.png");
    });

    it("preserves query strings in valid image URLs", () => {
      const url = "https://example.com/icon.png?v=2&size=24";

      const element = renderIcon({ url });

      const image = getIconContainer(element).querySelector("img");

      expect(image).not.toBeNull();
      expect(image.getAttribute("src")).toBe(url);
    });
  });

  // ----------------------------------------------------------
  // 4. DOM Injection Protection
  // ----------------------------------------------------------

  describe("DOM Injection Protection", () => {
    it("does not interpret icon classes as HTML", () => {
      const element = renderIcon('custom-icon"><img src=x onerror=alert(1)>');

      const icon = getIconContainer(element);

      expect(icon.querySelector("img")).toBeNull();
      expect(icon.querySelector("[onerror]")).toBeNull();
      expect(icon.querySelector("script")).toBeNull();
    });

    it("does not interpret structured FontAwesome classes as HTML", () => {
      const element = renderIcon({
        fontAwesome: 'fa-check"><svg onload=alert(1)>',
      });

      const icon = getIconContainer(element);

      expect(icon.querySelector("svg")).toBeNull();
      expect(icon.querySelector("[onload]")).toBeNull();
    });

    it("renders valid FontAwesome classes correctly", () => {
      const element = renderIcon({
        fontAwesome: "fas fa-check-circle",
      });

      const icon = getIconContainer(element).querySelector("i");

      expect(icon).not.toBeNull();
      expect(icon.classList.contains("fas")).toBe(true);
      expect(icon.classList.contains("fa-check-circle")).toBe(true);
    });

    it("renders untrusted notification messages as text", () => {
      const message = '<img src="x" onerror="alert(1)">';

      const element = toast.info(message, {
        duration: 0,
      });

      const content = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(content).not.toBeNull();
      expect(content.querySelector("img")).toBeNull();
      expect(content.textContent).toBe(message);
    });

    it("does not create script elements from untrusted messages", () => {
      const message = '<script>alert("unsafe")</script>';

      const element = toast.info(message, {
        duration: 0,
        allowHtml: false,
      });

      const content = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(content.querySelector("script")).toBeNull();
      expect(content.textContent).toBe(message);
    });

    it("allows trusted HTML only when explicitly enabled", () => {
      const element = toast.info("<strong>Trusted content</strong>", {
        duration: 0,
        allowHtml: true,
      });

      const content = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      const strong = content.querySelector("strong");

      expect(strong).not.toBeNull();
      expect(strong.textContent).toBe("Trusted content");
    });
  });

  // ----------------------------------------------------------
  // 5. Container Position and DOM Integrity
  // ----------------------------------------------------------

  describe("Container Position and DOM Integrity", () => {
    it("preserves the container position when SVG rendering fails", () => {
      const originalPosition = toast.options.position;
      const originalClassName = toast.container.className;
      const originalCount = toast.container.children.length;

      expect(() => {
        toast.info("Invalid SVG with position override", {
          duration: 0,
          position: "bottom-left",
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow(/svg|unsafe|attribute/i);

      expect(toast.options.position).toBe(originalPosition);
      expect(toast.container.className).toBe(originalClassName);
      expect(toast.container.children.length).toBe(originalCount);
    });

    it("updates the container position after successful rendering", () => {
      const element = toast.info("Valid notification", {
        duration: 0,
        position: "bottom-left",
      });

      expect(element.parentNode).toBe(toast.container);
      expect(toast.options.position).toBe("bottom-left");

      expect(
        toast.container.classList.contains("zephyr-position-bottom-left"),
      ).toBe(true);
    });

    it("does not append a notification after unsafe SVG rejection", () => {
      expectRejectedIcon({
        svg: "<svg><script>alert(1)</script></svg>",
      });

      expect(toast.container.children).toHaveLength(0);
    });

    it("preserves existing notifications after icon rejection", () => {
      const existing = toast.success("Existing notification", {
        duration: 0,
      });

      expectRejectedIcon({
        svg: '<svg onload="alert(1)"></svg>',
      });

      expect(toast.container.children).toHaveLength(1);
      expect(toast.container.contains(existing)).toBe(true);
    });

    it("accepts valid notifications after rejecting unsafe icons", () => {
      expectRejectedIcon({
        url: "javascript:alert(1)",
      });

      const element = toast.success("Valid notification", {
        duration: 0,
      });

      expect(element.isConnected).toBe(true);
      expect(toast.container.children).toHaveLength(1);
    });

    it("does not modify the container after rejecting unsafe positioned content", () => {
      const previousPosition = toast.options.position;
      const previousClassName = toast.container.className;
      const previousChildren = [...toast.container.children];

      expect(() => {
        toast.info("Unsafe positioned notification", {
          duration: 0,
          position: "bottom-left",
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow();

      expect(toast.options.position).toBe(previousPosition);
      expect(toast.container.className).toBe(previousClassName);
      expect([...toast.container.children]).toEqual(previousChildren);
    });
  });
});
