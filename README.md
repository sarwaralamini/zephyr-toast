# ZephyrToast

A lightweight, customizable, dependency-free toast notification library built with vanilla JavaScript.

ZephyrToast provides six notification styles, flexible positioning, customizable animations, progress indicators, custom icons, and configurable themes.

**[Live Demo & Notification Generator](https://sarwaralamini.github.io/zephyr-toast)**

## Features

- Six notification types: Success, Info, Warning, Error, Zen, and Void
- Six notification positions
- Entrance and exit animations
- Automatic dismissal and persistent notifications
- Pause and resume dismissal on hover
- Optional progress indicators and close buttons
- Custom colors, themes, titles, and icons
- Safe text rendering by default
- Restricted SVG rendering for custom icons
- ES module and standalone browser distributions
- TypeScript declarations with IDE autocomplete
- No runtime dependencies

## Installation

### npm

For Vite, React, Vue, and other applications supporting JavaScript modules:

```bash
npm install zephyr-toast
```

Import the library and its stylesheets:

```javascript
import ZephyrToast from "zephyr-toast";
import "zephyr-toast/animations.css";
import "zephyr-toast/style.css";

const toast = new ZephyrToast();

toast.success("Operation completed successfully!");
```

**Note:** npm installation applies once this package version is published. For testing unreleased changes, install a locally generated npm package.

### Standalone browser

Download or host the generated distribution files together:

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

The standalone script can also discover its accompanying stylesheets when the files are hosted together. Explicit stylesheet links are recommended for predictable loading.

## Quick Start

```javascript
const toast = new ZephyrToast({
  position: "top-right",
  duration: 3000,
});

toast.success("Saved successfully!");
toast.info("You have a new message.");
toast.warning("Your session is about to expire.");
toast.error("Unable to complete the request.");
toast.zen("Everything is running smoothly.");
toast.void("A new update is available.");
```

## Configuration

Configure defaults when creating a ZephyrToast instance:

```javascript
const toast = new ZephyrToast({
  position: "top-right",
  duration: 4000,
  pauseOnHover: true,
  showProgress: true,
  showClose: true,
});
```

Override settings for an individual notification:

```javascript
toast.success("Profile updated!", {
  title: "Success",
  position: "top-center",
  duration: 5000,
  animation: {
    in: "zoomIn",
    out: "zoomOut",
  },
  onClose: () => {
    console.log("Notification closed");
  },
});
```

Individual notification options override the corresponding instance defaults.

### Available options

| Option          | Default       | Description                                    |
| --------------- | ------------- | ---------------------------------------------- |
| `position`      | `"top-right"` | Notification container position                |
| `newestOnTop`   | `true`        | Insert newer notifications above existing ones |
| `type`          | `"info"`      | Default notification type                      |
| `duration`      | `3000`        | Automatic dismissal delay in milliseconds      |
| `pauseOnHover`  | `true`        | Pause dismissal while hovering                 |
| `showProgress`  | `true`        | Display the progress indicator                 |
| `animation.in`  | `"fadeIn"`    | Entrance animation                             |
| `animation.out` | `"fadeOut"`   | Exit animation                                 |
| `message`       | `""`          | Default message value                          |
| `title`         | `""`          | Optional title                                 |
| `allowHtml`     | `false`       | Interpret messages as trusted HTML             |
| `enableIcon`    | `true`        | Display notification icons                     |
| `icon`          | `null`        | Custom icon configuration                      |
| `isIcon`        | `false`       | Treat a string icon as CSS classes             |
| `showClose`     | `true`        | Display the close button                       |
| `onClose`       | `null`        | Callback after notification removal            |
| `onClick`       | `null`        | Callback for supported notification clicks     |
| `theme`         | Type defaults | Override notification colors                   |

Set `duration: 0` to prevent automatic dismissal.

## Notification Types

| Type    | Method            | Appearance |
| ------- | ----------------- | ---------- |
| Success | `toast.success()` | Green      |
| Info    | `toast.info()`    | Blue       |
| Warning | `toast.warning()` | Yellow     |
| Error   | `toast.error()`   | Red        |
| Zen     | `toast.zen()`     | Light      |
| Void    | `toast.void()`    | Dark       |

For a dynamically selected notification type:

```javascript
toast.show("A notification", {
  type: "warning",
});
```

## Positioning

Supported positions:

- `top-right`
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

Update the container position:

```javascript
toast.updatePosition("bottom-left");
```

You can also supply `position` in a notification's options.

## Animations

Supported entrance animations:

- `fadeIn`
- `slideInLeft`
- `slideInRight`
- `slideInDown`
- `slideInUp`
- `bounceIn`
- `zoomIn`

Supported exit animations:

- `fadeOut`
- `slideOutLeft`
- `slideOutRight`
- `slideOutUp`
- `slideOutDown`
- `bounceOut`
- `zoomOut`

Example:

```javascript
toast.info("Animation example", {
  animation: {
    in: "slideInRight",
    out: "slideOutRight",
  },
});
```

## Custom Themes

Change notification colors for an individual toast:

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

You can also pass a `theme` object when creating the instance.

## Duration and Hover Behavior

Set a notification duration in milliseconds:

```javascript
toast.success("Automatically dismisses", {
  duration: 5000,
});
```

Create a persistent notification:

```javascript
toast.info("Remains until dismissed", {
  duration: 0,
});
```

Disable hover-based pausing:

```javascript
toast.info("Dismissal continues during hover", {
  pauseOnHover: false,
});
```

## Titles and Close Buttons

```javascript
toast.warning("Please review your information.", {
  title: "Attention",
  showClose: true,
});
```

Disable the close button:

```javascript
toast.info("No close button", {
  showClose: false,
});
```

## Custom Icons

ZephyrToast supports CSS class icons, HTTP/HTTPS image URLs, and restricted custom SVG markup.

### CSS Class Icons

```javascript
toast.success("Saved successfully!", {
  icon: "fas fa-check-circle",
});
```

You can also use an object:

```javascript
toast.success("Saved successfully!", {
  icon: {
    fontAwesome: "fas fa-check-circle",
  },
});
```

External icon libraries such as Font Awesome must be loaded separately.

### Image Icons

```javascript
toast.info("Image icon example", {
  icon: "/images/info.png",
});
```

For custom dimensions:

```javascript
toast.warning("Custom image dimensions", {
  icon: {
    url: "/images/warning.png",
    width: "24px",
    height: "24px",
  },
});
```

Image URLs must resolve to HTTP or HTTPS. Relative URLs are supported.

### SVG Icons

Provide custom SVG markup using the `svg` property:

```javascript
toast.success("Custom SVG icon", {
  icon: {
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>',
  },
});
```

Custom SVG is processed through a restricted renderer. Unsupported elements, attributes, and potentially unsafe values are rejected.

### Disable Icons

```javascript
toast.info("Notification without an icon", {
  enableIcon: false,
});
```

## HTML Content and Security

Notification messages are rendered as text by default.

```javascript
toast.info("<strong>Important</strong>");
```

The markup above is displayed as literal text.

For trusted HTML:

```javascript
toast.success("<strong>Operation completed!</strong>", {
  allowHtml: true,
});
```

**Security warning:** `allowHtml: true` uses HTML interpretation. Never pass unsanitized user input or untrusted external content to this option.

If you need to display user-generated content, keep `allowHtml` disabled or sanitize the content using a trusted HTML sanitizer first.

## Event Callbacks

Execute a function when a notification is closed:

```javascript
toast.success("Saved!", {
  onClose: () => {
    console.log("The notification was removed.");
  },
});
```

Handle supported notification clicks:

```javascript
toast.info("Click this notification", {
  onClick: () => {
    console.log("Notification clicked.");
  },
});
```

## Managing Notifications

Create a notification directly:

```javascript
const notification = toast.success("Processing complete", {
  duration: 0,
});
```

Dismiss it manually:

```javascript
toast.removeToast(notification);
```

Dismiss all notifications in the shared container:

```javascript
toast.removeAll();
```

Removal uses the configured exit animation.

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

Both default and named class exports are supported:

```typescript
import ZephyrToast, { ZephyrToast as NamedZephyrToast } from "zephyr-toast";
```

## Public API

| Method                       | Description                            |
| ---------------------------- | -------------------------------------- |
| `new ZephyrToast(options?)`  | Create a notification manager          |
| `show(message, options?)`    | Display a notification                 |
| `success(message, options?)` | Display a success notification         |
| `info(message, options?)`    | Display an info notification           |
| `warning(message, options?)` | Display a warning notification         |
| `error(message, options?)`   | Display an error notification          |
| `zen(message, options?)`     | Display a zen notification             |
| `void(message, options?)`    | Display a void notification            |
| `removeToast(element)`       | Dismiss one notification               |
| `removeAll()`                | Dismiss notifications in the container |
| `updatePosition(position)`   | Change the notification position       |

## Development

Clone the repository:

```bash
git clone https://github.com/sarwaralamini/zephyr-toast.git
cd zephyr-toast
npm install
```

Run the automated tests:

```bash
npm test
```

Build the distribution:

```bash
npm run build
```

Verify distribution files and package exports:

```bash
npm run verify:build
```

Run the complete package validation:

```bash
npm run check
```

Inspect the npm package without publishing:

```bash
npm pack --dry-run
```

## Contributing

Bug reports, feature requests, and pull requests are welcome.

Before submitting code changes, run the automated tests and distribution checks.

## Author

**Md. Sarwar Alam**

[GitHub](https://github.com/sarwaralamini)

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
