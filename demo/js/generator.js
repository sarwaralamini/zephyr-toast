/**
 * @fileoverview ZephyrToast demo generator and interactive controls.
 *
 * Reads the demo form, generates reusable JavaScript examples,
 * and previews notifications using the production browser bundle.
 *
 * @module demo/js/generator
 * @author Md. Sarwar Alam
 * @license MIT
 */

"use strict";

(() => {
  const toast = new window.ZephyrToast();

  const byId = (id) => document.getElementById(id);
  const value = (id) => byId(id).value;
  const checked = (id) => byId(id).checked;

  const generateButton = byId("generate-toast");
  const copyButton = byId("copy-code");
  const codeOutput = byId("generated-code");

  /**
   * Finds the selected value from a named radio group.
   *
   * @param {string} name - Radio group name.
   * @returns {string} Selected radio value.
   */
  function selectedRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
  }

  /**
   * Resolves the selected custom icon.
   *
   * @returns {{icon: string, isIcon: boolean}|null}
   */
  function readCustomIcon() {
    if (!checked("toast-enable-icon")) return null;
    if (selectedRadio("icon-type") !== "custom") return null;

    const isIcon = selectedRadio("is-icon-true-false") === "true";
    const preset = value("toast-custom-icon").trim();
    const url = value("toast-custom-icon-url").trim();

    if (isIcon) {
      return { icon: preset, isIcon: true };
    }

    if (url) {
      return { icon: url, isIcon: false };
    }

    // A preset is a CSS class icon, not an image URL.
    return { icon: preset, isIcon: true };
  }

  /**
   * Reads all supported notification options from the form.
   *
   * @returns {Record<string, unknown>} Notification options.
   */
  function readOptions() {
    const duration = Number(value("toast-duration"));

    if (!Number.isFinite(duration) || duration < 0) {
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
   * Converts an options object into executable example code.
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
      code += "\n\n// Optional: add an onClick callback to the options object.";
    }

    if (checked("toast-include-onclose")) {
      code += "\n// Optional: add an onClose callback to the options object.";
    }

    return code;
  }

  /**
   * Generates the example and shows a notification.
   *
   * @returns {void}
   */
  function generateToast() {
    try {
      const message =
        value("toast-message") || "This is a sample notification.";

      const options = readOptions();

      const code = generateCode(message, options);

      // Always use textContent for generated source code.
      codeOutput.textContent = code;

      // Preview with the actual browser distribution.
      toast[options.type](message, options);
    } catch (error) {
      console.error("ZephyrToast generator error:", error);
      codeOutput.textContent = `// Error: ${error.message}`;
    }
  }

  /**
   * Copies the generated example to the clipboard.
   *
   * @returns {Promise<void>}
   */
  async function copyCode() {
    const code = codeOutput.textContent;

    if (!code || code.startsWith("// Error:")) return;

    const originalLabel = copyButton.textContent;

    try {
      await navigator.clipboard.writeText(code);
      copyButton.textContent = "Copied!";
    } catch (error) {
      console.error("Unable to copy generated code:", error);
      copyButton.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      copyButton.textContent = originalLabel;
    }, 1800);
  }

  /**
   * Updates the visibility of conditional generator controls.
   *
   * @returns {void}
   */
  function updateConditionalControls() {
    const customTheme = checked("toast-enable-custom-theme");
    const enabledIcon = checked("toast-enable-icon");
    const customIcon = selectedRadio("icon-type") === "custom";
    const classIcon = selectedRadio("is-icon-true-false") === "true";

    byId("theme-options").classList.toggle("d-none", !customTheme);
    byId("icon-type-options").classList.toggle("d-none", !enabledIcon);

    document
      .querySelector(".icon-custom-container")
      .classList.toggle("d-none", !enabledIcon || !customIcon);

    document
      .querySelector(".custom-icon-url")
      .classList.toggle("d-none", classIcon);
  }

  /**
   * Synchronizes a theme color preview with its input.
   *
   * @param {string} inputId - Theme field ID.
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

  // Main generator actions.
  generateButton.addEventListener("click", generateToast);
  copyButton.addEventListener("click", copyCode);

  // Bind each conditional control exactly once.
  byId("toast-enable-custom-theme").addEventListener(
    "change",
    updateConditionalControls,
  );

  byId("toast-enable-icon").addEventListener(
    "change",
    updateConditionalControls,
  );

  document
    .querySelectorAll('input[name="icon-type"]')
    .forEach((radio) =>
      radio.addEventListener("change", updateConditionalControls),
    );

  document
    .querySelectorAll('input[name="is-icon-true-false"]')
    .forEach((radio) =>
      radio.addEventListener("change", updateConditionalControls),
    );

  // Theme color previews.
  for (const [inputId, previewId] of [
    ["toast-bg-color", "bg-color-preview"],
    ["toast-text-color", "text-color-preview"],
    ["toast-border-color", "border-color-preview"],
    ["toast-progress-track-color", "progress-track-color-preview"],
    ["toast-progress-bar-color", "toast-progress-bar-color-preview"],
  ]) {
    bindColorPreview(inputId, previewId);
  }

  updateConditionalControls();
})();
