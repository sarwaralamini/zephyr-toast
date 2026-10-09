/**
 * @fileoverview Constructor safety and DOM integrity tests.
 *
 * Ensures invalid constructor configuration is rejected before
 * ZephyrToast creates or modifies the notification container.
 *
 * @module tests/zephyr-toast.constructor-safety
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { JSDOM } from "jsdom";
import ZephyrToast from "../src/index.js";

describe("ZephyrToast Constructor Safety", () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
      url: "http://localhost/",
    });

    vi.stubGlobal("document", dom.window.document);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    dom.window.close();
  });

  it("does not create a container when position is invalid", () => {
    expect(() => {
      new ZephyrToast({
        position: "invalid-position",
      });
    }).toThrow(RangeError);

    expect(document.getElementById("zephyr-toast-container")).toBeNull();
  });

  it("does not create a container when duration is invalid", () => {
    expect(() => {
      new ZephyrToast({
        duration: -100,
      });
    }).toThrow(RangeError);

    expect(document.getElementById("zephyr-toast-container")).toBeNull();
  });

  it("does not modify an existing container on invalid options", () => {
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

    expect(existingContainer.className).toBe("existing-container");
  });

  it("creates the container when configuration is valid", () => {
    const toast = new ZephyrToast({
      position: "bottom-left",
      duration: 3000,
    });

    expect(toast.container).not.toBeNull();

    expect(
      toast.container.classList.contains("zephyr-position-bottom-left"),
    ).toBe(true);
  });
});
