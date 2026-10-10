/**
 * @fileoverview Builds the ZephyrToast GitHub Pages website.
 *
 * Generates the production library distribution and publishes
 * the demo HTML, JavaScript, and CSS to the docs directory.
 *
 * @module scripts/build-demo
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

const distDirectory = resolve(projectRoot, "dist");
const demoDirectory = resolve(projectRoot, "demo");

const publishDirectory = resolve(projectRoot, "docs");
const assetsDirectory = resolve(publishDirectory, "site-assets");

const libraryFiles = [
  "zephyr-toast.js",
  "zephyr-toast.css",
  "zephyr-toast-animate.css",
];

/**
 * Copies a source file into the published asset directory.
 *
 * @param {string} source - Absolute source file path.
 * @param {string} filename - Output filename.
 * @returns {Promise<void>}
 */
async function publishAsset(source, filename) {
  await copyFile(source, resolve(assetsDirectory, filename));

  console.log(`Published: site-assets/${filename}`);
}

/**
 * Builds the complete GitHub Pages website.
 *
 * @returns {Promise<void>}
 */
async function buildDemo() {
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

buildDemo().catch((error) => {
  console.error("Demo build failed:", error);
  process.exitCode = 1;
});
