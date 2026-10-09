/**
 * @fileoverview ESLint configuration for ZephyrToast.
 *
 * Provides consistent JavaScript linting for the library,
 * build scripts, and automated tests.
 *
 * @author Md. Sarwar Alam
 * @license MIT
 */

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "no-debugger": "error",
      "no-constant-condition": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-unused-labels": "error",
      "valid-typeof": "error",
    },
  },
];
