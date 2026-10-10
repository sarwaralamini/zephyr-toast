/**
 * @fileoverview Animation duration consistency tests for ZephyrToast.
 *
 * Verifies that the core stylesheet, animation definitions,
 * and notification dismissal lifecycle consistently use
 * a 500ms exit duration.
 *
 * Ensures every registered animation has a corresponding CSS
 * selector and that lifecycle callbacks execute only after
 * notification removal completes.
 *
 * @module tests/zephyr-toast.animation-duration
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { readFileSync } from "node:fs";

import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ANIMATIONS } from "../src/config/animations.js";
import { dismissToast } from "../src/core/lifecycle.js";

/**
 * Expected notification exit duration in milliseconds.
 *
 * @type {number}
 */
const EXIT_DURATION_MS = 500;

/**
 * Source animation stylesheet.
 *
 * @type {string}
 */
const animationCSS = readFileSync(
  new URL("../src/styles/zephyr-toast-animate.css", import.meta.url),
  "utf8",
);

/**
 * Source notification stylesheet.
 *
 * @type {string}
 */
const coreCSS = readFileSync(
  new URL("../src/styles/zephyr-toast.css", import.meta.url),
  "utf8",
);

/**
 * Extracts the declarations belonging to a CSS class selector.
 *
 * @param {string} css - Stylesheet content.
 * @param {string} className - Class name without the leading dot.
 * @returns {string} The selector's CSS declaration block.
 */
function getClassDeclarations(css, className) {
  const escapedName = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const expression = new RegExp(`\\.${escapedName}\\s*\\{([^}]*)\\}`);

  const match = css.match(expression);

  expect(match, `Missing CSS selector: .${className}`).not.toBeNull();

  return match[1];
}

/**
 * Extracts the animation duration from a declaration block.
 *
 * @param {string} declarations - CSS declarations.
 * @returns {number | null} Duration in milliseconds, if declared.
 */
function getAnimationDuration(declarations) {
  const match = declarations.match(
    /(?:^|;)\s*animation-duration\s*:\s*([\d.]+)(ms|s)\s*(?:;|$)/i,
  );

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  return match[2].toLowerCase() === "s" ? value * 1000 : value;
}

/**
 * Creates a detached test notification with lifecycle options.
 *
 * @param {Document} document - Target document.
 * @param {Function} onClose - Close callback.
 * @param {string} entrance - Entrance animation name.
 * @param {string} exit - Exit animation name.
 * @returns {HTMLElement} Configured notification element.
 */
function createTestToast(
  document,
  onClose,
  entrance = "fadeIn",
  exit = "fadeOut",
) {
  const element = document.createElement("div");

  element.className = [
    "zephyr-toast-notification",
    "zephyr_animate",
    ANIMATIONS[entrance],
  ].join(" ");

  element._options = {
    animation: {
      in: entrance,
      out: exit,
    },
    onClose,
  };

  document.body.appendChild(element);

  return element;
}

// ------------------------------------------------------------
// Animation Duration Consistency
// ------------------------------------------------------------

