export function createLoop(update, render, step = 1000 / 60) {
  let id = 0,
    previous = 0,
    accumulator = 0,
    running = false;
  function frame(now) {
    if (!running) return;
    if (!previous) previous = now;
    accumulator += Math.min(100, now - previous);
    previous = now;
    while (accumulator >= step) {
      update(step / 1000);
      accumulator -= step;
    }
    render(accumulator / step);
    id = requestAnimationFrame(frame);
  }
  return {
    start() {
      if (running) return;
      running = true;
      previous = 0;
      id = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(id);
      previous = 0;
      accumulator = 0;
    },
  };
}
