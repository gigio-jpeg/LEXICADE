export const directions = {
  ArrowUp: [0, -1],
  w: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
};
export function bindDirections(element, callback, signal) {
  document.addEventListener(
    "keydown",
    (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const direction = directions[e.key];
      if (direction) {
        e.preventDefault();
        callback(direction);
      }
    },
    { signal },
  );
  let start;
  element.addEventListener(
    "pointerdown",
    (e) => {
      start = [e.clientX, e.clientY];
    },
    { signal },
  );
  element.addEventListener(
    "pointerup",
    (e) => {
      if (!start) return;
      const x = e.clientX - start[0],
        y = e.clientY - start[1];
      start = null;
      if (Math.max(Math.abs(x), Math.abs(y)) < 15) return;
      callback(
        Math.abs(x) > Math.abs(y) ? [Math.sign(x), 0] : [0, Math.sign(y)],
      );
    },
    { signal },
  );
}
