/**
 * @fileoverview Lifecycle and timer tests for ZephyrToast.
 *
 * Verifies automatic dismissal, manual closing, removal callbacks,
 * persistent notifications, and removal of multiple notifications.
 *
 * Uses an isolated jsdom environment and a deterministic timer
 * controller to test asynchronous behavior without real delays.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Original standalone library source.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates a deterministic timer controller for the browser window.
 *
 * Timers execute in chronological order when advance() is called.
 * This avoids real-time delays and supports timers scheduled by
 * other timer callbacks.
 *
 * @param {Window} window - The jsdom window.
 * @returns {{ advance: (milliseconds: number) => void }}
 *   Timer advancement controller.
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

  return {
    /**
     * Advances simulated time and executes scheduled callbacks.
     *
     * @param {number} milliseconds - Time to advance in milliseconds.
     * @returns {void}
     */
    advance(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0) {
        throw new RangeError(
          "Time advancement must be a non-negative finite number.",
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
 * Creates an isolated DOM and installs the test clock.
 *
 * The script reference supports the library's existing automatic
 * stylesheet discovery without loading external resources.
 *
 * @returns {{ dom: JSDOM, clock: ReturnType<typeof createTestClock> }}
 *   DOM environment and timer controller.
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

  return { dom, clock };
}

/**
 * Loads the standalone library into its isolated browser context.
 *
 * @param {JSDOM} dom - The test DOM environment.
 * @returns {Function} The ZephyrToast constructor.
 */
function loadZephyrToast(dom) {
  runInContext(
    `${source}\nglobalThis.ZephyrToast = ZephyrToast;`,
    dom.getInternalVMContext(),
  );

  return dom.window.ZephyrToast;
}

describe("ZephyrToast Lifecycle", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /** @type {ReturnType<typeof createTestClock>} */
  let clock;

  /**
   * Creates an isolated environment before each test.
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    clock = environment.clock;
    ZephyrToast = loadZephyrToast(dom);
  });

  /**
   * Restores mocks and releases DOM resources.
   */
  afterEach(() => {
    vi.restoreAllMocks();
    dom.window.close();
  });

  describe("Automatic Dismissal", () => {
    it("keeps a notification visible before its duration expires", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 1000,
      });

      clock.advance(999);

      expect(toast.container.contains(element)).toBe(true);
    });

    it("removes a notification after its duration and exit animation", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 1000,
      });

      clock.advance(1000);

      expect(toast.container.contains(element)).toBe(true);

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
    });

    it("keeps permanent notifications until explicitly removed", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Permanent notification", {
        duration: 0,
      });

      clock.advance(10000);

      expect(toast.container.contains(element)).toBe(true);
    });
  });

  describe("Manual Dismissal", () => {
    it("removes a notification after calling removeToast", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Manual dismissal", {
        duration: 0,
      });

      toast.removeToast(element);

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
    });

    it("dismisses a notification when its close button is clicked", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Close button", {
        duration: 0,
      });

      const closeButton = element.querySelector(
        ".zephyr-toast-notification-close",
      );

      closeButton.click();

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
    });
  });

  describe("Close Callbacks", () => {
    it("invokes onClose after a notification is removed", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Callback test", {
        duration: 0,
        onClose,
      });

      toast.removeToast(element);

      expect(onClose).not.toHaveBeenCalled();

      clock.advance(500);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("invokes onClose after automatic dismissal", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      toast.info("Automatic close callback", {
        duration: 1000,
        onClose,
      });

      clock.advance(1500);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multiple Notifications", () => {
    it("removes all notifications when removeAll is called", () => {
      const toast = new ZephyrToast();

      toast.success("First", { duration: 0 });
      toast.info("Second", { duration: 0 });
      toast.error("Third", { duration: 0 });

      expect(
        toast.container.querySelectorAll(".zephyr-toast-notification"),
      ).toHaveLength(3);

      toast.removeAll();

      clock.advance(500);

      expect(
        toast.container.querySelectorAll(".zephyr-toast-notification"),
      ).toHaveLength(0);
    });

    it("does not remove other notifications when dismissing one", () => {
      const toast = new ZephyrToast();

      const first = toast.info("First", {
        duration: 0,
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      toast.removeToast(first);

      clock.advance(500);

      expect(toast.container.contains(first)).toBe(false);
      expect(toast.container.contains(second)).toBe(true);
    });
  });
});
