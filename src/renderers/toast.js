/**
 * @fileoverview Notification DOM rendering for ZephyrToast.
 *
 * Creates notification elements, icons, titles, messages, close
 * buttons, progress bars, and click handlers independently of
 * configuration resolution and lifecycle management.
 *
 * @module renderers/toast
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { renderIcon } from "./icons.js";

/**
 * Creates a notification DOM element without inserting it into the page.
 *
 * Untrusted message content is rendered as text by default.
 * The allowHtml option is intended only for trusted HTML content.
 *
 * @param {Object} options - Resolved notification configuration.
 * @param {Object} types - Notification type definitions.
 * @param {Object} animations - Animation name-to-class mappings.
 * @param {Document} documentRef - Target document.
 * @param {Function} onDismiss - Notification dismissal callback.
 * @returns {HTMLElement} The complete notification element.
 */
export function renderToast(
  options,
  types,
  animations,
  documentRef,
  onDismiss,
) {
  // Create the notification element.
  const toast = documentRef.createElement("div");

  toast.className =
    `zephyr-toast-notification zephyr_animate ` +
    animations[options.animation.in];

  toast.style.backgroundColor = options.theme.bgColor;
  toast.style.color = options.theme.textColor;
  toast.style.borderColor = options.theme.borderColor;

  // Create the notification body.
  const toastBody = documentRef.createElement("div");
  toastBody.className = "zephyr-toast-notification-body";

  // Render the icon using the existing secure icon renderer.
  const iconElement = renderIcon(options, types, documentRef);

  if (iconElement) {
    toastBody.appendChild(iconElement);
  }

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

  return toast;
}
