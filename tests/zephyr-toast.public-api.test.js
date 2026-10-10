/**
 * @fileoverview Public API compatibility tests for ZephyrToast.
 *
 * Verifies public ES module exports, notification methods,
 * callback inheritance and overrides, notification removal,
 * shared container behavior, and position updates.
 *
 * Ensures the modular implementation preserves the existing
 * public API and expected behavior across multiple instances.
 *
 * Tests use isolated JSDOM environments and Vitest fake timers.
 *
 * @module tests/zephyr-toast.public-api
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ZephyrToast, { ZephyrToast as NamedZephyrToast } from "../src/index.js";

/**
 * Verifies the public API exposed by the modular implementation.
 */
describe("ZephyrToast Public API Compatibility", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {ZephyrToast} */
  let toast;

  /**
   * Initializes a fresh DOM and fake timers.
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

  // ----------------------------------------------------------
  // 1. Public Module Exports
  // ----------------------------------------------------------

  describe("Module Exports", () => {
    it("provides identical default and named exports", () => {
      expect(ZephyrToast).toBe(NamedZephyrToast);
      expect(typeof ZephyrToast).toBe("function");
    });

    it("exposes the expected notification methods", () => {
      const methods = [
        "show",
        "success",
        "info",
        "warning",
        "error",
        "zen",
        "void",
      ];

      for (const method of methods) {
        expect(typeof toast[method]).toBe("function");
      }
    });

    it("exposes the expected management methods", () => {
      expect(typeof toast.createToast).toBe("function");
      expect(typeof toast.removeToast).toBe("function");
      expect(typeof toast.removeAll).toBe("function");
      expect(typeof toast.updatePosition).toBe("function");
    });
  });

  // ----------------------------------------------------------
  // 2. Notification Methods
  // ----------------------------------------------------------

  describe("Notification Methods", () => {
    it("returns notification elements from every public method", () => {
      const methods = [
        "show",
        "success",
        "info",
        "warning",
        "error",
        "zen",
        "void",
      ];

      for (const method of methods) {
        const element = toast[method]("API compatibility", {
          duration: 0,
        });

        expect(element).toBeInstanceOf(dom.window.HTMLElement);
        expect(toast.container.contains(element)).toBe(true);
      }
    });

    it.each(["success", "info", "warning", "error", "zen", "void"])(
      "creates the correct %s notification type",
      (type) => {
        const element = toast[type]("Notification type", {
          duration: 0,
        });

        expect(element._options.type).toBe(type);
        expect(element.isConnected).toBe(true);
      },
    );

    it("returns the same element that is added to the container", () => {
      const element = toast.show("Returned element", {
        duration: 0,
      });

      expect(element.parentNode).toBe(toast.container);

      expect(toast.container.querySelector(".zephyr-toast-notification")).toBe(
        element,
      );
    });

    it("supports per-notification configuration overrides", () => {
      const element = toast.info("Custom duration", {
        duration: 5000,
        showClose: false,
      });

      expect(element._options.duration).toBe(5000);
      expect(element._options.showClose).toBe(false);

      expect(
        element.querySelector(".zephyr-toast-notification-close"),
      ).toBeNull();

      expect(toast.options.duration).toBe(3000);
    });
  });

  // ----------------------------------------------------------
  // 3. Callback Compatibility
  // ----------------------------------------------------------

  describe("Callback Compatibility", () => {
    it("allows per-toast callbacks to override instance callbacks", () => {
      const defaultOnClose = vi.fn();
      const overrideOnClose = vi.fn();

      const manager = new ZephyrToast({
        onClose: defaultOnClose,
      });

      const element = manager.info("Callback override", {
        duration: 0,
        onClose: overrideOnClose,
      });

      manager.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(overrideOnClose).toHaveBeenCalledOnce();
      expect(defaultOnClose).not.toHaveBeenCalled();
    });

    it("allows null to disable an inherited callback", () => {
      const defaultOnClose = vi.fn();

      const manager = new ZephyrToast({
        onClose: defaultOnClose,
      });

      const element = manager.info("Disabled callback", {
        duration: 0,
        onClose: null,
      });

      manager.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(defaultOnClose).not.toHaveBeenCalled();
      expect(element.isConnected).toBe(false);
    });

    it("inherits an instance close callback when not overridden", () => {
      const defaultOnClose = vi.fn();

      const manager = new ZephyrToast({
        onClose: defaultOnClose,
      });

      const element = manager.info("Inherited callback", {
        duration: 0,
      });

      manager.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(defaultOnClose).toHaveBeenCalledOnce();
    });

    it("invokes a configured notification click callback", () => {
      const onClick = vi.fn();

      const element = toast.info("Clickable notification", {
        duration: 0,
        onClick,
      });

      element.click();

      expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not invoke the close callback before removal completes", () => {
      const onClose = vi.fn();

      const element = toast.info("Delayed callback", {
        duration: 0,
        onClose,
      });

      toast.removeToast(element);

      vi.advanceTimersByTime(499);

      expect(onClose).not.toHaveBeenCalled();
      expect(element.isConnected).toBe(true);

      vi.advanceTimersByTime(1);

      expect(onClose).toHaveBeenCalledOnce();
      expect(element.isConnected).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 4. Shared Container Behavior
  // ----------------------------------------------------------

  describe("Shared Container Behavior", () => {
    it("shares the existing notification container between instances", () => {
      const secondManager = new ZephyrToast();

      expect(secondManager.container).toBe(toast.container);

      const first = toast.info("First manager", {
        duration: 0,
      });

      const second = secondManager.success("Second manager", {
        duration: 0,
      });

      expect(toast.container.contains(first)).toBe(true);
      expect(toast.container.contains(second)).toBe(true);
    });

    it("does not create duplicate notification containers", () => {
      new ZephyrToast();
      new ZephyrToast();

      expect(
        dom.window.document.querySelectorAll("#zephyr-toast-container"),
      ).toHaveLength(1);
    });

    it("preserves shared-container removeAll behavior", () => {
      const secondManager = new ZephyrToast();

      const first = toast.info("First", {
        duration: 0,
      });

      const second = secondManager.warning("Second", {
        duration: 0,
      });

      toast.removeAll();

      vi.advanceTimersByTime(500);

      expect(first.isConnected).toBe(false);
      expect(second.isConnected).toBe(false);

      expect(toast.container.children).toHaveLength(0);
    });

    it("allows one instance to dismiss a notification created by another", () => {
      const secondManager = new ZephyrToast();

      const element = secondManager.info("Shared notification", {
        duration: 0,
      });

      toast.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(element._lifecycleState).toBe("closed");
    });

    it("preserves independent instance configuration", () => {
      const secondManager = new ZephyrToast({
        duration: 5000,
        newestOnTop: false,
      });

      expect(toast.options.duration).toBe(3000);
      expect(toast.options.newestOnTop).toBe(true);

      expect(secondManager.options.duration).toBe(5000);
      expect(secondManager.options.newestOnTop).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 5. Position Management
  // ----------------------------------------------------------

  describe("Position Management", () => {
    it("updates the notification container position", () => {
      toast.updatePosition("bottom-left");

      expect(toast.options.position).toBe("bottom-left");

      expect(
        toast.container.classList.contains("zephyr-position-bottom-left"),
      ).toBe(true);
    });

    it("rejects invalid position updates without changing state", () => {
      const originalPosition = toast.options.position;
      const originalClassName = toast.container.className;

      expect(() => {
        toast.updatePosition("invalid-position");
      }).toThrow(RangeError);

      expect(toast.options.position).toBe(originalPosition);
      expect(toast.container.className).toBe(originalClassName);
    });

    it("preserves existing notifications after updating position", () => {
      const element = toast.info("Existing notification", {
        duration: 0,
      });

      toast.updatePosition("bottom-center");

      expect(element.isConnected).toBe(true);
      expect(toast.container.contains(element)).toBe(true);

      expect(
        toast.container.classList.contains("zephyr-position-bottom-center"),
      ).toBe(true);
    });

    it("updates the position after successful per-toast rendering", () => {
      const element = toast.info("Position override", {
        duration: 0,
        position: "top-center",
      });

      expect(element.parentNode).toBe(toast.container);
      expect(toast.options.position).toBe("top-center");

      expect(
        toast.container.classList.contains("zephyr-position-top-center"),
      ).toBe(true);
    });
  });
});
