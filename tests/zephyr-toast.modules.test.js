/**
 * @fileoverview ES module architecture and component regression tests.
 *
 * Verifies the modular structure of ZephyrToast, including:
 *
 * - Public ES module exports.
 * - Immutable configuration and independent instance defaults.
 * - Notification types and animation mappings.
 * - Configuration validation.
 * - Secure SVG and icon rendering.
 * - Supported image formats and URL restrictions.
 * - Notification lifecycle and timer management.
 * - DOM rendering and progress indicators.
 *
 * Tests source modules directly to ensure individual components
 * behave correctly independently of the compiled browser bundle.
 *
 * @module tests/zephyr-toast.modules
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

import ZephyrToast, { ZephyrToast as NamedZephyrToast } from "../src/index.js";

import {
  DEFAULT_OPTIONS,
  createDefaultOptions,
} from "../src/config/defaults.js";

import {
  NOTIFICATION_TYPES,
  createNotificationTypes,
} from "../src/config/types.js";

import { ANIMATIONS } from "../src/config/animations.js";

import {
  validateConfiguration,
  VALID_POSITIONS,
  VALID_ENTRANCE_ANIMATIONS,
  VALID_EXIT_ANIMATIONS,
} from "../src/config/validation.js";

import { createSafeSvg } from "../src/renderers/svg.js";

import {
  createClassIcon,
  createImageIcon,
  renderIcon,
} from "../src/renderers/icons.js";

import { renderToast } from "../src/renderers/toast.js";

import { initializeLifecycle, dismissToast } from "../src/core/lifecycle.js";

/**
 * Verifies public exports and internal module behavior.
 */
