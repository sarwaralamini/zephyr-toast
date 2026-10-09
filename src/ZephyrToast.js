import { ANIMATIONS } from "./config/animations.js";
import { createDefaultOptions } from "./config/defaults.js";
import { createNotificationTypes } from "./config/types.js";
import { validateConfiguration } from "./config/validation.js";
import { createSafeSvg } from "./renderers/svg.js";
import { renderToast } from "./renderers/toast.js";
import { initializeLifecycle, dismissToast } from "./core/lifecycle.js";

/**
 * ZephyrToast - A Toast Notification Library
 * Version: 1.5.0
 *
 * ZephyrToast is a lightweight, pure vanilla JavaScript toast notification library,
 * inspired by Bootstrap 5 styling and free from dependencies. It offers elegant,
 * customizable notifications that gently appear and disappear, delivering a seamless
 * user experience.
 *
 * Author: Md.Sarwar Alam
 * GitHub: https://github.com/sarwaralamini
 * Library: https://github.com/sarwaralamini/zephyr-toast
 *
 * Released under the MIT License
 */

class ZephyrToast {
  constructor(options = {}) {
    // Create independent default configuration for this instance.
    this.defaults = createDefaultOptions();

    // Merge options with defaults
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
   * Delegates parsing and security validation to the shared
   * SVG renderer while preserving the existing class API.
   *
   * @param {string} markup - SVG markup to validate.
   * @returns {SVGSVGElement} The validated SVG icon.
   * @throws {TypeError} If the markup contains unsupported content.
   */
  createSafeSvg(markup) {
    return createSafeSvg(markup, document);
  }

  /**
   * Validates notification configuration using the shared validator.
   *
   * Preserves the existing instance method while delegating validation
   * to the DOM-independent configuration module.
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
   * Initialize the container for toast notifications
   */
  initializeContainer() {
    // Get or create the container
    this.container = document.getElementById("zephyr-toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "zephyr-toast-container";
      document.body.appendChild(this.container);
    }

    // Set position class
    this.container.className = `zephyr-toast-container zephyr-position-${this.options.position}`;
  }

  /**
   * Loads the library stylesheets for standalone browser usage.
   *
   * When loaded through a traditional script element, CSS paths
   * are resolved relative to the JavaScript file.
   *
   * ES module consumers should import the stylesheets explicitly.
   * When no standalone script is present, no console error is emitted.
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
   * Create a new toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  createToast(message, options = {}) {
    // Validate user-provided options before merging and normalizing them.
    this.validateConfiguration(options);

    /**
     * Resolves notification configuration using the following priority:
     *
     * 1. Library defaults
     * 2. Notification type defaults
     * 3. Constructor-level configuration
     * 4. Per-notification configuration
     *
     * Nested animation and theme objects are merged independently
     * to preserve unspecified configuration properties.
     */
    const toastType = options.type ?? this.options.type;
    const typeTheme = this.types[toastType] ?? this.types.info;

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

    // Update position if provided in options
    if (options.position && options.position !== this.options.position) {
      this.updatePosition(options.position);
    }

    // Create the notification using the shared DOM renderer.
    const toast = renderToast(
      toastOptions,
      this.types,
      this.animations,
      document,
      (element) => this.removeToast(element),
    );

    // Store options with the toast
    toast._options = toastOptions;

    // Add to container
    if (toastOptions.newestOnTop) {
      this.container.prepend(toast);
    } else {
      this.container.appendChild(toast);
    }

    // Make the toast visible after insertion.
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
   * Dismisses a toast notification.
   *
   * Delegates lifecycle state management, animation, timer
   * cleanup, and removal to the shared lifecycle module.
   *
   * @param {HTMLElement} toast - Notification element to dismiss.
   * @returns {void}
   */
  removeToast(toast) {
    dismissToast(toast, this.animations);
  }

  /**
   * Remove all toast notifications
   */
  removeAll() {
    const toasts = this.container.querySelectorAll(
      ".zephyr-toast-notification",
    );
    toasts.forEach((toast) => this.removeToast(toast));
  }

  /**
   * Show a toast notification with specified type
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  show(message, options = {}) {
    return this.createToast(message, options);
  }

  /**
   * Show a success toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  success(message, options = {}) {
    return this.createToast(message, { ...options, type: "success" });
  }

  /**
   * Show an info toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  info(message, options = {}) {
    return this.createToast(message, { ...options, type: "info" });
  }

  /**
   * Show a warning toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  warning(message, options = {}) {
    return this.createToast(message, { ...options, type: "warning" });
  }

  /**
   * Show an error toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  error(message, options = {}) {
    return this.createToast(message, { ...options, type: "error" });
  }

  /**
   * Show a zen toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  zen(message, options = {}) {
    return this.createToast(message, { ...options, type: "zen" });
  }

  /**
   * Show a void toast notification
   * @param {string} message - The message to display
   * @param {object} options - Custom options for this notification
   * @returns {HTMLElement} The created toast notification element
   */
  void(message, options = {}) {
    return this.createToast(message, { ...options, type: "void" });
  }

  /**
   * Updates the notification container position.
   *
   * Validates the requested position before modifying the
   * instance configuration or container CSS classes.
   *
   * @param {string} position - The new notification position.
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

/**
 * Exports the ZephyrToast class for ES module consumers.
 *
 * @module ZephyrToast
 * @author Md. Sarwar Alam
 * @license MIT
 */
export { ZephyrToast };
export default ZephyrToast;
