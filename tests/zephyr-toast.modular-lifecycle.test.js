/**
 * @fileoverview Lifecycle integration tests for modular ZephyrToast.
 *
 * Verifies automatic dismissal, persistent notifications,
 * manual removal, duplicate dismissal, close callbacks,
 * hover pause/resume, progress indicators, and timer cleanup.
 *
 * Tests the source ES module implementation using isolated
 * JSDOM environments and Vitest fake timers.
 *
 * @module tests/zephyr-toast.modular-lifecycle
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ZephyrToast from "../src/index.js";

/**
 * Verifies notification lifecycle behavior through the
 * modular public API.
 */
describe("ZephyrToast Modular Lifecycle", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {ZephyrToast} */
  let toast;

  /**
   * Initializes an isolated DOM and enables deterministic timers.
   *
   * @returns {void}
   */
  beforeEach(() => {
    vi.useFakeTimers();

    dom = new JSDOM(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <script src="/zephyr-toast.js"></script>
        </head>
        <body></body>
      </html>`,
      {
        url: "http://localhost/",
      },
    );

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  /**
   * Restores timers, mocks, globals, and browser resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    dom.window.close();
  });

  /**
   * Dispatches a mouse event on a notification.
   *
   * @param {HTMLElement} element - Notification element.
   * @param {string} type - Mouse event type.
   * @returns {void}
   */
  function dispatchMouseEvent(element, type) {
    element.dispatchEvent(new dom.window.MouseEvent(type));
  }

  // ----------------------------------------------------------
  // 1. Automatic Dismissal
  // ----------------------------------------------------------

  describe("Automatic Dismissal", () => {
    it("removes a notification after its duration and exit period", () => {
      const element = toast.info("Automatic dismissal", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: false,
      });

      expect(element.isConnected).toBe(true);

      vi.advanceTimersByTime(999);

      expect(element.isConnected).toBe(true);
      expect(element._lifecycleState).not.toBe("closing");

      vi.advanceTimersByTime(1);

      expect(element._lifecycleState).toBe("closing");
      expect(element.isConnected).toBe(true);

      vi.advanceTimersByTime(499);

      expect(element.isConnected).toBe(true);

      vi.advanceTimersByTime(1);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
    });

    it("keeps persistent notifications visible", () => {
      const element = toast.info("Persistent", {
        duration: 0,
        showProgress: false,
      });

      vi.advanceTimersByTime(10000);

      expect(element.isConnected).toBe(true);
      expect(element._timeoutId).toBeUndefined();
      expect(element._lifecycleState).not.toBe("closing");
    });

    it("invokes onClose after automatic dismissal completes", () => {
      const onClose = vi.fn();

      const element = toast.success("Automatic callback", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: false,
        onClose,
      });

      vi.advanceTimersByTime(1000);

      expect(element._lifecycleState).toBe("closing");
      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------
  // 2. Manual Dismissal
  // ----------------------------------------------------------

  describe("Manual Dismissal", () => {
    it("cancels automatic dismissal after manual removal", () => {
      const onClose = vi.fn();

      const element = toast.info("Manual dismissal", {
        duration: 3000,
        showProgress: false,
        pauseOnHover: false,
        onClose,
      });

      vi.advanceTimersByTime(500);

      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");
      expect(element._timeoutId).toBeNull();

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("does not schedule duplicate removal timers", () => {
      const onClose = vi.fn();

      const element = toast.info("Repeated dismissal", {
        duration: 0,
        showProgress: false,
        onClose,
      });

      vi.advanceTimersByTime(10);

      toast.removeToast(element);
      toast.removeToast(element);
      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("removes a persistent notification when dismissed manually", () => {
      const element = toast.info("Manual persistent dismissal", {
        duration: 0,
        showProgress: false,
      });

      vi.advanceTimersByTime(5000);

      expect(element.isConnected).toBe(true);

      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
    });

    it("ignores removal requests after dismissal completes", () => {
      const onClose = vi.fn();

      const element = toast.warning("Already removed", {
        duration: 0,
        showProgress: false,
        onClose,
      });

      toast.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);

      expect(() => toast.removeToast(element)).not.toThrow();

      expect(onClose).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // 3. Hover Pause and Resume
  // ----------------------------------------------------------

  describe("Hover Pause and Resume", () => {
    it("preserves remaining dismissal time during hover", () => {
      const element = toast.info("Hover notification", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      vi.advanceTimersByTime(400);

      dispatchMouseEvent(element, "mouseenter");

      vi.advanceTimersByTime(2000);

      expect(element.isConnected).toBe(true);
      expect(element._lifecycleState).not.toBe("closing");

      dispatchMouseEvent(element, "mouseleave");

      vi.advanceTimersByTime(599);

      expect(element._lifecycleState).not.toBe("closing");

      vi.advanceTimersByTime(1);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });

    it("does not pause automatic dismissal when pauseOnHover is disabled", () => {
      const element = toast.info("Hover disabled", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: false,
      });

      vi.advanceTimersByTime(400);

      dispatchMouseEvent(element, "mouseenter");

      vi.advanceTimersByTime(600);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });

    it("preserves remaining lifetime across repeated hover cycles", () => {
      const element = toast.info("Repeated hover", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      vi.advanceTimersByTime(300);

      dispatchMouseEvent(element, "mouseenter");

      vi.advanceTimersByTime(1500);

      dispatchMouseEvent(element, "mouseleave");

      vi.advanceTimersByTime(200);

      dispatchMouseEvent(element, "mouseenter");

      vi.advanceTimersByTime(1500);

      dispatchMouseEvent(element, "mouseleave");

      vi.advanceTimersByTime(499);

      expect(element._lifecycleState).not.toBe("closing");

      vi.advanceTimersByTime(1);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });

    it("ignores repeated mouseleave events while already resumed", () => {
      const element = toast.info("Repeated mouseleave", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      vi.advanceTimersByTime(400);

      dispatchMouseEvent(element, "mouseenter");
      dispatchMouseEvent(element, "mouseleave");

      const pendingTimers = vi.getTimerCount();

      dispatchMouseEvent(element, "mouseleave");
      dispatchMouseEvent(element, "mouseleave");

      expect(vi.getTimerCount()).toBe(pendingTimers);

      vi.advanceTimersByTime(600);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 4. Progress Indicator Synchronization
  // ----------------------------------------------------------

  describe("Progress Indicator Synchronization", () => {
    it("pauses the progress indicator while hovered", () => {
      const element = toast.info("Progress pause", {
        duration: 1000,
        showProgress: true,
        pauseOnHover: true,
      });

      vi.advanceTimersByTime(400);

      dispatchMouseEvent(element, "mouseenter");

      const progress = element.querySelector(".zephyr-toast-progress-bar-fill");

      expect(progress).not.toBeNull();
      expect(progress.style.transition).toBe("none");
      expect(progress.style.width).toBe("60%");

      vi.advanceTimersByTime(2000);

      expect(element._lifecycleState).not.toBe("closing");
    });

    it("resumes the progress indicator with remaining duration", () => {
      const element = toast.info("Progress resume", {
        duration: 1000,
        showProgress: true,
        pauseOnHover: true,
      });

      vi.advanceTimersByTime(400);

      dispatchMouseEvent(element, "mouseenter");
      dispatchMouseEvent(element, "mouseleave");

      const progress = element.querySelector(".zephyr-toast-progress-bar-fill");

      expect(progress).not.toBeNull();
      expect(progress.style.transition).toBe("width 600ms linear");
      expect(progress.style.width).toBe("0%");

      vi.advanceTimersByTime(600);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 5. Lifecycle Cleanup
  // ----------------------------------------------------------

  describe("Lifecycle Cleanup", () => {
    it("removes hover listeners during dismissal", () => {
      const element = toast.info("Listener cleanup", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      expect(typeof element._hoverCleanup).toBe("function");

      toast.removeToast(element);

      expect(element._hoverCleanup).toBeNull();

      const pendingTimers = vi.getTimerCount();

      dispatchMouseEvent(element, "mouseenter");
      dispatchMouseEvent(element, "mouseleave");

      expect(vi.getTimerCount()).toBe(pendingTimers);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cancels pending visibility and progress updates", () => {
      const element = toast.info("Immediate dismissal", {
        duration: 1000,
        showProgress: true,
        pauseOnHover: false,
      });

      expect(element._visibilityTimeoutId).toBeDefined();
      expect(element._progressTimeoutId).toBeDefined();

      toast.removeToast(element);

      expect(element._visibilityTimeoutId).toBeNull();
      expect(element._progressTimeoutId).toBeNull();
      expect(element._timeoutId).toBeNull();

      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
