/**
 * @fileoverview Builds the ZephyrToast public demo website.
 *
 * Copies the latest production browser distribution into the
 * published demo asset directory, and publishes the demo HTML
 * from its maintained source location.
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
const assetsDirectory = resolve(projectRoot, "site-assets");

const libraryFiles = [
  "zephyr-toast.js",
  "zephyr-toast.css",
  "zephyr-toast-animate.css",
];

/**
 * Publishes the latest library assets and demo entry point.
 *
 * @returns {Promise<void>}
 */
async function buildDemo() {
  await mkdir(assetsDirectory, { recursive: true });

  for (const filename of libraryFiles) {
    await copyFile(
      resolve(distDirectory, filename),
      resolve(assetsDirectory, filename),
    );

    console.log(`Published library asset: ${filename}`);
  }

  await copyFile(
    resolve(demoDirectory, "css", "demo.css"),
    resolve(assetsDirectory, "demo.css"),
  );

  console.log("Published demo asset: demo.css");

  await copyFile(
    resolve(demoDirectory, "js", "generator.js"),
    resolve(assetsDirectory, "generator.js"),
  );

  console.log("Published demo asset: generator.js");

  await copyFile(
    resolve(demoDirectory, "index.html"),
    resolve(projectRoot, "index.html"),
  );

  console.log("Published demo: index.html");
  console.log("ZephyrToast demo build completed successfully.");
}

buildDemo().catch((error) => {
  console.error("Failed to build ZephyrToast demo:", error);
  process.exitCode = 1;
});
