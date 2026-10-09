/**
 * @fileoverview HTML, SVG, and image URL security regression tests.
 *
 * Covers untrusted message rendering, custom SVG handling,
 * unsupported image protocols, and DOM cleanup after errors.
 *
 * These tests establish the expected security behavior before
 * changing the production implementation.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Standalone browser implementation under test.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../dist/zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates an isolated browser environment with the library loaded.
 *
 * @returns {{dom: JSDOM, ZephyrToast: Function}}
 *   Browser environment and ZephyrToast constructor.
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
 * Verifies the security behavior of notification content and icons.
 */
describe("ZephyrToast Content Security", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes a new browser for every test.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
  });

  /**
   * Releases browser resources after testing.
   */
  afterEach(() => {
    dom.window.close();
  });

  describe("Default Message Safety", () => {
    it("renders HTML-like messages as plain text by default", () => {
      const toast = new ZephyrToast();

      const element = toast.info('<img src="x" onerror="alert(1)">', {
        duration: 0,
      });

      expect(element.querySelector("img")).toBeNull();
      expect(element.textContent).toContain("<img");
    });

    it("does not create scripts from untrusted messages", () => {
      const toast = new ZephyrToast();

      const element = toast.info('<script>alert("unsafe")</script>', {
        duration: 0,
        allowHtml: false,
      });

      expect(element.querySelector("script")).toBeNull();
    });
  });

  describe("Trusted HTML Mode", () => {
    it("supports explicitly enabled trusted HTML", () => {
      const toast = new ZephyrToast();

      const element = toast.info("<strong>Important message</strong>", {
        duration: 0,
        allowHtml: true,
      });

      expect(element.querySelector("strong")).not.toBeNull();
      expect(element.textContent).toContain("Important message");
    });
  });

  describe("Custom SVG Security", () => {
    it("rejects SVG containing event-handler attributes", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe SVG", {
          duration: 0,
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow(/svg|unsafe|security/i);
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
      }).toThrow(/svg|unsafe|security/i);
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
  });

  describe("Image URL Security", () => {
    it("rejects javascript URLs", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe image", {
          duration: 0,
          icon: {
            url: "javascript:alert(1)",
          },
        });
      }).toThrow(/url|http|protocol/i);
    });

    it("rejects data URLs for image icons", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Data image", {
          duration: 0,
          icon: {
            url: "data:image/svg+xml,<svg></svg>",
          },
        });
      }).toThrow(/url|http|protocol/i);
    });
  });

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
  });
});
