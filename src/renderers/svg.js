/**
 * @fileoverview Secure SVG icon parsing and rendering for ZephyrToast.
 *
 * Provides a restricted SVG renderer for custom notification icons.
 *
 * SVG markup is parsed into a detached DOM fragment, validated
 * against explicit element and attribute allowlists, and rebuilt
 * using DOM APIs.
 *
 * The renderer rejects unsupported elements, event handler
 * attributes, external resource references, potentially unsafe
 * attribute values, and unexpected child nodes.
 *
 * Only validated SVG elements are returned to the caller.
 *
 * @module renderers/svg
 * @author Md. Sarwar Alam
 * @license MIT
 */

/**
 * Parses, validates, and reconstructs custom SVG markup.
 *
 * The supplied markup must contain exactly one root SVG element.
 * Only a restricted set of SVG drawing elements and attributes
 * is permitted.
 *
 * Validation includes:
 * - Root element and SVG namespace verification.
 * - Allowlisted SVG elements and attributes.
 * - Rejection of unsupported or namespaced attributes.
 * - Rejection of URL references and script-related URI schemes.
 * - Rejection of control characters and HTML-like characters
 *   in attribute values.
 * - Rejection of unsupported child nodes and content.
 *
 * Approved elements are recreated using createElementNS(),
 * preventing the original parsed elements from being inserted
 * directly into the document.
 *
 * @param {string} markup - SVG markup to validate and reconstruct.
 * @param {Document} [documentRef=document] - Document used for
 * parsing and creating the validated SVG elements.
 * @returns {SVGSVGElement} A newly constructed, validated SVG element.
 * @throws {TypeError} If the markup is empty, malformed, or contains
 * unsupported SVG elements, attributes, or values.
 */
export function createSafeSvg(markup, documentRef = document) {
  // Validate the supplied SVG markup.
  if (typeof markup !== "string" || !markup.trim()) {
    throw new TypeError("SVG icon markup must be a non-empty string.");
  }

  // SVG namespace used for validation and element creation.
  const svgNamespace = "http://www.w3.org/2000/svg";

  // Only these SVG drawing elements are permitted.
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

  // Only these SVG attributes are permitted.
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

  // Ignore insignificant whitespace between parsed nodes.
  const nodes = Array.from(template.content.childNodes).filter(
    (node) => node.nodeType !== 3 || node.textContent.trim() !== "",
  );

  // Verify that the markup contains one valid SVG root.
  if (
    nodes.length !== 1 ||
    nodes[0].nodeType !== 1 ||
    nodes[0].localName !== "svg" ||
    nodes[0].namespaceURI !== svgNamespace
  ) {
    throw new TypeError("Invalid or unsafe SVG icon markup.");
  }

  /**
   * Recursively validates and reconstructs an SVG element.
   *
   * Rejects unsupported elements and attributes, validates
   * attribute values, and copies approved child elements into
   * a newly created SVG node.
   *
   * @param {Element} source - Parsed SVG element to validate.
   * @returns {SVGElement} A newly constructed, validated SVG element.
   * @throws {TypeError} If an unsafe or unsupported SVG element,
   * attribute, value, or child node is encountered.
   */
  const copySafeNode = (source) => {
    // Reject unsupported elements and non-SVG namespaces.
    if (
      source.namespaceURI !== svgNamespace ||
      !allowedElements.has(source.localName)
    ) {
      throw new TypeError(
        `Unsafe or unsupported SVG element: ${source.localName}.`,
      );
    }

    // Create an independent SVG element.
    const target = documentRef.createElementNS(svgNamespace, source.localName);

    // Validate and copy explicitly permitted attributes.
    for (const attribute of Array.from(source.attributes)) {
      const name = attribute.name;
      const value = attribute.value;

      // Reject unsupported or namespaced attributes.
      if (
        !allowedAttributes.has(name) ||
        (attribute.namespaceURI &&
          attribute.namespaceURI !== "http://www.w3.org/2000/xmlns/")
      ) {
        throw new TypeError(`Unsafe or unsupported SVG attribute: ${name}.`);
      }

      // Reject external references and unsafe values.
      if (
        /url\s*\(/i.test(value) ||
        /(?:javascript|data|vbscript)\s*:/i.test(value) ||
        /[<>\u0000-\u001f\u007f]/.test(value)
      ) {
        throw new TypeError(`Unsafe SVG attribute value: ${name}.`);
      }

      // Validate the SVG namespace declaration.
      if (name === "xmlns") {
        if (value !== svgNamespace) {
          throw new TypeError("Invalid SVG namespace.");
        }

        continue;
      }

      // Copy validated attributes to the new SVG element.
      target.setAttribute(name, value);
    }

    // Validate and recursively reconstruct child elements.
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

  // Return the reconstructed SVG tree.
  return copySafeNode(nodes[0]);
}
