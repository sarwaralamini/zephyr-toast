/**
 * @fileoverview Icon rendering security tests for ZephyrToast.
 *
 * Verifies that custom icon class names and image URLs are
 * rendered safely without interpreting their contents as HTML.
 *
 * Tests protect against attribute injection, unintended DOM
 * element creation, and executable event-handler attributes.
 *
 * The compiled standalone browser distribution is evaluated
 * in isolated JSDOM environments to verify production behavior.
 *
 * @module tests/zephyr-toast.security
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Compiled standalone browser distribution.
 *
 * The browser bundle must be built before running these tests.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../dist/zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates an isolated browser environment and loads ZephyrToast.
 *
 * Evaluates the production IIFE in JSDOM's VM context and
 * retrieves the public constructor from window.ZephyrToast.
 *
 * The script reference supports stylesheet discovery without
 * loading external JavaScript resources.
 *
 * @returns {{ dom: JSDOM, ZephyrToast: Function }}
 *   Initialized browser environment and constructor.
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

  runInContext(source, dom.getInternalVMContext());

  return {
    dom,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Verifies secure rendering of custom notification icons.
 *
 * Tests inspect generated DOM elements and attributes
 * rather than executing potentially unsafe payloads.
 */
describe("ZephyrToast Icon Security", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes a fresh browser environment before each test.
   *
   * @returns {void}
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
  });

  /**
   * Releases browser resources after each test.
   *
   * @returns {void}
   */
  afterEach(() => {
    dom.window.close();
  });

  /**
   * Returns the icon container of a notification.
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
  // 1. Icon Class Safety
  // ----------------------------------------------------------

  describe("Icon Class Safety", () => {
    it("does not interpret icon class strings as HTML", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Secure icon", {
        duration: 0,
        icon: 'custom-icon"><img src=x onerror=alert(1)>',
      });

      const container = getIconContainer(element);

      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("[onerror]")).toBeNull();

      expect(container.querySelector("script")).toBeNull();
    });

    it("does not create HTML elements from FontAwesome classes", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Secure icon", {
        duration: 0,
        icon: {
          fontAwesome: 'fa-check"><svg onload=alert(1)>',
        },
      });

      const container = getIconContainer(element);

      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector("[onload]")).toBeNull();

      expect(container.querySelector("script")).toBeNull();
    });

    it("renders valid icon class names normally", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Valid icon", {
        duration: 0,
        icon: "fas fa-check-circle",
      });

      const container = getIconContainer(element);
      const icon = container.querySelector("i");

      expect(icon).not.toBeNull();

      expect(icon.classList.contains("fas")).toBe(true);
      expect(icon.classList.contains("fa-check-circle")).toBe(true);

      expect(icon.hasAttribute("onerror")).toBe(false);
      expect(icon.hasAttribute("onload")).toBe(false);
    });

    it("renders structured FontAwesome classes safely", () => {
      const toast = new ZephyrToast();

      const element = toast.info("FontAwesome icon", {
        duration: 0,
        icon: {
          fontAwesome: "fas fa-info-circle",
        },
      });

      const container = getIconContainer(element);
      const icon = container.querySelector("i");

      expect(icon).not.toBeNull();

      expect(icon.classList.contains("fas")).toBe(true);
      expect(icon.classList.contains("fa-info-circle")).toBe(true);

      expect(container.querySelector("[onclick]")).toBeNull();
      expect(container.querySelector("[onload]")).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // 2. Image URL Safety
  // ----------------------------------------------------------

  describe("Image URL Safety", () => {
    it("does not create event attributes from image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Secure image", {
        duration: 0,
        icon: {
          url: 'icon.png" onerror="alert(1)',
        },
      });

      const container = getIconContainer(element);
      const image = container.querySelector("img");

      expect(image).not.toBeNull();

      expect(image.hasAttribute("onerror")).toBe(false);
      expect(image.hasAttribute("onload")).toBe(false);

      expect(container.querySelector("[onerror]")).toBeNull();
    });

    it("preserves valid HTTPS image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Valid image", {
        duration: 0,
        icon: {
          url: "https://example.com/icon.png",
          width: "24px",
          height: "24px",
        },
      });

      const container = getIconContainer(element);
      const image = container.querySelector("img");

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe("https://example.com/icon.png");

      expect(image.style.width).toBe("24px");
      expect(image.style.height).toBe("24px");

      expect(image.hasAttribute("onerror")).toBe(false);
    });

    it("preserves query parameters in valid image URLs", () => {
      const toast = new ZephyrToast();

      const url = "https://example.com/icon.png?v=2&size=24";

      const element = toast.info("Image with query string", {
        duration: 0,
        icon: { url },
      });

      const image = getIconContainer(element).querySelector("img");

      expect(image).not.toBeNull();
      expect(image.getAttribute("src")).toBe(url);
    });
  });

  // ----------------------------------------------------------
  // 3. DOM Integrity
  // ----------------------------------------------------------

  describe("DOM Integrity", () => {
    it("does not create unrelated elements from icon class input", () => {
      const toast = new ZephyrToast();

      const element = toast.info("DOM safety", {
        duration: 0,
        icon: 'fas fa-info"><button onclick="alert(1)">',
      });

      const container = getIconContainer(element);

      expect(container.querySelector("button")).toBeNull();
      expect(container.querySelector("[onclick]")).toBeNull();

      expect(element.isConnected).toBe(true);
    });

    it("preserves notification content when rendering a custom icon", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Original message", {
        duration: 0,
        icon: "fas fa-info-circle",
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message).not.toBeNull();
      expect(message.textContent).toBe("Original message");

      expect(getIconContainer(element).querySelector("i")).not.toBeNull();
    });
  });
});
