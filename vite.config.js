
/**
 * @fileoverview Vite library build configuration for ZephyrToast.
 *
 * Creates separate ES module and standalone IIFE distributions.
 * The standalone build also emits the existing CSS stylesheets.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { defineConfig } from "vite";
import { readFileSync } from "node:fs";

/**
 * Creates a Vite plugin that includes the library stylesheets
 * in the distribution without modifying their contents.
 *
 * @returns {import("vite").Plugin} Stylesheet emission plugin.
 */
function copyStylesheets() {
  return {
    name: "zephyr-copy-styles",

    generateBundle() {
      for (const filename of [
        "zephyr-toast.css",
        "zephyr-toast-animate.css",
      ]) {
        this.emitFile({
          type: "asset",
          fileName: filename,
          source: readFileSync(
            new URL(`./${filename}`, import.meta.url)
          ),
        });
      }
    },
  };
}

/**
 * Resolves the distribution configuration by build mode.
 */
export default defineConfig(({ mode }) => {
  const browserBuild = mode === "browser";

  return {
    plugins: browserBuild ? [copyStylesheets()] : [],

    build: {
      outDir: "dist",

      // The module build clears dist. The browser build adds to it.
      emptyOutDir: !browserBuild,

      sourcemap: true,

      lib: {
        entry: browserBuild
          ? "src/browser.js"
          : "src/index.js",

        name: "ZephyrToastBundle",

        formats: browserBuild ? ["iife"] : ["es"],

        fileName: () =>
          browserBuild
            ? "zephyr-toast.js"
            : "zephyr-toast.es.js",
      },
    },
  };
});
