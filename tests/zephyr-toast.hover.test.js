/**
 * @fileoverview Hover pause and resume integration tests for ZephyrToast.
 *
 * Verifies that automatic dismissal pauses while a notification
 * is hovered and resumes using its remaining lifetime.
 *
 * Covers repeated hover cycles, progress indicators, disabled
 * hover handling, persistent notifications, and timer cleanup.
 *
 * Executes the compiled standalone browser distribution using
 * an isolated JSDOM environment and deterministic timers.
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
 * Creates deterministic timers for an isolated browser window.
 *
 * Synchronizes performance.now() with simulated time so that
 * hover-based remaining-duration calculations are predictable.
 *
 * Executes scheduled callbacks chronologically, including
 * callbacks that register additional timers.
 *
 * @param {Window} window - Isolated browser window.
 * @returns {{
 *   advance: (milliseconds: number) => void,
 *   pending: () => number,
 *   clear: () => void
 * }} Deterministic timer controller.
 */
function createTestClock(window) {
  let now = 0;
  let nextId = 1;

  Object.defineProperty(window.performance, "now", {
    configurable: true,
    value: () => now,
  });

  /** @type {Map<number, { time: number, callback: Function }>} */
  const timers = new Map();

  window.setTimeout = (callback, delay = 0) => {
    const id = nextId++;

    timers.set(id, {
      time: now + Math.max(0, Number(delay) || 0),
      callback,
    });

    return id;
  };

  window.clearTimeout = (id) => {
    timers.delete(id);
  };

  return {
    /**
     * Advances simulated time and executes due callbacks.
     *
     * @param {number} milliseconds - Non-negative time increment.
     * @returns {void}
     */
    advance(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0) {
        throw new RangeError(
          "Time advancement must be non-negative and finite.",
        );
      }

      const target = now + milliseconds;

      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.time <= target)
          .sort((a, b) => a[1].time - b[1].time || a[0] - b[0])[0];

        if (!next) {
          break;
        }

        const [id, timer] = next;

        timers.delete(id);
        now = timer.time;

        timer.callback();
      }

      now = target;
    },

    /**
     * Returns the number of pending timers.
     *
     * @returns {number} Pending timer count.
     */
    pending() {
      return timers.size;
    },

    /**
     * Discards pending timers.
     *
     * @returns {void}
     */
    clear() {
      timers.clear();
    },
  };
}

/**
 * Creates an isolated browser environment and loads ZephyrToast.
 *
 * The script reference supports automatic stylesheet discovery
 * without loading external resources.
 *
 * @returns {{
 *   dom: JSDOM,
 *   ZephyrToast: Function,
 *   clock: ReturnType<typeof createTestClock>
 * }} Initialized browser testing environment.
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

  const clock = createTestClock(dom.window);

  runInContext(source, dom.getInternalVMContext());

  return {
    dom,
    clock,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Verifies hover interactions through the standalone browser API.
 */
