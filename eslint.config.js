/**
 * @fileoverview ESLint flat configuration for ZephyrToast.
 *
 * Provides consistent static analysis for JavaScript source files,
 * automated tests, demo scripts, and Node.js build utilities.
 *
 * Uses ESLint's flat configuration format and applies a focused
 * set of error-level rules to detect common programming mistakes.
 *
 * Generated distribution files, dependency directories, and
 * coverage reports are excluded from linting.
 *
 * @module eslint.config
 * @author Md. Sarwar Alam
 * @license MIT
 */

export default [
  // ----------------------------------------------------------
  // 1. Excluded Directories
  // ----------------------------------------------------------

  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },

  // ----------------------------------------------------------
  // 2. JavaScript and Node.js Module Files
  // ----------------------------------------------------------

  {
    files: ["**/*.js", "**/*.mjs"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      // Prevent accidental debugging statements.
      "no-debugger": "error",

      // Detect invalid control-flow and conditional constructs.
      "no-constant-condition": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-unused-labels": "error",

      // Prevent invalid typeof comparisons.
      "valid-typeof": "error",
    },
  },
];
