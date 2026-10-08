
/**
 * @fileoverview Lifecycle integration tests for modular ZephyrToast.
 *
 * Tests automatic dismissal, manual removal, duplicate dismissal,
 * callback execution, and hover pause/resume against the ES
 * module implementation.
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
import ZephyrToast from "../src/index.js";

/**
 * Verifies lifecycle behavior of the modular implementation.
 */
describe("ZephyrToast Modular Lifecycle", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {ZephyrToast} */
  let toast;

  /**
   * Creates an isolated DOM and enables deterministic timers.
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
      }
    );

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  /**
   * Restores timers, globals, and browser resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();

    dom.window.close();
  });

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

      vi.advanceTimersByTime(1);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

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
    });
  });

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

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledTimes(1);
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

      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("Hover Pause and Resume", () => {
    it("preserves remaining dismissal time during hover", () => {
      const element = toast.info("Hover notification", {
        duration: 1000,
        showProgress: false,
        pauseOnHover: true,
      });

      vi.advanceTimersByTime(400);

      element.dispatchEvent(
        new dom.window.MouseEvent("mouseenter")
      );

      vi.advanceTimersByTime(2000);

      expect(element.isConnected).toBe(true);

      element.dispatchEvent(
        new dom.window.MouseEvent("mouseleave")
      );

      vi.advanceTimersByTime(599);

      expect(element._lifecycleState).not.toBe("closing");

      vi.advanceTimersByTime(1);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });
  });
});
