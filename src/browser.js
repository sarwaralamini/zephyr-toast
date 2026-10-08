
/**
 * @fileoverview Standalone browser entry point for ZephyrToast.
 *
 * Exposes the ZephyrToast constructor globally for websites
 * using a traditional script element.
 *
 * @module browser
 * @author Md. Sarwar Alam
 * @license MIT
 */

import ZephyrToast from "./index.js";

/**
 * Register the constructor on the browser global object.
 */
window.ZephyrToast = ZephyrToast;
