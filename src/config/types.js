/**
 * @fileoverview Built-in notification types and visual themes for ZephyrToast.
 *
 * Defines the default SVG icons and color palettes for the six
 * supported notification types: success, info, warning, error,
 * zen, and void.
 *
 * The exported definitions are immutable. A factory function
 * provides independent mutable copies for individual instances.
 *
 * @module config/types
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Immutable definitions for all built-in notification types.
 *
 * Each notification type contains:
 * - icon: SVG markup representing the notification.
 * - bgColor: Background color of the notification.
 * - textColor: Foreground text and icon color.
 * - borderColor: Border color of the notification.
 *
 * Individual type definitions and their containing object are
 * frozen to prevent modifications to the shared defaults.
 *
 * @constant
 * @type {Readonly<Record<string, {
 *   icon: string,
 *   bgColor: string,
 *   textColor: string,
 *   borderColor: string
 * }>>}
 */
export const NOTIFICATION_TYPES = Object.freeze({
  success: Object.freeze({
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
    bgColor: "#e3f7ed",
    textColor: "#3bad71",
    borderColor: "#b5eace",
  }),

  info: Object.freeze({
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
    bgColor: "#dff0fa",
    textColor: "#2385ba",
    borderColor: "#a9d7f1",
  }),

  warning: Object.freeze({
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
    bgColor: "#fff5da",
    textColor: "#d9a209",
    borderColor: "#ffe59d",
  }),

  error: Object.freeze({
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>',
    bgColor: "#fde8e4",
    textColor: "#cc563d",
    borderColor: "#f9c1b6",
  }),

  zen: Object.freeze({
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 0 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/></svg>',
    bgColor: "#f4f7f9",
    textColor: "#2e3a59",
    borderColor: "#d8e1e8",
  }),

  void: Object.freeze({
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/></svg>',
    bgColor: "#111113",
    textColor: "#f1f1f1",
    borderColor: "#111113",
  }),
});

/**
 * Creates independent, mutable notification type definitions.
 *
 * Copies the top-level notification type collection and each
 * individual type configuration so that instances can customize
 * their visual themes without modifying the shared definitions.
 *
 * SVG strings and color values are preserved in the copies.
 *
 * @returns {Record<string, {
 *   icon: string,
 *   bgColor: string,
 *   textColor: string,
 *   borderColor: string
 * }>} An independent collection of mutable notification types.
 */
export function createNotificationTypes() {
  return Object.fromEntries(
    Object.entries(NOTIFICATION_TYPES).map(([name, config]) => [
      name,
      { ...config },
    ]),
  );
}
