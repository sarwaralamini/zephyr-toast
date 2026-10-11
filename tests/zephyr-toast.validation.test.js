/**
 * @fileoverview Configuration validation integration tests for ZephyrToast.
 *
 * Verifies that the standalone browser distribution rejects
 * invalid notification types, durations, animation names,
 * positions, and configuration structures.
 *
 * Also verifies that valid configuration values are accepted
 * and invalid updates do not modify existing instance state.
 *
 * Detailed boolean, theme-property, and structured-icon guards
 * are tested separately in zephyr-toast.config-guards.test.js.
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
 * The browser bundle must be generated before running these tests.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../dist/zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates an isolated browser environment and evaluates the
 * compiled standalone ZephyrToast distribution.
 *
 * The script reference supports stylesheet path discovery
 * without allowing external scripts to execute.
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
 * Verifies configuration validation through the public
 * standalone browser API.
 */
describe("ZephyrToast Configuration Validation", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes a fresh browser context for each test.
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
  // 1. Notification Type Validation
  // ----------------------------------------------------------

  describe("Notification Type Validation", () => {
    it("rejects unsupported notification types", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.show("Invalid type", {
          type: "unknown",
          duration: 0,
        });
      }).toThrow(/type/i);
    });

    it.each(["success", "info", "warning", "error", "zen", "void"])(
      "accepts the %s notification type",
      (type) => {
        const toast = new ZephyrToast();

        const element = toast.show(`${type} notification`, {
          type,
          duration: 0,
        });

        expect(element._options.type).toBe(type);
        expect(element.isConnected).toBe(true);
      },
    );

    it("preserves the existing container after an invalid type", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.show("Invalid type", {
          type: "unknown",
          duration: 0,
        });
      }).toThrow();

      expect(toast.container.children).toHaveLength(0);

      const element = toast.info("Valid notification", {
        duration: 0,
      });

      expect(element.isConnected).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // 2. Duration Validation
  // ----------------------------------------------------------

  describe("Duration Validation", () => {
    it("rejects negative durations", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid duration", {
          duration: -1000,
        });
      }).toThrow(/duration/i);
    });

    it("rejects non-numeric durations", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid duration", {
          duration: "five seconds",
        });
      }).toThrow(/duration/i);
    });

    it.each([NaN, Infinity, -Infinity])(
      "rejects non-finite duration %s",
      (duration) => {
        const toast = new ZephyrToast();

        expect(() => {
          toast.info("Invalid duration", { duration });
        }).toThrow(/duration/i);
      },
    );

    it("accepts zero duration for persistent notifications", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Persistent notification", {
        duration: 0,
      });

      expect(element._options.duration).toBe(0);
      expect(element._timeoutId).toBeUndefined();
    });

    it("accepts a positive numeric duration", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 5000,
      });

      expect(element._options.duration).toBe(5000);
      expect(element.isConnected).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // 3. Animation Validation
  // ----------------------------------------------------------

  describe("Animation Validation", () => {
    it("rejects unsupported entrance animations", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid animation", {
          duration: 0,
          animation: {
            in: "unknownAnimation",
          },
        });
      }).toThrow(/animation/i);
    });

    it("rejects unsupported exit animations", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid animation", {
          duration: 0,
          animation: {
            out: "unknownAnimation",
          },
        });
      }).toThrow(/animation/i);
    });

    it("accepts supported custom animations", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Custom animation", {
        duration: 0,
        animation: {
          in: "slideInRight",
          out: "slideOutRight",
        },
      });

      expect(element._options.animation.in).toBe("slideInRight");
      expect(element._options.animation.out).toBe("slideOutRight");

      expect(element.classList.contains("zephyr_animate_slideInRight")).toBe(
        true,
      );
    });

    it("does not mutate instance animations after rejection", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid animation", {
          duration: 0,
          animation: {
            in: "unknownAnimation",
          },
        });
      }).toThrow();

      expect(toast.options.animation.in).toBe("fadeIn");
      expect(toast.options.animation.out).toBe("fadeOut");
      expect(toast.container.children).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // 4. Position Validation
  // ----------------------------------------------------------

  describe("Position Validation", () => {
    it("rejects unsupported constructor positions", () => {
      expect(() => {
        new ZephyrToast({
          position: "center-middle",
        });
      }).toThrow(/position/i);
    });

    it.each([
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
      "top-center",
      "bottom-center",
    ])("accepts the %s position", (position) => {
      const toast = new ZephyrToast({ position });

      expect(
        toast.container.classList.contains(`zephyr-position-${position}`),
      ).toBe(true);
    });

    it("rejects invalid position updates", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.updatePosition("invalid-position");
      }).toThrow(/position/i);
    });

    it("preserves the existing position after an invalid update", () => {
      const toast = new ZephyrToast({
        position: "bottom-right",
      });

      const previousClassName = toast.container.className;

      expect(() => {
        toast.updatePosition("invalid-position");
      }).toThrow(/position/i);

      expect(toast.options.position).toBe("bottom-right");
      expect(toast.container.className).toBe(previousClassName);
    });
  });

  // ----------------------------------------------------------
  // 5. Theme Validation
  // ----------------------------------------------------------

  describe("Theme Validation", () => {
    it("rejects a non-object theme configuration", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid theme", {
          duration: 0,
          theme: "dark",
        });
      }).toThrow(/theme/i);
    });

    it("accepts valid custom theme properties", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Custom theme", {
        duration: 0,
        theme: {
          bgColor: "#123456",
          textColor: "#ffffff",
          borderColor: "#333333",
        },
      });

      expect(element.style.backgroundColor).toBe("rgb(18, 52, 86)");
      expect(element.style.color).toBe("rgb(255, 255, 255)");
      expect(element.style.borderColor).toBe("rgb(51, 51, 51)");
    });

    it("rejects invalid themes without appending a notification", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.info("Invalid theme", {
          duration: 0,
          theme: "invalid",
        });
      }).toThrow(/theme/i);

      expect(toast.container.children).toHaveLength(0);
    });
  });
});
