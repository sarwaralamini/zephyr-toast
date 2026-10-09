/**
 * @fileoverview Default notification configuration for ZephyrToast.
 *
 * Defines the default options used by new notification instances.
 * The configuration is immutable and should be copied before use
 * to prevent unintended changes to shared defaults.
 *
 * @module config/defaults
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Default settings for ZephyrToast notifications.
 *
 * Nested animation configuration is frozen separately to prevent
 * accidental changes through the exported object.
 *
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
 * Creates an independent copy of the default configuration.
 *
 * The nested animation object is copied as well, allowing each
 * ZephyrToast instance to manage its settings independently
 * without mutating the exported defaults.
 *
 * @returns {Object} A mutable copy of the default configuration.
 */
export function createDefaultOptions() {
  return {
    ...DEFAULT_OPTIONS,
    animation: {
      ...DEFAULT_OPTIONS.animation,
    },
  };
}
