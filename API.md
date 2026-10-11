# ZephyrToast API Reference

Complete developer reference for **ZephyrToast**, a dependency-free JavaScript toast notification library.

This reference describes the implementation on the `refactor/v2-architecture` branch. Refer to the [README](https://github.com/sarwaralamini/zephyr-toast#readme) for a short introduction and installation instructions.

## Contents

1. [Installation and imports](#installation-and-imports)
2. [Creating an instance](#creating-an-instance)
3. [Displaying notifications](#displaying-notifications)
4. [Configuration reference](#configuration-reference)
5. [Notification types](#notification-types)
6. [Positions and stacking](#positions-and-stacking)
7. [Animations and dismissal](#animations-and-dismissal)
8. [Themes](#themes)
9. [Icons](#icons)
10. [Content security](#content-security)
11. [Callbacks](#callbacks)
12. [Managing notifications](#managing-notifications)
13. [Advanced class methods and properties](#advanced-class-methods-and-properties)
14. [TypeScript reference](#typescript-reference)
15. [Validation and errors](#validation-and-errors)
16. [Integration examples](#integration-examples)

## Installation and imports

### ES modules and bundlers

After the package is published to npm:

```bash
npm install zephyr-toast
```

```js
import ZephyrToast from "zephyr-toast";
import "zephyr-toast/animations.css";
import "zephyr-toast/style.css";

const toast = new ZephyrToast();
toast.success("Changes saved.");
```

The named class export is also available:

```js
import { ZephyrToast } from "zephyr-toast";
```

The npm package includes its own TypeScript declarations; no separate `@types` package is needed.

### Standalone browser script

Copy these files from a production build into the same public directory:

- `zephyr-toast.js`
- `zephyr-toast.css`
- `zephyr-toast-animate.css`

```html
<link rel="stylesheet" href="/assets/zephyr-toast-animate.css" />
<link rel="stylesheet" href="/assets/zephyr-toast.css" />
<script src="/assets/zephyr-toast.js"></script>
<script>
  const toast = new ZephyrToast();
  toast.info("Ready to go.");
</script>
```

The standalone build also attempts stylesheet injection by locating a script named `zephyr-toast.js` and loading both CSS files alongside it. Explicit `<link>` elements are recommended for predictable loading. ESM consumers should import both stylesheets themselves.

## Creating an instance

```ts
new ZephyrToast(options?: ToastOptions): ZephyrToast
```

```js
const toast = new ZephyrToast({
  position: "bottom-right",
  duration: 4500,
  newestOnTop: true,
  pauseOnHover: true,
});
```

Constructor settings become the instance defaults. Each notification may override them using its second argument. The constructor validates its settings and initializes the notification container in the document.

> **Shared container:** Instances locate or create the element with ID `zephyr-toast-container`. More than one instance in the same document can therefore affect the position of the same container.

## Displaying notifications

Every display method accepts a message string and optional `ToastOptions`, and returns the created `HTMLElement`.

| Method        | Signature                        | Notification type                  |
| ------------- | -------------------------------- | ---------------------------------- |
| `show`        | `show(message, options?)`        | Instance default or `options.type` |
| `createToast` | `createToast(message, options?)` | Instance default or `options.type` |
| `success`     | `success(message, options?)`     | `success`                          |
| `info`        | `info(message, options?)`        | `info`                             |
| `warning`     | `warning(message, options?)`     | `warning`                          |
| `error`       | `error(message, options?)`       | `error`                            |
| `zen`         | `zen(message, options?)`         | `zen`                              |
| `void`        | `void(message, options?)`        | `void`                             |

```js
const toast = new ZephyrToast();

toast.success("Saved successfully.");
toast.info("New activity detected.");
toast.warning("Your session expires soon.");
toast.error("Unable to connect.");
toast.zen("All systems running smoothly.");
toast.void("Update available.");

// Choose a type dynamically.
toast.show("Check these settings.", { type: "warning" });

// Keep a reference for later dismissal.
const notification = toast.info("Processing...", { duration: 0 });
toast.removeToast(notification);
```

The named methods override any `type` passed in their `options` argument. Use `show` or `createToast` to select the type dynamically.

## Configuration reference

### `ToastOptions`

| Property       | Type                   | Default                            | Description                                                                                  |
| -------------- | ---------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `position`     | `ToastPosition`        | `"top-right"`                      | Shared container position                                                                    |
| `newestOnTop`  | `boolean`              | `true`                             | Prepend newer notifications when enabled                                                     |
| `type`         | `ToastType`            | `"info"`                           | Default notification type                                                                    |
| `duration`     | `number`               | `3000`                             | Automatic dismissal delay in milliseconds; `0` disables it                                   |
| `pauseOnHover` | `boolean`              | `true`                             | Pause automatic dismissal and progress on hover                                              |
| `showProgress` | `boolean`              | `true`                             | Show progress indicator for a timed notification                                             |
| `animation`    | `ToastAnimation`       | `{ in: "fadeIn", out: "fadeOut" }` | Entrance and exit effects                                                                    |
| `theme`        | `ToastTheme`           | Type-specific colors               | Optional overrides for notification colors                                                   |
| `message`      | `string`               | `""`                               | Configuration field; display methods use their `message` argument                            |
| `title`        | `string`               | `""`                               | Optional heading above the message                                                           |
| `allowHtml`    | `boolean`              | `false`                            | Interpret message as HTML rather than literal text                                           |
| `enableIcon`   | `boolean`              | `true`                             | Render an icon                                                                               |
| `icon`         | `ToastIcon`            | `null`                             | Custom CSS class, image or validated SVG icon                                                |
| `isIcon`       | `boolean`              | `false`                            | Treat string icon values as CSS classes; incompatible with recognized image filename strings |
| `showClose`    | `boolean`              | `true`                             | Render a close button                                                                        |
| `onClose`      | `(() => void) \| null` | `null`                             | Callback after DOM removal                                                                   |
| `onClick`      | `(() => void) \| null` | `null`                             | Callback for supported notification-area clicks                                              |

Example with constructor defaults and a per-notification override:

```js
const toast = new ZephyrToast({
  position: "top-right",
  duration: 3000,
  animation: { in: "fadeIn", out: "fadeOut" },
});

toast.success("Profile updated.", {
  duration: 6000,
  title: "Success",
  animation: { in: "zoomIn", out: "zoomOut" },
});
```

Settings merge in this order: library defaults, notification-type theme defaults, instance options, then per-notification options. The nested `animation` and `theme` objects are merged by property, allowing partial overrides.

### Duration requirements

`duration` must be a finite, non-negative number. A value of `0` creates a persistent notification. It does **not** disable the manual close button unless `showClose` is also `false`.

### Optional fields

The validator treats `undefined` for supported optional fields as omitted. Boolean settings, when provided with a defined value, must be actual booleans rather than strings or numeric equivalents.

## Notification types

```ts
type ToastType = "success" | "info" | "warning" | "error" | "zen" | "void";
```

Each type has its own built-in SVG icon and default background, foreground and border colors.

| Type      | Background | Text      | Border    |
| --------- | ---------- | --------- | --------- |
| `success` | `#e3f7ed`  | `#3bad71` | `#b5eace` |
| `info`    | `#dff0fa`  | `#2385ba` | `#a9d7f1` |
| `warning` | `#fff5da`  | `#d9a209` | `#ffe59d` |
| `error`   | `#fde8e4`  | `#cc563d` | `#f9c1b6` |
| `zen`     | `#f4f7f9`  | `#2e3a59` | `#d8e1e8` |
| `void`    | `#111113`  | `#f1f1f1` | `#111113` |

## Positions and stacking

```ts
type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";
```

```js
const toast = new ZephyrToast({ position: "top-right" });

toast.updatePosition("bottom-center");
toast.info("Position updated.");
```

A notification can override the position:

```js
toast.success("At the top left", { position: "top-left" });
```

**Important:** Position is applied to the common container rather than separately to each notification. A per-notification position override updates the instance's position setting and moves the existing container, including its other visible notifications. An invalid position is rejected before changing the container.

`newestOnTop: true` inserts new notifications at the beginning of the container; `false` appends them.

## Animations and dismissal

### Supported animations

| Entrance       | Exit            |
| -------------- | --------------- |
| `fadeIn`       | `fadeOut`       |
| `slideInLeft`  | `slideOutLeft`  |
| `slideInRight` | `slideOutRight` |
| `slideInDown`  | `slideOutDown`  |
| `slideInUp`    | `slideOutUp`    |
| `bounceIn`     | `bounceOut`     |
| `zoomIn`       | `zoomOut`       |

```js
toast.info("Animation example", {
  animation: { in: "slideInRight", out: "slideOutRight" },
});
```

Load `zephyr-toast-animate.css` or import `zephyr-toast/animations.css` for the animation classes to take effect.

### Automatic dismissal

```js
toast.success("Closes after five seconds", { duration: 5000 });
```

For a persistent notification:

```js
const notice = toast.warning("Action required", { duration: 0 });
// Later:
toast.removeToast(notice);
```

### Hover behavior and progress

If `pauseOnHover` is enabled and the duration is positive, entering the notification pauses the dismissal timer and freezes the progress indicator. Leaving resumes using the remaining time. `showProgress` affects the visible indicator, not whether automatic dismissal occurs.

### Exit timing

`removeToast()` starts the exit animation; DOM removal is **asynchronous**, after the library's fixed **500 ms** exit period. `onClose` runs after removal. Repeated dismissal attempts do not schedule duplicate removals.

## Themes

`ToastTheme` supports these optional CSS color strings:

| Property             | Purpose                        |
| -------------------- | ------------------------------ |
| `bgColor`            | Toast background               |
| `textColor`          | Message and primary foreground |
| `borderColor`        | Toast border                   |
| `progressTrackColor` | Progress track                 |
| `progressBarColor`   | Progress fill                  |

```js
toast.info("Custom appearance", {
  theme: {
    bgColor: "#f0f4f8",
    textColor: "#2b3d49",
    borderColor: "#a5b0b6",
    progressTrackColor: "#dce3ea",
    progressBarColor: "#2385ba",
  },
});
```

For all notifications on an instance, pass `theme` to the constructor. Theme values supplied for an individual notification take precedence.

## Icons

`ToastIcon` supports a string, one of three structured icon objects, or `null` for the built-in type icon.

### Built-in icon

```js
toast.success("Built-in icon");
```

Disable icons entirely:

```js
toast.success("No icon", { enableIcon: false });
```

### CSS class icons

```js
toast.info("Custom class icon", {
  icon: "fa-solid fa-bell",
});
```

Alternatively:

```js
toast.info("Custom class icon", {
  icon: { fontAwesome: "fa-solid fa-bell" },
});
```

CSS-based icons require the corresponding external icon stylesheet to be loaded by the consuming page.

### Image icons

For recognized filenames with extensions `jpeg`, `jpg`, `gif`, `png`, `webp`, `avif` or `svg`:

```js
toast.info("Image icon", { icon: "/images/notification.png" });
```

For any supported HTTP(S) or relative image URL, including extensionless endpoints, use the structured form:

```js
toast.info("Image icon with dimensions", {
  icon: {
    url: "/api/icons/notification",
    width: "24px",
    height: "24px",
  },
});
```

The source URL must resolve to HTTP or HTTPS. `javascript:`, `data:` and other protocols are rejected. SVG URLs used as images are not treated as inline SVG markup.

### `isIcon`

`isIcon: true` signals CSS-class interpretation for string icons and rejects strings recognized as image filenames:

```js
toast.info("CSS class icon", {
  icon: "fa-solid fa-circle-info",
  isIcon: true,
});
```

### Custom inline SVG

```js
toast.success("Custom SVG icon", {
  icon: {
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>',
  },
});
```

Inline SVG is parsed and validated against restricted element and attribute allowlists. Unsupported or unsafe markup throws an error rather than being inserted. Use trusted SVG designs and test them against the validator.

## Content security

Text rendering is the default:

```js
toast.info("<strong>Not interpreted as HTML</strong>");
```

For trusted or sanitized HTML only:

```js
toast.success("<strong>Saved!</strong>", { allowHtml: true });
```

**Security:** The library does not sanitize arbitrary HTML messages for you. Never combine `allowHtml: true` with unsanitized user input, query parameters, or remote data. The SVG icon validator is separate from message HTML handling.

## Callbacks

### `onClose`

Invoked after the element is removed, including when closed automatically, manually or via `removeAll()`.

```js
toast.success("Saved", {
  onClose: () => {
    console.log("Toast removed");
  },
});
```

### `onClick`

Invoked when an eligible notification surface is clicked. It is not a general event callback for all descendant elements, including the close button.

```js
toast.info("Open activity", {
  onClick: () => {
    console.log("Toast clicked");
  },
});
```

Both callbacks receive no arguments and default to `null`.

## Managing notifications

### `removeToast(toast)`

```ts
removeToast(toast: HTMLElement): void
```

Begins the exit animation and schedules removal. Calling it again on a closing or detached notification has no additional effect.

### `removeAll()`

```ts
removeAll(): void
```

Dismisses notifications currently in the instance's shared container using the normal animated removal lifecycle. This is not an instantaneous synchronous DOM clear.

### `updatePosition(position)`

```ts
updatePosition(position: ToastPosition): void
```

Validates a supported position and updates the shared container class and instance position setting.

## Advanced class methods and properties

The following members are available on the class and declared in `index.d.ts`. Most applications only need the notification display, dismissal and position methods above.

| Member                  | Signature / type                         | Purpose                                                             |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `validateConfiguration` | `(options: ToastOptions) => void`        | Validate supplied configuration; throws on supported invalid values |
| `createSafeSvg`         | `(markup: string) => SVGSVGElement`      | Validate and construct a safe inline SVG element                    |
| `initializeContainer`   | `() => void`                             | Locate/create and configure the notification container              |
| `injectCSS`             | `() => void`                             | Attempt standalone browser stylesheet injection                     |
| `defaults`              | `ToastOptions`                           | Instance-local copy of library defaults                             |
| `options`               | `ToastOptions`                           | Active constructor-level options                                    |
| `container`             | `HTMLElement`                            | Shared DOM notification container                                   |
| `animations`            | `Record<string, string>`                 | Animation-name-to-class mapping                                     |
| `types`                 | `Record<ToastType, ToastTypeDefinition>` | Instance-local built-in type definitions                            |

### Customizing instance type definitions

```js
const toast = new ZephyrToast();

toast.types.success.bgColor = "#e8fff0";
toast.types.success.textColor = "#087343";
toast.types.success.borderColor = "#b4e8c5";

toast.success("Custom success colors");
```

Type definition changes apply to later notifications created with that instance and do not mutate other instances' default type definitions. Be aware that explicit instance-level or per-notification `theme` options take priority over the type colors.

Do not rely on properties prefixed with `_` on returned DOM elements; those fields are internal lifecycle implementation details and may change.

## TypeScript reference

### Exported types

```ts
ToastType;
ToastPosition;
ToastEntranceAnimation;
ToastExitAnimation;
ToastAnimation;
ToastTheme;
ToastImageIcon;
ToastClassIcon;
ToastSvgIcon;
ToastIcon;
ToastOptions;
ToastTypeDefinition;
ZephyrToast;
```

### Typed application example

```ts
import ZephyrToast, {
  type ToastOptions,
  type ToastPosition,
  type ToastType,
} from "zephyr-toast";

import "zephyr-toast/animations.css";
import "zephyr-toast/style.css";

const position: ToastPosition = "bottom-right";
const type: ToastType = "success";

const options: ToastOptions = {
  position,
  type,
  duration: 4000,
  showProgress: true,
  animation: {
    in: "zoomIn",
    out: "zoomOut",
  },
};

const toast = new ZephyrToast(options);
const element: HTMLElement = toast.show("Ready for production.");

// Later:
toast.removeToast(element);
```

## Validation and errors

ZephyrToast validates supported notification settings at construction and on individual notification calls.

| Invalid input                                    | Typical error type |
| ------------------------------------------------ | ------------------ |
| Unknown notification type                        | `RangeError`       |
| Unknown position                                 | `RangeError`       |
| Unknown entrance/exit animation                  | `RangeError`       |
| Negative duration                                | `RangeError`       |
| Non-finite or nonnumeric duration                | `TypeError`        |
| Wrong type for known boolean setting             | `TypeError`        |
| Invalid `animation` or `theme` container         | `TypeError`        |
| Invalid recognized theme color value type        | `TypeError`        |
| Invalid icon object or unsupported icon property | `TypeError`        |
| Unsafe SVG markup or unsupported image protocol  | `TypeError`        |

For example:

```js
try {
  toast.info("Example", { duration: -100 });
} catch (error) {
  console.error("Invalid notification configuration:", error);
}
```

Validation checks the library's known settings; it should not be treated as a general-purpose validator or HTML sanitizer.

## Integration examples

### Form submission feedback

```js
const toast = new ZephyrToast({ position: "top-right" });

async function saveProfile(profile) {
  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!response.ok) throw new Error("Save failed");

    toast.success("Profile saved.", { title: "Success" });
  } catch {
    toast.error("Could not save your profile. Please try again.");
  }
}
```

### Persistent notification during an operation

```js
const toast = new ZephyrToast();

async function performOperation(operation) {
  const notice = toast.info("Working...", {
    duration: 0,
    showProgress: false,
  });

  try {
    await operation();
    toast.success("Completed successfully.");
  } catch {
    toast.error("Operation failed.");
  } finally {
    toast.removeToast(notice);
  }
}
```

### Dismiss everything

```js
const toast = new ZephyrToast();

toast.info("First");
toast.warning("Second");

// Both begin their configured exit animations.
toast.removeAll();
```

---

**Project:** [ZephyrToast on GitHub](https://github.com/sarwaralamini/zephyr-toast)  
**Documentation:** [README](README.md)  
**License:** [MIT](LICENSE)  
**Author:** Md. Sarwar Alam
