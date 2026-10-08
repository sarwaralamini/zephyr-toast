
/**
 * @fileoverview Animation class mappings for ZephyrToast.
 *
 * Maps supported animation names to their corresponding
 * CSS classes used for notification entrance and exit.
 *
 * @module config/animations
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Supported notification animation classes.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ANIMATIONS = Object.freeze({
  fadeIn: "zephyr_animate_fadeIn",
  fadeOut: "zephyr_animate_fadeOut",
  slideInLeft: "zephyr_animate_slideInLeft",
  slideOutLeft: "zephyr_animate_slideOutLeft",
  slideInRight: "zephyr_animate_slideInRight",
  slideOutRight: "zephyr_animate_slideOutRight",
  slideInDown: "zephyr_animate_slideInDown",
  slideOutUp: "zephyr_animate_slideOutUp",
  slideInUp: "zephyr_animate_slideInUp",
  slideOutDown: "zephyr_animate_slideOutDown",
  bounceIn: "zephyr_animate_bounceIn",
  bounceOut: "zephyr_animate_bounceOut",
  zoomIn: "zephyr_animate_zoomIn",
  zoomOut: "zephyr_animate_zoomOut",
});
