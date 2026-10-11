/**
 * @fileoverview Vite production build configuration for ZephyrToast.
 *
 * Configures two distribution formats:
 *
 * - ES module (ESM) for modern JavaScript applications and bundlers.
 * - Standalone browser bundle (IIFE) for traditional script usage.
 *
 * The browser build also publishes the library's CSS stylesheets
 * and TypeScript declarations into the distribution directory.
 *
 * The builds are executed sequentially. The ES module build
 * initializes the distribution directory, while the browser
 * build preserves the existing ES module artifacts.
 *
 * @module vite.config
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { readFileSync } from "node:fs";

import { defineConfig } from "vite";

/**
 * Creates a Vite plugin that emits additional distribution assets.
 *
 * Copies the library's existing CSS stylesheets and public
 * TypeScript declaration file without modifying their contents.
 *
 * Assets are emitted during Rollup's generateBundle lifecycle.
 *
 * This plugin is enabled only for the standalone browser build
 * to avoid emitting duplicate assets during the ES module build.
 *
 * @returns {import("vite").Plugin} Vite plugin for publishing
 * stylesheets and TypeScript declarations.
 */
function copyStylesheets() {
  return {
    name: "zephyr-copy-styles",

    generateBundle() {
      // ------------------------------------------------------
      // 1. Publish Library Stylesheets
      // ------------------------------------------------------

      // Copy the library stylesheets into the distribution.
      for (const filename of ["zephyr-toast.css", "zephyr-toast-animate.css"]) {
        this.emitFile({
          type: "asset",
          fileName: filename,
          source: readFileSync(
            new URL(`./src/styles/${filename}`, import.meta.url),
          ),
        });
      }

      // ------------------------------------------------------
      // 2. Publish TypeScript Declarations
      // ------------------------------------------------------

      // Include public TypeScript declarations in the npm package.
      this.emitFile({
        type: "asset",
        fileName: "index.d.ts",
        source: readFileSync(new URL("./src/index.d.ts", import.meta.url)),
      });
    },
  };
}

/**
 * Creates the Vite configuration for the requested build mode.
 *
 * The module build clears the distribution directory and emits
 * the ESM bundle. The subsequent browser build preserves those
 * files and emits the standalone IIFE bundle and additional assets.
 *
 * Source maps are enabled for both JavaScript distributions.
 *
 * @returns {import("vite").UserConfig} Resolved Vite configuration.
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
        entry: browserBuild ? "src/browser.js" : "src/index.js",

        name: "ZephyrToastBundle",

        formats: browserBuild ? ["iife"] : ["es"],

        fileName: () =>
          browserBuild ? "zephyr-toast.js" : "zephyr-toast.es.js",
      },
    },
  };
});
