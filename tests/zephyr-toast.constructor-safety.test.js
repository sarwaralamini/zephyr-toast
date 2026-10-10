/**
 * @fileoverview Constructor safety and DOM integrity tests for ZephyrToast.
 *
 * Verifies that invalid constructor configuration is rejected
 * before creating or modifying notification containers.
 *
 * Covers invalid positions, durations, animation settings,
 * notification types, boolean options, theme properties,
 * and structured icon configuration.
 *
 * Also verifies that valid initialization succeeds and
 * existing DOM elements are preserved after validation errors.
 *
 * @module tests/zephyr-toast.constructor-safety
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ZephyrToast from "../src/index.js";

/**
 * Verifies constructor validation and DOM integrity.
 */
describe("ZephyrToast Constructor Safety", () => {
  /** @type {JSDOM} */
  let dom;

  /**
   * Creates an isolated DOM for each test.
   *
   * @returns {void}
   */
  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
      url: "http://localhost/",
    });

    vi.stubGlobal("document", dom.window.document);
  });

  /**
   * Restores browser globals and releases DOM resources.
   *
   * @returns {void}
   */
  afterEach(() => {
    vi.unstubAllGlobals();
    dom.window.close();
  });

  /**
   * Returns the notification container, if one exists.
   *
   * @returns {HTMLElement | null} Notification container.
   */
  function getContainer() {
    return document.getElementById("zephyr-toast-container");
  }

  /**
   * Verifies that a constructor error does not create
   * a notification container or inject library styles.
   *
   * @param {Object} options - Invalid constructor options.
   * @param {Function} expectedError - Expected error constructor.
   * @returns {void}
   */
  function expectRejectedWithoutDOMMutation(options, expectedError) {
    expect(() => new ZephyrToast(options)).toThrow(expectedError);

    expect(getContainer()).toBeNull();

    expect(document.getElementById("zephyr-toast-notification-css")).toBeNull();
  }

  // ----------------------------------------------------------
  // 1. Invalid Constructor Configuration
  // ----------------------------------------------------------

  describe("Invalid Constructor Configuration", () => {
    it("does not create a container when position is invalid", () => {
      expectRejectedWithoutDOMMutation(
        {
          position: "invalid-position",
        },
        RangeError,
      );
    });

    it("does not create a container when duration is negative", () => {
      expectRejectedWithoutDOMMutation(
        {
          duration: -100,
        },
        RangeError,
      );
    });

    it("does not create a container when duration has an invalid type", () => {
      expectRejectedWithoutDOMMutation(
        {
          duration: "3000",
        },
        TypeError,
      );
    });

    it("does not create a container when animation is unsupported", () => {
      expectRejectedWithoutDOMMutation(
        {
          animation: {
            in: "invalid-animation",
          },
        },
        RangeError,
      );
    });

    it("does not create a container when notification type is unsupported", () => {
      expectRejectedWithoutDOMMutation(
        {
          type: "unknown",
        },
        RangeError,
      );
    });

    it("does not create a container when a boolean option is invalid", () => {
      expectRejectedWithoutDOMMutation(
        {
          pauseOnHover: "true",
        },
        TypeError,
      );
    });

    it("does not create a container when theme configuration is invalid", () => {
      expectRejectedWithoutDOMMutation(
        {
          theme: {
            bgColor: 123,
          },
        },
        TypeError,
      );
    });

    it("does not create a container when structured icon configuration is invalid", () => {
      expectRejectedWithoutDOMMutation(
        {
          icon: {
            unsupported: "icon",
          },
        },
        TypeError,
      );
    });
  });

  // ----------------------------------------------------------
  // 2. Existing Container Integrity
  // ----------------------------------------------------------

  describe("Existing Container Integrity", () => {
    it("does not modify an existing container on invalid animation settings", () => {
      const existingContainer = document.createElement("div");

      existingContainer.id = "zephyr-toast-container";
      existingContainer.className = "existing-container";

      document.body.appendChild(existingContainer);

      expect(() => {
        new ZephyrToast({
          animation: {
            in: "invalid-animation",
          },
        });
      }).toThrow(RangeError);

      expect(getContainer()).toBe(existingContainer);
      expect(existingContainer.className).toBe("existing-container");
    });

    it("does not modify an existing container on invalid position", () => {
      const existingContainer = document.createElement("div");

      existingContainer.id = "zephyr-toast-container";
      existingContainer.className = "existing-container custom-position";

      document.body.appendChild(existingContainer);

      expect(() => {
        new ZephyrToast({
          position: "invalid-position",
        });
      }).toThrow(RangeError);

      expect(getContainer()).toBe(existingContainer);

      expect(existingContainer.className).toBe(
        "existing-container custom-position",
      );
    });

    it("preserves existing container children after constructor rejection", () => {
      const existingContainer = document.createElement("div");
      const existingChild = document.createElement("span");

      existingContainer.id = "zephyr-toast-container";
      existingContainer.className = "existing-container";

      existingChild.textContent = "Existing content";

      existingContainer.appendChild(existingChild);
      document.body.appendChild(existingContainer);

      expect(() => {
        new ZephyrToast({
          duration: -100,
        });
      }).toThrow(RangeError);

      expect(getContainer()).toBe(existingContainer);
      expect(existingContainer.firstElementChild).toBe(existingChild);
      expect(existingChild.textContent).toBe("Existing content");
    });

    it("allows valid initialization after a rejected constructor", () => {
      expect(() => {
        new ZephyrToast({
          position: "invalid-position",
        });
      }).toThrow(RangeError);

      expect(getContainer()).toBeNull();

      const toast = new ZephyrToast({
        position: "bottom-left",
      });

      expect(getContainer()).toBe(toast.container);

      expect(
        toast.container.classList.contains("zephyr-position-bottom-left"),
      ).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // 3. Valid Constructor Configuration
  // ----------------------------------------------------------

  describe("Valid Constructor Configuration", () => {
    it("creates the container when configuration is valid", () => {
      const toast = new ZephyrToast({
        position: "bottom-left",
        duration: 3000,
      });

      expect(toast.container).not.toBeNull();

      expect(
        toast.container.classList.contains("zephyr-position-bottom-left"),
      ).toBe(true);

      expect(toast.options.duration).toBe(3000);
    });

    it("accepts a valid custom theme", () => {
      const toast = new ZephyrToast({
        theme: {
          bgColor: "#123456",
          textColor: "#ffffff",
        },
      });

      expect(toast.container).not.toBeNull();

      expect(toast.options.theme.bgColor).toBe("#123456");
      expect(toast.options.theme.textColor).toBe("#ffffff");
    });

    it("reuses an existing container for valid configuration", () => {
      const existingContainer = document.createElement("div");

      existingContainer.id = "zephyr-toast-container";
      existingContainer.className = "existing-container";

      document.body.appendChild(existingContainer);

      const toast = new ZephyrToast({
        position: "top-center",
      });

      expect(toast.container).toBe(existingContainer);

      expect(
        toast.container.classList.contains("zephyr-position-top-center"),
      ).toBe(true);

      expect(document.querySelectorAll("#zephyr-toast-container")).toHaveLength(
        1,
      );
    });
  });
});
