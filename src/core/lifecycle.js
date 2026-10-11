/**
 * @fileoverview Notification lifecycle management for ZephyrToast.
 *
 * Provides lifecycle functionality for notification elements,
 * including automatic dismissal, hover-based pause and resume,
 * progress-bar synchronization, exit animations, and cleanup.
 *
 * The lifecycle manager operates on notification DOM elements
 * created by the renderer and uses their internal properties
 * to track timers, state, and registered event listeners.
 *
 * @module core/lifecycle
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Initializes automatic dismissal and hover interactions.
 *
 * Notifications with a positive duration are automatically
 * dismissed after the configured number of milliseconds.
 * A duration of zero disables automatic dismissal.
 *
 * When pauseOnHover is enabled, hovering over the notification
 * pauses its dismissal timer and progress-bar animation.
 * Moving the pointer away resumes both using the remaining time.
 *
 * Event listeners and their cleanup callback are registered
 * directly on the notification element.
 *
 * @param {HTMLElement} toast - Notification DOM element.
 * @param {Object} options - Resolved notification configuration.
 * @param {Function} onDismiss - Callback responsible for dismissing
 * the notification element.
 * @returns {void}
 */
export function initializeLifecycle(toast, options, onDismiss) {
  const { duration, pauseOnHover } = options;

  // Start the automatic dismissal timer.
  if (duration > 0) {
    toast._timeoutId = setTimeout(() => {
      onDismiss(toast);
    }, duration);
  }

  // Persistent notifications and disabled hover handling
  // do not require pause/resume event listeners.
  if (!pauseOnHover || duration <= 0) {
    return;
  }

  // Track the remaining lifetime of the notification.
  let remainingTime = duration;
  let timerStartedAt = performance.now();
  let isPaused = false;

  // Locate the progress indicator when one is enabled.
  const progressBarFill = toast.querySelector(
    ".zephyr-toast-progress-bar-fill, .zephyr-toast-progress-bar-void-fill",
  );

  /**
   * Pauses the automatic dismissal timer and progress animation.
   *
   * Calculates the remaining notification lifetime, cancels
   * the active dismissal timer, and freezes the progress bar
   * at its corresponding percentage.
   *
   * Repeated pause requests have no effect while already paused.
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
      const remainingPercentage = (remainingTime / duration) * 100;

      progressBarFill.style.transition = "none";
      progressBarFill.style.width = `${remainingPercentage}%`;
    }
  };

  /**
   * Resumes automatic dismissal and progress animation.
   *
   * Schedules a new dismissal timer using the remaining
   * lifetime and resumes the progress-bar transition.
   *
   * If no time remains, the notification is dismissed
   * immediately through the provided dismissal callback.
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
      onDismiss(toast);
      return;
    }

    toast._timeoutId = setTimeout(() => {
      toast._timeoutId = null;
      onDismiss(toast);
    }, remainingTime);

    if (progressBarFill) {
      // Force layout before restarting the progress transition.
      void progressBarFill.offsetWidth;

      progressBarFill.style.transition = `width ${remainingTime}ms linear`;

      progressBarFill.style.width = "0%";
    }
  };

  // Register hover interaction listeners.
  toast.addEventListener("mouseenter", pause);
  toast.addEventListener("mouseleave", resume);

  // Retain listener cleanup for notification dismissal.
  toast._hoverCleanup = () => {
    toast.removeEventListener("mouseenter", pause);
    toast.removeEventListener("mouseleave", resume);
    toast._hoverCleanup = null;
  };
}

/**
 * Dismisses a notification using its configured exit animation.
 *
 * Prevents duplicate dismissals by checking the notification's
 * lifecycle state and whether it remains attached to the DOM.
 *
 * Cancels active timers, clears hover listeners, and replaces
 * the entrance animation class with the configured exit class.
 *
 * After the existing 500ms exit period, the notification is
 * removed from the document and its onClose callback is invoked
 * if one was provided.
 *
 * Repeated dismissal requests do not schedule additional
 * removal timers or invoke onClose multiple times.
 *
 * @param {HTMLElement} toast - Notification element to dismiss.
 * @param {Object} animations - Mapping of animation names to
 * their corresponding CSS classes.
 * @returns {void}
 */
export function dismissToast(toast, animations) {
  if (
    !toast ||
    toast._lifecycleState === "closing" ||
    toast._lifecycleState === "closed" ||
    !toast.parentNode
  ) {
    return;
  }

  // Mark the notification as closing.
  toast._lifecycleState = "closing";

  // Cancel automatic dismissal.
  if (toast._timeoutId != null) {
    clearTimeout(toast._timeoutId);
    toast._timeoutId = null;
  }

  // Cancel pending visibility updates.
  if (toast._visibilityTimeoutId != null) {
    clearTimeout(toast._visibilityTimeoutId);
    toast._visibilityTimeoutId = null;
  }

  // Cancel pending progress animation updates.
  if (toast._progressTimeoutId != null) {
    clearTimeout(toast._progressTimeoutId);
    toast._progressTimeoutId = null;
  }

  // Remove lifecycle event listeners.
  if (typeof toast._hoverCleanup === "function") {
    toast._hoverCleanup();
  }

  const { animation, onClose } = toast._options;

  // Replace the entrance animation with the exit animation.
  toast.classList.remove(animations[animation.in]);
  toast.classList.add(animations[animation.out]);

  // Remove the notification after the existing exit period.
  toast._removalTimeoutId = setTimeout(() => {
    toast._removalTimeoutId = null;

    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }

    toast._lifecycleState = "closed";

    if (typeof onClose === "function") {
      onClose();
    }
  }, 500);
}
