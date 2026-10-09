
/**
 * @fileoverview Copies production ZephyrToast assets into
 * the GitHub Pages demo directory.
 *
 * @module scripts/build-demo
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(projectRoot, "dist");
const outputDirectory = resolve(projectRoot, "site-assets");

const files = [
  "zephyr-toast.js",
  "zephyr-toast.css",
  "zephyr-toast-animate.css",
];

/**
 * Copies the latest standalone distribution files.
 *
 * @returns {Promise<void>}
 */
async function buildDemo() {
  await mkdir(outputDirectory, { recursive: true });

  for (const filename of files) {
    await copyFile(
      resolve(sourceDirectory, filename),
      resolve(outputDirectory, filename),
    );

    console.log(`Copied ${filename}`);
  }

  console.log("Demo assets updated successfully.");
}

buildDemo().catch((error) => {
  console.error("Demo build failed:", error);
  process.exitCode = 1;
});
