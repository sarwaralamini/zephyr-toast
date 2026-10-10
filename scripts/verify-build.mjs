/**
 * @fileoverview Production distribution verification for ZephyrToast.
 *
 * Performs post-build checks to confirm that the generated
 * distribution contains the required JavaScript, CSS, and
 * TypeScript declaration files.
 *
 * Verifies the following:
 * - Required distribution files exist and are not empty.
 * - ES module exports expose the ZephyrToast constructor.
 * - The standalone browser bundle exposes window.ZephyrToast.
 * - The browser bundle can create and display notifications.
 * - Package entry points and stylesheet exports are configured.
 * - The package's TypeScript declaration paths are correct.
 *
 * This script validates an existing production build.
 * It does not generate distribution files.
 *
 * @module scripts/verify-build
 * @author Md. Sarwar Alam
 * @license MIT
 */

import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { JSDOM } from "jsdom";

/**
 * Absolute path to the project root.
 *
 * Resolved relative to the current script to support execution
 * from different working directories.
 *
 * @constant
 * @type {string}
 */
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Absolute path to the production distribution directory.
 *
 * @constant
 * @type {string}
 */
const distDir = resolve(projectRoot, "dist");

/**
 * Verifies that a distribution artifact exists and contains data.
 *
 * Checks that the requested path represents a regular file
 * with a size greater than zero.
 *
 * @param {string} filename - Name of the distribution artifact.
 * @returns {Promise<void>} Resolves when the file is valid.
 * @throws {Error} If the file is missing, is not a regular file,
 * or is empty.
 */
async function verifyFile(filename) {
  const filePath = resolve(distDir, filename);
  const details = await stat(filePath);

  assert.ok(details.isFile(), `${filename} must be a file`);
  assert.ok(details.size > 0, `${filename} must not be empty`);

  console.log(`PASS File: ${filename}`);
}

/**
 * Verifies the ES module distribution.
 *
 * Dynamically imports the generated ES module bundle and
 * confirms that both the named and default exports expose
 * the same ZephyrToast constructor.
 *
 * @returns {Promise<void>} Resolves when exports are valid.
 * @throws {Error} If importing the bundle or verifying its
 * exports fails.
 */
async function verifyEsm() {
  const fileUrl = pathToFileURL(resolve(distDir, "zephyr-toast.es.js")).href;

  const module = await import(fileUrl);

  assert.equal(typeof module.default, "function");
  assert.equal(module.ZephyrToast, module.default);

  console.log("PASS ES module exports");
}

/**
 * Verifies the standalone browser distribution.
 *
 * Creates an isolated browser-like environment using JSDOM,
 * evaluates the production browser bundle, and confirms that
 * the ZephyrToast constructor is exposed globally.
 *
 * Also verifies that a notification can be created and
 * attached to the document, and that the standalone
 * stylesheet loader has been initialized.
 *
 * The temporary DOM environment is closed after testing,
 * including when an assertion fails.
 *
 * @returns {Promise<void>} Resolves when browser checks pass.
 * @throws {Error} If bundle evaluation or an assertion fails.
 */
async function verifyBrowser() {
  const dom = new JSDOM(
    `<!DOCTYPE html>
    <html>
      <head>
        <script src="/dist/zephyr-toast.js"></script>
      </head>
      <body></body>
    </html>`,
    {
      url: "http://localhost/",
      runScripts: "outside-only",
    },
  );

  try {
    const source = await readFile(resolve(distDir, "zephyr-toast.js"), "utf8");

    dom.window.eval(source);

    assert.equal(
      typeof dom.window.ZephyrToast,
      "function",
      "The browser bundle must expose window.ZephyrToast",
    );

    const toast = new dom.window.ZephyrToast();

    const element = toast.success("Browser build works", {
      duration: 0,
    });

    assert.equal(element._options.type, "success");

    assert.ok(
      dom.window.document.body.contains(element),
      "Notification must be attached to the document",
    );

    assert.ok(
      dom.window.document.getElementById("zephyr-toast-notification-css"),
      "Browser stylesheet loader must be initialized",
    );

    console.log("PASS Browser global and notification rendering");
  } finally {
    dom.window.close();
  }
}

/**
 * Verifies npm package entry points and stylesheet exports.
 *
 * Reads the package manifest and confirms that the configured
 * export paths match the expected distribution artifacts.
 *
 * Performs a self-referencing package import to verify that
 * the package name resolves to the generated ES module.
 *
 * Confirms the main TypeScript declaration paths in the
 * package manifest.
 *
 * @returns {Promise<void>} Resolves when package exports are valid.
 * @throws {Error} If the manifest is invalid, package import fails,
 * or an export path differs from the expected value.
 */
async function verifyPackageExports() {
  const packageJson = JSON.parse(
    await readFile(resolve(projectRoot, "package.json"), "utf8"),
  );

  assert.equal(packageJson.exports["."].import, "./dist/zephyr-toast.es.js");

  assert.equal(packageJson.exports["."].default, "./dist/zephyr-toast.es.js");

  assert.equal(packageJson.exports["./browser"], "./dist/zephyr-toast.js");

  assert.equal(packageJson.exports["./style.css"], "./dist/zephyr-toast.css");

  assert.equal(
    packageJson.exports["./animations.css"],
    "./dist/zephyr-toast-animate.css",
  );

  // Confirm that the actual package name resolves to its ES module.
  const module = await import("zephyr-toast");

  assert.equal(typeof module.default, "function");
  assert.equal(module.ZephyrToast, module.default);

  assert.equal(packageJson.types, "./dist/index.d.ts");

  assert.equal(packageJson.exports["."].types, "./dist/index.d.ts");

  console.log("PASS npm package exports");
}

/**
 * Executes all production distribution verification checks.
 *
 * Validates required files before testing module exports,
 * standalone browser functionality, and package entry points.
 *
 * Errors are propagated to the top-level error handler,
 * which reports the failure and sets a nonzero process exit code.
 *
 * @returns {Promise<void>} Resolves when all checks pass.
 * @throws {Error} If any distribution verification fails.
 */
async function main() {
  // Verify all required distribution artifacts.
  for (const filename of [
    "zephyr-toast.es.js",
    "zephyr-toast.js",
    "zephyr-toast.css",
    "zephyr-toast-animate.css",
    "index.d.ts",
  ]) {
    await verifyFile(filename);
  }

  // Verify the production JavaScript distributions.
  await verifyEsm();
  await verifyBrowser();

  // Verify package entry points and TypeScript declaration paths.
  await verifyPackageExports();

  console.log("All distribution checks passed.");
}

// Execute verification and report failures to the calling process.
main().catch((error) => {
  console.error("Distribution verification failed:", error);
  process.exitCode = 1;
});
