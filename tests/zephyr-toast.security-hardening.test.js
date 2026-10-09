/**
 * @fileoverview Advanced security regression tests for ZephyrToast.
 *
 * Covers SVG element and attribute allowlists, namespace isolation,
 * unsafe CSS values, image URL protocols, invalid icon structures,
 * and DOM cleanup after rejected content.
 *
 * These tests establish additional security requirements before
 * modifying the production implementation.
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
  new URL("../zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates an isolated browser environment containing ZephyrToast.
 *
 * @returns {{dom: JSDOM, ZephyrToast: Function}}
 *   The initialized DOM and notification constructor.
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

  runInContext(
    `${source}\nglobalThis.ZephyrToast = ZephyrToast;`,
    dom.getInternalVMContext(),
  );

  return {
    dom,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Tests advanced icon rendering security requirements.
 */
describe("ZephyrToast Security Hardening", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes a fresh browser context before each test.
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
   * Creates a persistent notification with a custom SVG icon.
   *
   * @param {string} markup - Custom SVG markup.
   * @returns {HTMLElement} The generated notification element.
   */
  function renderSvg(markup) {
    const toast = new ZephyrToast();

    return toast.info("SVG security test", {
      duration: 0,
      icon: {
        svg: markup,
      },
    });
  }

  describe("SVG Structure Validation", () => {
    it("rejects multiple SVG root elements", () => {
      expect(() => {
        renderSvg("<svg></svg><svg></svg>");
      }).toThrow(/svg|unsafe|invalid/i);
    });

    it("rejects HTML elements inside SVG foreignObject", () => {
      expect(() => {
        renderSvg(
          '<svg><foreignObject><div onclick="alert(1)">Test</div></foreignObject></svg>',
        );
      }).toThrow(/svg|unsafe|unsupported/i);
    });

    it("rejects SVG animation elements", () => {
      expect(() => {
        renderSvg(
          '<svg><animate attributeName="opacity" from="0" to="1" /></svg>',
        );
      }).toThrow(/svg|unsafe|unsupported/i);
    });

    it("rejects SVG external reference elements", () => {
      expect(() => {
        renderSvg(
          '<svg><use href="https://example.com/icons.svg#check" /></svg>',
        );
      }).toThrow(/svg|unsafe|unsupported/i);
    });

    it("accepts supported nested SVG drawing elements", () => {
      const element = renderSvg(
        '<svg viewBox="0 0 24 24"><g fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" /><path d="M8 12L11 15L16 9" stroke="currentColor" /></g></svg>',
      );

      const icon = element.querySelector(".zephyr-toast-notification-icon svg");

      expect(icon).not.toBeNull();
      expect(icon.querySelector("g")).not.toBeNull();
      expect(icon.querySelector("circle")).not.toBeNull();
      expect(icon.querySelector("path")).not.toBeNull();
    });
  });

  describe("SVG Attribute Validation", () => {
    it("rejects inline style attributes", () => {
      expect(() => {
        renderSvg(
          '<svg style="background:url(https://example.com/tracker)"><path d="M0 0L5 5" /></svg>',
        );
      }).toThrow(/svg|unsafe|attribute/i);
    });

    it("rejects namespaced external references", () => {
      expect(() => {
        renderSvg(
          '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><path xlink:href="https://example.com/icon.svg" /></svg>',
        );
      }).toThrow(/svg|unsafe|attribute/i);
    });

    it("rejects URL functions inside allowed attributes", () => {
      expect(() => {
        renderSvg(
          '<svg><path d="M0 0L5 5" fill="url(https://example.com/fill)" /></svg>',
        );
      }).toThrow(/svg|unsafe|attribute/i);
    });

    it("rejects event-handler attributes on nested elements", () => {
      expect(() => {
        renderSvg('<svg><g><path d="M0 0L5 5" onclick="alert(1)" /></g></svg>');
      }).toThrow(/svg|unsafe|attribute/i);
    });
  });

  describe("Image URL Validation", () => {
    it("rejects mixed-case JavaScript protocols", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe image", {
          duration: 0,
          icon: {
            url: "JaVaScRiPt:alert(1)",
          },
        });
      }).toThrow(/url|http|protocol/i);
    });

    it("rejects file URLs", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Local file", {
          duration: 0,
          icon: {
            url: "file:///etc/passwd",
          },
        });
      }).toThrow(/url|http|protocol/i);
    });

    it("accepts relative image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Relative image", {
        duration: 0,
        icon: {
          url: "/assets/icons/check.png",
        },
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();
      expect(image.getAttribute("src")).toBe("/assets/icons/check.png");
    });
  });

  describe("Invalid Icon Configuration", () => {
    it("rejects array-based icon configurations", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid icon", {
          duration: 0,
          icon: ["fas", "fa-check"],
        });
      }).toThrow(/icon/i);
    });
  });

  describe("Failure Cleanup", () => {
    it("does not append a notification after unsafe SVG rejection", () => {
      const toast = new ZephyrToast();

      const before = toast.container.children.length;

      expect(() => {
        toast.info("Rejected SVG", {
          duration: 0,
          icon: {
            svg: "<svg><script>alert(1)</script></svg>",
          },
        });
      }).toThrow();

      expect(toast.container.children.length).toBe(before);
    });
  });
});
