/**
 * @fileoverview Public TypeScript declarations for ZephyrToast.
 *
 * Provides static type definitions, editor autocomplete, and
 * development-time validation for the ZephyrToast JavaScript library.
 *
 * Defines supported notification types, positions, animations,
 * visual themes, custom icons, configuration options, and the
 * public notification manager API.
 *
 * These declarations introduce no runtime dependencies.
 *
 * @module zephyr-toast
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Supported built-in notification types.
 */
export type ToastType =
  "success" | "info" | "warning" | "error" | "zen" | "void";

/**
 * Supported notification container positions.
 */
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

/**
 * Supported notification entrance animations.
 *
 * Controls how a notification appears.
 */
export type ToastEntranceAnimation =
  | "fadeIn"
  | "slideInLeft"
  | "slideInRight"
  | "slideInDown"
  | "slideInUp"
  | "bounceIn"
  | "zoomIn";

/**
 * Supported notification exit animations.
 *
 * Controls how a notification disappears.
 */
export type ToastExitAnimation =
  | "fadeOut"
  | "slideOutLeft"
  | "slideOutRight"
  | "slideOutUp"
  | "slideOutDown"
  | "bounceOut"
  | "zoomOut";

/**
 * Notification entrance and exit animation configuration.
 *
 * Unspecified properties are resolved using the applicable
 * instance and library defaults.
 */
export interface ToastAnimation {
  /** Animation applied when the notification appears. */
  in?: ToastEntranceAnimation;

  /** Animation applied when the notification is dismissed. */
  out?: ToastExitAnimation;
}

/**
 * Custom notification theme colors.
 *
 * Individual properties override the resolved colors from
 * the selected notification type or instance configuration.
 */
export interface ToastTheme {
  /** Notification background color. */
  bgColor?: string;

  /** Notification foreground text color. */
  textColor?: string;

  /** Notification border color. */
  borderColor?: string;

  /** Progress indicator track color. */
  progressTrackColor?: string;

  /** Progress indicator fill color. */
  progressBarColor?: string;
}

/**
 * Custom image icon configuration.
 *
 * The URL must resolve to an HTTP or HTTPS resource.
 * Relative paths are supported.
 */
export interface ToastImageIcon {
  /** Absolute or relative image URL. */
  url: string;

  /** CSS width of the image. */
  width?: string;

  /** CSS height of the image. */
  height?: string;
}

/**
 * Custom icon configuration using CSS class names.
 *
 * The consuming application must provide any required
 * icon font or stylesheet.
 */
export interface ToastClassIcon {
  /** CSS classes used to render the icon. */
  fontAwesome: string;
}

/**
 * Custom SVG icon configuration.
 *
 * SVG markup is validated using ZephyrToast's restricted
 * SVG element and attribute allowlists.
 */
export interface ToastSvgIcon {
  /** SVG markup to validate and render. */
  svg: string;
}

/**
 * Supported notification icon values.
 *
 * Accepts a CSS class or recognized image URL string,
 * a structured image, CSS class, or SVG configuration,
 * or null to use the built-in notification type icon.
 */
export type ToastIcon =
  string | ToastImageIcon | ToastClassIcon | ToastSvgIcon | null;

/**
 * Configuration accepted by the ZephyrToast constructor
 * and individual notification methods.
 *
 * Per-notification values override instance settings.
 * Properties not explicitly provided are resolved using
 * the applicable configuration defaults.
 */
export interface ToastOptions {
  /** Notification container position. */
  position?: ToastPosition;

  /** Whether newer notifications appear before existing ones. */
  newestOnTop?: boolean;

  /** Built-in notification type. */
  type?: ToastType;

  /**
   * Automatic dismissal duration in milliseconds.
   *
   * Set to 0 to disable automatic dismissal.
   */
  duration?: number;

  /** Pause automatic dismissal while hovering. */
  pauseOnHover?: boolean;

  /** Display an animated progress indicator. */
  showProgress?: boolean;

  /** Entrance and exit animation settings. */
  animation?: ToastAnimation;

  /** Custom notification theme colors. */
  theme?: ToastTheme;

  /** Notification message. */
  message?: string;

  /** Optional notification title. */
  title?: string;

  /**
   * Enables HTML rendering for notification messages.
   *
   * Only use this option with trusted or sanitized content.
   * Untrusted HTML may introduce cross-site scripting risks.
   */
  allowHtml?: boolean;

  /** Enable or disable notification icons. */
  enableIcon?: boolean;

  /** Custom icon configuration or built-in icon fallback. */
  icon?: ToastIcon;

  /** Interpret supported string icon values as CSS icon classes. */
  isIcon?: boolean;

  /** Display the notification close button. */
  showClose?: boolean;

  /**
   * Callback invoked after a notification is removed.
   */
  onClose?: (() => void) | null;

  /**
   * Callback invoked when an eligible notification area is clicked.
   */
  onClick?: (() => void) | null;
}

/**
 * Visual properties of a built-in notification type.
 *
 * Instance-level type definitions can be customized independently
 * of the library's shared defaults.
 */
export interface ToastTypeDefinition {
  /** SVG markup used for the notification icon. */
  icon: string;

  /** Default notification background color. */
  bgColor: string;

  /** Default notification text color. */
  textColor: string;

  /** Default notification border color. */
  borderColor: string;
}

/**
 * Main ZephyrToast notification manager.
 *
 * Provides methods for creating, displaying, dismissing, and
 * configuring toast notifications.
 *
 * Each instance maintains its own configuration and notification
 * type definitions.
 */
export declare class ZephyrToast {
  /**
   * Creates a notification manager.
   *
   * Validates configuration, initializes the notification
   * container, and prepares the library for use.
   *
   * @param options - Initial notification configuration.
   */
  constructor(options?: ToastOptions);

  /** Independent default configuration for this instance. */
  defaults: ToastOptions;

  /** Active constructor-level notification configuration. */
  options: ToastOptions;

  /** Notification container in the document. */
  container: HTMLElement;

  /** Mapping of animation names to CSS class names. */
  animations: Record<string, string>;

  /** Instance-local notification type definitions. */
  types: Record<ToastType, ToastTypeDefinition>;

  /**
   * Creates and displays a notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  createToast(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a notification using the configured type.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  show(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a success notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  success(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays an informational notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  info(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a warning notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  warning(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays an error notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  error(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a zen-style notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  zen(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a void-style notification.
   *
   * @param message - Notification message.
   * @param options - Per-notification configuration.
   * @returns The created notification element.
   */
  void(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Dismisses a notification using its configured exit animation.
   *
   * @param toast - Notification element to dismiss.
   */
  removeToast(toast: HTMLElement): void;

  /**
   * Dismisses all notifications in the current container.
   *
   * Uses the standard notification lifecycle and exit animation.
   */
  removeAll(): void;

  /**
   * Updates the notification container position.
   *
   * @param position - New container position.
   */
  updatePosition(position: ToastPosition): void;

  /**
   * Validates notification configuration.
   *
   * @param options - Configuration values to validate.
   */
  validateConfiguration(options: ToastOptions): void;

  /**
   * Parses and validates custom SVG markup.
   *
   * @param markup - SVG markup to validate.
   * @returns A newly constructed, validated SVG element.
   */
  createSafeSvg(markup: string): SVGSVGElement;

  /**
   * Initializes or locates the notification container.
   */
  initializeContainer(): void;

  /**
   * Loads standalone browser stylesheets when applicable.
   */
  injectCSS(): void;
}

export default ZephyrToast;
