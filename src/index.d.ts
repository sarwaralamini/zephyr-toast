/**
 * @fileoverview Public TypeScript declarations for ZephyrToast.
 *
 * Provides static types and IDE autocomplete for the JavaScript
 * notification library without adding runtime dependencies.
 *
 * @module zephyr-toast
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Supported notification types.
 */
export type ToastType =
  "success" | "info" | "warning" | "error" | "zen" | "void";

/**
 * Supported notification positions.
 */
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

/**
 * Supported entrance animations.
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
 * Supported exit animations.
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
 */
export interface ToastAnimation {
  in?: ToastEntranceAnimation;
  out?: ToastExitAnimation;
}

/**
 * Notification theme color overrides.
 */
export interface ToastTheme {
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  progressTrackColor?: string;
  progressBarColor?: string;
}

/**
 * Custom image icon configuration.
 */
export interface ToastImageIcon {
  url: string;
  width?: string;
  height?: string;
}

/**
 * Custom CSS class icon configuration.
 */
export interface ToastClassIcon {
  fontAwesome: string;
}

/**
 * Custom SVG icon configuration.
 *
 * SVG markup must comply with ZephyrToast's security restrictions.
 */
export interface ToastSvgIcon {
  svg: string;
}

/**
 * Supported custom notification icon values.
 */
export type ToastIcon =
  string | ToastImageIcon | ToastClassIcon | ToastSvgIcon | null;

/**
 * Public configuration accepted by the constructor and
 * individual notification methods.
 */
export interface ToastOptions {
  position?: ToastPosition;
  newestOnTop?: boolean;
  type?: ToastType;
  duration?: number;
  pauseOnHover?: boolean;
  showProgress?: boolean;

  animation?: ToastAnimation;
  theme?: ToastTheme;

  message?: string;
  title?: string;

  /**
   * Enables trusted HTML rendering for notification messages.
   *
   * Never enable this for unsanitized user-provided content.
   */
  allowHtml?: boolean;

  enableIcon?: boolean;
  icon?: ToastIcon;
  isIcon?: boolean;
  showClose?: boolean;

  /**
   * Called after the notification is removed.
   */
  onClose?: (() => void) | null;

  /**
   * Called when the notification body is clicked.
   */
  onClick?: (() => void) | null;
}

/**
 * Available visual properties for a notification type.
 */
export interface ToastTypeDefinition {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

/**
 * Public ZephyrToast notification manager.
 */
export declare class ZephyrToast {
  /**
   * Creates a notification manager.
   *
   * @param options - Default notification configuration.
   */
  constructor(options?: ToastOptions);

  /** Instance-local default configuration. */
  defaults: ToastOptions;

  /** Active constructor-level configuration. */
  options: ToastOptions;

  /** Notification container in the DOM. */
  container: HTMLElement;

  /** CSS animation class mappings. */
  animations: Record<string, string>;

  /** Built-in notification type definitions. */
  types: Record<ToastType, ToastTypeDefinition>;

  /**
   * Creates and displays a notification.
   */
  createToast(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a notification using its configured type.
   */
  show(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a success notification.
   */
  success(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays an information notification.
   */
  info(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a warning notification.
   */
  warning(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays an error notification.
   */
  error(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a zen notification.
   */
  zen(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Displays a void notification.
   */
  void(message: string, options?: ToastOptions): HTMLElement;

  /**
   * Dismisses a notification using its exit animation.
   */
  removeToast(toast: HTMLElement): void;

  /**
   * Dismisses all notifications managed by this instance.
   */
  removeAll(): void;

  /**
   * Updates the notification container position.
   */
  updatePosition(position: ToastPosition): void;

  /**
   * Validates notification configuration.
   */
  validateConfiguration(options: ToastOptions): void;

  /**
   * Creates a validated SVG element.
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
