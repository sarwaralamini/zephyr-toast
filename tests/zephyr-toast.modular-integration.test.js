/**
 * @fileoverview Integration tests for modular ZephyrToast.
 *
 * Verifies interaction between configuration resolution,
 * notification types, themes, DOM rendering, positioning,
 * ordering, callbacks, and lifecycle management.
 *
 * Includes regression coverage for invalid SVG handling,
 * container integrity, and independent notification options.
 *
 * Tests the public ES module API using isolated JSDOM
 * environments and Vitest fake timers.
 *
 * @module tests/zephyr-toast.modular-integration
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ZephyrToast from "../src/index.js";

/**
 * Verifies interactions between the modular components.
 */
describe("ZephyrToast Modular Integration", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {ZephyrToast} */
  let toast;

  /**
   * Creates an isolated browser environment.
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

  // ----------------------------------------------------------
  // 1. Configuration and Rendering
  // ----------------------------------------------------------

  describe("Configuration and Rendering", () => {
    it("applies type colors and per-toast theme overrides", () => {
      const element = toast.success("Saved", {
        duration: 0,
        theme: {
          bgColor: "#123456",
        },
      });

      expect(element._options.type).toBe("success");

      expect(element.style.backgroundColor).toBe("rgb(18, 52, 86)");
      expect(element.style.color).toBe("rgb(59, 173, 113)");
      expect(element.style.borderColor).toBe("rgb(181, 234, 206)");

      expect(
        element.querySelector(".zephyr-toast-notification-icon svg"),
      ).not.toBeNull();
    });

    it("preserves instance defaults after per-toast overrides", () => {
      const first = toast.info("First", {
        duration: 0,
        animation: {
          in: "zoomIn",
        },
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      expect(first._options.animation.in).toBe("zoomIn");
      expect(first._options.animation.out).toBe("fadeOut");

      expect(second._options.animation.in).toBe("fadeIn");
      expect(second._options.animation.out).toBe("fadeOut");

      expect(toast.options.animation.in).toBe("fadeIn");
    });

    it("preserves type colors when overriding one theme property", () => {
      const element = toast.success("Partial theme", {
        duration: 0,
        theme: {
          bgColor: "#abcdef",
        },
      });

      expect(element.style.backgroundColor).toBe("rgb(171, 205, 239)");
      expect(element.style.color).toBe("rgb(59, 173, 113)");
      expect(element.style.borderColor).toBe("rgb(181, 234, 206)");
    });

    it("does not share per-toast theme overrides with later notifications", () => {
      const first = toast.info("Custom theme", {
        duration: 0,
        theme: {
          bgColor: "#123456",
        },
      });

      const second = toast.info("Default theme", {
        duration: 0,
      });

      expect(first.style.backgroundColor).toBe("rgb(18, 52, 86)");
      expect(second.style.backgroundColor).not.toBe("rgb(18, 52, 86)");

      expect(toast.options.theme?.bgColor).not.toBe("#123456");
    });

    it("renders the configured entrance animation", () => {
      const element = toast.info("Animated notification", {
        duration: 0,
        animation: {
          in: "zoomIn",
          out: "zoomOut",
        },
      });

      expect(element.classList.contains("zephyr_animate")).toBe(true);
      expect(element.classList.contains("zephyr_animate_zoomIn")).toBe(true);
      expect(element._options.animation.out).toBe("zoomOut");
    });

    it("renders a progress indicator for timed notifications", () => {
      const element = toast.info("Timed notification", {
        duration: 2000,
        showProgress: true,
      });

      const progress = element.querySelector(".zephyr-toast-progress-bar-fill");

      expect(progress).not.toBeNull();

      vi.advanceTimersByTime(10);

      expect(progress.style.width).toBe("0%");
      expect(progress.style.transitionDuration).toBe("2000ms");
    });
  });

  // ----------------------------------------------------------
  // 2. Security and DOM Integrity
  // ----------------------------------------------------------

  describe("Security and DOM Integrity", () => {
    it("rejects unsafe SVG without inserting a notification", () => {
      const initialCount = toast.container.children.length;

      expect(() => {
        toast.info("Unsafe icon", {
          duration: 0,
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow(/svg|unsafe|attribute/i);

      expect(toast.container.children.length).toBe(initialCount);
    });

    it("preserves container position when rendering fails", () => {
      const originalPosition = toast.options.position;
      const originalClassName = toast.container.className;

      expect(() => {
        toast.info("Invalid positioned notification", {
          duration: 0,
          position: "bottom-left",
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow();

      expect(toast.options.position).toBe(originalPosition);
      expect(toast.container.className).toBe(originalClassName);
      expect(toast.container.children).toHaveLength(0);
    });

    it("preserves existing notifications after rendering failure", () => {
      const existing = toast.info("Existing notification", {
        duration: 0,
      });

      expect(() => {
        toast.info("Invalid icon", {
          duration: 0,
          icon: {
            svg: "<svg><script>alert(1)</script></svg>",
          },
        });
      }).toThrow();

      expect(toast.container.children).toHaveLength(1);
      expect(toast.container.contains(existing)).toBe(true);
    });

    it("renders a valid notification after rejecting unsafe content", () => {
      expect(() => {
        toast.info("Rejected notification", {
          duration: 0,
          icon: {
            svg: '<svg onload="alert(1)"></svg>',
          },
        });
      }).toThrow();

      const element = toast.success("Valid notification", {
        duration: 0,
      });

      expect(element.isConnected).toBe(true);
      expect(toast.container.children).toHaveLength(1);
    });

    it("renders untrusted HTML-like messages as text", () => {
      const message = '<img src="x" onerror="alert(1)">';

      const element = toast.info(message, {
        duration: 0,
      });

      const content = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(content.querySelector("img")).toBeNull();
      expect(content.textContent).toBe(message);
    });
  });

  // ----------------------------------------------------------
  // 3. Positioning and Ordering
  // ----------------------------------------------------------

  describe("Positioning and Ordering", () => {
    it("updates position without removing notifications", () => {
      const element = toast.info("Position test", {
        duration: 0,
      });

      toast.updatePosition("bottom-left");

      expect(toast.options.position).toBe("bottom-left");

      expect(
        toast.container.classList.contains("zephyr-position-bottom-left"),
      ).toBe(true);

      expect(element.isConnected).toBe(true);
      expect(toast.container.contains(element)).toBe(true);
    });

    it("updates position after successfully rendering a notification", () => {
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

    it("respects newestOnTop when inserting notifications", () => {
      const first = toast.info("First", {
        duration: 0,
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      expect(toast.container.firstElementChild).toBe(second);

      const third = toast.info("Third", {
        duration: 0,
        newestOnTop: false,
      });

      expect(toast.container.firstElementChild).toBe(second);
      expect(toast.container.lastElementChild).toBe(third);

      expect(toast.container.contains(first)).toBe(true);
    });

    it("preserves notification order after updating position", () => {
      const first = toast.info("First", {
        duration: 0,
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      const originalOrder = [...toast.container.children];

      toast.updatePosition("bottom-right");

      expect([...toast.container.children]).toEqual(originalOrder);
      expect(toast.container.firstElementChild).toBe(second);
      expect(toast.container.lastElementChild).toBe(first);
    });

    it("does not change position after an invalid update", () => {
      const originalPosition = toast.options.position;
      const originalClassName = toast.container.className;

      expect(() => {
        toast.updatePosition("invalid-position");
      }).toThrow(/position/i);

      expect(toast.options.position).toBe(originalPosition);
      expect(toast.container.className).toBe(originalClassName);
    });
  });

  // ----------------------------------------------------------
  // 4. Lifecycle Integration
  // ----------------------------------------------------------

  describe("Lifecycle Integration", () => {
    it("removes all notifications and invokes callbacks once", () => {
      const firstClose = vi.fn();
      const secondClose = vi.fn();

      const first = toast.info("First", {
        duration: 0,
        onClose: firstClose,
      });

      const second = toast.warning("Second", {
        duration: 0,
        onClose: secondClose,
      });

      vi.advanceTimersByTime(10);

      toast.removeAll();
      toast.removeAll();

      vi.advanceTimersByTime(500);

      expect(first.isConnected).toBe(false);
      expect(second.isConnected).toBe(false);

      expect(firstClose).toHaveBeenCalledOnce();
      expect(secondClose).toHaveBeenCalledOnce();

      expect(toast.container.children).toHaveLength(0);
    });

    it("dismisses timed notifications after their configured duration", () => {
      const onClose = vi.fn();

      const element = toast.info("Timed notification", {
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

    it("cancels automatic dismissal after manual removal", () => {
      const onClose = vi.fn();

      const element = toast.info("Manual dismissal", {
        duration: 3000,
        pauseOnHover: false,
        onClose,
      });

      vi.advanceTimersByTime(100);

      toast.removeToast(element);

      expect(element._lifecycleState).toBe("closing");

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("does not schedule duplicate removals", () => {
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
      expect(onClose).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("removes only the specified notification", () => {
      const first = toast.info("First", {
        duration: 0,
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      toast.removeToast(first);

      vi.advanceTimersByTime(500);

      expect(first.isConnected).toBe(false);
      expect(second.isConnected).toBe(true);
    });

    it("keeps persistent notifications until manually dismissed", () => {
      const element = toast.info("Persistent notification", {
        duration: 0,
      });

      vi.advanceTimersByTime(10000);

      expect(element.isConnected).toBe(true);

      toast.removeToast(element);

      vi.advanceTimersByTime(500);

      expect(element.isConnected).toBe(false);
    });
  });
});
