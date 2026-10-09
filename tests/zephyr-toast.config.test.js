/**
 * @fileoverview Configuration and theme regression tests for ZephyrToast.
 *
 * Verifies default configuration, nested animation settings,
 * notification type resolution, theme inheritance, and
 * per-notification customization.
 *
 * Tests define the expected configuration behavior before
 * the existing implementation is refactored.
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
 * Creates an isolated browser environment and loads ZephyrToast.
 *
 * The existing browser script is evaluated directly without
 * requiring an ES module export or loading external resources.
 *
 * @returns {{dom: JSDOM, ZephyrToast: Function}}
 *   An initialized DOM and library constructor.
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
 * Tests configuration inheritance and notification theme resolution.
 */
describe("ZephyrToast Configuration and Themes", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes an independent browser environment for each test.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
  });

  /**
   * Releases browser resources after each test.
   */
  afterEach(() => {
    dom.window.close();
  });

  describe("Animation Configuration", () => {
    it("preserves the default exit animation when only entrance is configured", () => {
      const toast = new ZephyrToast({
        animation: {
          in: "slideInRight",
        },
      });

      const element = toast.info("Custom entrance", {
        duration: 0,
      });

      expect(element._options.animation.in).toBe("slideInRight");
      expect(element._options.animation.out).toBe("fadeOut");
    });

    it("preserves the configured entrance when exit animation is overridden", () => {
      const toast = new ZephyrToast({
        animation: {
          in: "slideInRight",
          out: "slideOutRight",
        },
      });

      const element = toast.info("Custom exit", {
        duration: 0,
        animation: {
          out: "zoomOut",
        },
      });

      expect(element._options.animation.in).toBe("slideInRight");
      expect(element._options.animation.out).toBe("zoomOut");
    });

    it("does not mutate instance animation defaults", () => {
      const toast = new ZephyrToast();

      toast.info("Custom animation", {
        duration: 0,
        animation: {
          in: "zoomIn",
        },
      });

      expect(toast.options.animation.in).toBe("fadeIn");
      expect(toast.options.animation.out).toBe("fadeOut");
    });
  });

  describe("Notification Type Resolution", () => {
    it("uses success colors for success notifications", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Saved successfully", {
        duration: 0,
      });

      expect(element.style.backgroundColor).toBe("rgb(227, 247, 237)");
      expect(element.style.color).toBe("rgb(59, 173, 113)");
      expect(element.style.borderColor).toBe("rgb(181, 234, 206)");
    });

    it("uses constructor notification type colors with show()", () => {
      const toast = new ZephyrToast({
        type: "warning",
      });

      const element = toast.show("Attention required", {
        duration: 0,
      });

      expect(element._options.type).toBe("warning");
      expect(element.style.backgroundColor).toBe("rgb(255, 245, 218)");
    });
  });

  describe("Theme Configuration", () => {
    it("applies constructor-level theme overrides", () => {
      const toast = new ZephyrToast({
        theme: {
          bgColor: "#123456",
        },
      });

      const element = toast.info("Custom default theme", {
        duration: 0,
      });

      expect(element.style.backgroundColor).toBe("rgb(18, 52, 86)");
    });

    it("preserves type colors when overriding one theme property", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Partial theme", {
        duration: 0,
        theme: {
          bgColor: "#123456",
        },
      });

      expect(element.style.backgroundColor).toBe("rgb(18, 52, 86)");
      expect(element.style.color).toBe("rgb(59, 173, 113)");
      expect(element.style.borderColor).toBe("rgb(181, 234, 206)");
    });

    it("gives per-notification themes priority over constructor themes", () => {
      const toast = new ZephyrToast({
        theme: {
          bgColor: "#111111",
        },
      });

      const element = toast.info("Per-toast theme", {
        duration: 0,
        theme: {
          bgColor: "#222222",
        },
      });

      expect(element.style.backgroundColor).toBe("rgb(34, 34, 34)");
    });
  });
});
