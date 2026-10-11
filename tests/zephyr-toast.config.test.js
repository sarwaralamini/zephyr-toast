/**
 * @fileoverview Configuration and theme integration tests for ZephyrToast.
 *
 * Verifies configuration inheritance, nested animation settings,
 * notification type resolution, theme precedence, and
 * per-notification customization.
 *
 * Tests execute the compiled standalone browser distribution
 * inside isolated JSDOM environments to verify behavior through
 * the public browser API.
 *
 * Input validation is covered separately by the dedicated
 * configuration validation and guard test suites.
 *
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
 * The production bundle must be built before these tests run.
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
 * retrieves the constructor registered on window.ZephyrToast.
 *
 * @returns {{ dom: JSDOM, ZephyrToast: Function }}
 *   Initialized browser environment and library constructor.
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
 * Verifies configuration inheritance, notification type colors,
 * and theme resolution in the standalone browser distribution.
 */
describe("ZephyrToast Configuration and Themes", () => {
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
  // 1. Animation Configuration
  // ----------------------------------------------------------

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

    it("applies the configured entrance animation class", () => {
      const toast = new ZephyrToast({
        animation: {
          in: "slideInRight",
        },
      });

      const element = toast.info("Entrance animation", {
        duration: 0,
      });

      expect(element.classList.contains("zephyr_animate")).toBe(true);

      expect(element.classList.contains("zephyr_animate_slideInRight")).toBe(
        true,
      );
    });
  });

  // ----------------------------------------------------------
  // 2. Notification Type Resolution
  // ----------------------------------------------------------

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

    it("resolves per-notification types independently", () => {
      const toast = new ZephyrToast({
        type: "warning",
      });

      const element = toast.show("Saved successfully", {
        type: "success",
        duration: 0,
      });

      expect(element._options.type).toBe("success");
      expect(element.style.backgroundColor).toBe("rgb(227, 247, 237)");

      expect(toast.options.type).toBe("warning");
    });
  });

  // ----------------------------------------------------------
  // 3. Theme Configuration
  // ----------------------------------------------------------

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

    it("inherits constructor theme properties not overridden per notification", () => {
      const toast = new ZephyrToast({
        theme: {
          bgColor: "#111111",
          textColor: "#abcdef",
        },
      });

      const element = toast.info("Partial per-toast theme", {
        duration: 0,
        theme: {
          bgColor: "#222222",
        },
      });

      expect(element.style.backgroundColor).toBe("rgb(34, 34, 34)");
      expect(element.style.color).toBe("rgb(171, 205, 239)");
    });

    it("does not mutate constructor theme settings", () => {
      const toast = new ZephyrToast({
        theme: {
          bgColor: "#111111",
        },
      });

      toast.info("Temporary override", {
        duration: 0,
        theme: {
          bgColor: "#222222",
        },
      });

      expect(toast.options.theme.bgColor).toBe("#111111");
    });
  });
});
