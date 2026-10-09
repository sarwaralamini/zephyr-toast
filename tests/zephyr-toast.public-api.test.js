
/**
 * @fileoverview Public API compatibility tests for ZephyrToast.
 *
 * Verifies public module exports, notification methods,
 * callback overrides, notification removal, and shared
 * container behavior.
 *
 * @module tests/zephyr-toast.public-api
 * @author Md. Sarwar Alam
 * @license MIT
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

import { JSDOM } from "jsdom";

import ZephyrToast, {
  ZephyrToast as NamedZephyrToast,
} from "../src/index.js";

describe("ZephyrToast Public API Compatibility", () => {
  let dom;
  let toast;

  beforeEach(() => {
    vi.useFakeTimers();

    dom = new JSDOM(
      "<!DOCTYPE html><html><head></head><body></body></html>",
      {
        url: "http://localhost/",
      }
    );

    vi.stubGlobal("document", dom.window.document);

    toast = new ZephyrToast();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    dom.window.close();
  });

  it("provides identical default and named exports", () => {
    expect(ZephyrToast).toBe(NamedZephyrToast);
    expect(typeof ZephyrToast).toBe("function");
  });

  it("returns notification elements from every public method", () => {
    const methods = [
      "show",
      "success",
      "info",
      "warning",
      "error",
      "zen",
      "void",
    ];

    for (const method of methods) {
      const element = toast[method]("API compatibility", {
        duration: 0,
      });

      expect(element).toBeInstanceOf(
        dom.window.HTMLElement
      );

      expect(toast.container.contains(element)).toBe(true);
    }
  });

  it("allows per-toast callbacks to override instance callbacks", () => {
    const defaultOnClose = vi.fn();
    const overrideOnClose = vi.fn();

    const manager = new ZephyrToast({
      onClose: defaultOnClose,
    });

    const element = manager.info("Callback override", {
      duration: 0,
      onClose: overrideOnClose,
    });

    manager.removeToast(element);

    vi.advanceTimersByTime(500);

    expect(overrideOnClose).toHaveBeenCalledOnce();
    expect(defaultOnClose).not.toHaveBeenCalled();
  });

  it("allows null to disable an inherited callback", () => {
    const defaultOnClose = vi.fn();

    const manager = new ZephyrToast({
      onClose: defaultOnClose,
    });

    const element = manager.info("Disabled callback", {
      duration: 0,
      onClose: null,
    });

    manager.removeToast(element);

    vi.advanceTimersByTime(500);

    expect(defaultOnClose).not.toHaveBeenCalled();
    expect(element.isConnected).toBe(false);
  });

  it("shares the existing notification container between instances", () => {
    const secondManager = new ZephyrToast();

    expect(secondManager.container).toBe(toast.container);

    const first = toast.info("First manager", {
      duration: 0,
    });

    const second = secondManager.success("Second manager", {
      duration: 0,
    });

    expect(toast.container.contains(first)).toBe(true);
    expect(toast.container.contains(second)).toBe(true);
  });

  it("preserves shared-container removeAll behavior", () => {
    const secondManager = new ZephyrToast();

    const first = toast.info("First", {
      duration: 0,
    });

    const second = secondManager.warning("Second", {
      duration: 0,
    });

    toast.removeAll();

    vi.advanceTimersByTime(500);

    expect(first.isConnected).toBe(false);
    expect(second.isConnected).toBe(false);
  });

  it("rejects invalid position updates without changing state", () => {
    const originalPosition = toast.options.position;
    const originalClassName = toast.container.className;

    expect(() => {
      toast.updatePosition("invalid-position");
    }).toThrow(RangeError);

    expect(toast.options.position).toBe(originalPosition);
    expect(toast.container.className).toBe(
      originalClassName
    );
  });
});
