/**
 * @fileoverview Unit tests for the ZephyrToast notification library.
 *
 * Provides regression coverage for the standalone browser implementation,
 * including initialization, notification rendering, configuration,
 * content handling, positioning, and public convenience methods.
 *
 * The library is evaluated inside an isolated jsdom environment to
 * preserve its browser-global API without modifying the source.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { runInContext } from "node:vm";

/**
 * Absolute location of the existing standalone library.
 *
 * Resolving the path relative to this test module ensures that
 * tests work regardless of the terminal's working directory.
 *
 * @type {string}
 */
const source = readFileSync(
  new URL("../dist/zephyr-toast.js", import.meta.url),
  "utf8",
);

/**
 * Evaluates the standalone JavaScript library inside a jsdom window.
 *
 * The current ZephyrToast source defines a top-level class without
 * exporting it as an ES module. This helper exposes that class through
 * the isolated window so the tests can instantiate it.
 *
 * @param {JSDOM} dom - The isolated DOM environment.
 * @returns {Function} The ZephyrToast constructor.
 */
function loadZephyrToast(dom) {
  const context = dom.getInternalVMContext();

  // The generated IIFE bundle registers window.ZephyrToast.
  runInContext(source, context);

  return dom.window.ZephyrToast;
}

/**
 * Creates an isolated browser-like environment for a test.
 *
 * Includes the standalone library script reference so the existing
 * CSS discovery mechanism can resolve its stylesheet paths.
 *
 * Script execution remains manually controlled to prevent external
 * resources from running during unit tests.
 *
 * @returns {JSDOM} A fresh DOM environment.
 */
