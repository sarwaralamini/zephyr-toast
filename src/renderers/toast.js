/**
 * @fileoverview Notification DOM rendering for ZephyrToast.
 *
 * Responsible for constructing individual notification elements,
 * including their appearance, icons, titles, message content,
 * close buttons, progress indicators, and click interactions.
 *
 * DOM construction is handled independently of configuration
 * resolution, notification positioning, and lifecycle management.
 *
 * The renderer creates and returns a complete notification element
 * without inserting it into the document.
 *
 * @module renderers/toast
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { renderIcon } from "./icons.js";

/**
 * Creates a complete ZephyrToast notification DOM element.
 *
 * Applies the resolved visual theme and entrance animation,
 * constructs the notification body, and optionally attaches
 * a close button, progress indicator, and click handler.
 *
 * Message content is rendered as plain text by default.
 * When allowHtml is explicitly enabled, the message is rendered
 * as HTML and must originate from a trusted or sanitized source.
 *
 * The returned element is not automatically inserted into
 * the document. Its caller is responsible for placement and
 * lifecycle initialization.
 *
 * @param {Object} options - Fully resolved notification configuration,
 * including message, type, theme, animation, and behavior settings.
 * @param {Object} types - Notification type definitions containing
 * default colors and icons.
 * @param {Object} animations - Mapping of supported animation names
 * to their corresponding CSS class names.
 * @param {Document} documentRef - Document used to create DOM elements.
 * @param {Function} onDismiss - Callback responsible for dismissing
 * the notification when its close button is activated.
 * @returns {HTMLElement} Constructed notification DOM element.
 */
export function renderToast(
  options,
  types,
  animations,
  documentRef,
  onDismiss,
) {
  // ----------------------------------------------------------
  // 1. Notification Element and Theme
  // ----------------------------------------------------------

  // Create the notification element.
  const toast = documentRef.createElement("div");

  toast.className =
    `zephyr-toast-notification zephyr_animate ` +
    animations[options.animation.in];

  toast.style.backgroundColor = options.theme.bgColor;
  toast.style.color = options.theme.textColor;
  toast.style.borderColor = options.theme.borderColor;

  // ----------------------------------------------------------
  // 2. Notification Body and Icon
  // ----------------------------------------------------------

  // Create the notification body.
  const toastBody = documentRef.createElement("div");
  toastBody.className = "zephyr-toast-notification-body";

  // Render the icon using the existing secure icon renderer.
  const iconElement = renderIcon(options, types, documentRef);

  if (iconElement) {
    toastBody.appendChild(iconElement);
  }

  // ----------------------------------------------------------
  // 3. Notification Content
  // ----------------------------------------------------------

  // Create the content container.
  const contentDiv = documentRef.createElement("div");
  contentDiv.className = "zephyr-toast-notification-content";

  // Render the notification title.
  if (options.title) {
    const titleDiv = documentRef.createElement("div");
    titleDiv.className = "zephyr-toast-notification-title";
    titleDiv.textContent = options.title;

    contentDiv.appendChild(titleDiv);
  }

  // Render the message.
  const messageDiv = documentRef.createElement("div");
  messageDiv.className = "zephyr-toast-notification-message";

  if (options.allowHtml) {
    // Trusted HTML only; never pass unsanitized user content.
    messageDiv.innerHTML = options.message;
  } else {
    messageDiv.textContent = options.message;
  }

  contentDiv.appendChild(messageDiv);
  toastBody.appendChild(contentDiv);
  toast.appendChild(toastBody);

  // ----------------------------------------------------------
  // 4. Close Button
  // ----------------------------------------------------------

  // Create the close button.
  if (options.showClose) {
    const closeButton = documentRef.createElement("button");
    closeButton.type = "button";
    closeButton.className = "zephyr-toast-notification-close";
    closeButton.innerHTML = "&times;";
    closeButton.style.color = types[options.type].textColor;

    closeButton.addEventListener("click", () => {
      onDismiss(toast);
    });

    toastBody.appendChild(closeButton);
  }

  // ----------------------------------------------------------
  // 5. Progress Indicator
  // ----------------------------------------------------------

  // Create the progress indicator.
  if (options.showProgress && options.duration > 0) {
    const isVoid = options.type === "void";

    const progressBar = documentRef.createElement("div");
    progressBar.className = isVoid
      ? "zephyr-toast-progress-bar-void"
      : "zephyr-toast-progress-bar";

    progressBar.style.backgroundColor = options.theme.progressTrackColor;

    const progressBarFill = documentRef.createElement("div");
    progressBarFill.className = isVoid
      ? "zephyr-toast-progress-bar-void-fill"
      : "zephyr-toast-progress-bar-fill";

    progressBarFill.style.backgroundColor = options.theme.progressBarColor;

    progressBar.appendChild(progressBarFill);
    toast.appendChild(progressBar);

    // Start the progress animation on the next render cycle.
    // The lifecycle manager cancels this timer on dismissal.
    toast._progressTimeoutId = setTimeout(() => {
      toast._progressTimeoutId = null;

      if (
        toast._lifecycleState === "closing" ||
        toast._lifecycleState === "closed"
      ) {
        return;
      }

      // Establish the starting width before animating.
      progressBarFill.style.transitionProperty = "none";
      progressBarFill.style.width = "100%";

      // Commit the starting state to layout.
      void progressBarFill.offsetWidth;

      // Configure transition properties explicitly for browser
      // consistency and reliable DOM regression testing.
      progressBarFill.style.transitionProperty = "width";
      progressBarFill.style.transitionTimingFunction = "linear";
      progressBarFill.style.transitionDuration = `${options.duration}ms`;

      // Animate the progress indicator towards zero.
      progressBarFill.style.width = "0%";
    }, 10);
  }

  // ----------------------------------------------------------
  // 6. Notification Click Handler
  // ----------------------------------------------------------

  // Attach the configured click handler.
  if (typeof options.onClick === "function") {
    toast.style.cursor = "pointer";

    toast.addEventListener("click", (event) => {
      if (
        event.target !== toast &&
        event.target.className !== "zephyr-toast-notification-message" &&
        event.target.className !== "zephyr-toast-notification-content"
      ) {
        return;
      }

      options.onClick();
    });
  }

  // ----------------------------------------------------------
  // 7. Return Constructed Notification
  // ----------------------------------------------------------

  return toast;
}
