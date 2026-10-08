
/**
 * @fileoverview Configuration validation tests for ZephyrToast.
 *
 * Verifies that invalid notification types, animation names,
 * durations, positions, and configuration structures are rejected
 * with meaningful errors.
 *
 * The tests establish expected validation behavior before
 * refactoring the standalone JavaScript implementation.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Source code of the existing standalone library.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../zephyr-toast.js", import.meta.url),
  "utf8"
);

/**
 * Creates an isolated DOM and evaluates the browser library.
 *
 * A script reference is included to support the current stylesheet
 * discovery mechanism without executing external resources.
 *
 * @returns {{dom: JSDOM, ZephyrToast: Function}}
 *   The browser environment and notification constructor.
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
    }
  );

  runInContext(
    `${source}\nglobalThis.ZephyrToast = ZephyrToast;`,
    dom.getInternalVMContext()
  );

  return {
    dom,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Verifies validation of public notification configuration.
 */
describe("ZephyrToast Configuration Validation", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Initializes an independent browser context before each test.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
  });

  /**
   * Releases DOM resources after each test.
   */
  afterEach(() => {
    dom.window.close();
  });

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

    it("accepts all supported notification types", () => {
      const toast = new ZephyrToast();

      const types = [
        "success",
        "info",
        "warning",
        "error",
        "zen",
        "void",
      ];

      for (const type of types) {
        expect(() => {
          toast.show(`${type} notification`, {
            type,
            duration: 0,
          });
        }).not.toThrow();
      }
    });
  });

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

    it("accepts zero duration for persistent notifications", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Persistent notification", {
        duration: 0,
      });

      expect(element._options.duration).toBe(0);
      expect(element._timeoutId).toBeUndefined();
    });
  });

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
    });
  });

  describe("Position Validation", () => {
    it("rejects unsupported positions", () => {
      expect(() => {
        new ZephyrToast({
          position: "center-middle",
        });
      }).toThrow(/position/i);
    });

    it("accepts every supported position", () => {
      const positions = [
        "top-right",
        "top-left",
        "bottom-right",
        "bottom-left",
        "top-center",
        "bottom-center",
      ];

      for (const position of positions) {
        const toast = new ZephyrToast({ position });

        expect(
          toast.container.classList.contains(
            `zephyr-position-${position}`
          )
        ).toBe(true);
      }
    });

    it("rejects invalid position updates", () => {
      const toast = new ZephyrToast();

      expect(() => {
        toast.updatePosition("invalid-position");
      }).toThrow(/position/i);
    });
  });

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

      expect(element.style.backgroundColor).toBe(
        "rgb(18, 52, 86)"
      );

      expect(element.style.color).toBe(
        "rgb(255, 255, 255)"
      );

      expect(element.style.borderColor).toBe(
        "rgb(51, 51, 51)"
      );
    });
  });
});