function createTestDOM() {
  return new JSDOM(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <script src="/zephyr-toast.js"></script>
      </head>
      <body></body>
    </html>`,
    {
      url: "http://localhost/",
      runScripts: "outside-only",
    },
  );
}

describe("ZephyrToast", () => {
  /** @type {JSDOM} */
  let dom;

  /** @type {Function} */
  let ZephyrToast;

  /**
   * Creates a new DOM environment and loads the original library
   * before each test to prevent shared state between test cases.
   */
  beforeEach(() => {
    dom = createTestDOM();
    ZephyrToast = loadZephyrToast(dom);
  });

  /**
   * Releases DOM resources and restores mocked functions after
   * each test.
   */
  afterEach(() => {
    vi.restoreAllMocks();
    dom.window.close();
  });

  describe("Initialization", () => {
    it("creates a notification container", () => {
      new ZephyrToast();

      const container = dom.window.document.querySelector(
        "#zephyr-toast-container",
      );

      expect(container).not.toBeNull();
      expect(container.classList.contains("zephyr-toast-container")).toBe(true);
    });

    it("uses the default top-right position", () => {
      const toast = new ZephyrToast();

      expect(
        toast.container.classList.contains("zephyr-position-top-right"),
      ).toBe(true);
    });

    it("accepts a custom initial position", () => {
      const toast = new ZephyrToast({
        position: "bottom-center",
      });

      expect(
        toast.container.classList.contains("zephyr-position-bottom-center"),
      ).toBe(true);
    });

    it("reuses an existing notification container", () => {
      new ZephyrToast();
      new ZephyrToast();

      const containers = dom.window.document.querySelectorAll(
        "#zephyr-toast-container",
      );

      expect(containers).toHaveLength(1);
    });

    /**
     * Verifies that stylesheet imports are injected only once,
     * even when multiple ZephyrToast instances are created.
     */
    it("injects the required stylesheet imports only once", () => {
      new ZephyrToast();
      new ZephyrToast();

      const styles = dom.window.document.querySelectorAll(
        "#zephyr-toast-notification-css",
      );

      expect(styles).toHaveLength(1);

      expect(styles[0].textContent).toContain("zephyr-toast.css");

      expect(styles[0].textContent).toContain("zephyr-toast-animate.css");
    });
  });

  describe("Notification Rendering", () => {
    it("creates a notification element", () => {
      const toast = new ZephyrToast();

      const element = toast.show("Test notification", {
        duration: 0,
      });

      expect(element).not.toBeNull();

      expect(element.classList.contains("zephyr-toast-notification")).toBe(
        true,
      );
    });

    it("renders the provided notification message", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Hello ZephyrToast", {
        duration: 0,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message).not.toBeNull();
      expect(message.textContent).toBe("Hello ZephyrToast");
    });

    it("renders an optional notification title", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Profile updated", {
        title: "Success",
        duration: 0,
      });

      const title = element.querySelector(".zephyr-toast-notification-title");

      expect(title).not.toBeNull();
      expect(title.textContent).toBe("Success");
    });

    it("does not render a title when none is provided", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Message only", {
        duration: 0,
      });

      const title = element.querySelector(".zephyr-toast-notification-title");

      expect(title).toBeNull();
    });

    it("appends notifications to the configured container", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Container test", {
        duration: 0,
      });

      expect(toast.container.contains(element)).toBe(true);
    });
  });

  describe("Notification Types", () => {
    /**
     * Verifies that every public notification helper creates
     * an element containing the supplied message.
     */
    it.each(["success", "info", "warning", "error", "zen", "void"])(
      "supports the %s notification type",
      (type) => {
        const toast = new ZephyrToast();

        const message = `${type} notification`;

        const element = toast[type](message, {
          duration: 0,
        });

        expect(element.textContent).toContain(message);
      },
    );
  });

  describe("HTML Content Handling", () => {
    it("escapes HTML content by default", () => {
      const toast = new ZephyrToast();

      const element = toast.info("<strong>Hello</strong>", {
        duration: 0,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      expect(message.textContent).toBe("<strong>Hello</strong>");

      expect(message.querySelector("strong")).toBeNull();
    });

    it("renders HTML when allowHtml is explicitly enabled", () => {
      const toast = new ZephyrToast();

      const element = toast.info("<strong>Hello</strong>", {
        duration: 0,
        allowHtml: true,
      });

      const message = element.querySelector(
        ".zephyr-toast-notification-message",
      );

      const strong = message.querySelector("strong");

      expect(strong).not.toBeNull();
      expect(strong.textContent).toBe("Hello");
    });
  });

  describe("Close Button", () => {
    it("displays the close button by default", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Close button test", {
        duration: 0,
      });

      const button = element.querySelector(".zephyr-toast-notification-close");

      expect(button).not.toBeNull();
      expect(button.tagName).toBe("BUTTON");
    });

    it("hides the close button when disabled", () => {
      const toast = new ZephyrToast();

      const element = toast.info("No close button", {
        duration: 0,
        showClose: false,
      });

      expect(
        element.querySelector(".zephyr-toast-notification-close"),
      ).toBeNull();
    });
  });

  describe("Notification Icons", () => {
    it("renders the default icon", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Icon test", {
        duration: 0,
      });

      const icon = element.querySelector(".zephyr-toast-notification-icon");

      expect(icon).not.toBeNull();
      expect(icon.querySelector("svg")).not.toBeNull();
    });

    it("disables icons when enableIcon is false", () => {
      const toast = new ZephyrToast();

      const element = toast.info("No icon", {
        duration: 0,
        enableIcon: false,
      });

      expect(
        element.querySelector(".zephyr-toast-notification-icon"),
      ).toBeNull();
    });

    it("supports custom icon classes", () => {
      const toast = new ZephyrToast();

      const element = toast.success("Custom icon", {
        duration: 0,
        icon: "fas fa-check-circle",
      });

      const icon = element.querySelector(".zephyr-toast-notification-icon i");

      expect(icon).not.toBeNull();

      expect(icon.classList.contains("fa-check-circle")).toBe(true);
    });

    it("supports custom image icons", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Image icon", {
        duration: 0,
        icon: "https://example.com/icon.png",
      });

      const image = element.querySelector(
        ".zephyr-toast-notification-icon img",
      );

      expect(image).not.toBeNull();

      expect(image.getAttribute("src")).toBe("https://example.com/icon.png");
    });
  });

  describe("Progress Bar", () => {
    it("renders a progress bar for timed notifications", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Timed notification", {
        duration: 5000,
        showProgress: true,
      });

      const progress = element.querySelector(".zephyr-toast-progress-bar");

      expect(progress).not.toBeNull();
    });

    it("does not render a progress bar when disabled", () => {
      const toast = new ZephyrToast();

      const element = toast.info("No progress", {
        duration: 5000,
        showProgress: false,
      });

      expect(element.querySelector(".zephyr-toast-progress-bar")).toBeNull();
    });

    it("does not render a progress bar for permanent notifications", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Permanent notification", {
        duration: 0,
        showProgress: true,
      });

      expect(element.querySelector(".zephyr-toast-progress-bar")).toBeNull();
    });
  });

  describe("Notification Positioning", () => {
    it("updates the notification container position", () => {
      const toast = new ZephyrToast();

      toast.updatePosition("bottom-left");

      expect(
        toast.container.classList.contains("zephyr-position-bottom-left"),
      ).toBe(true);

      expect(toast.options.position).toBe("bottom-left");
    });

    it("supports per-notification position overrides", () => {
      const toast = new ZephyrToast();

      toast.info("Position override", {
        duration: 0,
        position: "top-center",
      });

      expect(
        toast.container.classList.contains("zephyr-position-top-center"),
      ).toBe(true);
    });
  });

  describe("Notification Ordering", () => {
    it("places newer notifications first by default", () => {
      const toast = new ZephyrToast();

      const first = toast.info("First", {
        duration: 0,
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      expect(toast.container.firstElementChild).toBe(second);
      expect(toast.container.lastElementChild).toBe(first);
    });

    it("appends newer notifications when newestOnTop is false", () => {
      const toast = new ZephyrToast({
        newestOnTop: false,
      });

      const first = toast.info("First", {
        duration: 0,
      });

      const second = toast.info("Second", {
        duration: 0,
      });

      expect(toast.container.firstElementChild).toBe(first);
      expect(toast.container.lastElementChild).toBe(second);
    });
  });

  describe("Callbacks", () => {
    it("invokes the click callback when the toast is clicked", () => {
      const onClick = vi.fn();
      const toast = new ZephyrToast();

      const element = toast.info("Clickable notification", {
        duration: 0,
        onClick,
      });

      element.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not invoke the click callback when none is configured", () => {
      const toast = new ZephyrToast();

      const element = toast.info("Regular notification", {
        duration: 0,
      });

      expect(() => element.click()).not.toThrow();
    });
  });

  describe("Configuration", () => {
    it("applies default configuration values", () => {
      const toast = new ZephyrToast();

      expect(toast.options.position).toBe("top-right");
      expect(toast.options.duration).toBe(3000);
      expect(toast.options.pauseOnHover).toBe(true);
      expect(toast.options.showProgress).toBe(true);
      expect(toast.options.allowHtml).toBe(false);
    });

    it("accepts constructor configuration overrides", () => {
      const toast = new ZephyrToast({
        duration: 6000,
        pauseOnHover: false,
        showClose: false,
      });

      expect(toast.options.duration).toBe(6000);
      expect(toast.options.pauseOnHover).toBe(false);
      expect(toast.options.showClose).toBe(false);
    });

    it("accepts per-notification configuration overrides", () => {
      const toast = new ZephyrToast({
        duration: 3000,
      });

      const element = toast.info("Custom duration", {
        duration: 7000,
      });

      expect(element._options.duration).toBe(7000);

      // Per-toast configuration must not mutate constructor defaults.
      expect(toast.options.duration).toBe(3000);
    });
  });
});
