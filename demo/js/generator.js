/**
 * @fileoverview ZephyrToast demo generator and interactive controls.
 *
 * Manages notification configuration, JavaScript code generation,
 * isolated live previews, visual positioning, custom icons,
 * interface themes, and clipboard functionality.
 *
 * @module demo/js/generator
 * @author Md. Sarwar Alam
 * @license MIT
 */

"use strict";

(() => {
  /**
   * @param {string} id - Element ID.
   * @returns {HTMLElement|null}
   */
  const byId = (id) => document.getElementById(id);

  /**
   * @param {string} id - Form element ID.
   * @returns {string}
   */
  const value = (id) => byId(id).value;

  /**
   * @param {string} id - Checkbox element ID.
   * @returns {boolean}
   */
  const checked = (id) => byId(id).checked;

  const generateButton = byId("generate-toast");
  const copyButton = byId("copy-code");
  const codeOutput = byId("generated-code");

  const previewFrame = byId("toast-preview-frame");
  const clearPreviewButton = byId("clear-preview");

  const positionSelect = byId("toast-position");
  const themeButton = byId("demo-theme-toggle");
  const themeLabel = byId("demo-theme-label");

  const PREVIEW_CHANNEL = "zephyr-demo-preview";

  let previewReady = false;

  /** @type {Array<Record<string, unknown>>} */
  const pendingPreviewMessages = [];

  /**
   * Returns the currently selected radio value.
   *
   * @param {string} name - Radio group name.
   * @returns {string}
   */
  function selectedRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
  }

  /**
   * Sends data directly to the preview iframe.
   *
   * @param {Record<string, unknown>} message - Preview message.
   * @returns {void}
   */
  function postPreviewMessage(message) {
    previewFrame.contentWindow?.postMessage(message, window.location.origin);
  }

  /**
   * Sends an action to the isolated preview.
   *
   * Messages are queued until the preview reports that it is ready.
   * This prevents notifications from being lost during initialization.
   *
   * @param {string} action - Preview action.
   * @param {Record<string, unknown>} payload - Action payload.
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
   * Delivers queued preview messages.
   *
   * @returns {void}
   */
  function flushPreviewMessages() {
    while (pendingPreviewMessages.length > 0) {
      postPreviewMessage(pendingPreviewMessages.shift());
    }
  }

  /**
   * Reads the selected custom icon configuration.
   *
   * @returns {{icon: string, isIcon: boolean}|null}
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

    // The predefined icons use CSS classes, not image URLs.
    return {
      icon: preset,
      isIcon: true,
    };
  }

  /**
   * Collects the current notification configuration.
   *
   * @returns {Record<string, unknown>}
   */
  function readOptions() {
    const durationInput = value("toast-duration").trim();
    const duration = Number(durationInput);

    if (durationInput === "" || !Number.isFinite(duration) || duration < 0) {
      throw new RangeError("Duration must be a non-negative number.");
    }

    const options = {
      type: value("toast-type"),
      position: value("toast-position"),
      duration,
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

  /**
   * Generates a copy-ready JavaScript notification example.
   *
   * JSON.stringify ensures message content is correctly escaped
   * for JavaScript string literals.
   *
   * @param {string} message - Notification message.
   * @param {Record<string, unknown>} options - Notification options.
   * @returns {string}
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
   * Reads the generator input and previews the notification.
   *
   * @returns {void}
   */
  function generateToast() {
    try {
      const message =
        value("toast-message") || "This is a sample notification.";

      const options = readOptions();

      const code = generateCode(message, options);

      // Generated code is always rendered as text.
      codeOutput.textContent = code;

      // Show notification using the isolated browser preview.
      sendPreview("show", {
        message,
        options,
      });
    } catch (error) {
      console.error("ZephyrToast generator error:", error);

      codeOutput.textContent = `// Error: ${error.message}`;
    }
  }

  /**
   * Copies the generated JavaScript to the clipboard.
   *
   * @returns {Promise<void>}
   */
  async function copyCode() {
    const code = codeOutput.textContent;

    if (!code || code.startsWith("// Error:")) {
      return;
    }

    const originalLabel = copyButton.innerHTML;

    try {
      await navigator.clipboard.writeText(code);

      copyButton.textContent = "Copied!";
    } catch (error) {
      console.error("Unable to copy code:", error);

      copyButton.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      copyButton.innerHTML = originalLabel;
    }, 1800);
  }

  /**
   * Updates custom theme and icon control visibility.
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

  /**
   * Synchronizes a theme field's color preview.
   *
   * @param {string} inputId - Color input element ID.
   * @param {string} previewId - Preview element ID.
   * @returns {void}
   */
  function bindColorPreview(inputId, previewId) {
    const input = byId(inputId);
    const preview = byId(previewId);

    const refresh = () => {
      preview.style.backgroundColor = input.value;
    };

    input.addEventListener("input", refresh);

    refresh();
  }

  /**
   * Synchronizes the visual position buttons.
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
   * Changes the interface's light/dark mode.
   *
   * The preview background changes independently from
   * the notification's configured custom theme.
   *
   * @param {"light"|"dark"} theme - Interface theme.
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

  /**
   * Handles the preview iframe ready notification.
   *
   * Only messages from the expected same-origin frame
   * are accepted.
   *
   * @param {MessageEvent} event - Window message event.
   * @returns {void}
   */
  function handlePreviewMessage(event) {
    if (
      event.origin !== window.location.origin ||
      event.source !== previewFrame.contentWindow
    ) {
      return;
    }

    const data = event.data;

    if (!data || data.channel !== PREVIEW_CHANNEL || data.action !== "ready") {
      return;
    }

    previewReady = true;

    flushPreviewMessages();
  }

  /**
   * Resets the preview communication state when the
   * iframe begins a new load.
   *
   * @returns {void}
   */
  function handlePreviewLoad() {
    // The iframe sends a "ready" message after initialization.
    // No additional action is required for its initial load.
  }

  /**
   * Registers the demo's event listeners.
   *
   * @returns {void}
   */
  function initializeEvents() {
    generateButton.addEventListener("click", generateToast);

    copyButton.addEventListener("click", copyCode);

    clearPreviewButton.addEventListener("click", () => {
      sendPreview("clear");
    });

    window.addEventListener("message", handlePreviewMessage);

    previewFrame.addEventListener("load", handlePreviewLoad);

    // Existing position dropdown.
    positionSelect.addEventListener("change", syncPositionButtons);

    // Visual position buttons.
    document
      .querySelectorAll("#demo-position-grid [data-position]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          positionSelect.value = button.dataset.position;

          syncPositionButtons();
        });
      });

    // Light/dark mode.
    themeButton.addEventListener("click", () => {
      const currentTheme = document.body.dataset.demoTheme;

      setDemoTheme(currentTheme === "dark" ? "light" : "dark");
    });

    // Custom theme visibility.
    byId("toast-enable-custom-theme").addEventListener(
      "change",
      updateConditionalControls,
    );

    // Custom icon visibility.
    byId("toast-enable-icon").addEventListener(
      "change",
      updateConditionalControls,
    );

    document.querySelectorAll('input[name="icon-type"]').forEach((radio) => {
      radio.addEventListener("change", updateConditionalControls);
    });

    document
      .querySelectorAll('input[name="is-icon-true-false"]')
      .forEach((radio) => {
        radio.addEventListener("change", updateConditionalControls);
      });

    // Theme color previews.
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

  /**
   * Initializes generator state and controls.
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
