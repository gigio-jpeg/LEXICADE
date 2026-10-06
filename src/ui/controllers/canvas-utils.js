export const palette = {
  bg: "#0e1220",
  line: "#252b42",
  text: "#edf4ff",
  muted: "#a8b2c8",
  cyan: "#64f5dc",
  pink: "#ff82b9",
  yellow: "#f4da75",
  purple: "#af9bff",
  green: "#78ecae",
};
export function clear(draw, width, height) {
  draw.fillStyle = palette.bg;
  draw.fillRect(0, 0, width, height);
}
export function text(
  draw,
  value,
  x,
  y,
  size = 18,
  color = palette.text,
  align = "center",
) {
  draw.fillStyle = color;
  draw.font = `${size}px Consolas, monospace`;
  draw.textAlign = align;
  draw.textBaseline = "middle";
  draw.fillText(value, x, y);
}
export function stars(draw, width, height, elapsed = 0) {
  for (let i = 0; i < 45; i++) {
    const x = (i * 137.7) % width,
      y = (i * 97.3 + elapsed * 8) % height;
    draw.fillStyle = i % 4 ? palette.line : palette.muted;
    draw.fillRect(x, y, i % 4 ? 2 : 3, i % 4 ? 2 : 3);
  }
}
export function roundRect(draw, x, y, w, h, color, r = 7) {
  draw.fillStyle = color;
  draw.beginPath();
  draw.roundRect(x, y, w, h, r);
  draw.fill();
}
export function creature(draw, x, y, color, size = 12) {
  draw.fillStyle = color;
  draw.beginPath();
  draw.arc(x, y, size, Math.PI, 0);
  draw.lineTo(x + size, y + size);
  draw.lineTo(x + size / 2, y + size * 0.6);
  draw.lineTo(x, y + size);
  draw.lineTo(x - size / 2, y + size * 0.6);
  draw.lineTo(x - size, y + size);
  draw.closePath();
  draw.fill();
  draw.fillStyle = palette.bg;
  draw.fillRect(x - 6, y - 2, 3, 5);
  draw.fillRect(x + 3, y - 2, 3, 5);
}