describe("ZephyrToast Hover Behavior", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /** @type {ReturnType<typeof createTestClock>} */
  let clock;

  /**
   * Creates a fresh DOM and timer controller.
   *
   * @returns {void}
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
    clock = environment.clock;
  });

  /**
   * Clears pending timers and releases browser resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    clock.clear();
    dom.window.close();
  });

  /**
   * Dispatches a mouse event on a notification element.
   *
   * @param {HTMLElement} element - Notification element.
   * @param {string} type - Mouse event type.
   * @returns {void}
   */
  function dispatchMouseEvent(element, type) {
    element.dispatchEvent(
      new dom.window.MouseEvent(type, {
        bubbles: false,
      }),
    );
  }

  // ----------------------------------------------------------
  // 1. Hover Pause
  // ----------------------------------------------------------

  describe("Hover Pause", () => {
    it("does not dismiss a notification while hovered", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Hover test", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      clock.advance(400);

      dispatchMouseEvent(element, "mouseenter");

      clock.advance(2000);

      expect(toast.container.contains(element)).toBe(true);
      expect(element._lifecycleState).not.toBe("closing");
    });

    it("does not pause dismissal when pauseOnHover is disabled", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Hover disabled", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: false,
      });

      clock.advance(400);

      dispatchMouseEvent(element, "mouseenter");

      clock.advance(600);

      expect(element._lifecycleState).toBe("closing");

      clock.advance(500);

      expect(element.isConnected).toBe(false);
    });

    it("does not schedule automatic dismissal for persistent notifications", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Persistent notification", {
        duration: 0,
        showProgress: false,
        pauseOnHover: true,
      });

      dispatchMouseEvent(element, "mouseenter");

      clock.advance(10000);

      dispatchMouseEvent(element, "mouseleave");

      clock.advance(10000);

      expect(element.isConnected).toBe(true);
      expect(element._timeoutId).toBeUndefined();
      expect(clock.pending()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // 2. Hover Resume
  // ----------------------------------------------------------

  describe("Hover Resume", () => {
    it("resumes using remaining time without a progress bar", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Remaining time test", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      clock.advance(400);

      dispatchMouseEvent(element, "mouseenter");

      clock.advance(2000);

      dispatchMouseEvent(element, "mouseleave");

      clock.advance(599);

      expect(element._lifecycleState).not.toBe("closing");
      expect(element.isConnected).toBe(true);

      clock.advance(1);

      expect(element._lifecycleState).toBe("closing");

      expect(element.classList.contains("zephyr_animate_fadeOut")).toBe(true);

      clock.advance(500);

      expect(element.isConnected).toBe(false);
    });

    it("preserves remaining time across repeated hover cycles", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Repeated hover test", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      clock.advance(300);

      dispatchMouseEvent(element, "mouseenter");

      clock.advance(1500);

      dispatchMouseEvent(element, "mouseleave");

      clock.advance(200);

      dispatchMouseEvent(element, "mouseenter");

      clock.advance(1500);

      dispatchMouseEvent(element, "mouseleave");

      clock.advance(499);

      expect(element._lifecycleState).not.toBe("closing");
      expect(element.isConnected).toBe(true);

      clock.advance(1);

      expect(element._lifecycleState).toBe("closing");

      clock.advance(500);

      expect(element.isConnected).toBe(false);
    });

    it("ignores repeated mouseleave events after resuming", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Repeated leave", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      clock.advance(400);

      dispatchMouseEvent(element, "mouseenter");
      dispatchMouseEvent(element, "mouseleave");

      const pendingAfterResume = clock.pending();

      dispatchMouseEvent(element, "mouseleave");
      dispatchMouseEvent(element, "mouseleave");

      expect(clock.pending()).toBe(pendingAfterResume);

      clock.advance(600);

      expect(element._lifecycleState).toBe("closing");

      clock.advance(500);

      expect(element.isConnected).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 3. Progress Indicator Synchronization
  // ----------------------------------------------------------

  describe("Progress Indicator Synchronization", () => {
    it("freezes the progress bar at the remaining percentage", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Progress pause", {
        duration: 1000,
        showProgress: true,
        pauseOnHover: true,
      });

      clock.advance(400);

      dispatchMouseEvent(element, "mouseenter");

      const progressFill = element.querySelector(
        ".zephyr-toast-progress-bar-fill",
      );

      expect(progressFill).not.toBeNull();
      expect(progressFill.style.transition).toBe("none");
      expect(progressFill.style.width).toBe("60%");
    });

    it("resumes progress with the remaining notification lifetime", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Progress resume", {
        duration: 1000,
        showProgress: true,
        pauseOnHover: true,
      });

      clock.advance(400);

      dispatchMouseEvent(element, "mouseenter");
      dispatchMouseEvent(element, "mouseleave");

      const progressFill = element.querySelector(
        ".zephyr-toast-progress-bar-fill",
      );

      expect(progressFill.style.transition).toBe("width 600ms linear");
      expect(progressFill.style.width).toBe("0%");

      clock.advance(600);

      expect(element._lifecycleState).toBe("closing");

      clock.advance(500);

      expect(element.isConnected).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 4. Timer Cleanup
  // ----------------------------------------------------------

  describe("Timer Cleanup", () => {
    it("removes hover listeners when a notification is dismissed", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Cleanup test", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      clock.advance(200);

      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");
      expect(element._hoverCleanup).toBeNull();

      const pendingAfterDismissal = clock.pending();

      dispatchMouseEvent(element, "mouseenter");
      dispatchMouseEvent(element, "mouseleave");

      expect(clock.pending()).toBe(pendingAfterDismissal);

      clock.advance(500);

      expect(element.isConnected).toBe(false);
      expect(clock.pending()).toBe(0);
    });
  });
});
