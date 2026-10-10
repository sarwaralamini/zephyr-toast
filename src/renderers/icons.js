/**
 * @fileoverview Notification icon creation and rendering for ZephyrToast.
 *
 * Provides utilities for rendering notification icons from CSS class
 * names, image URLs, built-in SVG markup, and custom SVG definitions.
 *
 * Icon selection is determined by the resolved notification options.
 * CSS class names and image attributes are assigned through DOM APIs
 * rather than interpolated into HTML strings.
 *
 * Image URLs are restricted to HTTP and HTTPS protocols, including
 * relative URLs that resolve to those protocols. Custom SVG markup
 * is delegated to the secure SVG renderer for validation.
 *
 * @module renderers/icons
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { createSafeSvg } from "./svg.js";

/**
 * Creates an icon element using CSS class names.
 *
 * Constructs an HTML <i> element and assigns the provided class names
 * through setAttribute(), without interpreting them as HTML markup.
 *
 * The required icon font or stylesheet must be available in the
 * consuming application for the icon to appear correctly.
 *
 * @param {string} className - CSS class names representing the icon.
 * @param {Document} documentRef - Document used to create the element.
 * @returns {HTMLElement} The constructed icon element.
 */
export function createClassIcon(className, documentRef) {
  const element = documentRef.createElement("i");
  element.setAttribute("class", className);

  return element;
}

/**
 * Creates an image-based notification icon.
 *
 * Accepts a non-empty URL string that resolves to an HTTP or HTTPS
 * resource. Relative URLs are resolved against the target document's
 * base URI for protocol validation.
 *
 * Unsupported protocols and invalid URL values are rejected.
 * The original URL string is assigned to the image's src attribute.
 *
 * Image dimensions can be customized through optional width and
 * height arguments. The image is decorative and receives an
 * empty alt attribute.
 *
 * @param {string} url - Absolute or relative image source URL.
 * @param {Document} documentRef - Document used to create the image.
 * @param {string} [width="16px"] - CSS width of the image.
 * @param {string} [height="16px"] - CSS height of the image.
 * @returns {HTMLImageElement} The constructed image element.
 * @throws {TypeError} If the URL is empty, invalid, or uses an
 * unsupported protocol.
 */
export function createImageIcon(
  url,
  documentRef,
  width = "16px",
  height = "16px",
) {
  if (typeof url !== "string" || !url.trim()) {
    throw new TypeError("Icon image URL must be a non-empty string.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url, documentRef.baseURI);
  } catch {
    throw new TypeError("Invalid icon image URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new TypeError(
      "Icon image URL must use HTTP, HTTPS, or a relative path.",
    );
  }

  const image = documentRef.createElement("img");

  image.setAttribute("src", url);
  image.setAttribute("alt", "");
  image.style.width = width;
  image.style.height = height;

  return image;
}

/**
 * Creates and populates the icon container for a notification.
 *
 * Returns null when icon rendering is explicitly disabled.
 * Otherwise, creates a notification icon container and selects
 * the appropriate rendering method based on the icon configuration.
 *
 * Supported icon configurations include:
 *
 * - A CSS class string, rendered using an HTML <i> element.
 * - A recognized image filename string (JPEG, PNG, GIF, WebP,
 *   AVIF, or SVG), rendered as an image when isIcon is false.
 * - An object containing a URL and optional image dimensions.
 * - An object containing fontAwesome CSS class names.
 * - An object containing custom SVG markup.
 * - A built-in SVG icon when no custom icon is provided.
 *
 * Custom SVG markup is processed by createSafeSvg() before
 * insertion into the notification.
 *
 * Built-in SVG strings originate from library-controlled
 * notification type definitions.
 *
 * @param {Object} options - Resolved notification configuration,
 * including type, icon, isIcon, and enableIcon.
 * @param {Object} types - Built-in notification type definitions
 * containing their associated SVG icons.
 * @param {Document} documentRef - Document used to create elements.
 * @returns {HTMLElement|null} The populated icon container,
 * or null when icons are disabled.
 * @throws {TypeError} If an icon configuration is invalid or an
 * unsupported image URL is provided.
 */
export function renderIcon(options, types, documentRef) {
  // Skip icon construction when explicitly disabled.
  if (options.enableIcon === false) {
    return null;
  }

  // Create the notification icon container.
  const iconDiv = documentRef.createElement("div");
  iconDiv.className = "zephyr-toast-notification-icon";

  const icon = options.icon;

  // Render string-based icon configurations.
  if (typeof icon === "string" && icon.length > 0) {
    const isImageUrl = /\.(jpeg|jpg|gif|png|webp|avif|svg)(?:[?#].*)?$/i.test(
      icon,
    );

    if (options.isIcon && isImageUrl) {
      throw new TypeError("An image URL cannot be used when isIcon is true.");
    }

    if (isImageUrl && !options.isIcon) {
      iconDiv.appendChild(createImageIcon(icon, documentRef));
    } else {
      iconDiv.appendChild(createClassIcon(icon, documentRef));
    }
  } else if (icon && typeof icon === "object") {
    // Reject array-based configurations.
    if (Array.isArray(icon)) {
      throw new TypeError(
        "Icon configuration must be a string or a non-array object.",
      );
    }

    // Render structured image, CSS class, or SVG configurations.
    if (icon.url !== undefined) {
      iconDiv.appendChild(
        createImageIcon(icon.url, documentRef, icon.width, icon.height),
      );
    } else if (icon.fontAwesome !== undefined) {
      if (typeof icon.fontAwesome !== "string") {
        throw new TypeError("Icon class names must be provided as a string.");
      }

      iconDiv.appendChild(createClassIcon(icon.fontAwesome, documentRef));
    } else if (icon.svg !== undefined) {
      if (typeof icon.svg !== "string") {
        throw new TypeError("Custom SVG must be a string.");
      }

      iconDiv.appendChild(createSafeSvg(icon.svg, documentRef));
    }
  } else {
    // Built-in SVG strings are controlled by the library.
    iconDiv.innerHTML = types[options.type].icon;
  }

  return iconDiv;
}
