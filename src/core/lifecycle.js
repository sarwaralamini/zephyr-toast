/**
 * @fileoverview Notification lifecycle management for ZephyrToast.
 *
 * Manages automatic dismissal, hover pause/resume, exit
 * animations, and notification removal.
 *
 * @module core/lifecycle
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Initializes automatic dismissal and hover behavior.
 *
 * Notifications with zero duration remain visible until
 * manually dismissed. Hovering pauses the dismissal timer
 * and resumes it using the remaining duration.
 *
 * @param {HTMLElement} toast - Notification element.
 * @param {Object} options - Resolved notification options.
 * @param {Function} onDismiss - Callback that dismisses the toast.
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

  if (!pauseOnHover || duration <= 0) {
    return;
  }

  let remainingTime = duration;
  let timerStartedAt = performance.now();
  let isPaused = false;

  const progressBarFill = toast.querySelector(
    ".zephyr-toast-progress-bar-fill, .zephyr-toast-progress-bar-void-fill",
  );

  /**
   * Pauses automatic dismissal and progress animation.
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
   * Resumes dismissal using the time remaining before hover.
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
 * Dismisses a notification with its configured exit animation.
 *
 * The operation is idempotent: repeated calls do not create
 * duplicate removal timers or invoke onClose more than once.
 *
 * @param {HTMLElement} toast - Notification element to dismiss.
 * @param {Object} animations - Mapping of animation names to CSS classes.
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