describe("ZephyrToast animation duration consistency", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Core Stylesheet", () => {
    it("uses 500ms for the core notification animation", () => {
      const declarations = getClassDeclarations(
        coreCSS,
        "zephyr-toast-notification",
      );

      expect(getAnimationDuration(declarations)).toBe(EXIT_DURATION_MS);
    });
  });

  describe("Animation Stylesheet", () => {
    it("uses 500ms for the base animation class", () => {
      const declarations = getClassDeclarations(animationCSS, "zephyr_animate");

      expect(getAnimationDuration(declarations)).toBe(EXIT_DURATION_MS);
    });

    it.each(["bounceIn", "bounceOut"])("uses 500ms for %s", (animationName) => {
      const declarations = getClassDeclarations(
        animationCSS,
        `zephyr_animate_${animationName}`,
      );

      expect(getAnimationDuration(declarations)).toBe(EXIT_DURATION_MS);
    });

    it.each(Object.entries(ANIMATIONS))(
      "defines the animation class for %s",
      (_name, className) => {
        expect(() => {
          getClassDeclarations(animationCSS, className);
        }).not.toThrow();
      },
    );

    it("does not define animation durations longer than the dismissal period", () => {
      const declarations = [
        getClassDeclarations(animationCSS, "zephyr_animate"),
        ...Object.values(ANIMATIONS).map((className) =>
          getClassDeclarations(animationCSS, className),
        ),
      ];

      for (const declaration of declarations) {
        const duration = getAnimationDuration(declaration);

        if (duration !== null) {
          expect(duration).toBeLessThanOrEqual(EXIT_DURATION_MS);
        }
      }
    });

    it("defines all registered exit animation classes", () => {
      const exitAnimations = [
        "fadeOut",
        "slideOutLeft",
        "slideOutRight",
        "slideOutUp",
        "slideOutDown",
        "bounceOut",
        "zoomOut",
      ];

      for (const name of exitAnimations) {
        const className = ANIMATIONS[name];

        expect(className).toBeDefined();

        expect(() => {
          getClassDeclarations(animationCSS, className);
        }).not.toThrow();
      }
    });
  });

  describe("Dismissal Lifecycle", () => {
    it("removes the toast after 500ms, not before", () => {
      vi.useFakeTimers();

      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const onClose = vi.fn();

        const toast = createTestToast(dom.window.document, onClose);

        dismissToast(toast, ANIMATIONS);

        expect(toast._lifecycleState).toBe("closing");

        expect(toast.classList.contains("zephyr_animate_fadeOut")).toBe(true);

        vi.advanceTimersByTime(EXIT_DURATION_MS - 1);

        expect(toast.isConnected).toBe(true);
        expect(onClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);

        expect(toast.isConnected).toBe(false);
        expect(toast._lifecycleState).toBe("closed");
        expect(onClose).toHaveBeenCalledTimes(1);
      } finally {
        dom.window.close();
      }
    });

    it("removes the entrance animation before applying the exit animation", () => {
      vi.useFakeTimers();

      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const toast = createTestToast(
          dom.window.document,
          vi.fn(),
          "zoomIn",
          "zoomOut",
        );

        expect(toast.classList.contains("zephyr_animate_zoomIn")).toBe(true);

        dismissToast(toast, ANIMATIONS);

        expect(toast.classList.contains("zephyr_animate_zoomIn")).toBe(false);

        expect(toast.classList.contains("zephyr_animate_zoomOut")).toBe(true);

        vi.advanceTimersByTime(EXIT_DURATION_MS);

        expect(toast.isConnected).toBe(false);
      } finally {
        dom.window.close();
      }
    });

    it("does not schedule duplicate exit animations", () => {
      vi.useFakeTimers();

      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const onClose = vi.fn();

        const toast = createTestToast(dom.window.document, onClose);

        dismissToast(toast, ANIMATIONS);
        dismissToast(toast, ANIMATIONS);
        dismissToast(toast, ANIMATIONS);

        expect(vi.getTimerCount()).toBe(1);

        vi.advanceTimersByTime(EXIT_DURATION_MS);

        expect(toast.isConnected).toBe(false);
        expect(onClose).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        dom.window.close();
      }
    });

    it("executes the close callback after the exit animation period", () => {
      vi.useFakeTimers();

      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const onClose = vi.fn();

        const toast = createTestToast(dom.window.document, onClose);

        dismissToast(toast, ANIMATIONS);

        vi.advanceTimersByTime(EXIT_DURATION_MS - 1);

        expect(onClose).not.toHaveBeenCalled();
        expect(toast.isConnected).toBe(true);

        vi.advanceTimersByTime(1);

        expect(toast.isConnected).toBe(false);
        expect(onClose).toHaveBeenCalledOnce();
      } finally {
        dom.window.close();
      }
    });

    it("does not dismiss a notification that has no parent node", () => {
      vi.useFakeTimers();

      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const onClose = vi.fn();

        const toast = createTestToast(dom.window.document, onClose);

        toast.remove();

        dismissToast(toast, ANIMATIONS);

        expect(vi.getTimerCount()).toBe(0);
        expect(onClose).not.toHaveBeenCalled();
        expect(toast.isConnected).toBe(false);
      } finally {
        dom.window.close();
      }
    });
  });
});
