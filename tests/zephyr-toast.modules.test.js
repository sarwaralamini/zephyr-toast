
/**
 * @fileoverview ES module architecture regression tests.
 *
 * Verifies that extracted configuration modules preserve
 * their expected exports and that the public module entry
 * point exposes the ZephyrToast class.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, vi } from "vitest";
import { JSDOM } from "jsdom";

import {
  DEFAULT_OPTIONS,
  createDefaultOptions,
} from "../src/config/defaults.js";

import {
  NOTIFICATION_TYPES,
  createNotificationTypes,
} from "../src/config/types.js";

import {
  validateConfiguration,
  VALID_POSITIONS,
  VALID_ENTRANCE_ANIMATIONS,
  VALID_EXIT_ANIMATIONS,
} from "../src/config/validation.js";

import { ANIMATIONS } from "../src/config/animations.js";

import { createSafeSvg } from "../src/renderers/svg.js";

import {
  createClassIcon,
  createImageIcon,
  renderIcon,
} from "../src/renderers/icons.js";

import ZephyrToast, {
  ZephyrToast as NamedZephyrToast,
} from "../src/index.js";

/**
 * Verifies animation configuration and public module exports.
 */
describe("ZephyrToast Modular Architecture", () => {
  describe("Animation Configuration", () => {
    it("exports all existing notification animations", () => {
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
        [...expectedAnimations].sort()
      );

      expect(ANIMATIONS.fadeIn).toBe("zephyr_animate_fadeIn");
      expect(ANIMATIONS.fadeOut).toBe("zephyr_animate_fadeOut");
    });

    it("exports an immutable animation mapping", () => {
      expect(Object.isFrozen(ANIMATIONS)).toBe(true);
    });
  });

  describe("Public Entry Point", () => {
    it("exposes the same class through named and default exports", () => {
      expect(ZephyrToast).toBe(NamedZephyrToast);
      expect(typeof ZephyrToast).toBe("function");
    });
  });

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
        { url: "http://localhost/" }
      );

      vi.stubGlobal("document", dom.window.document);

      try {
        const first = new ZephyrToast();
        const second = new ZephyrToast();

        expect(first.defaults).not.toBe(second.defaults);
        expect(first.defaults.animation).not.toBe(
          second.defaults.animation
        );

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
  });

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
  });

  describe("Secure SVG Rendering", () => {
    it("creates supported SVG elements in the target document", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const svg = createSafeSvg(
          '<svg viewBox="0 0 24 24"><path d="M2 2L12 12" /></svg>',
          dom.window.document
        );

        expect(svg.localName).toBe("svg");
        expect(svg.ownerDocument).toBe(dom.window.document);
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
            dom.window.document
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
            dom.window.document
          );
        }).toThrow(/svg|unsafe|unsupported/i);
      } finally {
        dom.window.close();
      }
    });
  });

  describe("Icon Rendering", () => {
    it("renders icon classes without interpreting HTML", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

      try {
        const icon = createClassIcon(
          'fas fa-check"><img src=x onerror=alert(1)>',
          dom.window.document
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
          "24px"
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

    it("rejects unsafe image URL protocols", () => {
      const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://example.com/",
      });

      try {
        expect(() => {
          createImageIcon(
            "javascript:alert(1)",
            dom.window.document
          );
        }).toThrow(/url|http/i);

        expect(() => {
          createImageIcon(
            "data:image/svg+xml,<svg></svg>",
            dom.window.document
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
          dom.window.document
        );

        expect(icon).not.toBeNull();
        expect(icon.className).toBe(
          "zephyr-toast-notification-icon"
        );
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
          dom.window.document
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
            dom.window.document
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
          dom.window.document
        );

        expect(icon).toBeNull();
      } finally {
        dom.window.close();
      }
    });
  });
  
});
