
/**
 * @fileoverview Configuration validation for ZephyrToast.
 *
 * Validates notification types, positions, durations, animations,
 * icon structures, and theme configuration independently of
 * notification rendering and DOM manipulation.
 *
 * @module config/validation
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { NOTIFICATION_TYPES } from "./types.js";

/**
 * Supported notification container positions.
 *
 * @type {ReadonlyArray<string>}
 */
export const VALID_POSITIONS = Object.freeze([
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
  "top-center",
  "bottom-center",
]);

/**
 * Supported entrance animation names.
 *
 * @type {ReadonlyArray<string>}
 */
export const VALID_ENTRANCE_ANIMATIONS = Object.freeze([
  "fadeIn",
  "slideInLeft",
  "slideInRight",
  "slideInDown",
  "slideInUp",
  "bounceIn",
  "zoomIn",
]);

/**
 * Supported exit animation names.
 *
 * @type {ReadonlyArray<string>}
 */
export const VALID_EXIT_ANIMATIONS = Object.freeze([
  "fadeOut",
  "slideOutLeft",
  "slideOutRight",
  "slideOutUp",
  "slideOutDown",
  "bounceOut",
  "zoomOut",
]);

/**
 * Validates a ZephyrToast configuration object.
 *
 * Validation is independent of the DOM and can be used for
 * constructor settings, notification overrides, and position
 * updates.
 *
 * @param {Object} options - Configuration to validate.
 * @returns {void}
 * @throws {TypeError} If a configuration value has an invalid type.
 * @throws {RangeError} If a configuration value is unsupported.
 */
export function validateConfiguration(options) {
  // Validate the notification type.
  if (
    options.type !== undefined &&
    !Object.hasOwn(NOTIFICATION_TYPES, options.type)
  ) {
    throw new RangeError(
      `Invalid notification type: "${options.type}".`
    );
  }

  // Validate the notification position.
  if (
    options.position !== undefined &&
    !VALID_POSITIONS.includes(options.position)
  ) {
    throw new RangeError(
      `Invalid notification position: "${options.position}".`
    );
  }

  // Duration must be a finite, non-negative number.
  if (options.duration !== undefined) {
    if (
      typeof options.duration !== "number" ||
      !Number.isFinite(options.duration)
    ) {
      throw new TypeError(
        "Notification duration must be a finite number."
      );
    }

    if (options.duration < 0) {
      throw new RangeError(
        "Notification duration cannot be negative."
      );
    }
  }

  // Validate the animation configuration.
  if (options.animation !== undefined) {
    const animation = options.animation;

    if (
      animation === null ||
      typeof animation !== "object" ||
      Array.isArray(animation)
    ) {
      throw new TypeError(
        "Animation configuration must be an object."
      );
    }

    if (
      animation.in !== undefined &&
      !VALID_ENTRANCE_ANIMATIONS.includes(animation.in)
    ) {
      throw new RangeError(
        `Invalid entrance animation: "${animation.in}".`
      );
    }

    if (
      animation.out !== undefined &&
      !VALID_EXIT_ANIMATIONS.includes(animation.out)
    ) {
      throw new RangeError(
        `Invalid exit animation: "${animation.out}".`
      );
    }
  }

  // Reject array-based icon configurations before rendering.
  if (Array.isArray(options.icon)) {
    throw new TypeError(
      "Icon configuration must be a string or a non-array object."
    );
  }

  // Theme configuration must be a non-array object.
  if (options.theme !== undefined) {
    if (
      options.theme === null ||
      typeof options.theme !== "object" ||
      Array.isArray(options.theme)
    ) {
      throw new TypeError(
        "Notification theme must be a configuration object."
      );
    }
  }
}
