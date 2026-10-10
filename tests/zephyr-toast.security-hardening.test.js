/**
 * @fileoverview Advanced security regression tests for ZephyrToast.
 *
 * Verifies strict SVG element and attribute validation,
 * rejection of executable or externally referenced SVG content,
 * image URL protocol restrictions, invalid icon structures,
 * and DOM integrity after rejected input.
 *
 * Tests exercise the compiled standalone browser distribution
 * inside isolated JSDOM environments.
 *
 * @module tests/zephyr-toast.security-hardening
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
 * The browser bundle must be generated before running these tests.
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
 * Evaluates the compiled IIFE inside JSDOM's VM context and
 * retrieves the public constructor from window.ZephyrToast.
 *
 * External script execution and resource loading are disabled.
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
 * Verifies SVG, image URL, and icon configuration security
 * through the standalone browser distribution.
 */
describe("ZephyrToast Security Hardening", () => {
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

  /**
   * Creates a persistent notification with a custom SVG icon.
   *
   * @param {string} markup - Custom SVG markup.
   * @returns {HTMLElement} Rendered notification element.
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

  /**
   * Returns the custom SVG icon from a notification.
   *
   * @param {HTMLElement} element - Notification element.
   * @returns {SVGSVGElement} Rendered SVG element.
   */
  function getSvgIcon(element) {
    const icon = element.querySelector(".zephyr-toast-notification-icon svg");

    expect(icon).not.toBeNull();

    return icon;
  }

  // ----------------------------------------------------------
  // 1. SVG Structure Validation
  // ----------------------------------------------------------

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

    it("rejects embedded SVG image elements", () => {
      expect(() => {
        renderSvg('<svg><image href="https://example.com/image.png" /></svg>');
      }).toThrow(/svg|unsafe|unsupported/i);
    });

    it("accepts supported nested SVG drawing elements", () => {
      const element = renderSvg(
        '<svg viewBox="0 0 24 24"><g fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" /><path d="M8 12L11 15L16 9" stroke="currentColor" /></g></svg>',
      );

      const icon = getSvgIcon(element);

      expect(icon.querySelector("g")).not.toBeNull();
      expect(icon.querySelector("circle")).not.toBeNull();
      expect(icon.querySelector("path")).not.toBeNull();
    });

    it("rejects non-SVG root elements", () => {
      expect(() => {
        renderSvg('<div><svg viewBox="0 0 24 24"></svg></div>');
      }).toThrow(/svg|unsafe|invalid/i);
    });
  });

  // ----------------------------------------------------------
  // 2. SVG Attribute Validation
  // ----------------------------------------------------------

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

    it("rejects event handlers on the SVG root", () => {
      expect(() => {
        renderSvg('<svg onload="alert(1)"><path d="M0 0L5 5" /></svg>');
      }).toThrow(/svg|unsafe|attribute/i);
    });

    it("rejects unsupported custom SVG attributes", () => {
      expect(() => {
        renderSvg('<svg><path d="M0 0L5 5" data-unsafe="value" /></svg>');
      }).toThrow(/svg|unsafe|attribute/i);
    });

    it("preserves safe SVG drawing attributes", () => {
      const element = renderSvg(
        '<svg viewBox="0 0 24 24"><path d="M2 2L12 12" fill="none" stroke="currentColor" stroke-width="2" /></svg>',
      );

      const icon = getSvgIcon(element);
      const path = icon.querySelector("path");

      expect(path).not.toBeNull();
      expect(path.getAttribute("d")).toBe("M2 2L12 12");
      expect(path.getAttribute("fill")).toBe("none");
      expect(path.getAttribute("stroke")).toBe("currentColor");
      expect(path.getAttribute("stroke-width")).toBe("2");

      expect(path.hasAttribute("onclick")).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 3. Image URL Validation
  // ----------------------------------------------------------

  describe("Image URL Validation", () => {
    it.each([
      "JaVaScRiPt:alert(1)",
      "file:///etc/passwd",
      "data:image/svg+xml,<svg></svg>",
    ])("rejects unsafe image URL protocols", (url) => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Unsafe image", {
          duration: 0,
          icon: { url },
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

    it("accepts valid HTTPS image URLs", () => {
      const toast = new ZephyrToast();

      const element = toast.info("HTTPS image", {
        duration: 0,
        icon: {
          url: "https://example.com/icons/check.png",
        },
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe(
        "https://example.com/icons/check.png",
      );
    });

    it("preserves image URL query strings", () => {
      const toast = new ZephyrToast();

      const url = "https://example.com/icons/check.png?v=2";

      const element = toast.info("Versioned image", {
        duration: 0,
        icon: { url },
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();
      expect(image.getAttribute("src")).toBe(url);
    });
  });

  // ----------------------------------------------------------
  // 4. Invalid Icon Configuration
  // ----------------------------------------------------------

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

    it("rejects unsupported icon object properties", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid icon", {
          duration: 0,
          icon: {
            unsupported: "icon",
          },
        });
      }).toThrow(/icon/i);
    });

    it("rejects non-string image URL values", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid URL", {
          duration: 0,
          icon: {
            url: 123,
          },
        });
      }).toThrow(/icon|url/i);
    });

    it("accepts an explicitly disabled custom icon", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Default icon", {
        duration: 0,
        icon: null,
      });

      expect(element.isConnected).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // 5. DOM Integrity After Rejection
  // ----------------------------------------------------------

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

    it("does not modify existing notifications after unsafe SVG rejection", () => {
      const toast = new ZephyrToast();

      const existing = toast.info("Existing notification", {
        duration: 0,
      });

      expect(() => {
        toast.info("Rejected SVG", {
          duration: 0,
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow();

      expect(toast.container.children).toHaveLength(1);
      expect(toast.container.contains(existing)).toBe(true);
    });

    it("can render a valid notification after rejecting unsafe content", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Rejected SVG", {
          duration: 0,
          icon: {
            svg: "<svg><script>alert(1)</script></svg>",
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
