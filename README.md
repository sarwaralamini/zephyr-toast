# ZephyrToast

A lightweight, customizable, dependency-free toast notification library built with vanilla JavaScript.

ZephyrToast makes it easy to display elegant, responsive notifications with customizable themes, animations, icons, and interaction behavior—without relying on a JavaScript framework.

[**Live Demo & Interactive Playground**](https://sarwaralamini.github.io/zephyr-toast/) · [**Report an Issue**](https://github.com/sarwaralamini/zephyr-toast/issues)

## Features

- **Six notification types:** Success, Info, Warning, Error, Zen, and Void.
- **Six positions:** Place notifications in any corner or at the top or bottom center.
- **Custom animations:** Choose from supported entrance and exit effects.
- **Automatic or manual dismissal:** Configure notification duration or keep notifications visible.
- **Pause on hover:** Automatically pause and resume notification dismissal.
- **Progress indicators:** Display a visual countdown for timed notifications.
- **Custom appearance:** Configure colors, titles, icons, and close buttons.
- **Flexible icons:** Use CSS classes, image URLs, or validated SVG markup.
- **Safe defaults:** Render notification messages as text unless trusted HTML is explicitly enabled.
- **TypeScript support:** Includes declaration files and editor autocomplete.
- **Flexible integration:** Supports ES modules and standalone browser scripts.
- **Zero runtime dependencies:** Built with vanilla JavaScript.

## Installation

### npm

Install ZephyrToast:

```bash
npm install zephyr-toast
```

Import the library and stylesheets:

```javascript
import ZephyrToast from "zephyr-toast";

import "zephyr-toast/animations.css";
import "zephyr-toast/style.css";

const toast = new ZephyrToast();

toast.success("Operation completed successfully!");
```

You can also use the named export:

```javascript
import { ZephyrToast } from "zephyr-toast";
```

> **Release status:** The npm installation command will work once the package is published. Until then, you can build and install a local npm package for testing.

### Standalone Browser

For websites without a JavaScript bundler, use the standalone browser distribution.

Build the library:

```bash
npm install
npm run build
```

Copy these files from `dist/` into your website:

```text
zephyr-toast.js
zephyr-toast.css
zephyr-toast-animate.css
```

Include them in your HTML:

```html
<link rel="stylesheet" href="zephyr-toast-animate.css" />
<link rel="stylesheet" href="zephyr-toast.css" />

<script src="zephyr-toast.js"></script>

<script>
  const toast = new ZephyrToast();

  toast.success("ZephyrToast is ready!");
</script>
```

The standalone script also supports automatic stylesheet discovery when its accompanying CSS files are hosted in the expected location.

Explicit stylesheet imports are recommended for predictable loading.

## Quick Start

Create a notification manager:

```javascript
const toast = new ZephyrToast({
  position: "top-right",
  duration: 3000,
});
```

Display notifications:

```javascript
toast.success("Changes saved successfully.");
toast.info("You have a new message.");
toast.warning("Your session is about to expire.");
toast.error("Unable to complete the request.");
toast.zen("Everything is running smoothly.");
toast.void("A new update is available.");
```

Each method returns the notification's HTML element.

## Configuration

Configure default behavior when creating an instance:

```javascript
const toast = new ZephyrToast({
  position: "top-right",
  duration: 4000,
  newestOnTop: true,
  pauseOnHover: true,
  showProgress: true,
  showClose: true,
});
```

Override settings for an individual notification:

```javascript
toast.success("Profile updated!", {
  title: "Success",
  duration: 5000,
  animation: {
    in: "zoomIn",
    out: "zoomOut",
  },
  onClose: () => {
    console.log("Notification closed.");
  },
});
```

Per-notification options take precedence over instance settings.

### Configuration Options

| Option          | Default       | Description                        |
| --------------- | ------------- | ---------------------------------- |
| `position`      | `"top-right"` | Notification container position    |
| `newestOnTop`   | `true`        | Display newer notifications first  |
| `type`          | `"info"`      | Default notification type          |
| `duration`      | `3000`        | Dismissal delay in milliseconds    |
| `pauseOnHover`  | `true`        | Pause dismissal while hovering     |
| `showProgress`  | `true`        | Display a progress indicator       |
| `animation.in`  | `"fadeIn"`    | Entrance animation                 |
| `animation.out` | `"fadeOut"`   | Exit animation                     |
| `message`       | `""`          | Message configuration value        |
| `title`         | `""`          | Optional notification title        |
| `allowHtml`     | `false`       | Enable trusted HTML content        |
| `enableIcon`    | `true`        | Display a notification icon        |
| `icon`          | `null`        | Custom icon configuration          |
| `isIcon`        | `false`       | Control string icon interpretation |
| `showClose`     | `true`        | Display the close button           |
| `onClose`       | `null`        | Callback after dismissal           |
| `onClick`       | `null`        | Callback for supported clicks      |
| `theme`         | Type defaults | Custom notification colors         |

Set `duration: 0` to disable automatic dismissal.

See [API Reference](API.md) for the complete API.

## Notification Types

ZephyrToast provides six built-in notification types.

| Type    | Method            | Default Appearance |
| ------- | ----------------- | ------------------ |
| Success | `toast.success()` | Green              |
| Info    | `toast.info()`    | Blue               |
| Warning | `toast.warning()` | Yellow             |
| Error   | `toast.error()`   | Red                |
| Zen     | `toast.zen()`     | Light              |
| Void    | `toast.void()`    | Dark               |

You can select the notification type dynamically:

```javascript
toast.show("Please check your settings.", {
  type: "warning",
});
```

## Notification Positions

Supported positions:

- `top-right`
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

Configure the initial position:

```javascript
const toast = new ZephyrToast({
  position: "bottom-right",
});
```

Update it programmatically:

```javascript
toast.updatePosition("top-center");
```

Position overrides in individual notifications update the shared notification container position.

On narrow screens, the library may center notification containers according to its responsive stylesheet.

## Animations

### Entrance Animations

`fadeIn`, `slideInLeft`, `slideInRight`, `slideInDown`, `slideInUp`, `bounceIn`, `zoomIn`

### Exit Animations

`fadeOut`, `slideOutLeft`, `slideOutRight`, `slideOutUp`, `slideOutDown`, `bounceOut`, `zoomOut`

Example:

```javascript
toast.info("Animation example", {
  animation: {
    in: "slideInRight",
    out: "slideOutRight",
  },
});
```

Make sure the ZephyrToast animation stylesheet is included.

## Custom Themes

Override notification colors:

```javascript
toast.info("Custom themed notification", {
  theme: {
    bgColor: "#f0f4f8",
    textColor: "#2b3d49",
    borderColor: "#a5b0b6",
    progressTrackColor: "#dce3ea",
    progressBarColor: "#2385ba",
  },
});
```

Theme options can also be provided when creating the notification manager.

## Duration and Dismissal

### Automatic Dismissal

```javascript
toast.success("Automatically dismisses", {
  duration: 5000,
});
```

The notification is dismissed automatically after the configured duration.

### Persistent Notifications

```javascript
const notification = toast.info("Remains visible", {
  duration: 0,
});
```

Dismiss it manually:

```javascript
toast.removeToast(notification);
```

### Pause on Hover

```javascript
toast.info("Pause enabled", {
  pauseOnHover: true,
});
```

When enabled, hovering pauses the dismissal timer and progress animation.

## Titles and Close Buttons

```javascript
toast.warning("Please review your information.", {
  title: "Attention",
  showClose: true,
});
```

Hide the close button:

```javascript
toast.info("No close button", {
  showClose: false,
});
```

## Custom Icons

ZephyrToast supports built-in SVG icons, CSS class icons, image URLs, and restricted custom SVG markup.

### CSS Class Icons

```javascript
toast.success("Saved successfully!", {
  icon: "fas fa-check-circle",
});
```

Structured configuration:

```javascript
toast.success("Saved successfully!", {
  icon: {
    fontAwesome: "fas fa-check-circle",
  },
});
```

External icon libraries, such as Font Awesome, must be loaded separately.

### Image Icons

```javascript
toast.info("Image icon example", {
  icon: "/images/info.webp",
});
```

String-based image recognition supports JPEG, JPG, PNG, GIF, WebP, AVIF, and SVG filename extensions.

For custom dimensions or image URLs without recognized extensions, use an object:

```javascript
toast.warning("Custom image icon", {
  icon: {
    url: "/api/icons/warning",
    width: "24px",
    height: "24px",
  },
});
```

Image URLs must resolve to HTTP or HTTPS resources. Relative URLs are supported.

SVG image URLs are rendered as image elements, not interpreted as inline SVG markup.

### Custom SVG Markup

```javascript
toast.success("Custom SVG icon", {
  icon: {
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>',
  },
});
```

ZephyrToast validates custom SVG markup using restricted element and attribute allowlists.

Modified instance-level built-in SVG icons are subject to the same validation.

Unsafe or unsupported SVG content is rejected.

### Disable Icons

```javascript
toast.info("Notification without an icon", {
  enableIcon: false,
});
```

## HTML Content and Security

By default, ZephyrToast renders notification messages as text.

```javascript
toast.info("<strong>Important</strong>");
```

The HTML markup above is displayed as literal text.

To render trusted HTML:

```javascript
toast.success("<strong>Operation completed!</strong>", {
  allowHtml: true,
});
```

**Security warning:** `allowHtml: true` interprets the message using HTML rendering. Do not pass unsanitized user input or untrusted external data to this option.

If you need rich content from external sources, sanitize it with a trusted HTML sanitizer before passing it to ZephyrToast.

## Event Callbacks

### onClose

Runs when a notification has been removed:

```javascript
toast.success("Saved!", {
  onClose: () => {
    console.log("Notification removed.");
  },
});
```

### onClick

Runs when a supported notification area is clicked:

```javascript
toast.info("Click this notification", {
  onClick: () => {
    console.log("Notification clicked.");
  },
});
```

The click handler does not automatically fire for every descendant element, such as the close button.

## Managing Notifications

Display and retain a notification element:

```javascript
const notification = toast.success("Processing complete", {
  duration: 0,
});
```

Dismiss it:

```javascript
toast.removeToast(notification);
```

Dismiss all notifications in the shared container:

```javascript
toast.removeAll();
```

Notifications are removed using their configured exit animations.

## TypeScript Support

ZephyrToast includes TypeScript declarations. No separate `@types` package is required.

```typescript
import ZephyrToast, {
  type ToastOptions,
  type ToastPosition,
  type ToastType,
} from "zephyr-toast";

import "zephyr-toast/animations.css";
import "zephyr-toast/style.css";

const position: ToastPosition = "top-right";
const type: ToastType = "success";

const options: ToastOptions = {
  position,
  type,
  duration: 3000,
  pauseOnHover: true,
};

const toast = new ZephyrToast(options);

toast.success("TypeScript integration works!");
```

The library supports both default and named class exports.

## API Reference

The main methods are:

| Method                           | Description                                 |
| -------------------------------- | ------------------------------------------- |
| `new ZephyrToast(options?)`      | Create a notification manager               |
| `createToast(message, options?)` | Create and display a notification           |
| `show(message, options?)`        | Display a notification with a selected type |
| `success(message, options?)`     | Display a success notification              |
| `info(message, options?)`        | Display an informational notification       |
| `warning(message, options?)`     | Display a warning notification              |
| `error(message, options?)`       | Display an error notification               |
| `zen(message, options?)`         | Display a zen notification                  |
| `void(message, options?)`        | Display a void notification                 |
| `removeToast(element)`           | Dismiss a notification                      |
| `removeAll()`                    | Dismiss notifications in the container      |
| `updatePosition(position)`       | Update container position                   |

For options, type definitions, callback behavior, and other available methods, see the [API Reference](API.md).

## Development

Clone the repository:

```bash
git clone https://github.com/sarwaralamini/zephyr-toast.git
cd zephyr-toast
npm install
```

Build the production distribution:

```bash
npm run build
```

Run automated tests:

```bash
npm test
```

Verify distribution files and package exports:

```bash
npm run verify:build
```

Run the complete package checks:

```bash
npm run check
```

Check source formatting:

```bash
npm run format:check
```

Run ESLint:

```bash
npm run lint
```

Validate the TypeScript declarations:

```bash
npm run test:types
```

The `test:types` command requires TypeScript to be installed as a development dependency and the corresponding script to be configured in `package.json`.

### Build the Demo Website

```bash
npm run build:demo
```

The generated GitHub Pages website is written to the `docs/` directory.

Serve it locally:

```bash
python3 -m http.server 4173 --directory docs
```

Visit `http://localhost:4173/`.

### Inspect the npm Package

```bash
npm pack --dry-run
```

This shows which files would be included in the npm package without publishing it.

## Contributing

## Bug Reports & Feedback

ZephyrToast is currently maintained by its author, and external pull requests are not being accepted at this time.

If you encounter a bug, unexpected behavior, or compatibility issue, please open a GitHub Issue with a clear description and steps to reproduce the problem.

Feature suggestions and feedback are also welcome. All development, code changes, and releases are currently managed by the maintainer.

- [Report a Bug](https://github.com/sarwaralamini/zephyr-toast/issues/new)
- [View Existing Issues](https://github.com/sarwaralamini/zephyr-toast/issues)

## Author

**Md. Sarwar Alam**

GitHub: https://github.com/sarwaralamini

## License

ZephyrToast is released under the [MIT License](LICENSE).