describe("ZephyrToast Modular Architecture", () => {
  // ----------------------------------------------------------
  // 1. Animation Configuration
  // ----------------------------------------------------------

  describe("Animation Configuration", () => {
    it("exports all supported notification animations", () => {
      const expectedAnimations = [
        "fadeIn",
        "fadeOut",
        "slideInLeft",
        "slideOutLeft",
        "slideInRight",
        "slideOutRight",
        "slideInDown",
        "slideOutUp",
        "slideInUp",
        "slideOutDown",
        "bounceIn",
        "bounceOut",
        "zoomIn",
        "zoomOut",
      ];

      expect(Object.keys(ANIMATIONS).sort()).toEqual(
        [...expectedAnimations].sort(),
      );

      expect(ANIMATIONS.fadeIn).toBe("zephyr_animate_fadeIn");
      expect(ANIMATIONS.fadeOut).toBe("zephyr_animate_fadeOut");
    });

    it("exports an immutable animation mapping", () => {
      expect(Object.isFrozen(ANIMATIONS)).toBe(true);
    });

    it("maps every animation name to its CSS class", () => {
      for (const [name, className] of Object.entries(ANIMATIONS)) {
        expect(className).toBe(`zephyr_animate_${name}`);
      }
    });
  });

  // ----------------------------------------------------------
  // 2. Public ES Module Entry Point
  // ----------------------------------------------------------

  describe("Public Entry Point", () => {
    it("exposes the same class through named and default exports", () => {
      expect(ZephyrToast).toBe(NamedZephyrToast);
      expect(typeof ZephyrToast).toBe("function");
    });
  });

  // ----------------------------------------------------------
  // 3. Default Configuration
  // ----------------------------------------------------------

  describe("Default Configuration", () => {
    it("exports the expected immutable default options", () => {
      expect(DEFAULT_OPTIONS.position).toBe("top-right");
      expect(DEFAULT_OPTIONS.type).toBe("info");
      expect(DEFAULT_OPTIONS.duration).toBe(3000);
      expect(DEFAULT_OPTIONS.newestOnTop).toBe(true);
      expect(DEFAULT_OPTIONS.pauseOnHover).toBe(true);
      expect(DEFAULT_OPTIONS.showProgress).toBe(true);
      expect(DEFAULT_OPTIONS.allowHtml).toBe(false);
      expect(DEFAULT_OPTIONS.enableIcon).toBe(true);
      expect(DEFAULT_OPTIONS.showClose).toBe(true);

      expect(DEFAULT_OPTIONS.animation).toEqual({
        in: "fadeIn",
        out: "fadeOut",
      });

      expect(Object.isFrozen(DEFAULT_OPTIONS)).toBe(true);
      expect(Object.isFrozen(DEFAULT_OPTIONS.animation)).toBe(true);
    });

    it("creates independent mutable default configuration objects", () => {
      const first = createDefaultOptions();
      const second = createDefaultOptions();

      expect(first).not.toBe(second);
      expect(first.animation).not.toBe(second.animation);

      first.position = "bottom-left";
      first.animation.in = "zoomIn";

      expect(second.position).toBe("top-right");
      expect(second.animation.in).toBe("fadeIn");

      expect(DEFAULT_OPTIONS.position).toBe("top-right");
      expect(DEFAULT_OPTIONS.animation.in).toBe("fadeIn");
    });

    it("keeps default configuration independent between instances", () => {
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
        },
      );

      vi.stubGlobal("document", dom.window.document);

      try {
        const first = new ZephyrToast();
        const second = new ZephyrToast();

        expect(first.defaults).not.toBe(second.defaults);
        expect(first.defaults.animation).not.toBe(second.defaults.animation);

        first.defaults.position = "bottom-left";
        first.defaults.animation.in = "zoomIn";

        expect(second.defaults.position).toBe("top-right");
        expect(second.defaults.animation.in).toBe("fadeIn");

        expect(DEFAULT_OPTIONS.position).toBe("top-right");
        expect(DEFAULT_OPTIONS.animation.in).toBe("fadeIn");
      } finally {
        vi.unstubAllGlobals();
        dom.window.close();
      }
    });
  });

  // ----------------------------------------------------------
  // 4. Notification Types and Themes
  // ----------------------------------------------------------

  describe("Notification Types and Themes", () => {
    it("exports all six built-in notification types", () => {
      const expectedTypes = [
        "success",
        "info",
        "warning",
        "error",
        "zen",
        "void",
      ];

      expect(Object.keys(NOTIFICATION_TYPES)).toEqual(expectedTypes);

      for (const type of expectedTypes) {
        const config = NOTIFICATION_TYPES[type];

        expect(config.icon).toContain("<svg");
        expect(config.icon).toContain("</svg>");

        expect(config.bgColor).toMatch(/^#[0-9a-f]{6}$/i);
        expect(config.textColor).toMatch(/^#[0-9a-f]{6}$/i);
        expect(config.borderColor).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it("keeps exported notification definitions immutable", () => {
      expect(Object.isFrozen(NOTIFICATION_TYPES)).toBe(true);

      for (const config of Object.values(NOTIFICATION_TYPES)) {
        expect(Object.isFrozen(config)).toBe(true);
      }
    });

    it("creates independent notification type definitions", () => {
      const first = createNotificationTypes();
      const second = createNotificationTypes();

      expect(first).not.toBe(second);
      expect(first.success).not.toBe(second.success);

      first.success.bgColor = "#123456";
      first.info.textColor = "#abcdef";

      expect(second.success.bgColor).toBe("#e3f7ed");
      expect(second.info.textColor).toBe("#2385ba");

      expect(NOTIFICATION_TYPES.success.bgColor).toBe("#e3f7ed");
      expect(NOTIFICATION_TYPES.info.textColor).toBe("#2385ba");
    });

    it("keeps built-in icon definitions independent between copies", () => {
      const first = createNotificationTypes();
      const second = createNotificationTypes();

      const originalIcon = second.success.icon;

      first.success.icon = "<svg></svg>";

      expect(second.success.icon).toBe(originalIcon);
      expect(NOTIFICATION_TYPES.success.icon).toBe(originalIcon);
    });
  });

  // ----------------------------------------------------------
  // 5. Configuration Validation
  // ----------------------------------------------------------

  describe("Configuration Validation", () => {
    it("exports all supported positions", () => {
      expect(VALID_POSITIONS).toEqual([
        "top-right",
        "top-left",
        "bottom-right",
        "bottom-left",
        "top-center",
        "bottom-center",
      ]);

      expect(Object.isFrozen(VALID_POSITIONS)).toBe(true);
    });

    it("exports supported animation names", () => {
      expect(VALID_ENTRANCE_ANIMATIONS).toContain("fadeIn");
      expect(VALID_ENTRANCE_ANIMATIONS).toContain("zoomIn");

      expect(VALID_EXIT_ANIMATIONS).toContain("fadeOut");
      expect(VALID_EXIT_ANIMATIONS).toContain("zoomOut");

      expect(Object.isFrozen(VALID_ENTRANCE_ANIMATIONS)).toBe(true);
      expect(Object.isFrozen(VALID_EXIT_ANIMATIONS)).toBe(true);
    });

    it("accepts valid notification configuration", () => {
      expect(() => {
        validateConfiguration({
          type: "success",
          position: "top-right",
          duration: 3000,
          animation: {
            in: "fadeIn",
            out: "fadeOut",
          },
          icon: {
            fontAwesome: "fas fa-check",
          },
          theme: {
            bgColor: "#123456",
          },
        });
      }).not.toThrow();
    });

    it("rejects unsupported notification types", () => {
      expect(() => {
        validateConfiguration({
          type: "invalid",
        });
      }).toThrow(/type/i);
    });

    it("rejects invalid durations", () => {
      expect(() => {
        validateConfiguration({
          duration: -100,
        });
      }).toThrow(/duration/i);

      expect(() => {
        validateConfiguration({
          duration: "3000",
        });
      }).toThrow(/duration/i);
    });

    it("rejects invalid positions and animations", () => {
      expect(() => {
        validateConfiguration({
          position: "center",
        });
      }).toThrow(/position/i);

      expect(() => {
        validateConfiguration({
          animation: {
            in: "unknownAnimation",
          },
        });
      }).toThrow(/animation/i);
    });

    it("rejects invalid icon and theme structures", () => {
      expect(() => {
        validateConfiguration({
          icon: ["fas", "fa-check"],
        });
      }).toThrow(/icon/i);

      expect(() => {
        validateConfiguration({
          theme: "dark",
        });
      }).toThrow(/theme/i);
    });

    it("rejects invalid boolean configuration values", () => {
      expect(() => {
        validateConfiguration({
          pauseOnHover: "true",
        });
      }).toThrow(TypeError);

      expect(() => {
        validateConfiguration({
          showProgress: 1,
        });
      }).toThrow(TypeError);
    });

    it("rejects non-string theme color values", () => {
      expect(() => {
        validateConfiguration({
          theme: {
            bgColor: 123,
          },
        });
      }).toThrow(TypeError);
    });

    it("rejects unsupported structured icon properties", () => {
      expect(() => {
        validateConfiguration({
          icon: {
            unsupported: "value",
          },
        });
      }).toThrow(TypeError);
    });
  });

  // ----------------------------------------------------------
  // 6. Secure SVG Rendering
  // ----------------------------------------------------------

  describe("Secure SVG Rendering", () => {
    it("creates supported SVG elements in the target document", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const svg = createSafeSvg(
          '<svg viewBox="0 0 24 24"><path d="M2 2L12 12" /></svg>',
          dom.window.document,
        );

        expect(svg.localName).toBe("svg");
        expect(svg.ownerDocument).toBe(dom.window.document);
        expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
        expect(svg.querySelector("path")).not.toBeNull();
      } finally {
        dom.window.close();
      }
    });

    it("rejects unsafe SVG attributes", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        expect(() => {
          createSafeSvg(
            '<svg onload="alert(1)"><path d="M0 0" /></svg>',
            dom.window.document,
          );
        }).toThrow(/svg|unsafe|attribute/i);
      } finally {
        dom.window.close();
      }
    });

    it("rejects unsupported SVG elements", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        expect(() => {
          createSafeSvg(
            "<svg><script>alert(1)</script></svg>",
            dom.window.document,
          );
        }).toThrow(/svg|unsafe|unsupported/i);
      } finally {
        dom.window.close();
      }
    });
  });

  // ----------------------------------------------------------
  // 7. Icon Rendering
  // ----------------------------------------------------------

  describe("Icon Rendering", () => {
    it("renders icon classes without interpreting HTML", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const icon = createClassIcon(
          'fas fa-check"><img src=x onerror=alert(1)>',
          dom.window.document,
        );

        expect(icon.localName).toBe("i");
        expect(icon.getAttribute("class")).toContain("fa-check");
        expect(icon.querySelector("img")).toBeNull();
        expect(icon.querySelector("[onerror]")).toBeNull();
      } finally {
        dom.window.close();
      }
    });

    it("renders valid image icons without event attributes", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://example.com/",
      });

      try {
        const image = createImageIcon(
          "/images/check.png",
          dom.window.document,
          "24px",
          "24px",
        );

        expect(image.localName).toBe("img");
        expect(image.getAttribute("src")).toBe("/images/check.png");
        expect(image.style.width).toBe("24px");
        expect(image.style.height).toBe("24px");
        expect(image.hasAttribute("onerror")).toBe(false);
      } finally {
        dom.window.close();
      }
    });

    it.each([
      ["JPEG", "/icons/notification.jpeg"],
      ["JPG", "/icons/notification.jpg"],
      ["PNG", "/icons/notification.png"],
      ["GIF", "/icons/notification.gif"],
      ["WebP", "/icons/notification.webp"],
      ["AVIF", "/icons/notification.avif"],
      ["SVG", "/icons/notification.svg"],
      ["WebP with query", "/icons/notification.webp?v=2"],
      ["AVIF with fragment", "/icons/notification.avif#icon"],
      ["SVG with query and fragment", "/icons/notification.svg?v=2#icon"],
      ["Uppercase WebP", "/icons/notification.WEBP"],
    ])("renders %s URL strings as image icons", (_format, url) => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://example.com/",
      });

      try {
        const icon = renderIcon(
          {
            type: "info",
            icon: url,
            isIcon: false,
            enableIcon: true,
          },
          createNotificationTypes(),
          dom.window.document,
        );

        const image = icon.querySelector("img");

        expect(image).not.toBeNull();
        expect(image.getAttribute("src")).toBe(url);
        expect(image.getAttribute("alt")).toBe("");
        expect(icon.querySelector("i")).toBeNull();
      } finally {
        dom.window.close();
      }
    });

    it.each([
      "/icons/notification.webp",
      "/icons/notification.avif",
      "/icons/notification.svg",
    ])("rejects image URL %s when isIcon is true", (url) => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://example.com/",
      });

      try {
        expect(() => {
          renderIcon(
            {
              type: "info",
              icon: url,
              isIcon: true,
              enableIcon: true,
            },
            createNotificationTypes(),
            dom.window.document,
          );
        }).toThrow(/image URL cannot be used/i);
      } finally {
        dom.window.close();
      }
    });

    it.each([
      "javascript:alert(1)",
      "data:image/svg+xml,<svg></svg>",
      "file:///tmp/notification.svg",
      "ftp://example.com/notification.webp",
    ])("rejects unsafe image URL protocol: %s", (url) => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://example.com/",
      });

      try {
        expect(() => {
          createImageIcon(url, dom.window.document);
        }).toThrow(TypeError);
      } finally {
        dom.window.close();
      }
    });

    it("rejects unsafe image URL protocols", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://example.com/",
      });

      try {
        expect(() => {
          createImageIcon("javascript:alert(1)", dom.window.document);
        }).toThrow(/url|http/i);

        expect(() => {
          createImageIcon(
            "data:image/svg+xml,<svg></svg>",
            dom.window.document,
          );
        }).toThrow(/url|http/i);
      } finally {
        dom.window.close();
      }
    });

    it("renders the correct built-in notification icon", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const types = createNotificationTypes();

        const icon = renderIcon(
          {
            type: "success",
            icon: null,
            enableIcon: true,
          },
          types,
          dom.window.document,
        );

        expect(icon).not.toBeNull();
        expect(icon.className).toBe("zephyr-toast-notification-icon");
        expect(icon.querySelector("svg")).not.toBeNull();
        expect(icon.querySelector("path")).not.toBeNull();
      } finally {
        dom.window.close();
      }
    });

    it("renders custom SVG icons through the secure renderer", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const icon = renderIcon(
          {
            type: "info",
            icon: {
              svg: '<svg viewBox="0 0 24 24"><path d="M0 0L12 12" /></svg>',
            },
            enableIcon: true,
          },
          createNotificationTypes(),
          dom.window.document,
        );

        expect(icon.querySelector("svg")).not.toBeNull();
        expect(icon.querySelector("path")).not.toBeNull();

        expect(() => {
          renderIcon(
            {
              type: "info",
              icon: {
                svg: '<svg onload="alert(1)"></svg>',
              },
              enableIcon: true,
            },
            createNotificationTypes(),
            dom.window.document,
          );
        }).toThrow(/svg|unsafe|attribute/i);
      } finally {
        dom.window.close();
      }
    });

    it("does not render an icon when icons are disabled", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const icon = renderIcon(
          {
            type: "info",
            icon: null,
            enableIcon: false,
          },
          createNotificationTypes(),
          dom.window.document,
        );

        expect(icon).toBeNull();
      } finally {
        dom.window.close();
      }
    });
  });

  // ----------------------------------------------------------
  // 8. Lifecycle Management
  // ----------------------------------------------------------

  describe("Lifecycle Management", () => {
    it("exports the lifecycle functions", () => {
      expect(typeof initializeLifecycle).toBe("function");
      expect(typeof dismissToast).toBe("function");
    });

    it("does not schedule dismissal for persistent notifications", () => {
      vi.useFakeTimers();

      try {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

        try {
          const element = dom.window.document.createElement("div");
          const onDismiss = vi.fn();

          initializeLifecycle(
            element,
            {
              duration: 0,
              pauseOnHover: true,
            },
            onDismiss,
          );

          vi.advanceTimersByTime(5000);

          expect(onDismiss).not.toHaveBeenCalled();
          expect(element._timeoutId).toBeUndefined();
        } finally {
          dom.window.close();
        }
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });

    it("schedules automatic dismissal after the configured duration", () => {
      vi.useFakeTimers();

      try {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

        try {
          const element = dom.window.document.createElement("div");
          const onDismiss = vi.fn();

          initializeLifecycle(
            element,
            {
              duration: 1000,
              pauseOnHover: false,
            },
            onDismiss,
          );

          vi.advanceTimersByTime(999);

          expect(onDismiss).not.toHaveBeenCalled();

          vi.advanceTimersByTime(1);

          expect(onDismiss).toHaveBeenCalledOnce();
          expect(onDismiss).toHaveBeenCalledWith(element);
        } finally {
          dom.window.close();
        }
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });

    it("dismisses a notification only once", () => {
      vi.useFakeTimers();

      try {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

        try {
          const element = dom.window.document.createElement("div");
          const onClose = vi.fn();

          element._options = {
            animation: {
              in: "fadeIn",
              out: "fadeOut",
            },
            onClose,
          };

          dom.window.document.body.appendChild(element);

          const animations = {
            fadeIn: "zephyr_animate_fadeIn",
            fadeOut: "zephyr_animate_fadeOut",
          };

          dismissToast(element, animations);
          dismissToast(element, animations);
          dismissToast(element, animations);

          expect(vi.getTimerCount()).toBe(1);
          expect(element._lifecycleState).toBe("closing");

          vi.advanceTimersByTime(500);

          expect(element.isConnected).toBe(false);
          expect(element._lifecycleState).toBe("closed");
          expect(onClose).toHaveBeenCalledOnce();
          expect(vi.getTimerCount()).toBe(0);
        } finally {
          dom.window.close();
        }
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });
  });

  // ----------------------------------------------------------
  // 9. Toast DOM Rendering
  // ----------------------------------------------------------

  describe("Toast DOM Rendering", () => {
    /**
     * Builds a valid resolved notification configuration.
     *
     * @param {Object} overrides - Configuration overrides.
     * @returns {Object} Resolved notification options.
     */
    function createOptions(overrides = {}) {
      return {
        ...createDefaultOptions(),
        duration: 0,
        type: "info",
        theme: {
          bgColor: "#dff0fa",
          textColor: "#2385ba",
          borderColor: "#a9d7f1",
        },
        ...overrides,
      };
    }

    it("creates a notification without inserting it into the DOM", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const toast = renderToast(
          createOptions(),
          createNotificationTypes(),
          ANIMATIONS,
          dom.window.document,
          () => {},
        );

        expect(toast.classList.contains("zephyr-toast-notification")).toBe(
          true,
        );

        expect(toast.isConnected).toBe(false);

        expect(
          toast.querySelector(".zephyr-toast-notification-message"),
        ).not.toBeNull();
      } finally {
        dom.window.close();
      }
    });

    it("renders untrusted HTML-like content as plain text", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const toast = renderToast(
          createOptions({
            message: '<img src=x onerror="alert(1)">',
            allowHtml: false,
          }),
          createNotificationTypes(),
          ANIMATIONS,
          dom.window.document,
          () => {},
        );

        expect(
          toast.querySelector(".zephyr-toast-notification-message img"),
        ).toBeNull();

        expect(toast.textContent).toContain("<img");
      } finally {
        dom.window.close();
      }
    });

    it("supports explicitly trusted HTML content", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const toast = renderToast(
          createOptions({
            message: "<strong>Important</strong>",
            allowHtml: true,
          }),
          createNotificationTypes(),
          ANIMATIONS,
          dom.window.document,
          () => {},
        );

        expect(toast.querySelector("strong")).not.toBeNull();
      } finally {
        dom.window.close();
      }
    });

    it("renders a close button that invokes dismissal", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const dismissed = vi.fn();

        const toast = renderToast(
          createOptions(),
          createNotificationTypes(),
          ANIMATIONS,
          dom.window.document,
          dismissed,
        );

        const closeButton = toast.querySelector(
          ".zephyr-toast-notification-close",
        );

        expect(closeButton).not.toBeNull();

        closeButton.click();

        expect(dismissed).toHaveBeenCalledOnce();
        expect(dismissed).toHaveBeenCalledWith(toast);
      } finally {
        dom.window.close();
      }
    });

    it("renders the progress bar for timed notifications", () => {
      vi.useFakeTimers();

      try {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

        try {
          const toast = renderToast(
            createOptions({
              duration: 2000,
              showProgress: true,
            }),
            createNotificationTypes(),
            ANIMATIONS,
            dom.window.document,
            () => {},
          );

          expect(
            toast.querySelector(".zephyr-toast-progress-bar"),
          ).not.toBeNull();

          vi.advanceTimersByTime(10);

          const progressFill = toast.querySelector(
            ".zephyr-toast-progress-bar-fill",
          );

          expect(progressFill.style.width).toBe("0%");
          expect(progressFill.style.transitionDuration).toBe("2000ms");
        } finally {
          dom.window.close();
        }
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });

    it("does not create a progress bar for persistent notifications", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const toast = renderToast(
          createOptions({
            duration: 0,
            showProgress: true,
          }),
          createNotificationTypes(),
          ANIMATIONS,
          dom.window.document,
          () => {},
        );

        expect(toast.querySelector(".zephyr-toast-progress-bar")).toBeNull();
      } finally {
        dom.window.close();
      }
    });
  });
});
