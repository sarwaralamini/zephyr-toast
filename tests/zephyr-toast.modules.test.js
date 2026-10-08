
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

import { describe, it, expect } from "vitest";

import { ANIMATIONS } from "../src/config/animations.js";

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
});
