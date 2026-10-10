/**
 * @fileoverview Content and icon security integration tests for ZephyrToast.
 *
 * Verifies safe rendering of untrusted messages, explicitly
 * enabled HTML content, custom SVG validation, image URL
 * restrictions, and DOM integrity after rejected input.
 *
 * Tests execute the compiled standalone browser distribution
 * in isolated JSDOM environments.
 *
 * @module tests/zephyr-toast.content-security
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
 * Evaluates the compiled IIFE in JSDOM's VM context and
 * retrieves the constructor exposed through window.ZephyrToast.
 *
 * The script reference supports automatic stylesheet discovery
 * without loading external JavaScript resources.
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
 * Verifies message rendering, icon validation, and DOM integrity
 * through the standalone browser API.
 */
describe("ZephyrToast Content Security", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes an independent browser environment.
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

  // ----------------------------------------------------------
  // 1. Default Message Safety
  // ----------------------------------------------------------

  describe("Default Message Safety", () => {
    it("renders HTML-like messages as plain text by default", () => {
      const toast = new ZephyrToast();

      const element = toast.info('<img src="x" onerror="alert(1)">', {
        duration: 0,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message).not.toBeNull();
      expect(message.querySelector("img")).toBeNull();
      expect(message.textContent).toBe('<img src="x" onerror="alert(1)">');
    });

    it("does not create script elements from untrusted messages", () => {
      const toast = new ZephyrToast();

      const element = toast.info('<script>alert("unsafe")</script>', {
        duration: 0,
        allowHtml: false,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message.querySelector("script")).toBeNull();
      expect(message.textContent).toBe('<script>alert("unsafe")</script>');
    });

    it("does not create event-handler elements from untrusted messages", () => {
      const toast = new ZephyrToast();

      const element = toast.info('<button onclick="alert(1)">Click</button>', {
        duration: 0,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message.querySelector("button")).toBeNull();
      expect(message.textContent).toContain("onclick");
    });

    it("preserves harmless special characters as text", () => {
      const toast = new ZephyrToast();

      const text = 'Price < 100 & value > 10 "quoted"';

      const element = toast.info(text, {
        duration: 0,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message.textContent).toBe(text);
    });
  });

  // ----------------------------------------------------------
  // 2. Explicitly Enabled HTML
  // ----------------------------------------------------------

  describe("Trusted HTML Mode", () => {
    it("renders HTML when explicitly enabled", () => {
      const toast = new ZephyrToast();

      const element = toast.info("<strong>Important message</strong>", {
        duration: 0,
        allowHtml: true,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      const strong = message.querySelector("strong");

      expect(strong).not.toBeNull();
      expect(strong.textContent).toBe("Important message");
    });

    it("supports nested trusted HTML markup", () => {
      const toast = new ZephyrToast();

      const element = toast.info("<p><strong>Notice</strong> updated</p>", {
        duration: 0,
        allowHtml: true,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message.querySelector("p strong")).not.toBeNull();
      expect(message.textContent).toBe("Notice updated");
    });

    it("does not enable HTML rendering on subsequent notifications", () => {
      const toast = new ZephyrToast();

      const trusted = toast.info("<strong>Trusted</strong>", {
        duration: 0,
        allowHtml: true,
      });

      const untrusted = toast.info("<strong>Untrusted</strong>", {
        duration: 0,
      });

      expect(trusted.querySelector("strong")).not.toBeNull();

      const message = untrusted.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message.querySelector("strong")).toBeNull();
      expect(message.textContent).toBe("<strong>Untrusted</strong>");
    });
  });

  // ----------------------------------------------------------
  // 3. Custom SVG Security
  // ----------------------------------------------------------

  describe("Custom SVG Security", () => {
    it.each([
      '<svg onload="alert(1)"></svg>',
      '<svg><path onclick="alert(1)" d="M2 2L12 12" /></svg>',
    ])("rejects SVG event-handler attributes", (svg) => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe SVG", {
          duration: 0,
          icon: { svg },
        });
      }).toThrow(/svg|unsafe|security|attribute/i);
    });

    it("rejects SVG containing script elements", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe script", {
          duration: 0,
          icon: {
            svg: "<svg><script>alert(1)</script></svg>",
          },
        });
      }).toThrow(/svg|unsafe|security|element/i);
    });

    it("supports ordinary SVG icon markup", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Safe SVG", {
        duration: 0,
        icon: {
          svg: '<svg viewBox="0 0 24 24"><path d="M2 2L12 12" /></svg>',
        },
      });

      const svg = element.querySelector(".zephyr-toast-notification-icon svg");

      expect(svg).not.toBeNull();
      expect(svg.querySelector("path")).not.toBeNull();
      expect(svg.hasAttribute("onload")).toBe(false);
    });

    it("does not append unsafe SVG after rejection", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe SVG", {
          duration: 0,
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow();

      expect(toast.container.children).toHaveLength(0);
      expect(dom.window.document.querySelector("svg")).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // 4. Image URL Security
  // ----------------------------------------------------------

  describe("Image URL Security", () => {
    it.each(["javascript:alert(1)", "data:image/svg+xml,<svg></svg>"])(
      "rejects unsafe image URL schemes",
      (url) => {
        const toast = new ZephyrToast();

        expect(() => {
          toast.info("Unsafe image", {
            duration: 0,
            icon: { url },
          });
        }).toThrow(/url|http|protocol/i);
      },
    );

    it("accepts HTTPS image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Safe image", {
        duration: 0,
        icon: {
          url: "https://example.com/icon.png",
        },
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe("https://example.com/icon.png");
    });

    it("accepts HTTP image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("HTTP image", {
        duration: 0,
        icon: {
          url: "http://example.com/icon.png",
        },
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe("http://example.com/icon.png");
    });
  });

  // ----------------------------------------------------------
  // 5. DOM Integrity After Errors
  // ----------------------------------------------------------

  describe("Error Cleanup", () => {
    it("does not insert a notification when icon validation fails", () => {
      const toast = new ZephyrToast();

      const before = toast.container.children.length;

      expect(() => {
        toast.info("Invalid icon", {
          duration: 0,
          icon: {
            url: "javascript:alert(1)",
          },
        });
      }).toThrow();

      expect(toast.container.children.length).toBe(before);
    });

    it("preserves existing notifications when a new icon is rejected", () => {
      const toast = new ZephyrToast();

      const existing = toast.info("Existing notification", {
        duration: 0,
      });

      expect(() => {
        toast.info("Invalid notification", {
          duration: 0,
          icon: {
            url: "javascript:alert(1)",
          },
        });
      }).toThrow();

      expect(toast.container.children).toHaveLength(1);
      expect(toast.container.contains(existing)).toBe(true);
    });

    it("allows valid notifications after an icon validation error", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid notification", {
          duration: 0,
          icon: {
            url: "javascript:alert(1)",
          },
        });
      }).toThrow();

      const element = toast.success("Valid notification", {
        duration: 0,
      });

      expect(element.isConnected).toBe(true);
      expect(toast.container.children).toHaveLength(1);
    });
  });
});
