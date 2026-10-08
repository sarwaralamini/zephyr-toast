
/**
 * @fileoverview Notification lifecycle and cleanup tests for ZephyrToast.
 *
 * Verifies idempotent dismissal, timer cleanup, close callbacks,
 * and safe removal of multiple notifications.
 *
 * Uses an isolated jsdom environment with deterministic timers
 * to validate asynchronous cleanup without real-time delays.
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
  vi,
} from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Original standalone ZephyrToast source.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../zephyr-toast.js", import.meta.url),
  "utf8"
);

/**
 * Creates a deterministic timer controller for the DOM.
 *
 * @param {Window} window - The isolated browser window.
 * @returns {{
 *   advance: (milliseconds: number) => void,
 *   pending: () => number
 * }} Timer control and inspection methods.
 */
function createTestClock(window) {
  let now = 0;
  let nextId = 1;

  /** @type {Map<number, {time: number, callback: Function}>} */
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
     * Advances simulated time and runs scheduled callbacks.
     *
     * @param {number} milliseconds - Milliseconds to advance.
     * @returns {void}
     */
    advance(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0) {
        throw new RangeError(
          "Time advancement must be non-negative and finite."
        );
      }

      const target = now + milliseconds;

      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.time <= target)
          .sort(
            (a, b) =>
              a[1].time - b[1].time || a[0] - b[0]
          )[0];

        if (!next) break;

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
     * @returns {number} Number of scheduled callbacks.
     */
    pending() {
      return timers.size;
    },
  };
}

/**
 * Creates an isolated DOM environment and loads the library.
 *
 * @returns {{
 *   dom: JSDOM,
 *   ZephyrToast: Function,
 *   clock: ReturnType<typeof createTestClock>
 * }} Initialized testing environment.
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

  const clock = createTestClock(dom.window);

  runInContext(
    `${source}\nglobalThis.ZephyrToast = ZephyrToast;`,
    dom.getInternalVMContext()
  );

  return {
    dom,
    clock,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Tests notification dismissal and resource cleanup.
 */
describe("ZephyrToast Cleanup", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /** @type {ReturnType<typeof createTestClock>} */
  let clock;

  /**
   * Initializes a fresh test environment.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
    clock = environment.clock;
  });

  /**
   * Releases DOM resources and restores mocks.
   */
  afterEach(() => {
    vi.restoreAllMocks();
    dom.window.close();
  });

  describe("Idempotent Dismissal", () => {
    it("schedules only one removal when dismissed repeatedly", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Repeated dismissal", {
        duration: 0,
        showProgress: false,
      });

      // Flush the initial visibility timer.
      clock.advance(10);

      toast.removeToast(element);
      toast.removeToast(element);
      toast.removeToast(element);

      expect(clock.pending()).toBe(1);

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
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

      clock.advance(500);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("safely ignores dismissal after removal is complete", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Already removed", {
        duration: 0,
      });

      toast.removeToast(element);
      clock.advance(500);

      expect(() => toast.removeToast(element)).not.toThrow();
      expect(clock.pending()).toBe(0);
    });
  });

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

      // The original automatic dismissal must not run later.
      clock.advance(2000);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(clock.pending()).toBe(0);
    });
  });

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

      // Flush all initial visibility timers.
      clock.advance(10);

      toast.removeAll();
      toast.removeAll();

      // Each notification requires only one removal timer.
      expect(clock.pending()).toBe(3);

      clock.advance(500);

      expect(
        toast.container.querySelectorAll(
          ".zephyr-toast-notification"
        )
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
  });
});
