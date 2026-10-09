/**
 * @fileoverview Distribution build verification for ZephyrToast.
 *
 * Confirms that the library emits its expected JavaScript and CSS
 * files, that the ES module exports its constructor, and that
 * the standalone browser bundle exposes window.ZephyrToast.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { JSDOM } from "jsdom";

/**
 * Absolute path to the project root.
 *
 * @type {string}
 */
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const distDir = resolve(projectRoot, "dist");

/**
 * Ensures that a distribution file exists and is not empty.
 *
 * @param {string} filename - Distribution file name.
 * @returns {Promise<void>}
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
 * @returns {Promise<void>}
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
 * @returns {Promise<void>}
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
 * @returns {Promise<void>}
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
 * Executes the distribution verification checks.
 *
 * @returns {Promise<void>}
 */
async function main() {
  for (const filename of [
    "zephyr-toast.es.js",
    "zephyr-toast.js",
    "zephyr-toast.css",
    "zephyr-toast-animate.css",
    "index.d.ts",
  ]) {
    await verifyFile(filename);
  }

  await verifyEsm();
  await verifyBrowser();
  await verifyPackageExports();

  console.log("All distribution checks passed.");
}

main().catch((error) => {
  console.error("Distribution verification failed:", error);
  process.exitCode = 1;
});
