
/**
 * @fileoverview Integration tests for the modular ZephyrToast library.
 *
 * Verifies interaction between configuration resolution, notification
 * types, DOM rendering, SVG security, positioning, and lifecycle
 * management through the public ES module API.
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
 * Tests the interaction of extracted modules through ZephyrToast.
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
      }
    );

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  /**
   * Releases timers and browser resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();

    dom.window.close();
  });

  describe("Configuration and Rendering", () => {
    it("applies type colors and per-toast theme overrides", () => {
      const element = toast.success("Saved", {
        duration: 0,
        theme: {
          bgColor: "#123456",
        },
      });

      expect(element._options.type).toBe("success");

      expect(element.style.backgroundColor).toBe(
        "rgb(18, 52, 86)"
      );

      expect(element.style.color).toBe(
        "rgb(59, 173, 113)"
      );

      expect(element.style.borderColor).toBe(
        "rgb(181, 234, 206)"
      );

      expect(element.querySelector(
        ".zephyr-toast-notification-icon svg"
      )).not.toBeNull();
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
  });

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
  });

  describe("Positioning and Ordering", () => {
    it("updates position without removing notifications", () => {
      const element = toast.info("Position test", {
        duration: 0,
      });

      toast.updatePosition("bottom-left");

      expect(toast.options.position).toBe("bottom-left");
      expect(toast.container.classList.contains(
        "zephyr-position-bottom-left"
      )).toBe(true);

      expect(element.isConnected).toBe(true);
      expect(toast.container.contains(element)).toBe(true);
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
  });

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

      expect(toast.container.children.length).toBe(0);
    });
  });
});
