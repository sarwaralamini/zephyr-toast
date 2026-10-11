/**
 * @fileoverview Main ZephyrToast notification class.
 *
 * Provides the public API for creating, displaying, configuring,
 * and dismissing toast notifications.
 *
 * Coordinates configuration validation, notification rendering,
 * lifecycle management, container positioning, and stylesheet
 * initialization through the library's modular components.
 *
 * Supports six built-in notification types and customizable
 * appearance, animation, icons, and interaction behavior.
 *
 * @module ZephyrToast
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { ANIMATIONS } from "./config/animations.js";
import { createDefaultOptions } from "./config/defaults.js";
import { createNotificationTypes } from "./config/types.js";
import { validateConfiguration } from "./config/validation.js";

import { initializeLifecycle, dismissToast } from "./core/lifecycle.js";

import { createSafeSvg } from "./renderers/svg.js";
import { renderToast } from "./renderers/toast.js";

/**
 * Main class for managing ZephyrToast notifications.
 *
 * Each instance maintains its own configuration and notification
 * type definitions while sharing the library's immutable
 * animation mappings.
 *
 * The constructor validates configuration, initializes the
 * notification container, and attempts stylesheet injection
 * for standalone browser usage.
 */
class ZephyrToast {
  /**
   * Creates a ZephyrToast instance.
   *
   * Combines user-provided configuration with the library defaults.
   * Nested animation settings are merged independently to preserve
   * unspecified default values.
   *
   * Configuration is validated before the notification container
   * is initialized.
   *
   * @param {Object} [options={}] - Initial notification configuration.
   * @throws {TypeError} If a configuration value has an invalid type.
   * @throws {RangeError} If a configuration value is unsupported.
   */
  constructor(options = {}) {
    // Create independent default configuration for this instance.
    this.defaults = createDefaultOptions();

    // Merge constructor options with the library defaults.
    this.options = {
      ...this.defaults,
      ...options,
      animation: {
        ...this.defaults.animation,
        ...options.animation,
      },
    };

    // Animation classes are maintained in the shared configuration module.
    this.animations = ANIMATIONS;

    // Create independent notification type definitions.
    this.types = createNotificationTypes();

    // Validate configuration before modifying the DOM.
    this.validateConfiguration(this.options);

    // Initialize the notification container only after validation succeeds.
    this.initializeContainer();

    // Load stylesheets for standalone browser usage.
    this.injectCSS();
  }

  /**
   * Creates a validated custom SVG icon.
   *
   * Delegates SVG parsing and validation to the shared secure
   * SVG renderer while preserving the class-level API.
   *
   * @param {string} markup - Custom SVG markup to validate.
   * @returns {SVGSVGElement} A newly constructed, validated SVG element.
   * @throws {TypeError} If the markup is invalid or contains
   * unsupported SVG content.
   */
  createSafeSvg(markup) {
    return createSafeSvg(markup, document);
  }

  /**
   * Validates notification configuration.
   *
   * Delegates validation to the shared configuration validator.
   * Can be used for constructor options, per-notification options,
   * and notification container position updates.
   *
   * @param {Object} options - Configuration values to validate.
   * @returns {void}
   * @throws {TypeError} If a configuration value has an invalid type.
   * @throws {RangeError} If a configuration value is unsupported.
   */
  validateConfiguration(options) {
    validateConfiguration(options);
  }

  /**
   * Initializes or reuses the notification container.
   *
   * Locates the shared notification container in the document,
   * creating one when necessary.
   *
   * Applies the configured position class to the container.
   *
   * @returns {void}
   */
  initializeContainer() {
    // Get or create the notification container.
    this.container = document.getElementById("zephyr-toast-container");

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "zephyr-toast-container";
      document.body.appendChild(this.container);
    }

