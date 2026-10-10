/**
 * @fileoverview Notification configuration validation for ZephyrToast.
 *
 * Validates notification types, positions, durations, animations,
 * boolean settings, custom themes, and icon configurations.
 *
 * Validation is independent of DOM rendering and is used for
 * constructor settings, individual notification overrides,
 * and notification container position updates.
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
 * Configuration properties that require boolean values.
 *
 * @type {ReadonlyArray<string>}
 */
const BOOLEAN_OPTIONS = Object.freeze([
  "newestOnTop",
  "pauseOnHover",
  "showProgress",
  "allowHtml",
  "enableIcon",
  "isIcon",
  "showClose",
]);

/**
 * Supported custom theme color properties.
 *
 * @type {ReadonlyArray<string>}
 */
const THEME_COLOR_OPTIONS = Object.freeze([
  "bgColor",
  "textColor",
  "borderColor",
  "progressTrackColor",
  "progressBarColor",
]);

/**
 * Supported structured icon configuration properties.
 *
 * @type {ReadonlyArray<string>}
 */
const ICON_OPTIONS = Object.freeze(["url", "fontAwesome", "svg"]);

/**
 * Validates a ZephyrToast notification configuration object.
 *
 * Checks supported notification types, positions, duration,
 * animations, boolean settings, theme values, and icon structures.
 *
 * This function does not modify the supplied configuration.
 *
 * @param {Object} options - Configuration values to validate.
 * @returns {void}
 * @throws {TypeError} If a configuration value has an invalid
 * type or unsupported structure.
 * @throws {RangeError} If a notification type, position,
 * duration, or animation is unsupported.
 */
export function validateConfiguration(options) {
  // ----------------------------------------------------------
  // 1. Notification Type
  // ----------------------------------------------------------

  if (
    options.type !== undefined &&
    !Object.hasOwn(NOTIFICATION_TYPES, options.type)
  ) {
    throw new RangeError(`Invalid notification type: "${options.type}".`);
  }

  // ----------------------------------------------------------
  // 2. Notification Position
  // ----------------------------------------------------------

  if (
    options.position !== undefined &&
    !VALID_POSITIONS.includes(options.position)
  ) {
    throw new RangeError(
      `Invalid notification position: "${options.position}".`,
    );
  }

  // ----------------------------------------------------------
  // 3. Notification Duration
  // ----------------------------------------------------------

  if (options.duration !== undefined) {
    if (
      typeof options.duration !== "number" ||
      !Number.isFinite(options.duration)
    ) {
      throw new TypeError("Notification duration must be a finite number.");
    }

    if (options.duration < 0) {
      throw new RangeError("Notification duration cannot be negative.");
    }
  }

  // ----------------------------------------------------------
  // 4. Notification Animations
  // ----------------------------------------------------------

  if (options.animation !== undefined) {
    const animation = options.animation;

    if (
      animation === null ||
      typeof animation !== "object" ||
      Array.isArray(animation)
    ) {
      throw new TypeError("Animation configuration must be an object.");
    }

    if (
      animation.in !== undefined &&
      !VALID_ENTRANCE_ANIMATIONS.includes(animation.in)
    ) {
      throw new RangeError(`Invalid entrance animation: "${animation.in}".`);
    }

    if (
      animation.out !== undefined &&
      !VALID_EXIT_ANIMATIONS.includes(animation.out)
    ) {
      throw new RangeError(`Invalid exit animation: "${animation.out}".`);
    }
  }

  // ----------------------------------------------------------
  // 5. Boolean Configuration
  // ----------------------------------------------------------

  for (const option of BOOLEAN_OPTIONS) {
    if (options[option] !== undefined && typeof options[option] !== "boolean") {
      throw new TypeError(`Notification ${option} must be a boolean.`);
    }
  }

  // ----------------------------------------------------------
  // 6. Notification Theme
  // ----------------------------------------------------------

  if (options.theme !== undefined) {
    const theme = options.theme;

    if (theme === null || typeof theme !== "object" || Array.isArray(theme)) {
      throw new TypeError("Notification theme must be a configuration object.");
    }

    for (const property of THEME_COLOR_OPTIONS) {
      if (
        theme[property] !== undefined &&
        typeof theme[property] !== "string"
      ) {
        throw new TypeError(`Notification theme ${property} must be a string.`);
      }
    }
  }

  // ----------------------------------------------------------
  // 7. Notification Icon
  // ----------------------------------------------------------

  if (options.icon !== undefined && options.icon !== null) {
    const icon = options.icon;

    // String icons represent CSS classes or recognized image URLs.
    if (typeof icon === "string") {
      return;
    }

    // Reject primitive values and array-based configurations.
    if (typeof icon !== "object" || Array.isArray(icon)) {
      throw new TypeError(
        "Icon configuration must be a string or a non-array object.",
      );
    }

    // Require a recognized structured icon property.
    const hasSupportedProperty = ICON_OPTIONS.some((property) =>
      Object.hasOwn(icon, property),
    );

    if (!hasSupportedProperty) {
      throw new TypeError(
        "Icon configuration must provide url, fontAwesome, or svg.",
      );
    }

    // Reject unsupported structured icon properties.
    for (const property of Object.keys(icon)) {
      if (
        !ICON_OPTIONS.includes(property) &&
        property !== "width" &&
        property !== "height"
      ) {
        throw new TypeError(
          `Unsupported icon configuration property: ${property}.`,
        );
      }
    }

    // Validate the provided icon source properties.
    for (const property of ICON_OPTIONS) {
      if (
        Object.hasOwn(icon, property) &&
        (typeof icon[property] !== "string" || !icon[property].trim())
      ) {
        throw new TypeError(`Icon ${property} must be a non-empty string.`);
      }
    }

    // Image dimensions must be valid CSS value strings.
    for (const property of ["width", "height"]) {
      if (icon[property] !== undefined && typeof icon[property] !== "string") {
        throw new TypeError(`Icon ${property} must be a string.`);
      }
    }
  }
}
