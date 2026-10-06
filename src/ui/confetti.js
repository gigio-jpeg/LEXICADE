import { settings } from "../core/storage.js";
export function confetti() {
  if (
    settings().reducedMotion ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const host = document.createElement("div");
  host.className = "confetti";
  host.setAttribute("aria-hidden", "true");
  host.dataset.effect = settings().effect ?? "sparks";
  for (let i = 0; i < 28; i++) {
    const dot = document.createElement("i");
    dot.style.setProperty("--x", `${Math.random() * 100}vw`);
    dot.style.setProperty("--delay", `${Math.random() * 0.7}s`);
    dot.style.setProperty("--hue", `${Math.random() * 360}`);
    host.append(dot);
  }
  document.body.append(host);
  setTimeout(() => host.remove(), 2500);
}
