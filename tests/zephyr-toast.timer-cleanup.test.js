
/**
 * @fileoverview Timer and event listener cleanup tests.
 *
 * Verifies that dismissing a notification cancels pending
 * render timers, removes hover listeners, and preserves
 * normal dismissal behavior.
 *
 * @module tests/zephyr-toast.timer-cleanup
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

describe("ZephyrToast Timer Cleanup", () => {
  let dom;
  let toast;

  beforeEach(() => {
    vi.useFakeTimers();

    dom = new JSDOM(
      "<!DOCTYPE html><html><head></head><body></body></html>",
      {
        url: "http://localhost/",
      }
    );

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();

    dom.window.close();
  });

  it("cancels pending render timers on immediate dismissal", () => {
    const element = toast.info("Immediate dismissal", {
      duration: 3000,
      showProgress: true,
      pauseOnHover: false,
    });

    expect(element._visibilityTimeoutId).toBeDefined();
    expect(element._progressTimeoutId).toBeDefined();

    toast.removeToast(element);

    expect(element._visibilityTimeoutId).toBeNull();
    expect(element._progressTimeoutId).toBeNull();
    expect(element._timeoutId).toBeNull();

    vi.advanceTimersByTime(10);

    expect(element.style.opacity).not.toBe("1");
    expect(element._lifecycleState).toBe("closing");

    vi.advanceTimersByTime(490);

    expect(element.isConnected).toBe(false);
    expect(element._lifecycleState).toBe("closed");
  });

  it("removes hover listeners when a notification is dismissed", () => {
    const element = toast.info("Hover cleanup", {
      duration: 3000,
      pauseOnHover: true,
      showProgress: false,
    });

    expect(typeof element._hoverCleanup).toBe("function");

    const removeListenerSpy = vi.spyOn(
      element,
      "removeEventListener"
    );

    toast.removeToast(element);

    expect(removeListenerSpy).toHaveBeenCalledWith(
      "mouseenter",
      expect.any(Function)
    );

    expect(removeListenerSpy).toHaveBeenCalledWith(
      "mouseleave",
      expect.any(Function)
    );

    expect(element._hoverCleanup).toBeNull();

    removeListenerSpy.mockRestore();
  });

  it("preserves normal automatic dismissal behavior", () => {
    const onClose = vi.fn();

    const element = toast.success("Automatic dismissal", {
      duration: 1000,
      pauseOnHover: false,
      onClose,
    });

    vi.advanceTimersByTime(1000);

    expect(element._lifecycleState).toBe("closing");

    vi.advanceTimersByTime(500);

    expect(element.isConnected).toBe(false);
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

    vi.advanceTimersByTime(500);

    expect(element.isConnected).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
