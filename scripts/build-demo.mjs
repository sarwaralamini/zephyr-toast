/**
 * @fileoverview GitHub Pages website build script for ZephyrToast.
 *
 * Prepares the deployable GitHub Pages website by copying the
 * production library assets and demo interface files into
 * the docs directory.
 *
 * The published website includes the standalone JavaScript
 * distribution, library stylesheets, interactive playground,
 * and isolated notification preview.
 *
 * This script expects the production distribution to have
 * been generated before execution.
 *
 * @module scripts/build-demo
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Resolve directories relative to the project root.
const projectRoot = resolve(import.meta.dirname, "..");

const distDirectory = resolve(projectRoot, "dist");
const demoDirectory = resolve(projectRoot, "demo");

const publishDirectory = resolve(projectRoot, "docs");
const assetsDirectory = resolve(publishDirectory, "site-assets");

/**
 * Production library assets required by the demo website.
 *
 * These files are copied from the existing dist directory
 * into the GitHub Pages asset directory.
 *
 * @constant
 * @type {string[]}
 */
const libraryFiles = [
  "zephyr-toast.js",
  "zephyr-toast.js.map",
  "zephyr-toast.css",
  "zephyr-toast-animate.css",
];

/**
 * Copies a file into the published website's asset directory.
 *
 * The destination filename is resolved relative to
 * docs/site-assets, independent of the source file location.
 *
 * Logs the published asset path after a successful copy.
 *
 * @param {string} source - Absolute path of the source file.
 * @param {string} filename - Destination filename.
 * @returns {Promise<void>} Resolves when copying is complete.
 * @throws {Error} If the source cannot be read or the destination
 * cannot be written.
 */
async function publishAsset(source, filename) {
  await copyFile(source, resolve(assetsDirectory, filename));

  console.log(`Published: site-assets/${filename}`);
}

/**
 * Builds the complete GitHub Pages website.
 *
 * Creates the destination asset directory and publishes:
 * - Production ZephyrToast JavaScript and CSS.
 * - Demo interface stylesheet.
 * - Interactive playground JavaScript.
 * - Isolated notification preview page.
 * - Main website HTML entry point.
 *
 * The script copies existing build artifacts and demo sources.
 * It does not compile the library itself.
 *
 * @returns {Promise<void>} Resolves after all files are published.
 * @throws {Error} If directory creation or file copying fails.
 */
async function buildDemo() {
  // Ensure the published asset directory exists.
  await mkdir(assetsDirectory, { recursive: true });

  // Publish production ZephyrToast files.
  for (const filename of libraryFiles) {
    await publishAsset(resolve(distDirectory, filename), filename);
  }

  // Publish the demo interface stylesheet.
  await publishAsset(resolve(demoDirectory, "css", "demo.css"), "demo.css");

  // Publish the demo generator JavaScript.
  await publishAsset(
    resolve(demoDirectory, "js", "generator.js"),
    "generator.js",
  );

  // Publish the isolated notification preview page.
  await publishAsset(resolve(demoDirectory, "preview.html"), "preview.html");

  // Publish the website entry point.
  await copyFile(
    resolve(demoDirectory, "index.html"),
    resolve(publishDirectory, "index.html"),
  );

  console.log("Published: docs/index.html");
  console.log("ZephyrToast GitHub Pages build completed.");
}

// Execute the website build and report failures.
buildDemo().catch((error) => {
  console.error("Demo build failed:", error);
  process.exitCode = 1;
});
