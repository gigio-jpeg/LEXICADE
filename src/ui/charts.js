import { el } from "./components.js";
export function chart(values = [], label = "") {
  const points = values.length ? values : [0, 0];
  const max = Math.max(1, ...points);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 600 140");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  svg.classList.add("chart");
  const polyline = document.createElementNS(svg.namespaceURI, "polyline");
  polyline.setAttribute(
    "points",
    points
      .map(
        (v, i) =>
          `${10 + (i / Math.max(1, points.length - 1)) * 580},${130 - (v / max) * 115}`,
      )
      .join(" "),
  );
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "currentColor");
  polyline.setAttribute("stroke-width", "3");
  svg.append(polyline);
  return el("div", { class: "chart-wrap" }, svg);
}
