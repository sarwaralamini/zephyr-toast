/**
 * @fileoverview Configuration type and structure regression tests.
 *
 * Verifies strict boolean settings, custom theme properties,
 * and supported icon configuration structures.
 *
 * Ensures invalid configuration is rejected without changing
 * supported notification options or mutating user input.
 *
 * @module tests/zephyr-toast.config-guards
 * @author Md. Sarwar Alam
 * @license MIT
 */

import { describe, expect, it } from "vitest";

import { validateConfiguration } from "../src/config/validation.js";

// ------------------------------------------------------------
// 1. Boolean Configuration Validation
// ------------------------------------------------------------

describe("Boolean Configuration Validation", () => {
  const booleanOptions = [
    "newestOnTop",
    "pauseOnHover",
    "showProgress",
    "allowHtml",
    "enableIcon",
    "isIcon",
    "showClose",
  ];

  it.each(booleanOptions)("accepts boolean values for %s", (property) => {
    expect(() => {
      validateConfiguration({ [property]: true });
    }).not.toThrow();

    expect(() => {
      validateConfiguration({ [property]: false });
    }).not.toThrow();
  });

  it.each(booleanOptions)("rejects invalid values for %s", (property) => {
    for (const invalidValue of ["false", "true", 0, 1, null, []]) {
      expect(() => {
        validateConfiguration({ [property]: invalidValue });
      }).toThrow(TypeError);
    }
  });

  it("accepts omitted boolean settings", () => {
    expect(() => {
      validateConfiguration({});
    }).not.toThrow();
  });

  it("rejects objects as boolean values", () => {
    for (const property of booleanOptions) {
      expect(() => {
        validateConfiguration({
          [property]: {},
        });
      }).toThrow(TypeError);
    }
  });

  it("allows undefined boolean values as omitted settings", () => {
    for (const property of booleanOptions) {
      expect(() => {
        validateConfiguration({
          [property]: undefined,
        });
      }).not.toThrow();
    }
  });
});

// ------------------------------------------------------------
// 2. Theme Configuration Validation
// ------------------------------------------------------------

describe("Theme Configuration Validation", () => {
  const themeProperties = [
    "bgColor",
    "textColor",
    "borderColor",
    "progressTrackColor",
    "progressBarColor",
  ];

  it.each(themeProperties)("accepts CSS strings for %s", (property) => {
    expect(() => {
      validateConfiguration({
        theme: {
          [property]: "#123456",
        },
      });
    }).not.toThrow();

    expect(() => {
      validateConfiguration({
        theme: {
          [property]: "var(--toast-color)",
        },
      });
    }).not.toThrow();
  });

  it.each(themeProperties)("rejects non-string values for %s", (property) => {
    for (const invalidValue of [123, true, null, [], {}]) {
      expect(() => {
        validateConfiguration({
          theme: {
            [property]: invalidValue,
          },
        });
      }).toThrow(TypeError);
    }
  });

  it("accepts partial and empty theme objects", () => {
    expect(() => {
      validateConfiguration({
        theme: {},
      });
    }).not.toThrow();

    expect(() => {
      validateConfiguration({
        theme: {
          bgColor: "#ffffff",
        },
      });
    }).not.toThrow();
  });

  it("accepts all supported theme properties together", () => {
    expect(() => {
      validateConfiguration({
        theme: {
          bgColor: "#ffffff",
          textColor: "#222222",
          borderColor: "#cccccc",
          progressTrackColor: "#eeeeee",
          progressBarColor: "#3781c2",
        },
      });
    }).not.toThrow();
  });

  it("rejects invalid theme structures", () => {
    for (const invalidValue of [null, [], "dark", 123]) {
      expect(() => {
        validateConfiguration({
          theme: invalidValue,
        });
      }).toThrow(TypeError);
    }
  });

  it("rejects non-finite numeric theme values", () => {
    for (const invalidValue of [NaN, Infinity, -Infinity]) {
      expect(() => {
        validateConfiguration({
          theme: {
            bgColor: invalidValue,
          },
        });
      }).toThrow(TypeError);
    }
  });

  it("does not mutate theme input while validating", () => {
    const theme = {
      bgColor: "#ffffff",
      textColor: "#222222",
    };

    const original = { ...theme };

    validateConfiguration({ theme });

    expect(theme).toEqual(original);
  });
});

// ------------------------------------------------------------
// 3. Icon Configuration Validation
// ------------------------------------------------------------

