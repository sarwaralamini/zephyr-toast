/**
 * @fileoverview Standalone browser entry point for ZephyrToast.
 *
 * Provides the entry point for the standalone browser distribution,
 * allowing websites to use ZephyrToast through a traditional
 * script element without an ES module import.
 *
 * Imports the main ZephyrToast constructor from the public
 * ES module entry point and exposes it on the browser's
 * global window object.
 *
 * This module is intended for the browser distribution build.
 * ES module consumers should use the public index.js entry point.
 *
 * @module browser
 * @author Md. Sarwar Alam
 * @license MIT
 */

import ZephyrToast from "./index.js";

/**
 * Exposes the ZephyrToast constructor globally.
 *
 * Makes the constructor accessible through window.ZephyrToast
 * for applications using the standalone browser distribution.
 *
 * @type {typeof ZephyrToast}
 */
window.ZephyrToast = ZephyrToast;
