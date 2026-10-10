/**
 * @fileoverview Default configuration for ZephyrToast notifications.
 *
 * Defines the immutable default options shared by ZephyrToast instances.
 * Each instance receives an independent copy of these defaults to avoid
 * unintended changes to the shared configuration.
 *
 * @module config/defaults
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Immutable default configuration for ZephyrToast notifications.
 *
 * Defines the initial notification type, positioning, duration,
 * appearance, animation, and interaction behavior.
 *
 * The configuration is shallowly frozen using Object.freeze().
 * The nested animation object is frozen separately to prevent
 * modifications to its properties.
 *
 * @constant
 * @type {Readonly<Record<string, unknown>>}
 */
export const DEFAULT_OPTIONS = Object.freeze({
  position: "top-right",
  newestOnTop: true,
  type: "info",
  duration: 3000,
  pauseOnHover: true,
  showProgress: true,
  animation: Object.freeze({
    in: "fadeIn",
    out: "fadeOut",
  }),
  message: "",
  title: "",
  allowHtml: false,
  enableIcon: true,
  icon: null,
  isIcon: false,
  showClose: true,
  onClose: null,
  onClick: null,
});

/**
 * Creates an independent, mutable copy of the default configuration.
 *
 * Copies all top-level properties and creates a separate animation
 * object so that instances can customize their settings without
 * modifying the shared default configuration.
 *
 * @returns {Object} A mutable copy of the default configuration,
 * including an independently copied animation object.
 */
export function createDefaultOptions() {
  return {
    ...DEFAULT_OPTIONS,
    animation: {
      ...DEFAULT_OPTIONS.animation,
    },
  };
}