describe("Icon Configuration Validation", () => {
  it("accepts built-in icon fallback values", () => {
    expect(() => {
      validateConfiguration({
        icon: null,
      });
    }).not.toThrow();

    expect(() => {
      validateConfiguration({});
    }).not.toThrow();

    expect(() => {
      validateConfiguration({
        icon: "",
      });
    }).not.toThrow();
  });

  it("accepts CSS class icons", () => {
    expect(() => {
      validateConfiguration({
        icon: "fas fa-check-circle",
      });
    }).not.toThrow();

    expect(() => {
      validateConfiguration({
        icon: {
          fontAwesome: "fas fa-check-circle",
        },
      });
    }).not.toThrow();
  });

  it("accepts supported image configurations", () => {
    for (const url of [
      "/icons/check.png",
      "/icons/check.webp",
      "/icons/check.avif",
      "/icons/check.svg",
    ]) {
      expect(() => {
        validateConfiguration({ icon: url });
      }).not.toThrow();
    }

    expect(() => {
      validateConfiguration({
        icon: {
          url: "/api/icons/check",
          width: "24px",
          height: "24px",
        },
      });
    }).not.toThrow();
  });

  it("accepts SVG icon configuration", () => {
    expect(() => {
      validateConfiguration({
        icon: {
          svg: '<svg><circle cx="8" cy="8" r="6" /></svg>',
        },
      });
    }).not.toThrow();
  });

  it.each([
    123,
    true,
    false,
    [],
    ["fas", "fa-check"],
    {},
    { unknown: "value" },
    { url: "" },
    { url: 123 },
    { fontAwesome: null },
    { svg: 123 },
    { svg: "" },
    { url: "/icons/check.png", width: 24 },
    { url: "/icons/check.png", height: false },
  ])("rejects unsupported icon configuration: %j", (icon) => {
    expect(() => {
      validateConfiguration({ icon });
    }).toThrow(TypeError);
  });

  it("accepts image dimensions as strings", () => {
    expect(() => {
      validateConfiguration({
        icon: {
          url: "/icons/check.png",
          width: "2rem",
          height: "auto",
        },
      });
    }).not.toThrow();
  });

  it("rejects non-finite numeric icon dimensions", () => {
    for (const invalidValue of [NaN, Infinity, -Infinity]) {
      expect(() => {
        validateConfiguration({
          icon: {
            url: "/icons/check.png",
            width: invalidValue,
          },
        });
      }).toThrow(TypeError);
    }
  });

  it("does not mutate supported structured icon configurations", () => {
    const icon = {
      url: "/icons/check.png",
      width: "24px",
      height: "24px",
    };

    const original = { ...icon };

    validateConfiguration({ icon });

    expect(icon).toEqual(original);
  });
});

// ------------------------------------------------------------
// 4. Combined Configuration Validation
// ------------------------------------------------------------

describe("Combined Configuration Validation", () => {
  it("accepts compatible settings in one configuration object", () => {
    expect(() => {
      validateConfiguration({
        newestOnTop: true,
        pauseOnHover: false,
        showProgress: true,
        allowHtml: false,
        enableIcon: true,
        showClose: true,
        theme: {
          bgColor: "#ffffff",
          textColor: "#111111",
        },
        icon: {
          fontAwesome: "fas fa-check-circle",
        },
      });
    }).not.toThrow();
  });

  it("rejects invalid settings even when other properties are valid", () => {
    expect(() => {
      validateConfiguration({
        newestOnTop: true,
        pauseOnHover: "false",
        showProgress: true,
        theme: {
          bgColor: "#ffffff",
        },
      });
    }).toThrow(TypeError);
  });

  it("does not mutate the original configuration object", () => {
    const configuration = {
      showProgress: true,
      pauseOnHover: false,
      theme: {
        bgColor: "#ffffff",
      },
      icon: {
        fontAwesome: "fas fa-check",
      },
    };

    const original = structuredClone(configuration);

    validateConfiguration(configuration);

    expect(configuration).toEqual(original);
  });

  it("does not mutate input after rejecting invalid configuration", () => {
    const configuration = {
      showProgress: "true",
      theme: {
        bgColor: "#ffffff",
      },
    };

    const original = structuredClone(configuration);

    expect(() => {
      validateConfiguration(configuration);
    }).toThrow(TypeError);

    expect(configuration).toEqual(original);
  });
});
