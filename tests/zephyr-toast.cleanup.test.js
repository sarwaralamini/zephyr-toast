/**
 * @fileoverview Notification cleanup integration tests for ZephyrToast.
 *
 * Verifies idempotent dismissal, cancellation of active timers,
 * cleanup of pending rendering updates, close callbacks,
 * and safe removal of multiple notifications.
 *
 * Tests execute the compiled standalone browser distribution
 * inside isolated JSDOM environments with deterministic timers.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
 * Synchronizes performance.now() with the simulated clock
 * and executes scheduled callbacks in chronological order.
 *
 * Timers scheduled for the same deadline execute in
 * registration order.
 *
 * @param {Window} window - Isolated JSDOM window.
 * @returns {{
 *   advance: (milliseconds: number) => void,
 *   pending: () => number,
 *   clear: () => void
 * }} Timer controller.
 */
function createTestClock(window) {
  let now = 0;
  let nextId = 1;

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

  Object.defineProperty(window.performance, "now", {
    configurable: true,
    value: () => now,
  });

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
     * @returns {number} Scheduled callback count.
     */
    pending() {
      return timers.size;
    },

    /**
     * Discards all pending timers.
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
 * The standalone script reference enables stylesheet discovery
 * without loading external scripts or resources.
 *
 * @returns {{
 *   dom: JSDOM,
 *   ZephyrToast: Function,
 *   clock: ReturnType<typeof createTestClock>
 * }} Initialized test environment.
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
 * Verifies notification dismissal and resource cleanup
 * through the standalone browser distribution.
 */
describe("ZephyrToast Cleanup", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /** @type {ReturnType<typeof createTestClock>} */
  let clock;

  /**
   * Initializes an independent test environment.
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
   * Clears pending timers, restores mocks, and releases the DOM.
   *
   * @returns {void}
   */
  afterEach(() => {
    clock.clear();
    vi.restoreAllMocks();
    dom.window.close();
  });

  // ----------------------------------------------------------
  // 1. Idempotent Dismissal
  // ----------------------------------------------------------

  describe("Idempotent Dismissal", () => {
    it("schedules only one removal when dismissed repeatedly", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Repeated dismissal", {
        duration: 0,
        showProgress: false,
      });

      clock.advance(10);

      toast.removeToast(element);
      toast.removeToast(element);
      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");
      expect(clock.pending()).toBe(1);

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
      expect(element._lifecycleState).toBe("closed");
      expect(clock.pending()).toBe(0);
    });

    it("executes onClose exactly once after repeated dismissal", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Close once", {
        duration: 0,
        onClose,
      });

      toast.removeToast(element);
      toast.removeToast(element);

      expect(onClose).not.toHaveBeenCalled();

      clock.advance(500);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(element._lifecycleState).toBe("closed");
    });

    it("safely ignores dismissal after removal is complete", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Already removed", {
        duration: 0,
      });

      toast.removeToast(element);

      clock.advance(500);

      expect(element.isConnected).toBe(false);

      expect(() => toast.removeToast(element)).not.toThrow();

      expect(element._lifecycleState).toBe("closed");
      expect(clock.pending()).toBe(0);
    });

    it("does not schedule removal for a detached notification", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Detached notification", {
        duration: 0,
        showProgress: false,
      });

      clock.advance(10);

      element.remove();

      const pendingBeforeDismissal = clock.pending();

      expect(() => toast.removeToast(element)).not.toThrow();

      expect(clock.pending()).toBe(pendingBeforeDismissal);
    });
  });

  // ----------------------------------------------------------
  // 2. Timer Cleanup
  // ----------------------------------------------------------

  describe("Timer Cleanup", () => {
    it("cancels automatic dismissal after manual closing", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Manual close", {
        duration: 1000,
        showProgress: false,
        onClose,
      });

      clock.advance(200);

      toast.removeToast(element);

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);

      clock.advance(2000);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(clock.pending()).toBe(0);
    });

    it("cancels the pending visibility update during dismissal", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Immediate dismissal", {
        duration: 0,
        showProgress: false,
      });

      expect(clock.pending()).toBe(1);

      toast.removeToast(element);

      expect(element._visibilityTimeoutId).toBeNull();
      expect(clock.pending()).toBe(1);

      clock.advance(10);

      expect(element._lifecycleState).toBe("closing");

      clock.advance(490);

      expect(element.isConnected).toBe(false);
      expect(clock.pending()).toBe(0);
    });

    it("cancels the pending progress update during dismissal", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Progress cleanup", {
        duration: 1000,
        showProgress: true,
      });

      expect(element._progressTimeoutId).toBeDefined();

      toast.removeToast(element);

      expect(element._progressTimeoutId).toBeNull();
      expect(element._timeoutId).toBeNull();

      expect(clock.pending()).toBe(1);

      clock.advance(500);

      expect(element.isConnected).toBe(false);
      expect(clock.pending()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // 3. Bulk Dismissal
  // ----------------------------------------------------------

  describe("Bulk Dismissal", () => {
    it("does not schedule duplicate removals when removeAll is repeated", () => {
      const toast = new ZephyrToast();

      toast.success("First", {
        duration: 0,
      });

      toast.info("Second", {
        duration: 0,
      });

      toast.warning("Third", {
        duration: 0,
      });

      clock.advance(10);

      toast.removeAll();
      toast.removeAll();

      expect(clock.pending()).toBe(3);

      clock.advance(500);

      expect(
        toast.container.querySelectorAll(".zephyr-toast-notification"),
      ).toHaveLength(0);

      expect(clock.pending()).toBe(0);
    });

    it("invokes each notification's onClose callback once", () => {
      const onCloseFirst = vi.fn();
      const onCloseSecond = vi.fn();

      const toast = new ZephyrToast();

      toast.success("First", {
        duration: 0,
        onClose: onCloseFirst,
      });

      toast.error("Second", {
        duration: 0,
        onClose: onCloseSecond,
      });

      toast.removeAll();
      toast.removeAll();

      clock.advance(500);

      expect(onCloseFirst).toHaveBeenCalledTimes(1);
      expect(onCloseSecond).toHaveBeenCalledTimes(1);
    });

    it("preserves notifications created after removeAll", () => {
      const toast = new ZephyrToast();

      const first = toast.info("First", {
        duration: 0,
      });

      toast.removeAll();

      const second = toast.info("Second", {
        duration: 0,
      });

      clock.advance(500);

      expect(first.isConnected).toBe(false);
      expect(second.isConnected).toBe(true);
      expect(second._lifecycleState).not.toBe("closing");
    });
  });
});
