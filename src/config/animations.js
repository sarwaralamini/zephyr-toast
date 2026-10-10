/**
 * @fileoverview Notification animation mappings for ZephyrToast.
 *
 * Defines the supported entrance and exit animations and maps
 * their configuration names to the corresponding CSS classes.
 *
 * These mappings are used by the notification renderer and
 * lifecycle manager to apply entrance and dismissal effects.
 *
 * @module config/animations
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Immutable mapping of supported notification animations.
 *
 * Animation names serve as configuration keys, while their
 * values represent CSS classes defined in the ZephyrToast
 * animation stylesheet.
 *
 * Animations are organized by family:
 * - Fade
 * - Slide
 * - Bounce
 * - Zoom
 *
 * @constant
 * @type {Readonly<Record<string, string>>}
 */
export const ANIMATIONS = Object.freeze({
  // Fade animations.
  fadeIn: "zephyr_animate_fadeIn",
  fadeOut: "zephyr_animate_fadeOut",

  // Slide animations.
  slideInLeft: "zephyr_animate_slideInLeft",
  slideOutLeft: "zephyr_animate_slideOutLeft",
  slideInRight: "zephyr_animate_slideInRight",
  slideOutRight: "zephyr_animate_slideOutRight",
  slideInDown: "zephyr_animate_slideInDown",
  slideOutDown: "zephyr_animate_slideOutDown",
  slideInUp: "zephyr_animate_slideInUp",
  slideOutUp: "zephyr_animate_slideOutUp",

  // Bounce animations.
  bounceIn: "zephyr_animate_bounceIn",
  bounceOut: "zephyr_animate_bounceOut",

  // Zoom animations.
  zoomIn: "zephyr_animate_zoomIn",
  zoomOut: "zephyr_animate_zoomOut",
});
