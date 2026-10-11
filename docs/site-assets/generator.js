/**
 * @fileoverview Interactive playground controller for ZephyrToast.
 *
 * Manages the notification generator used by the ZephyrToast
 * demonstration website.
 *
 * Responsibilities:
 * - Read and validate notification configuration inputs.
 * - Generate copy-ready JavaScript notification examples.
 * - Communicate with the isolated notification preview iframe.
 * - Manage custom icons and notification theme controls.
 * - Synchronize the six visual notification positions.
 * - Support light and dark interface appearances.
 * - Copy generated JavaScript to the clipboard.
 *
 * Preview communication uses a dedicated message channel
 * with strict origin and iframe source verification.
 *
 * @module demo/js/generator
 * @author Md. Sarwar Alam
 * @license MIT
 */

"use strict";

(() => {
  // ----------------------------------------------------------
  // 1. Constants and DOM Helpers
  // ----------------------------------------------------------

  /**
   * Dedicated channel for communicating with the preview.
   *
   * @type {string}
   */
  const PREVIEW_CHANNEL = "zephyr-demo-preview";

  /**
   * Default message when the playground input is empty.
   *
   * @type {string}
   */
  const DEFAULT_MESSAGE = "This is a sample notification.";

  /**
   * Notification types supported by the playground.
   *
   * @type {ReadonlyArray<string>}
   */
  const NOTIFICATION_TYPES = [
    "success",
    "info",
    "warning",
    "error",
    "zen",
    "void",
  ];

  /**
   * Retrieves an element by ID.
   *
   * @param {string} id - Element ID.
   * @returns {HTMLElement | null} Matching element.
   */
  const byId = (id) => document.getElementById(id);

  /**
   * Reads the value of a form control.
   *
   * @param {string} id - Form control ID.
   * @returns {string} Current value.
   */
  const value = (id) => byId(id).value;

  /**
   * Reads the checked state of a checkbox.
   *
   * @param {string} id - Checkbox ID.
   * @returns {boolean} Whether the checkbox is checked.
   */
  const checked = (id) => byId(id).checked;

  /**
   * Returns the selected value from a radio group.
   *
   * @param {string} name - Radio group name.
   * @returns {string} Selected value or an empty string.
   */
  function selectedRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
  }

  // ----------------------------------------------------------
  // 2. DOM References
  // ----------------------------------------------------------

  const generateButton = byId("generate-toast");
  const copyButton = byId("copy-code");
  const codeOutput = byId("generated-code");

  const previewFrame = byId("toast-preview-frame");
  const clearPreviewButton = byId("clear-preview");

  const positionSelect = byId("toast-position");

  const themeButton = byId("demo-theme-toggle");
  const themeLabel = byId("demo-theme-label");

  /**
   * Tracks whether the preview has reported readiness.
   *
   * @type {boolean}
   */
  let previewReady = false;

  /**
   * Actions queued until the preview initializes.
   *
   * @type {Array<Record<string, unknown>>}
   */
  const pendingPreviewMessages = [];

  /**
   * Tracks the latest clipboard feedback timer.
   *
   * @type {number | null}
   */
  let copyFeedbackTimeoutId = null;

  /**
   * Stores the original copy button markup.
   *
   * @type {string}
   */
  const originalCopyButtonMarkup = copyButton.innerHTML;

  // ----------------------------------------------------------
  // 3. Preview Communication
  // ----------------------------------------------------------

  /**
   * Posts a message to the preview iframe.
   *
   * Uses an explicit target origin instead of "*".
   *
   * @param {Record<string, unknown>} message - Message payload.
   * @returns {void}
   */
  function postPreviewMessage(message) {
    const previewWindow = previewFrame.contentWindow;

    if (!previewWindow) {
      return;
    }

    previewWindow.postMessage(message, window.location.origin);
  }

  /**
   * Sends an action to the isolated preview.
   *
   * Messages are queued until the iframe reports that
   * the notification library is ready.
   *
   * @param {string} action - Preview action.
   * @param {Record<string, unknown>} [payload={}] - Action data.
   * @returns {void}
   */
  function sendPreview(action, payload = {}) {
    const message = {
      channel: PREVIEW_CHANNEL,
      action,
      ...payload,
    };

    if (!previewReady) {
      pendingPreviewMessages.push(message);
      return;
    }

    postPreviewMessage(message);
  }

  /**
   * Delivers queued preview messages in insertion order.
   *
   * @returns {void}
   */
  function flushPreviewMessages() {
    while (pendingPreviewMessages.length > 0) {
      const message = pendingPreviewMessages.shift();

      postPreviewMessage(message);
    }
  }

  /**
   * Validates an incoming message from the preview iframe.
   *
   * Messages must come from the expected iframe, use
   * the same origin, and contain the correct channel.
   *
   * @param {MessageEvent} event - Incoming message.
   * @returns {boolean} Whether the message is trusted.
   */
  function isTrustedPreviewMessage(event) {
    if (
      event.origin !== window.location.origin ||
      event.source !== previewFrame.contentWindow
    ) {
      return false;
    }

    const data = event.data;

    return (
      data !== null &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      data.channel === PREVIEW_CHANNEL
    );
  }

  /**
   * Handles the preview's readiness notification.
   *
   * @param {MessageEvent} event - Incoming message.
   * @returns {void}
   */
  function handlePreviewMessage(event) {
    if (!isTrustedPreviewMessage(event)) {
      return;
    }

    if (event.data.action !== "ready") {
      return;
    }

    previewReady = true;

    flushPreviewMessages();
  }

  // ----------------------------------------------------------
  // 4. Custom Icon Configuration
  // ----------------------------------------------------------

  /**
   * Reads the selected custom icon configuration.
   *
   * Returns null when icons are disabled or when the
   * built-in notification icon is selected.
   *
   * CSS class icons use isIcon=true.
   * Image URL icons use isIcon=false.
   *
   * @returns {{icon: string, isIcon: boolean} | null}
   * Custom icon settings or null.
   */
  function readCustomIcon() {
    if (!checked("toast-enable-icon")) {
      return null;
    }

    if (selectedRadio("icon-type") !== "custom") {
      return null;
    }

    const useClassIcon = selectedRadio("is-icon-true-false") === "true";

    const preset = value("toast-custom-icon").trim();
    const customUrl = value("toast-custom-icon-url").trim();

    if (useClassIcon) {
      return {
        icon: preset,
        isIcon: true,
      };
    }

    if (customUrl) {
      return {
        icon: customUrl,
        isIcon: false,
      };
    }

    // Preserve the existing behavior: use the selected
    // CSS icon preset when the image URL field is empty.
    return {
      icon: preset,
      isIcon: true,
    };
  }

  // ----------------------------------------------------------
  // 5. Notification Configuration
  // ----------------------------------------------------------

  /**
   * Reads and validates the notification duration.
   *
   * @returns {number} Duration in milliseconds.
   * @throws {RangeError} When duration is invalid.
   */
  function readDuration() {
    const durationInput = value("toast-duration").trim();
    const duration = Number(durationInput);

    if (durationInput === "" || !Number.isFinite(duration) || duration < 0) {
      throw new RangeError("Duration must be a non-negative number.");
    }

    return duration;
  }

  /**
   * Collects the current playground configuration.
   *
   * Includes notification type, position, duration,
   * behavior, animation, and optional appearance settings.
   *
   * @returns {Record<string, unknown>} Notification options.
   */
  function readOptions() {
    const type = value("toast-type");

    if (!NOTIFICATION_TYPES.includes(type)) {
      throw new RangeError("Unsupported notification type.");
    }

    const options = {
      type,
      position: value("toast-position"),
      duration: readDuration(),
      title: value("toast-title"),
      newestOnTop: value("toast-newest-on-top") === "true",
      showProgress: checked("toast-show-progress"),
      showClose: checked("toast-show-close"),
      pauseOnHover: checked("toast-pause-on-hover"),
      allowHtml: checked("toast-allow-html"),
      enableIcon: checked("toast-enable-icon"),
      animation: {
        in: value("toast-animation-in"),
        out: value("toast-animation-out"),
      },
    };

    if (checked("toast-enable-custom-theme")) {
      options.theme = {
        bgColor: value("toast-bg-color"),
        textColor: value("toast-text-color"),
        borderColor: value("toast-border-color"),
        progressTrackColor: value("toast-progress-track-color"),
        progressBarColor: value("toast-progress-bar-color"),
      };
    }

    const customIcon = readCustomIcon();

    if (customIcon) {
      Object.assign(options, customIcon);
    }

    return options;
  }

  // ----------------------------------------------------------
  // 6. JavaScript Code Generation
  // ----------------------------------------------------------

  /**
   * Generates a copy-ready JavaScript notification example.
   *
   * JSON.stringify ensures notification messages and
   * configuration values are escaped correctly.
   *
   * @param {string} message - Notification message.
   * @param {Record<string, unknown>} options - Notification options.
   * @returns {string} Generated JavaScript.
   */
  function generateCode(message, options) {
    const method = options.type;

    const serializedMessage = JSON.stringify(message);
    const serializedOptions = JSON.stringify(options, null, 2);

    let code =
      "// Initialize ZephyrToast once in your application.\n" +
      "const toast = new ZephyrToast();\n\n" +
      `toast.${method}(\n` +
      `  ${serializedMessage},\n` +
      `  ${serializedOptions}\n` +
      ");";

    if (checked("toast-include-onclick")) {
      code +=
        "\n\n// Add your onClick callback to the options object if needed.";
    }

    if (checked("toast-include-onclose")) {
      code += "\n// Add your onClose callback to the options object if needed.";
    }

    return code;
  }

  /**
   * Generates JavaScript and displays a notification.
   *
   * The generated source is always inserted as text,
   * preventing HTML execution in the code display.
   *
   * @returns {void}
   */
  function generateToast() {
    try {
      const message = value("toast-message") || DEFAULT_MESSAGE;
      const options = readOptions();

      codeOutput.textContent = generateCode(message, options);

      sendPreview("show", {
        message,
        options,
      });
    } catch (error) {
      console.error("ZephyrToast generator error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to generate notification.";

      codeOutput.textContent = `// Error: ${errorMessage}`;
    }
  }

  // ----------------------------------------------------------
  // 7. Clipboard Integration
  // ----------------------------------------------------------

  /**
   * Displays temporary copy button feedback.
   *
   * @param {string} message - Feedback message.
   * @returns {void}
   */
  function showCopyFeedback(message) {
    if (copyFeedbackTimeoutId !== null) {
      window.clearTimeout(copyFeedbackTimeoutId);
    }

    copyButton.textContent = message;

    copyFeedbackTimeoutId = window.setTimeout(() => {
      copyButton.innerHTML = originalCopyButtonMarkup;
      copyFeedbackTimeoutId = null;
    }, 1800);
  }

  /**
   * Copies generated JavaScript to the clipboard.
   *
   * Invalid or empty generated code is not copied.
   *
   * @returns {Promise<void>} Copy operation completion.
   */
  async function copyCode() {
    const code = codeOutput.textContent;

    if (!code || code.startsWith("// Error:")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);

      showCopyFeedback("Copied!");
    } catch (error) {
      console.error("Unable to copy code:", error);

      showCopyFeedback("Copy failed");
    }
  }

  // ----------------------------------------------------------
  // 8. Conditional Playground Controls
  // ----------------------------------------------------------

  /**
   * Synchronizes the visibility of custom theme and
   * icon configuration controls.
   *
   * @returns {void}
   */
  function updateConditionalControls() {
    const customThemeEnabled = checked("toast-enable-custom-theme");
    const iconEnabled = checked("toast-enable-icon");
    const customIconSelected = selectedRadio("icon-type") === "custom";
    const useClassIcon = selectedRadio("is-icon-true-false") === "true";

    byId("theme-options").classList.toggle("d-none", !customThemeEnabled);

    byId("icon-type-options").classList.toggle("d-none", !iconEnabled);

    document
      .querySelector(".icon-custom-container")
      .classList.toggle("d-none", !iconEnabled || !customIconSelected);

    document
      .querySelector(".custom-icon-url")
      .classList.toggle("d-none", useClassIcon);
  }

  // ----------------------------------------------------------
  // 9. Theme Color Previews
  // ----------------------------------------------------------

  /**
   * Synchronizes a custom theme input with its color swatch.
   *
   * @param {string} inputId - Color input ID.
   * @param {string} previewId - Color swatch ID.
   * @returns {void}
   */
  function bindColorPreview(inputId, previewId) {
    const input = byId(inputId);
    const preview = byId(previewId);

    /**
     * Applies the current input color to its swatch.
     *
     * @returns {void}
     */
    function refresh() {
      preview.style.backgroundColor = input.value;
    }

    input.addEventListener("input", refresh);

    refresh();
  }

  // ----------------------------------------------------------
  // 10. Position Selector Synchronization
  // ----------------------------------------------------------

  /**
   * Updates the visual position buttons to reflect
   * the selected dropdown value.
   *
   * @returns {void}
   */
  function syncPositionButtons() {
    document
      .querySelectorAll("#demo-position-grid [data-position]")
      .forEach((button) => {
        const selected = button.dataset.position === positionSelect.value;

        button.setAttribute("aria-pressed", String(selected));
      });
  }

  /**
   * Selects a notification position using the visual grid.
   *
   * @param {string} position - Requested position.
   * @returns {void}
   */
  function selectPosition(position) {
    positionSelect.value = position;

    syncPositionButtons();
  }

  // ----------------------------------------------------------
  // 11. Interface Theme Management
  // ----------------------------------------------------------

  /**
   * Sets the demo website's appearance.
   *
   * The preview iframe receives the selected background
   * appearance separately from notification theme colors.
   *
   * @param {"light" | "dark"} theme - Requested appearance.
   * @returns {void}
   */
  function setDemoTheme(theme) {
    const resolvedTheme = theme === "light" ? "light" : "dark";

    document.body.dataset.demoTheme = resolvedTheme;

    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    themeLabel.textContent = nextTheme === "light" ? "Light mode" : "Dark mode";

    themeButton.setAttribute("aria-label", `Switch to ${nextTheme} mode`);

    const themeIcon = themeButton.querySelector("i");

    if (themeIcon) {
      themeIcon.className =
        nextTheme === "light" ? "fas fa-sun me-1" : "fas fa-moon me-1";
    }

    sendPreview("theme", {
      theme: resolvedTheme,
    });
  }

  // ----------------------------------------------------------
  // 12. Event Listener Registration
  // ----------------------------------------------------------

  /**
   * Registers playground interaction handlers.
   *
   * @returns {void}
   */
  function initializeEvents() {
    // Notification generation and clipboard.
    generateButton.addEventListener("click", generateToast);
    copyButton.addEventListener("click", copyCode);

    // Clear the isolated preview.
    clearPreviewButton.addEventListener("click", () => {
      sendPreview("clear");
    });

    // Receive preview readiness notifications.
    window.addEventListener("message", handlePreviewMessage);

    // Position dropdown.
    positionSelect.addEventListener("change", syncPositionButtons);

    // Visual position controls.
    document
      .querySelectorAll("#demo-position-grid [data-position]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          selectPosition(button.dataset.position);
        });
      });

    // Website appearance.
    themeButton.addEventListener("click", () => {
      const currentTheme = document.body.dataset.demoTheme;

      setDemoTheme(currentTheme === "dark" ? "light" : "dark");
    });

    // Custom theme controls.
    byId("toast-enable-custom-theme").addEventListener(
      "change",
      updateConditionalControls,
    );

    // Custom icon enablement.
    byId("toast-enable-icon").addEventListener(
      "change",
      updateConditionalControls,
    );

    // Default/custom icon selection.
    document.querySelectorAll('input[name="icon-type"]').forEach((radio) => {
      radio.addEventListener("change", updateConditionalControls);
    });

    // CSS class/image URL selection.
    document
      .querySelectorAll('input[name="is-icon-true-false"]')
      .forEach((radio) => {
        radio.addEventListener("change", updateConditionalControls);
      });

    // Theme color swatches.
    const colors = [
      ["toast-bg-color", "bg-color-preview"],
      ["toast-text-color", "text-color-preview"],
      ["toast-border-color", "border-color-preview"],
      ["toast-progress-track-color", "progress-track-color-preview"],
      ["toast-progress-bar-color", "toast-progress-bar-color-preview"],
    ];

    for (const [inputId, previewId] of colors) {
      bindColorPreview(inputId, previewId);
    }
  }

  // ----------------------------------------------------------
  // 13. Playground Initialization
  // ----------------------------------------------------------

  /**
   * Initializes the interactive playground.
   *
   * Registers handlers, synchronizes controls, and
   * establishes the default dark appearance.
   *
   * @returns {void}
   */
  function initialize() {
    initializeEvents();

    updateConditionalControls();
    syncPositionButtons();

    setDemoTheme("dark");
  }

  initialize();
})();
