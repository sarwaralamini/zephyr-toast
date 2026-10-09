/**
 * @fileoverview Security regression tests for ZephyrToast.
 *
 * Verifies that custom icon classes and image URLs are handled
 * without introducing unintended HTML elements or executable
 * event-handler attributes.
 *
 * These tests establish safe DOM rendering requirements before
 * the icon rendering implementation is refactored.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Source code of the standalone ZephyrToast library.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../dist/zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates an isolated DOM and evaluates the existing library.
 *
 * The document includes the browser script reference required
 * by the current stylesheet discovery implementation.
 *
 * @returns {{dom: JSDOM, ZephyrToast: Function}}
 *   The initialized testing environment.
 */
function createTestEnvironment() {
  const dom = new JSDOM(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <script src="/zephyr-toast.js"></script>
      </head>
      <body></body>
    </html>`,
    {
      url: "http://localhost/",
      runScripts: "outside-only",
    },
  );

  // The generated IIFE bundle registers window.ZephyrToast itself.
  runInContext(source, dom.getInternalVMContext());

  return {
    dom,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Verifies secure rendering of custom notification icons.
 *
 * The tests inspect generated DOM structure and attributes.
 * They do not rely on executing malicious payloads.
 */
describe("ZephyrToast Icon Security", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Creates a fresh test environment before each test.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
  });

  /**
   * Releases the browser environment after each test.
   */
  afterEach(() => {
    dom.window.close();
  });

  describe("Icon Class Safety", () => {
    it("does not interpret icon class strings as HTML", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Secure icon", {
        duration: 0,
        icon: 'custom-icon"><img src=x onerror=alert(1)>',
      });

      const container = element.querySelector(
        ".zephyr-toast-notification-icon",
      );

      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("[onerror]")).toBeNull();
    });

    it("does not create HTML elements from FontAwesome classes", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Secure icon", {
        duration: 0,
        icon: {
          fontAwesome: 'fa-check"><svg onload=alert(1)>',
        },
      });

      const container = element.querySelector(
        ".zephyr-toast-notification-icon",
      );

      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector("[onload]")).toBeNull();
    });

    it("renders valid icon class names normally", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Valid icon", {
        duration: 0,
        icon: "fas fa-check-circle",
      });

      const icon = element.querySelector(".zephyr-toast-notification-icon i");

      expect(icon).not.toBeNull();
      expect(icon.classList.contains("fas")).toBe(true);
      expect(icon.classList.contains("fa-check-circle")).toBe(true);
    });
  });

  describe("Image URL Safety", () => {
    it("does not create event attributes from image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Secure image", {
        duration: 0,
        icon: {
          url: 'icon.png" onerror="alert(1)',
        },
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();
      expect(image.hasAttribute("onerror")).toBe(false);
    });

    it("preserves valid image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Valid image", {
        duration: 0,
        icon: {
          url: "https://example.com/icon.png",
          width: "24px",
          height: "24px",
        },
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
});
