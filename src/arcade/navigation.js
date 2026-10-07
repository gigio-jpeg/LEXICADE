export const MACHINE_IDS = Object.freeze([
  "typerush",
  "decifra",
  "wordman",
  "anagrama",
]);
export const COLORS = Object.freeze([
  "#65f5c4",
  "#d0f77a",
  "#ff8d66",
  "#b49aff",
]);
export const machineX = (index) => (index - 1.5) * 3.15;
export const wrapIndex = (index, count = 4) =>
  ((index % count) + count) % count;
export const ease = (value) =>
  value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
export function cameraPose(index, state, aspect, viewport) {
  const x = machineX(index),
    mobile = aspect < 0.85;
  if (state === "overview")
    return { position: [7.8, 5.6, mobile ? 22 : 13.5], target: [0, 2, 0] };
  if (state === "play") {
    if (viewport?.width <= 700) {
      const tangent = Math.tan(21 * Math.PI / 180);
      const usableHeight = Math.max(100, viewport.height - 110);
      const distance = Math.max(1.92 / (2 * tangent * aspect * .88),
        1.6 / (2 * tangent * usableHeight / viewport.height));
      const y = 2.8 + 38 * 2 * distance * tangent / viewport.height;
      return { position: [x, y, .906 + distance], target: [x, y, .906] };
    }
    const distance = mobile ? 2.65 / Math.max(0.35, aspect) : 3.2;
    return { position: [x, 2.86, 0.98 + distance], target: [x, 2.86, 0.9] };
  }
  return mobile
    ? { position: [x + 2, 4, 12], target: [x, 3.2, 0] }
    : { position: [x + 3.8, 3.25, 10.5], target: [x - 1.05, 2.2, 0] };
}
