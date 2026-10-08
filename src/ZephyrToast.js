import { ANIMATIONS } from "./config/animations.js";
import { createDefaultOptions } from "./config/defaults.js";
import { createNotificationTypes } from "./config/types.js";

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

    // Initialize the container
    this.initializeContainer();

    // Animation classes are maintained in the shared configuration module.
    this.animations = ANIMATIONS;

    // Create independent notification type definitions.
    this.types = createNotificationTypes();

    // Validate the initialized configuration before loading styles.
    this.validateConfiguration(this.options);

    // Add necessary CSS.
    this.injectCSS();
  }


  /**
   * Creates a restricted SVG icon from supplied SVG markup.
   *
   * Only supported SVG drawing elements and attributes are copied
   * into a new SVG DOM tree. Scripts, event handlers, embedded
   * content, external references, and unsupported markup are rejected.
   *
   * @param {string} markup - SVG markup to validate and render.
   * @returns {SVGSVGElement} The validated SVG icon.
   * @throws {TypeError} If the SVG contains unsupported content.
   */
  createSafeSvg(markup) {
    if (typeof markup !== "string" || !markup.trim()) {
      throw new TypeError("SVG icon markup must be a non-empty string.");
    }

    const svgNamespace = "http://www.w3.org/2000/svg";

    const allowedElements = new Set([
      "svg",
      "g",
      "path",
      "circle",
      "ellipse",
      "rect",
      "line",
      "polyline",
      "polygon",
    ]);

    const allowedAttributes = new Set([
      "viewBox",
      "width",
      "height",
      "fill",
      "fill-opacity",
      "fill-rule",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-miterlimit",
      "stroke-dasharray",
      "stroke-dashoffset",
      "stroke-opacity",
      "opacity",
      "d",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "points",
      "transform",
      "xmlns",
    ]);

    // Parse markup in an inert template, never in the live document.
    const template = document.createElement("template");
    template.innerHTML = markup;

    const nodes = Array.from(template.content.childNodes).filter(
      (node) =>
        node.nodeType !== 3 || node.textContent.trim() !== ""
    );

    if (
      nodes.length !== 1 ||
      nodes[0].nodeType !== 1 ||
      nodes[0].localName !== "svg" ||
      nodes[0].namespaceURI !== svgNamespace
    ) {
      throw new TypeError("Invalid or unsafe SVG icon markup.");
    }

    /**
     * Recursively copies approved SVG nodes and attributes.
     *
     * @param {Element} source - SVG element to validate.
     * @returns {SVGElement} A newly constructed, validated element.
     * @throws {TypeError} If unsupported SVG content is encountered.
     */
    const copySafeNode = (source) => {
      if (
        source.namespaceURI !== svgNamespace ||
        !allowedElements.has(source.localName)
      ) {
        throw new TypeError(
          `Unsafe or unsupported SVG element: ${source.localName}.`
        );
      }

      const target = document.createElementNS(
        svgNamespace,
        source.localName
      );

      for (const attribute of Array.from(source.attributes)) {
        const name = attribute.name;
        const value = attribute.value;

        // Reject event handlers, namespaced references, and
        // attributes outside the explicitly supported subset.
        if (
          !allowedAttributes.has(name) ||
          (attribute.namespaceURI &&
            attribute.namespaceURI !== "http://www.w3.org/2000/xmlns/")
        ) {
          throw new TypeError(
            `Unsafe or unsupported SVG attribute: ${name}.`
          );
        }

        // Reject URL functions, control characters, markup, and
        // protocol-like content inside supported attributes.
        if (
          /url\s*\(/i.test(value) ||
          /(?:javascript|data|vbscript)\s*:/i.test(value) ||
          /[<>\u0000-\u001f\u007f]/.test(value)
        ) {
          throw new TypeError(
            `Unsafe SVG attribute value: ${name}.`
          );
        }

        if (name === "xmlns") {
          if (value !== svgNamespace) {
            throw new TypeError("Invalid SVG namespace.");
          }

          continue;
        }

        target.setAttribute(name, value);
      }

      for (const child of Array.from(source.childNodes)) {
        if (child.nodeType === 3 && child.textContent.trim() === "") {
          continue;
        }

        if (child.nodeType !== 1) {
          throw new TypeError("Unsupported SVG child content.");
        }

        target.appendChild(copySafeNode(child));
      }

      return target;
    };

    return copySafeNode(nodes[0]);
  }

  /**
   * Validates notification configuration before it is applied.
   *
   * Ensures notification types, positions, durations, animations,
   * and theme structures contain supported values.
   *
   * This method is shared by constructor initialization,
   * individual notification creation, and position updates.
   *
   * @param {Object} options - The configuration values to validate.
   * @returns {void}
   * @throws {TypeError} If a configuration value has an invalid type.
   * @throws {RangeError} If a configuration value is unsupported.
   */
  validateConfiguration(options) {
    const validPositions = [
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
      "top-center",
      "bottom-center",
    ];

    const validEntranceAnimations = [
      "fadeIn",
      "slideInLeft",
      "slideInRight",
      "slideInDown",
      "slideInUp",
      "bounceIn",
      "zoomIn",
    ];

    const validExitAnimations = [
      "fadeOut",
      "slideOutLeft",
      "slideOutRight",
      "slideOutUp",
      "slideOutDown",
      "bounceOut",
      "zoomOut",
    ];

    // Validate the notification type.
    if (
      options.type !== undefined &&
      !Object.hasOwn(this.types, options.type)
    ) {
      throw new RangeError(
        `Invalid notification type: "${options.type}".`
      );
    }

    // Validate the notification position.
    if (
      options.position !== undefined &&
      !validPositions.includes(options.position)
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
        !validEntranceAnimations.includes(animation.in)
      ) {
        throw new RangeError(
          `Invalid entrance animation: "${animation.in}".`
        );
      }

      if (
        animation.out !== undefined &&
        !validExitAnimations.includes(animation.out)
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
   * Inject necessary CSS for toast notifications
   */
  injectCSS() {
    if (document.getElementById("zephyr-toast-notification-css")) return;

    // Loop through all scripts in the document to find the ZephyrToast script
    const scripts = document.scripts;
    let scriptPath = "";

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes("zephyr-toast.js")) {
        // Match based on the script file name
        scriptPath = script.src;
        break;
      }
    }

    // If the path is found, extract the directory
    if (scriptPath) {
      const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf("/"));

      // Construct the correct paths for the CSS files
      const animateCSSPath = `${scriptDir}/zephyr-toast-animate.css`;
      const zephyrToastCSSPath = `${scriptDir}/zephyr-toast.css`;

      // Create the style element with dynamically constructed paths
      const css = `
          @import url('${animateCSSPath}');
          @import url('${zephyrToastCSSPath}');
          `;

      const style = document.createElement("style");
      style.id = "zephyr-toast-notification-css";
      style.textContent = css;
      document.head.appendChild(style);
    } else {
      console.error("ZephyrToast script not found.");
    }
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

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `zephyr-toast-notification zephyr_animate ${
      this.animations[toastOptions.animation.in]
    }`;
    toast.style.backgroundColor = toastOptions.theme.bgColor;
    toast.style.color = toastOptions.theme.textColor;
    toast.style.borderColor = toastOptions.theme.borderColor;

    // Create toast body
    const toastBody = document.createElement("div");
    toastBody.className = "zephyr-toast-notification-body";

    //Adds an icon to the toast notification if `enableIcon` is not explicitly set to false.
    
    // Render notification icons using DOM APIs to prevent HTML injection.
    if (toastOptions.enableIcon !== false) {
      const iconDiv = document.createElement("div");
      iconDiv.className = "zephyr-toast-notification-icon";

      const icon = toastOptions.icon;

      /**
       * Creates an icon element from CSS class names.
       *
       * Assigning the class attribute directly prevents the supplied
       * value from being interpreted as HTML markup.
       *
       * @param {string} className - CSS classes for the icon.
       * @returns {HTMLElement} The generated icon element.
       */
      const createClassIcon = (className) => {
        const element = document.createElement("i");
        element.setAttribute("class", className);
        return element;
      };

      /**
       * Creates an image icon without interpolating HTML attributes.
       *
       * Supports relative, HTTP, and HTTPS image URLs. Dimensions are
       * applied using the CSSOM rather than inline HTML markup.
       *
       * @param {string} url - The image source URL.
       * @param {string} [width="16px"] - Image width.
       * @param {string} [height="16px"] - Image height.
       * @returns {HTMLImageElement} The generated image element.
       * @throws {TypeError} If the URL is invalid or unsupported.
       */
      const createImageIcon = (
        url,
        width = "16px",
        height = "16px"
      ) => {
        if (typeof url !== "string" || !url.trim()) {
          throw new TypeError("Icon image URL must be a non-empty string.");
        }

        let parsedUrl;

        try {
          parsedUrl = new URL(url, document.baseURI);
        } catch {
          throw new TypeError("Invalid icon image URL.");
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new TypeError(
            "Icon image URL must use HTTP, HTTPS, or a relative path."
          );
        }

        const image = document.createElement("img");

        // Preserve the supplied URL while preventing attribute injection.
        image.setAttribute("src", url);
        image.setAttribute("alt", "");
        image.style.width = width;
        image.style.height = height;

        return image;
      };

      if (typeof icon === "string" && icon.length > 0) {
        const isImageUrl = /\.(jpeg|jpg|gif|png)(?:[?#].*)?$/i.test(icon);

        if (toastOptions.isIcon && isImageUrl) {
          throw new TypeError(
            "An image URL cannot be used when isIcon is true."
          );
        }

        if (isImageUrl && !toastOptions.isIcon) {
          iconDiv.appendChild(createImageIcon(icon));
        } else {
          iconDiv.appendChild(createClassIcon(icon));
        }
      } else if (icon && typeof icon === "object") {
        if (icon.url !== undefined) {
          iconDiv.appendChild(
            createImageIcon(icon.url, icon.width, icon.height)
          );
        } else if (icon.fontAwesome !== undefined) {
          if (typeof icon.fontAwesome !== "string") {
            throw new TypeError(
              "Icon class names must be provided as a string."
            );
          }

          iconDiv.appendChild(createClassIcon(icon.fontAwesome));
        } else if (icon.svg !== undefined) {
          if (typeof icon.svg !== "string") {
            throw new TypeError("Custom SVG must be a string.");
          }

          // Validate and construct custom SVG using approved DOM elements.
          iconDiv.appendChild(this.createSafeSvg(icon.svg));
        }
      } else {
        // Built-in icons are static library-controlled SVG markup.
        iconDiv.innerHTML = this.types[toastOptions.type].icon;
      }

      toastBody.appendChild(iconDiv);
    }

    // Add content
    const contentDiv = document.createElement("div");
    contentDiv.className = "zephyr-toast-notification-content";

    // Add title if provided
    if (toastOptions.title) {
      const titleDiv = document.createElement("div");
      titleDiv.className = "zephyr-toast-notification-title";
      titleDiv.textContent = toastOptions.title;
      contentDiv.appendChild(titleDiv);
    }

    // Add message (supports HTML if allowHtml is true)
    const messageDiv = document.createElement("div");
    messageDiv.className = "zephyr-toast-notification-message";
    if (toastOptions.allowHtml) {
      messageDiv.innerHTML = toastOptions.message;
    } else {
      messageDiv.textContent = toastOptions.message;
    }
    contentDiv.appendChild(messageDiv);

    toastBody.appendChild(contentDiv);
    toast.appendChild(toastBody);

    // Add close button if enabled
    if (toastOptions.showClose) {
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "zephyr-toast-notification-close";
      closeButton.innerHTML = "&times;";
      closeButton.style.color = this.types[toastOptions.type].textColor;
      closeButton.addEventListener("click", () => this.removeToast(toast));
      toastBody.appendChild(closeButton);
    }

    // Add progress bar if enabled
    if (toastOptions.showProgress && toastOptions.duration > 0) {
      const progressBar = document.createElement("div");
      progressBar.className = toastOptions.type === 'void' ? "zephyr-toast-progress-bar-void" : "zephyr-toast-progress-bar";
    
      // Apply user/default background (track)
      progressBar.style.backgroundColor = toastOptions.theme.progressTrackColor;

      const progressBarFill = document.createElement("div");
      progressBarFill.className = toastOptions.type === 'void' ? "zephyr-toast-progress-bar-void-fill" : "zephyr-toast-progress-bar-fill";
    
      // Apply user/default fill color
      progressBarFill.style.backgroundColor = toastOptions.theme.progressBarColor;
      progressBar.appendChild(progressBarFill);
      toast.appendChild(progressBar);
    
      setTimeout(() => {
        progressBarFill.style.width = "0%";
        progressBarFill.style.transitionDuration = `${toastOptions.duration}ms`;
      }, 10);
    }
    

    // Add click handler if provided
    if (typeof toastOptions.onClick === "function") {
      toast.style.cursor = "pointer";
      toast.addEventListener("click", (e) => {
        if (
          e.target !== toast &&
          e.target.className !== "zephyr-toast-notification-message" &&
          e.target.className !== "zephyr-toast-notification-content"
        )
          return;
        toastOptions.onClick();
      });
    }

    // Store options with the toast
    toast._options = toastOptions;

    // Add to container
    if (toastOptions.newestOnTop) {
      this.container.prepend(toast);
    } else {
      this.container.appendChild(toast);
    }

    // Make toast visible
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 10);

    // Auto-remove after duration
    if (toastOptions.duration > 0) {
      toast._timeoutId = setTimeout(() => {
        this.removeToast(toast);
      }, toastOptions.duration);
    }

    
    /**
     * Pauses automatic dismissal while the pointer is over the toast.
     *
     * Remaining time is calculated using a monotonic clock rather
     * than measuring the progress bar's rendered width. This ensures
     * accurate timing regardless of progress bar visibility.
     *
     * The progress indicator is synchronized with the remaining
     * duration and resumes from its paused position.
     */
    if (toastOptions.pauseOnHover && toastOptions.duration > 0) {
      let remainingTime = toastOptions.duration;
      let timerStartedAt = performance.now();
      let isPaused = false;

      const progressBarFill = toast.querySelector(
        ".zephyr-toast-progress-bar-fill, .zephyr-toast-progress-bar-void-fill"
      );

      /**
       * Pauses the dismissal timer and progress animation.
       *
       * @returns {void}
       */
      const pause = () => {
        if (isPaused || !toast._timeoutId) {
          return;
        }

        isPaused = true;

        const elapsed = performance.now() - timerStartedAt;

        remainingTime = Math.max(0, remainingTime - elapsed);

        clearTimeout(toast._timeoutId);
        toast._timeoutId = null;

        if (progressBarFill) {
          const remainingPercentage =
            (remainingTime / toastOptions.duration) * 100;

          progressBarFill.style.transition = "none";
          progressBarFill.style.width = `${remainingPercentage}%`;
        }
      };

      /**
       * Resumes dismissal using the time remaining before the pause.
       *
       * @returns {void}
       */
      const resume = () => {
        if (!isPaused) {
          return;
        }

        isPaused = false;
        timerStartedAt = performance.now();

        if (remainingTime <= 0) {
          this.removeToast(toast);
          return;
        }

        toast._timeoutId = setTimeout(() => {
          toast._timeoutId = null;
          this.removeToast(toast);
        }, remainingTime);

        if (progressBarFill) {
          // Force layout so the paused width is applied before
          // restarting the CSS transition.
          void progressBarFill.offsetWidth;

          progressBarFill.style.transition =
            `width ${remainingTime}ms linear`;

          progressBarFill.style.width = "0%";
        }
      };

      toast.addEventListener("mouseenter", pause);
      toast.addEventListener("mouseleave", resume);
    }

    return toast;
  }


  /**
   * Dismisses a toast notification and releases its dismissal timer.
   *
   * The operation is idempotent. Notifications that are already closing
   * or have been removed are ignored, preventing duplicate animations,
   * unnecessary timers, and repeated callback execution.
   *
   * The notification remains in the DOM until its exit animation
   * completes. The onClose callback executes only after removal.
   *
   * @param {HTMLElement} toast - The notification element to dismiss.
   * @returns {void}
   */
  removeToast(toast) {
    // Ignore invalid, closing, or previously removed notifications.
    if (
      !toast ||
      toast._lifecycleState === "closing" ||
      toast._lifecycleState === "closed" ||
      !toast.parentNode
    ) {
      return;
    }

    // Mark the toast immediately to prevent duplicate dismissal.
    toast._lifecycleState = "closing";

    // Cancel the pending automatic dismissal timer.
    if (toast._timeoutId != null) {
      clearTimeout(toast._timeoutId);
      toast._timeoutId = null;
    }

    // Replace the entrance animation with the configured exit animation.
    const { animation, onClose } = toast._options;

    toast.classList.remove(this.animations[animation.in]);
    toast.classList.add(this.animations[animation.out]);

    // Complete removal after the existing 500ms exit period.
    toast._removalTimeoutId = setTimeout(() => {
      toast._removalTimeoutId = null;

      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }

      toast._lifecycleState = "closed";

      // Notify consumers once the notification has been removed.
      if (typeof onClose === "function") {
        onClose();
      }
    }, 500);
  }


  /**
   * Remove all toast notifications
   */
  removeAll() {
    const toasts = this.container.querySelectorAll(
      ".zephyr-toast-notification"
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

    this.container.className =
      `zephyr-toast-container zephyr-position-${position}`;
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
