
/**
 * @fileoverview Secure SVG icon rendering for ZephyrToast.
 *
 * Parses custom SVG markup and reconstructs it using an explicit
 * allowlist of drawing elements and attributes.
 *
 * Unsupported elements, event handlers, external references,
 * and unsafe attribute values are rejected.
 *
 * @module renderers/svg
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Creates a restricted SVG icon from supplied markup.
 *
 * Uses a detached template for parsing and constructs an entirely
 * new SVG tree containing only approved elements and attributes.
 *
 * @param {string} markup - Custom SVG markup.
 * @param {Document} [documentRef=document] - Target DOM document.
 * @returns {SVGSVGElement} The validated SVG element.
 * @throws {TypeError} If the SVG contains unsupported content.
 */
export function createSafeSvg(markup, documentRef = document) {
  if (typeof markup !== "string" || !markup.trim()) {
    throw new TypeError("SVG icon markup must be a non-empty string.");
  }

  const svgNamespace = "http://www.w3.org/2000/svg";

  const allowedElements = new Set([
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "rect",
    "line",
    "polyline",
    "polygon",
  ]);

  const allowedAttributes = new Set([
    "viewBox",
    "width",
    "height",
    "fill",
    "fill-opacity",
    "fill-rule",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity",
    "opacity",
    "d",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "transform",
    "xmlns",
  ]);

  // Parse SVG markup in a detached template.
  const template = documentRef.createElement("template");
  template.innerHTML = markup;

  const nodes = Array.from(template.content.childNodes).filter(
    (node) =>
      node.nodeType !== 3 || node.textContent.trim() !== ""
  );

  if (
    nodes.length !== 1 ||
    nodes[0].nodeType !== 1 ||
    nodes[0].localName !== "svg" ||
    nodes[0].namespaceURI !== svgNamespace
  ) {
    throw new TypeError("Invalid or unsafe SVG icon markup.");
  }

  /**
   * Recursively copies approved SVG elements and attributes.
   *
   * @param {Element} source - Source SVG element.
   * @returns {SVGElement} A validated SVG element.
   * @throws {TypeError} If unsupported content is encountered.
   */
  const copySafeNode = (source) => {
    if (
      source.namespaceURI !== svgNamespace ||
      !allowedElements.has(source.localName)
    ) {
      throw new TypeError(
        `Unsafe or unsupported SVG element: ${source.localName}.`
      );
    }

    const target = documentRef.createElementNS(
      svgNamespace,
      source.localName
    );

    for (const attribute of Array.from(source.attributes)) {
      const name = attribute.name;
      const value = attribute.value;

      // Reject unsupported or namespaced attributes.
      if (
        !allowedAttributes.has(name) ||
        (attribute.namespaceURI &&
          attribute.namespaceURI !==
            "http://www.w3.org/2000/xmlns/")
      ) {
        throw new TypeError(
          `Unsafe or unsupported SVG attribute: ${name}.`
        );
      }

      // Reject external references and unsafe values.
      if (
        /url\s*\(/i.test(value) ||
        /(?:javascript|data|vbscript)\s*:/i.test(value) ||
        /[<>\u0000-\u001f\u007f]/.test(value)
      ) {
        throw new TypeError(
          `Unsafe SVG attribute value: ${name}.`
        );
      }

      if (name === "xmlns") {
        if (value !== svgNamespace) {
          throw new TypeError("Invalid SVG namespace.");
        }

        continue;
      }

      target.setAttribute(name, value);
    }

    for (const child of Array.from(source.childNodes)) {
      if (child.nodeType === 3 && child.textContent.trim() === "") {
        continue;
      }

      if (child.nodeType !== 1) {
        throw new TypeError("Unsupported SVG child content.");
      }

      target.appendChild(copySafeNode(child));
    }

    return target;
  };

  return copySafeNode(nodes[0]);
}
