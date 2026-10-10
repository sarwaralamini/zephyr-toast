/**
 * @fileoverview Timer and event listener cleanup tests for ZephyrToast.
 *
 * Verifies that notification dismissal cancels pending visibility,
 * progress, and automatic dismissal timers.
 *
 * Also tests hover listener cleanup, idempotent dismissal,
 * lifecycle state transitions, and close callback execution.
 *
 * Tests the source ES module implementation using isolated
 * JSDOM environments and Vitest fake timers.
 *
 * @module tests/zephyr-toast.timer-cleanup
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ZephyrToast from "../src/index.js";

/**
 * Verifies cleanup of notification timers and event listeners.
 */
describe("ZephyrToast Timer Cleanup", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {ZephyrToast} */
  let toast;

  /**
   * Initializes fake timers and an isolated browser environment.
   *
   * @returns {void}
   */
  beforeEach(() => {
    vi.useFakeTimers();

    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
      url: "http://localhost/",
    });

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  /**
   * Restores timers, mocked functions, globals, and DOM resources.
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

  // ----------------------------------------------------------
  // 1. Pending Timer Cleanup
  // ----------------------------------------------------------

  describe("Pending Timer Cleanup", () => {
    it("cancels pending render timers on immediate dismissal", () => {
      const element = toast.info("Immediate dismissal", {
        duration: 3000,
        showProgress: true,
        pauseOnHover: false,
      });

      expect(element._visibilityTimeoutId).toBeDefined();
      expect(element._progressTimeoutId).toBeDefined();
      expect(element._timeoutId).toBeDefined();

      toast.removeToast(element);

      expect(element._visibilityTimeoutId).toBeNull();
      expect(element._progressTimeoutId).toBeNull();
      expect(element._timeoutId).toBeNull();

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(10);

      expect(element.style.opacity).not.toBe("1");
      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(489);

      expect(element.isConnected).toBe(true);

      vi.advanceTimersByTime(1);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cancels the automatic dismissal timer after manual closing", () => {
      const onClose = vi.fn();

      const element = toast.info("Manual close", {
        duration: 3000,
        showProgress: false,
        pauseOnHover: false,
        onClose,
      });

      vi.advanceTimersByTime(200);

      toast.removeToast(element);

      expect(element._timeoutId).toBeNull();
      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("clears the removal timer after dismissal completes", () => {
      const element = toast.info("Removal timer", {
        duration: 0,
        showProgress: false,
      });

      toast.removeToast(element);

      expect(element._removalTimeoutId).toBeDefined();

      vi.advanceTimersByTime(500);

      expect(element._removalTimeoutId).toBeNull();
      expect(element._lifecycleState).toBe("closed");
      expect(element.isConnected).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // 2. Hover Listener Cleanup
  // ----------------------------------------------------------

  describe("Hover Listener Cleanup", () => {
    it("removes hover listeners when a notification is dismissed", () => {
      const element = toast.info("Hover cleanup", {
        duration: 3000,
        pauseOnHover: true,
        showProgress: false,
      });

      expect(typeof element._hoverCleanup).toBe("function");

      const removeListenerSpy = vi.spyOn(element, "removeEventListener");

      toast.removeToast(element);

      expect(removeListenerSpy).toHaveBeenCalledWith(
        "mouseenter",
        expect.any(Function),
      );

      expect(removeListenerSpy).toHaveBeenCalledWith(
        "mouseleave",
        expect.any(Function),
      );

      expect(element._hoverCleanup).toBeNull();
    });

    it("does not restart dismissal timers after hover listeners are removed", () => {
      const element = toast.info("Hover after dismissal", {
        duration: 3000,
        pauseOnHover: true,
        showProgress: false,
      });

      vi.advanceTimersByTime(100);

      toast.removeToast(element);

      expect(element._hoverCleanup).toBeNull();

      const pendingTimers = vi.getTimerCount();

      element.dispatchEvent(new dom.window.MouseEvent("mouseenter"));
      element.dispatchEvent(new dom.window.MouseEvent("mouseleave"));

      expect(vi.getTimerCount()).toBe(pendingTimers);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("does not register hover listeners for persistent notifications", () => {
      const element = toast.info("Persistent notification", {
        duration: 0,
        pauseOnHover: true,
        showProgress: false,
      });

      expect(element._hoverCleanup).toBeUndefined();
      expect(element._timeoutId).toBeUndefined();

      vi.advanceTimersByTime(10000);

      expect(element.isConnected).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // 3. Automatic Dismissal
  // ----------------------------------------------------------

  describe("Automatic Dismissal", () => {
    it("preserves normal automatic dismissal behavior", () => {
      const onClose = vi.fn();

      const element = toast.success("Automatic dismissal", {
        duration: 1000,
        pauseOnHover: false,
        onClose,
      });

      vi.advanceTimersByTime(999);

      expect(element.isConnected).toBe(true);
      expect(element._lifecycleState).not.toBe("closing");

      vi.advanceTimersByTime(1);

      expect(element._lifecycleState).toBe("closing");
      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not invoke onClose twice after repeated dismissal", () => {
      const onClose = vi.fn();

      const element = toast.warning("Repeated dismissal", {
        duration: 2000,
        pauseOnHover: true,
        onClose,
      });

      toast.removeToast(element);
      toast.removeToast(element);
      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("does not schedule timers when dismissing an already closed notification", () => {
      const onClose = vi.fn();

      const element = toast.info("Already closed", {
        duration: 0,
        showProgress: false,
        onClose,
      });

      toast.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(element._lifecycleState).toBe("closed");

      toast.removeToast(element);

      expect(vi.getTimerCount()).toBe(0);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
