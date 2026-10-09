/**
 * @fileoverview Hover and timer regression tests for ZephyrToast.
 *
 * Verifies that notification dismissal timers pause when the
 * pointer enters a toast and resume using the remaining time
 * when the pointer leaves.
 *
 * Tests cover notifications with and without progress bars,
 * including repeated hover interactions.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Loads the existing standalone library source.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates a deterministic browser timer implementation.
 *
 * Scheduled callbacks are executed in chronological order,
 * allowing tests to advance time without real delays.
 *
 * @param {Window} window - The isolated browser window.
 * @returns {{advance: (milliseconds: number) => void}}
 *   Controller for advancing simulated time.
 */
function createTestClock(window) {
  let now = 0;
  let nextId = 1;

  // Keep the browser's monotonic clock synchronized with fake timers.
  Object.defineProperty(window.performance, "now", {
    configurable: true,
    value: () => now,
  });

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

  return {
    /**
     * Executes all scheduled callbacks up to the target time.
     *
     * @param {number} milliseconds - Milliseconds to advance.
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

        if (!next) break;

        const [id, timer] = next;

        timers.delete(id);
        now = timer.time;

        timer.callback();
      }

      now = target;
    },
  };
}

/**
 * Creates a standalone browser environment and loads ZephyrToast.
 *
 * @returns {{
 *   dom: JSDOM,
 *   ZephyrToast: Function,
 *   clock: ReturnType<typeof createTestClock>
 * }} The isolated testing environment.
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

  runInContext(
    `${source}\nglobalThis.ZephyrToast = ZephyrToast;`,
    dom.getInternalVMContext(),
  );

  return {
    dom,
    clock,
    ZephyrToast: dom.window.ZephyrToast,
  };
}

/**
 * Tests the pause-on-hover dismissal behavior.
 */
describe("ZephyrToast Hover Behavior", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /** @type {ReturnType<typeof createTestClock>} */
  let clock;

  /**
   * Creates a fresh DOM and timer controller before each test.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    ZephyrToast = environment.ZephyrToast;
    clock = environment.clock;
  });

  /**
   * Releases browser resources after each test.
   */
  afterEach(() => {
    dom.window.close();
  });

  /**
   * Dispatches a mouse event on a notification.
   *
   * @param {HTMLElement} element - The notification element.
   * @param {string} type - The mouse event type.
   * @returns {void}
   */
  function dispatchMouseEvent(element, type) {
    element.dispatchEvent(
      new dom.window.MouseEvent(type, {
        bubbles: false,
      }),
    );
  }

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
  });

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

    // Only 600ms should remain after resuming.
    clock.advance(599);

    expect(toast.container.contains(element)).toBe(true);

    clock.advance(1);

    expect(element.classList.contains("zephyr_animate_fadeOut")).toBe(true);

    // Allow the existing exit animation to finish.
    clock.advance(500);

    expect(toast.container.contains(element)).toBe(false);
  });

  it("preserves remaining time across repeated hover cycles", () => {
    const toast = new ZephyrToast();

    const element = toast.info("Repeated hover test", {
      duration: 1000,
      showProgress: false,
      pauseOnHover: true,
    });

    // First active period: 300ms elapsed.
    clock.advance(300);

    dispatchMouseEvent(element, "mouseenter");
    clock.advance(1500);
    dispatchMouseEvent(element, "mouseleave");

    // Second active period: another 200ms elapsed.
    clock.advance(200);

    dispatchMouseEvent(element, "mouseenter");
    clock.advance(1500);
    dispatchMouseEvent(element, "mouseleave");

    // Exactly 500ms should remain.
    clock.advance(499);

    expect(toast.container.contains(element)).toBe(true);

    clock.advance(1);

    expect(element.classList.contains("zephyr_animate_fadeOut")).toBe(true);

    clock.advance(500);

    expect(toast.container.contains(element)).toBe(false);
  });
});
