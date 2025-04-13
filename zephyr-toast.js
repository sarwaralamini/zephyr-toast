/**
 * ZephyrToast - A Toast Notification Library
 * Version: 1.3.0
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
      icon: null,
      isIcon: false,
      onClose: null,
      onClick: null,
    };

    // Merge options with defaults
    this.options = { ...this.defaults, ...options };

    // Initialize the container
    this.initializeContainer();

    // Animation classes
    this.animations = {
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
    };

    // Toast class types
    this.types = {
      success: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
        bgColor: "#e3f7ed",
        textColor: "#3bad71",
        borderColor: "#b5eace",
      },
      info: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
        bgColor: "#dff0fa",
        textColor: "#2385ba",
        borderColor: "#a9d7f1",
      },
      warning: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
        bgColor: "#fff5da",
        textColor: "#d9a209",
        borderColor: "#ffe59d",
      },
      error: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>',
        bgColor: "#fde8e4",
        textColor: "#cc563d",
        borderColor: "#f9c1b6",
      },
      zen: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/></svg>',
        bgColor: "#f4f7f9",
        textColor: "#2e3a59",
        borderColor: "#d8e1e8",
      },          
      void: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/></svg>',
        bgColor: "#111113",
        textColor: "#f1f1f1",
        borderColor: "#111113",
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
    // Merge options
    const toastOptions = { ...this.options, ...options, message };

    // Update position if provided in options
    if (options.position && options.position !== this.options.position) {
      this.updatePosition(options.position);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `zephyr-toast-notification zephyr_animate ${
      this.animations[toastOptions.animation.in]
    }`;
    toast.style.backgroundColor = this.types[toastOptions.type].bgColor;
    toast.style.color = this.types[toastOptions.type].textColor;
    toast.style.borderColor = this.types[toastOptions.type].borderColor;

    // Create toast body
    const toastBody = document.createElement("div");
    toastBody.className = "zephyr-toast-notification-body";

    // Add icon
    const iconDiv = document.createElement("div");
    iconDiv.className = "zephyr-toast-notification-icon";

    // Check if a custom icon is provided
    if (toastOptions.icon) {
      // Handle different icon types
      if (typeof toastOptions.icon === "string") {
        if (toastOptions.isIcon) {
          // Don't allow image URLs with isIcon
          // Only check for image URLs if the icon is not a class name (i.e., doesn't look like a URL)
          if (toastOptions.icon.match(/\.(jpeg|jpg|gif|png)$/i)) {
            throw new Error(
              "isIcon is true, but an image URL was provided for the icon."
            );
          }
          // Render icon as custom HTML (can be any library: e.g. FontAwesome, Bootstrap Icons, etc.)
          iconDiv.innerHTML = `<i class="${toastOptions.icon}"></i>`;
        } else {
          // Not isIcon: check if it's an image
          if (toastOptions.icon.match(/\.(jpeg|jpg|gif|png)$/i)) {
            iconDiv.innerHTML = `<img src="${toastOptions.icon}" alt="icon" style="width: 16px; height: 16px;" />`;
          }
          // Default to rendering as a font-icon class (e.g. FontAwesome, Bootstrap Icons, etc.)
          else {
            iconDiv.innerHTML = `<i class="${toastOptions.icon}"></i>`;
          }
        }
      }
      // If it's an object with specific properties
      else if (typeof toastOptions.icon === "object") {
        if (toastOptions.icon.url) {
          // Image URL
          iconDiv.innerHTML = `<img src="${
            toastOptions.icon.url
          }" alt="icon" style="width: ${
            toastOptions.icon.width || "16px"
          }; height: ${toastOptions.icon.height || "16px"};" />`;
        } else if (toastOptions.icon.fontAwesome) {
          // FontAwesome with specific class
          iconDiv.innerHTML = `<i class="${toastOptions.icon.fontAwesome}"></i>`;
        } else if (toastOptions.icon.svg) {
          // SVG content
          iconDiv.innerHTML = toastOptions.icon.svg;
        }
      }
    } else {
      // Use default icon based on type
      iconDiv.innerHTML = this.types[toastOptions.type].icon;
    }
    toastBody.appendChild(iconDiv);

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

    // Add message
    const messageDiv = document.createElement("div");
    messageDiv.className = "zephyr-toast-notification-message";
    messageDiv.textContent = toastOptions.message;
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
    
      const progressBarFill = document.createElement("div");
      progressBarFill.className = toastOptions.type === 'void' ? "zephyr-toast-progress-bar-void-fill" : "zephyr-toast-progress-bar-fill";
    
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
   * Update container position
   * @param {string} position - New position ('top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center')
   */
  updatePosition(position) {
    this.options.position = position;
    this.container.className = `zephyr-toast-container zephyr-position-${position}`;
  }
}
