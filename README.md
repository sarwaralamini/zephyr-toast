# ZephyrToast

ZephyrToast is a lightweight, pure vanilla JavaScript toast notification library, inspired by Bootstrap 5 styling and free from dependencies. It offers elegant, customizable notifications that gently appear and disappear, delivering a seamless user experience.

## Features

- 🌈 Multiple notification types: Success, Info, Warning, Error
- 📍 Flexible positioning: Top-right, Top-left, Bottom-right, Bottom-left, Top-center, Bottom-center
- ✨ Beautiful animations powered by Animate.css
- ⏱️ Progress bar with customizable duration
- 🎨 Bootstrap 5 inspired styling with no dependencies
- 🔧 Highly customizable: titles, animations, close buttons, and more

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
const Toast = new ZephyrToast();
```

3. Create toast notifications:

```javascript
// Show a success toast
Toast.success("Operation completed successfully!");

// Show an error toast
Toast.error("Something went wrong. Please try again.");

// Show a warning toast
Toast.warning("Your session will expire in 5 minutes.");

// Show an info toast
Toast.info("3 new messages in your inbox.");
```

## Demo

Open `zephyr-toast-demo.html` in your browser to see ZephyrToast in action and explore all available options.

## Dependencies

- [Animate.css](https://animate.style/) - For animations (Provides elegant animations for your toast notifications (No additional setup required - already integrated within zephyr-toast.js))

## Configuration

ZephyrToast is highly customizable. Here's an example with all options:

```javascript
// Initialize ZephyrToast
const Toast = new ZephyrToast();

Toast.success("Profile updated successfully!", {
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

## Author

Md. Sarwar Alam - [GitHub](https://github.com/sarwaralamini)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
