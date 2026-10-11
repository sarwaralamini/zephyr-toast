/**
 * @fileoverview Public ES module entry point for ZephyrToast.
 *
 * Provides the primary entry point for applications importing
 * ZephyrToast through native JavaScript modules or bundlers.
 *
 * Re-exports the main ZephyrToast class as both a named export
 * and a default export without introducing additional runtime
 * initialization or side effects.
 *
 * This entry point is used by the library's ES module build.
 *
 * @module zephyr-toast
 * @author Md. Sarwar Alam
 * @license MIT
 */

export { ZephyrToast, default } from "./ZephyrToast.js";
