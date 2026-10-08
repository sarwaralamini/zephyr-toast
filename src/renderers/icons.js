
/**
 * @fileoverview Notification icon rendering for ZephyrToast.
 *
 * Supports built-in icons, CSS class icons, image icons,
 * and restricted custom SVG markup.
 *
 * Uses DOM APIs for untrusted attribute values and delegates
 * custom SVG validation to the secure SVG renderer.
 *
 * @module renderers/icons
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { createSafeSvg } from "./svg.js";

/**
 * Creates an icon element from CSS class names.
 *
 * Class names are assigned as an attribute rather than parsed
 * as HTML, preventing injected markup from creating elements.
 *
 * @param {string} className - CSS classes for the icon.
 * @param {Document} documentRef - Target document.
 * @returns {HTMLElement} The icon element.
 */
export function createClassIcon(className, documentRef) {
  const element = documentRef.createElement("i");
  element.setAttribute("class", className);

  return element;
}

/**
 * Creates an image icon with a validated URL.
 *
 * Accepts URLs resolving to HTTP or HTTPS, including relative
 * paths. Unsupported URL protocols are rejected.
 *
 * @param {string} url - Image source URL.
 * @param {Document} documentRef - Target document.
 * @param {string} [width="16px"] - Image width.
 * @param {string} [height="16px"] - Image height.
 * @returns {HTMLImageElement} The image element.
 * @throws {TypeError} If the URL is invalid or unsupported.
 */
export function createImageIcon(
  url,
  documentRef,
  width = "16px",
  height = "16px"
) {
  if (typeof url !== "string" || !url.trim()) {
    throw new TypeError(
      "Icon image URL must be a non-empty string."
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url, documentRef.baseURI);
  } catch {
    throw new TypeError("Invalid icon image URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new TypeError(
      "Icon image URL must use HTTP, HTTPS, or a relative path."
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
 * Creates the icon container for a notification.
 *
 * Preserves existing icon selection behavior. A null return
 * value indicates that icon rendering is disabled.
 *
 * @param {Object} options - Resolved notification options.
 * @param {Object} types - Notification type definitions.
 * @param {Document} documentRef - Target document.
 * @returns {HTMLElement|null} The icon container, or null.
 * @throws {TypeError} If an icon value is invalid or unsafe.
 */
export function renderIcon(options, types, documentRef) {
  if (options.enableIcon === false) {
    return null;
  }

  const iconDiv = documentRef.createElement("div");
  iconDiv.className = "zephyr-toast-notification-icon";

  const icon = options.icon;

  if (typeof icon === "string" && icon.length > 0) {
    const isImageUrl = /\.(jpeg|jpg|gif|png)(?:[?#].*)?$/i.test(icon);

    if (options.isIcon && isImageUrl) {
      throw new TypeError(
        "An image URL cannot be used when isIcon is true."
      );
    }

    if (isImageUrl && !options.isIcon) {
      iconDiv.appendChild(createImageIcon(icon, documentRef));
    } else {
      iconDiv.appendChild(createClassIcon(icon, documentRef));
    }
  } else if (icon && typeof icon === "object") {
    if (Array.isArray(icon)) {
      throw new TypeError(
        "Icon configuration must be a string or a non-array object."
      );
    }

    if (icon.url !== undefined) {
      iconDiv.appendChild(
        createImageIcon(
          icon.url,
          documentRef,
          icon.width,
          icon.height
        )
      );
    } else if (icon.fontAwesome !== undefined) {
      if (typeof icon.fontAwesome !== "string") {
        throw new TypeError(
          "Icon class names must be provided as a string."
        );
      }

      iconDiv.appendChild(
        createClassIcon(icon.fontAwesome, documentRef)
      );
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