    // Apply the configured notification position.
    this.container.className = `zephyr-toast-container zephyr-position-${this.options.position}`;
  }

  /**
   * Loads the library stylesheets for standalone browser usage.
   *
   * Searches the document for the standalone ZephyrToast script
   * and resolves stylesheet paths relative to its location.
   *
   * When an existing stylesheet injection element is found,
   * no additional styles are added.
   *
   * ES module consumers should import the library stylesheets
   * explicitly through their bundler.
   *
   * If no standalone script is detected, the method returns
   * without modifying the document.
   *
   * @returns {void}
   */
  injectCSS() {
    if (document.getElementById("zephyr-toast-notification-css")) {
      return;
    }

    // Find the standalone browser script.
    const scripts = document.scripts;
    let scriptPath = "";

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];

      if (script.src && /(?:^|\/)zephyr-toast\.js(?:[?#]|$)/.test(script.src)) {
        scriptPath = script.src;
        break;
      }
    }

    // ES module consumers load stylesheets through their bundler.
    if (!scriptPath) {
      return;
    }

    const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

    const animateCSSPath = `${scriptDir}/zephyr-toast-animate.css`;

    const zephyrToastCSSPath = `${scriptDir}/zephyr-toast.css`;

    const style = document.createElement("style");

    style.id = "zephyr-toast-notification-css";
    style.textContent = `
      @import url('${animateCSSPath}');
      @import url('${zephyrToastCSSPath}');
    `;

    document.head.appendChild(style);
  }

  /**
   * Creates and displays a toast notification.
   *
   * Validates the provided notification options and combines them
   * with the instance configuration and notification type defaults.
   *
   * Configuration precedence:
   * 1. Library defaults.
   * 2. Notification type theme defaults.
   * 3. Constructor-level configuration.
   * 4. Per-notification configuration.
   *
   * Animation and theme settings are resolved independently to
   * preserve unspecified properties.
   *
   * The notification is rendered, inserted into its container,
   * and initialized with visibility and lifecycle behavior.
   *
   * @param {string} message - Message to display in the notification.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification DOM element.
   * @throws {TypeError} If a configuration value is invalid or
   * icon rendering encounters unsupported content.
   * @throws {RangeError} If a configuration value is unsupported.
   */
  createToast(message, options = {}) {
    // Validate user-provided options before merging and normalizing them.
    this.validateConfiguration(options);

    // Resolve the notification type and its default theme.
    const toastType = options.type ?? this.options.type;
    const typeTheme = this.types[toastType] ?? this.types.info;

    // Merge instance and per-notification configuration.
    const toastOptions = {
      ...this.options,
      ...options,
      message,
      animation: {
        ...this.defaults.animation,
        ...this.options.animation,
        ...options.animation,
      },
      theme: {
        bgColor:
          options.theme?.bgColor ??
          this.options.theme?.bgColor ??
          typeTheme.bgColor,

        textColor:
          options.theme?.textColor ??
          this.options.theme?.textColor ??
          typeTheme.textColor,

        borderColor:
          options.theme?.borderColor ??
          this.options.theme?.borderColor ??
          typeTheme.borderColor,

        progressTrackColor:
          options.theme?.progressTrackColor ??
          this.options.theme?.progressTrackColor,

        progressBarColor:
          options.theme?.progressBarColor ??
          this.options.theme?.progressBarColor,
      },
    };

    // Validate the resolved configuration before creating DOM elements.
    this.validateConfiguration(toastOptions);

    // Render the notification before modifying shared container state.
    // If rendering fails, the existing position remains unchanged.
    const toast = renderToast(
      toastOptions,
      this.types,
      this.animations,
      document,
      (element) => this.removeToast(element),
    );

    // Update the container position only after successful rendering.
    if (options.position && options.position !== this.options.position) {
      this.updatePosition(options.position);
    }

    // Store the resolved configuration on the notification.
    toast._options = toastOptions;

    // Insert the notification using the configured ordering.
    if (toastOptions.newestOnTop) {
      this.container.prepend(toast);
    } else {
      this.container.appendChild(toast);
    }

    // Make the notification visible after insertion.
    // Retain the timer so dismissal can cancel pending DOM updates.
    toast._visibilityTimeoutId = setTimeout(() => {
      toast._visibilityTimeoutId = null;

      if (
        toast._lifecycleState !== "closing" &&
        toast._lifecycleState !== "closed"
      ) {
        toast.style.opacity = "1";
      }
    }, 10);

    // Initialize automatic dismissal and hover behavior.
    initializeLifecycle(toast, toastOptions, (element) =>
      this.removeToast(element),
    );

    return toast;
  }

  /**
   * Dismisses a notification using its configured exit animation.
   *
   * Delegates timer cancellation, animation handling, event-listener
   * cleanup, and DOM removal to the shared lifecycle manager.
   *
   * @param {HTMLElement} toast - Notification element to dismiss.
   * @returns {void}
   */
  removeToast(toast) {
    dismissToast(toast, this.animations);
  }

  /**
   * Dismisses all notifications in the current container.
   *
   * Each notification is dismissed through the standard
   * lifecycle manager, preserving its exit animation behavior.
   *
   * @returns {void}
   */
  removeAll() {
    const toasts = this.container.querySelectorAll(
      ".zephyr-toast-notification",
    );

    toasts.forEach((toast) => this.removeToast(toast));
  }

  /**
   * Displays a notification using the resolved notification type.
   *
   * Uses the instance's configured default type unless a different
   * type is supplied through the notification options.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  show(message, options = {}) {
    return this.createToast(message, options);
  }

  /**
   * Displays a success notification.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  success(message, options = {}) {
    return this.createToast(message, { ...options, type: "success" });
  }

  /**
   * Displays an informational notification.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  info(message, options = {}) {
    return this.createToast(message, { ...options, type: "info" });
  }

  /**
   * Displays a warning notification.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  warning(message, options = {}) {
    return this.createToast(message, { ...options, type: "warning" });
  }

  /**
   * Displays an error notification.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  error(message, options = {}) {
    return this.createToast(message, { ...options, type: "error" });
  }

  /**
   * Displays a zen-style notification.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  zen(message, options = {}) {
    return this.createToast(message, { ...options, type: "zen" });
  }

  /**
   * Displays a void-style notification.
   *
   * @param {string} message - Notification message.
   * @param {Object} [options={}] - Per-notification configuration.
   * @returns {HTMLElement} The created notification element.
   */
  void(message, options = {}) {
    return this.createToast(message, { ...options, type: "void" });
  }

  /**
   * Updates the notification container position.
   *
   * Validates the requested position before updating the
   * instance configuration and container CSS classes.
   *
   * @param {string} position - New notification container position.
   * @returns {void}
   * @throws {RangeError} If the position is unsupported.
   */
  updatePosition(position) {
    // Reject unsupported positions before changing the container.
    this.validateConfiguration({ position });

    this.options.position = position;

    this.container.className = `zephyr-toast-container zephyr-position-${position}`;
  }
}

export { ZephyrToast };
export default ZephyrToast;
