/**
 * @fileoverview Standalone browser lifecycle integration tests.
 *
 * Verifies automatic dismissal, manual closing, lifecycle states,
 * close callbacks, persistent notifications, duplicate dismissal,
 * and removal of multiple notifications.
 *
 * Uses an isolated JSDOM environment and a deterministic timer
 * controller to test asynchronous behavior without real delays.
 *
 * Tests execute the compiled standalone browser distribution.
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
 * The production browser bundle must be built before these
 * integration tests are executed.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../dist/zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Creates a deterministic timer controller for an isolated window.
 *
 * Replaces window.setTimeout and window.clearTimeout with controlled
 * implementations. Scheduled callbacks execute in chronological
 * order, including callbacks that schedule additional timers.
 *
 * Timers with identical deadlines execute in registration order.
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
          "Time advancement must be a non-negative finite number.",
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
     * Discards any pending timers.
     *
     * @returns {void}
     */
    clear() {
      timers.clear();
    },
  };
}

/**
 * Creates an isolated browser environment with controlled timers.
 *
 * Includes the standalone script reference to support stylesheet
 * discovery without loading external resources.
 *
 * @returns {{
 *   dom: JSDOM,
 *   clock: ReturnType<typeof createTestClock>
 * }} Browser environment and timer controller.
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
 * Loads the compiled standalone browser bundle into JSDOM.
 *
 * The IIFE registers its public constructor on window.ZephyrToast.
 *
 * @param {JSDOM} dom - Isolated browser environment.
 * @returns {Function} ZephyrToast constructor.
 */
function loadZephyrToast(dom) {
  runInContext(source, dom.getInternalVMContext());

  return dom.window.ZephyrToast;
}

/**
 * Verifies notification lifecycle behavior through the
 * standalone browser distribution.
 */
describe("ZephyrToast Lifecycle", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /** @type {ReturnType<typeof createTestClock>} */
  let clock;

  /**
   * Creates an isolated environment before each test.
   *
   * @returns {void}
   */
  beforeEach(() => {
    const environment = createTestEnvironment();

    dom = environment.dom;
    clock = environment.clock;
    ZephyrToast = loadZephyrToast(dom);
  });

  /**
   * Clears pending timers and releases browser resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    clock.clear();
    vi.restoreAllMocks();
    dom.window.close();
  });

  // ----------------------------------------------------------
  // 1. Automatic Dismissal
  // ----------------------------------------------------------

  describe("Automatic Dismissal", () => {
    it("keeps a notification visible before its duration expires", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 1000,
      });

      clock.advance(999);

      expect(toast.container.contains(element)).toBe(true);
      expect(element._lifecycleState).not.toBe("closing");
    });

    it("starts dismissal when the configured duration expires", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 1000,
      });

      clock.advance(999);

      expect(element._lifecycleState).not.toBe("closing");

      clock.advance(1);

      expect(element._lifecycleState).toBe("closing");
      expect(toast.container.contains(element)).toBe(true);
    });

    it("removes a notification after its duration and exit animation", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 1000,
      });

      clock.advance(1000);

      expect(toast.container.contains(element)).toBe(true);
      expect(element._lifecycleState).toBe("closing");

      clock.advance(499);

      expect(toast.container.contains(element)).toBe(true);

      clock.advance(1);

      expect(toast.container.contains(element)).toBe(false);
      expect(element._lifecycleState).toBe("closed");
    });

    it("keeps permanent notifications until explicitly removed", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Permanent notification", {
        duration: 0,
      });

      clock.advance(10000);

      expect(toast.container.contains(element)).toBe(true);
      expect(element._lifecycleState).not.toBe("closing");
    });
  });

  // ----------------------------------------------------------
  // 2. Manual Dismissal
  // ----------------------------------------------------------

  describe("Manual Dismissal", () => {
    it("removes a notification after calling removeToast", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Manual dismissal", {
        duration: 0,
      });

      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
      expect(element._lifecycleState).toBe("closed");
    });

    it("dismisses a notification when its close button is clicked", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Close button", {
        duration: 0,
      });

      const closeButton = element.querySelector(
        ".zephyr-toast-notification-close",
      );

      expect(closeButton).not.toBeNull();

      closeButton.click();

      expect(element._lifecycleState).toBe("closing");

      clock.advance(500);

      expect(toast.container.contains(element)).toBe(false);
    });

    it("does not create duplicate removal timers", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Repeated dismissal", {
        duration: 0,
        showProgress: false,
      });

      clock.advance(10);

      toast.removeToast(element);

      const pendingAfterFirstDismissal = clock.pending();

      toast.removeToast(element);
      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");
      expect(clock.pending()).toBe(pendingAfterFirstDismissal);

      clock.advance(500);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
      expect(clock.pending()).toBe(0);
    });

    it("cancels automatic dismissal after manual removal", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Manual removal", {
        duration: 3000,
        showProgress: false,
        onClose,
      });

      clock.advance(100);

      toast.removeToast(element);

      clock.advance(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);

      clock.advance(5000);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(clock.pending()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // 3. Close Callbacks
  // ----------------------------------------------------------

  describe("Close Callbacks", () => {
    it("invokes onClose only after the notification is removed", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Callback test", {
        duration: 0,
        onClose,
      });

      toast.removeToast(element);

      expect(onClose).not.toHaveBeenCalled();

      clock.advance(499);

      expect(onClose).not.toHaveBeenCalled();
      expect(element.isConnected).toBe(true);

      clock.advance(1);

      expect(element.isConnected).toBe(false);
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

    it("does not invoke onClose multiple times after repeated dismissal", () => {
      const onClose = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Single callback", {
        duration: 0,
        onClose,
      });

      toast.removeToast(element);
      toast.removeToast(element);

      clock.advance(500);

      toast.removeToast(element);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------
  // 4. Multiple Notifications
  // ----------------------------------------------------------

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

    it("invokes each notification's close callback once during removeAll", () => {
      const firstClose = vi.fn();
      const secondClose = vi.fn();

      const toast = new ZephyrToast();

      toast.info("First", {
        duration: 0,
        onClose: firstClose,
      });

      toast.info("Second", {
        duration: 0,
        onClose: secondClose,
      });

      toast.removeAll();

      clock.advance(500);

      expect(firstClose).toHaveBeenCalledTimes(1);
      expect(secondClose).toHaveBeenCalledTimes(1);
    });
  });
});
