# [Try ZephyrToast Toast Notification Generator](https://sarwaralamini.github.io/zephyr-toast)

# ZephyrToast

ZephyrToast is a lightweight, pure vanilla JavaScript toast notification library, inspired by Bootstrap 5 styling and free from dependencies. It offers elegant, customizable notifications that gently appear and disappear, delivering a seamless user experience.

## Features

- 🌈 Multiple notification types: Success, Info, Warning, Error, Zen (light), Void (dark)
- 📍 Flexible positioning: Top-right, Top-left, Bottom-right, Bottom-left, Top-center, Bottom-center
- ✨ Beautiful animations powered by zephyr-toast-animate.css
- ⏱️ Progress bar with customizable duration
- 🎨 Bootstrap 5 inspired styling with no dependencies
- 🔧 Highly customizable: titles, animations, close buttons, themes, and more

## Installation

### Option 1: Clone the repository

```bash
git clone https://github.com/sarwaralamini/zephyr-toast.git
cd zephyr-toast
```

## Quick Start

1. Include the required files in your HTML:

```html
<script src="zephyr-toast.js"></script>
```

2. Initialize ZephyrToast:

```javascript
// Initialize ZephyrToast
const toast = new ZephyrToast();
```

3. Create toast notifications:

```javascript
// Show a success toast
toast.success("Operation completed successfully!");

// Show an error toast
toast.error("Something went wrong. Please try again.");

// Show a warning toast
toast.warning("Your session will expire in 5 minutes.");

// Show an info toast
toast.info("3 new messages in your inbox.");

// Show a zen toast (light)
toast.zen("Everything is running smoothly.");

// Show a void toast (dark)
toast.void("Just a quick update.");
```

## Demo

Easily create your own toast notifications using the [Toast Notification Generator](https://sarwaralamini.github.io/zephyr-toast). Simply open `index.html` and start customizing your toasts with different styles, icons, and messages.

## Dependencies

- [zephyr-toast-animate.css](https://github.com/sarwaralamini/zephyr-toast) - Custom animation system with prefixed classes (zephyr\_) providing elegant animations for your toast notifications (No additional setup required - already integrated within zephyr-toast.js)

## Configuration

ZephyrToast is highly customizable. Here's an example with all options:

```javascript
// Initialize ZephyrToast
const toast = new ZephyrToast();

toast.success("Profile updated successfully!", {
  position: "top-center",
  duration: 5000,
  title: "Success",
  showClose: true,
  showProgress: true,
  newestOnTop: true,
  animation: {
    in: "fadeIn",
    out: "fadeOut",
  },
  onClose: () => console.log("Toast closed"),
  onClick: () => console.log("Toast clicked"),
});
```

# Custom Themes

ZephyrToast supports custom theming for your notifications. You can override default colors with your own theme:

```javascript
toast.info("Custom themed notification", {
  theme: {
    bgColor: "#f0f4f8", // Background color
    textColor: "#2b3d49", // Text color
    borderColor: "#a5b0b6", // Border color
    progressTrackColor: "#00000026", // Progress track color
    progressBarColor: "#00000013", // Progress bar color
  },
});
```

# Pause On Hover

You can pause the toast auto-dismiss countdown when the user hovers over it:

```javascript
toast.info("This toast will pause when hovered", {
  pauseOnHover: true, // Default is true
});
```

# Pause On Hover

```javascript
toast.success("Operation <strong>completed</strong> successfully!", {
  allowHtml: true, // Default is false
});
```

# Enabling/Disabling Icons

You can globally enable or disable icons for any notification:

```javascript
toast.success("Profile updated successfully!", {
  enableIcon: false,
});
```

# ZephyrToast Custom Icons

ZephyrToast now supports custom icons in your toast notifications. This feature allows you to replace the default icons with your own images, SVGs, or icons from any icon library (e.g., FontAwesome, Material Icons, Bootstrap Icons) to better match your application's design.

## Icon Usage Examples

### Icon Basic Usage

You can customize icons when creating any toast notification:

```javascript
// Initialize ZephyrToast
const toast = new ZephyrToast();

// Create a toast with custom icon
toast.success("Success message", {
  icon: "https://example.com/custom-icon.png",
});
```

## Supported Icon Types

### SVG Icons

You can use inline SVG content:

```javascript
toast.info("Info message", {
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"/></svg>',
});
```

### Image URLs (PNG, JPG, JPEG, GIF)

You can use direct image URLs:

```javascript
toast.warning("Warning message", {
  icon: "https://example.com/warning-icon.png",
});

toast.error("Error message", {
  icon: "https://mysite.com/images/error-icon.jpg",
});
```

### Icon Libraries

You can use icons from any supported icon library (e.g., FontAwesome, Material Icons, Bootstrap Icons, etc.). Just make sure the relevant library is loaded in your project before using any icons.

```javascript
toast.success("Success message", {
  icon: "fas fa-check-circle", // Example from FontAwesome
});

toast.info("Info message", {
  icon: "material-icons info",
}); // Example from Material Icons
```

## Advanced Customization for Icon

For more control, you can pass an object with specific properties:

### Custom Image with Size Control

```javascript
toast.success("Profile updated", {
  icon: {
    url: "https://example.com/profile-icon.png",
    width: "24px",
    height: "24px",
  },
});
```

### FontAwesome with Specific Class

```javascript
toast.warning("Warning", {
  icon: {
    fontAwesome: "fas fa-exclamation-triangle fa-lg",
  },
});
```

### Custom SVG with Advanced Options

```javascript
toast.info("New message", {
  icon: {
    svg: "<svg>...</svg>",
  },
});
```

## Icon Default Behavior

If no custom icon is provided, ZephyrToast will use its default icons based on the notification type:

- Success: Checkmark circle
- Info: Information circle
- Warning: Warning triangle
- Error: X circle
- Zen: Sun
- Void: Moon

## Icon Compatibility Notes

- Image files (PNG, JPG, JPEG, GIF) will be displayed at 16×16px by default unless dimensions are specified
- Icons from any icon library (e.g., FontAwesome, Material Icons, Bootstrap Icons) require the respective library to be loaded in your project.
- SVG icons will inherit the color defined by the toast type (using currentColor)

## Author

Md. Sarwar Alam - [GitHub](https://github.com/sarwaralamini)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

```

```
