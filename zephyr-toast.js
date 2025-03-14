/**
 * ZephyrToast - A Toast Notification Library
 * Version: 1.0.1
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
    // Default configuration
    this.defaults = {
      position: "top-right",
      type: "info",
      duration: 3000,
      message: "",
      title: "",
      showProgress: true,
      showClose: true,
      newestOnTop: true,
      animation: {
        in: "fadeIn",
        out: "fadeOut",
      },
      onClose: null,
      onClick: null,
    };

    // Merge options with defaults
    this.options = { ...this.defaults, ...options };

    // Initialize the container
    this.initializeContainer();

    // Animation classes
    this.animations = {
      fadeIn: "animate__fadeIn",
      fadeOut: "animate__fadeOut",
      slideInLeft: "animate__slideInLeft",
      slideOutLeft: "animate__slideOutLeft",
      slideInRight: "animate__slideInRight",
      slideOutRight: "animate__slideOutRight",
      slideInDown: "animate__slideInDown",
      slideOutUp: "animate__slideOutUp",
      slideInUp: "animate__slideInUp",
      slideOutDown: "animate__slideOutDown",
      bounceIn: "animate__bounceIn",
      bounceOut: "animate__bounceOut",
    };

    // Toast class types
    this.types = {
      success: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
        bgColor: "#e3f7ed",
        textColor: "#3bad71",
        borderColor: "#b5eace",
      },
      info: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
        bgColor: "#dff0fa",
        textColor: "#2385ba",
        borderColor: "#a9d7f1",
      },
      warning: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
        bgColor: "#fff5da",
        textColor: "#d9a209",
        borderColor: "#ffe59d",
      },
      error: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>',
        bgColor: "#fde8e4",
        textColor: "#cc563d",
        borderColor: "#f9c1b6",
      },
    };

    // Add necessary CSS
    this.injectCSS();
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
    this.container.className = `zephyr-toast-container position-${this.options.position}`;
  }

  /**
   * Inject necessary CSS for toast notifications
   */
  injectCSS() {
    if (document.getElementById("toast-notification-css")) return;

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
      const animateCSSPath = `${scriptDir}/animate.min.css`;
      const zephyrToastCSSPath = `${scriptDir}/zephyr-toast.css`;

      // Create the style element with dynamically constructed paths
      const css = `
          @import url('${animateCSSPath}');
          @import url('${zephyrToastCSSPath}');
          `;

      const style = document.createElement("style");
      style.id = "toast-notification-css";
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
    // Merge options
    const toastOptions = { ...this.options, ...options, message };

    // Update position if provided in options
    if (options.position && options.position !== this.options.position) {
      this.updatePosition(options.position);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast-notification animate__animated ${
      this.animations[toastOptions.animation.in]
    }`;
    toast.style.backgroundColor = this.types[toastOptions.type].bgColor;
    toast.style.color = this.types[toastOptions.type].textColor;
    toast.style.borderColor = this.types[toastOptions.type].borderColor;

    // Create toast body
    const toastBody = document.createElement("div");
    toastBody.className = "toast-notification-body";

    // Add icon
    const iconDiv = document.createElement("div");
    iconDiv.className = "toast-notification-icon";
    iconDiv.innerHTML = this.types[toastOptions.type].icon;
    toastBody.appendChild(iconDiv);

    // Add content
    const contentDiv = document.createElement("div");
    contentDiv.className = "toast-notification-content";

    // Add title if provided
    if (toastOptions.title) {
      const titleDiv = document.createElement("div");
      titleDiv.className = "toast-notification-title";
      titleDiv.textContent = toastOptions.title;
      contentDiv.appendChild(titleDiv);
    }

    // Add message
    const messageDiv = document.createElement("div");
    messageDiv.className = "toast-notification-message";
    messageDiv.textContent = toastOptions.message;
    contentDiv.appendChild(messageDiv);

    toastBody.appendChild(contentDiv);
    toast.appendChild(toastBody);

    // Add close button if enabled
    if (toastOptions.showClose) {
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "toast-notification-close";
      closeButton.innerHTML = "&times;";
      closeButton.style.color = this.types[toastOptions.type].textColor;
      closeButton.addEventListener("click", () => this.removeToast(toast));
      toastBody.appendChild(closeButton);
    }

    // Add progress bar if enabled
    if (toastOptions.showProgress && toastOptions.duration > 0) {
      const progressBar = document.createElement("div");
      progressBar.className = "toast-progress-bar";

      const progressBarFill = document.createElement("div");
      progressBarFill.className = "toast-progress-bar-fill";

      progressBar.appendChild(progressBarFill);
      toast.appendChild(progressBar);

      // Animate progress bar
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
          e.target.className !== "toast-notification-message" &&
          e.target.className !== "toast-notification-content"
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

    return toast;
  }

  /**
   * Remove a toast notification
   * @param {HTMLElement} toast - The toast element to remove
   */
  removeToast(toast) {
    // Clear timeout if exists
    if (toast._timeoutId) {
      clearTimeout(toast._timeoutId);
    }

    // Apply exit animation
    toast.classList.remove(this.animations[toast._options.animation.in]);
    toast.classList.add(this.animations[toast._options.animation.out]);

    // Remove after animation completes
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.parentNode.removeChild(toast);
        // Call onClose callback if provided
        if (typeof toast._options.onClose === "function") {
          toast._options.onClose();
        }
      }
    }, 500);
  }

  /**
   * Remove all toast notifications
   */
  removeAll() {
    const toasts = this.container.querySelectorAll(".toast-notification");
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
   * Update container position
   * @param {string} position - New position ('top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center')
   */
  updatePosition(position) {
    this.options.position = position;
    this.container.className = `zephyr-toast-container position-${position}`;
  }
}
