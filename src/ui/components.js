export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function")
      node.addEventListener(key.slice(2), value);
    else if (key === "text") node.textContent = value;
    else if (key === "checked") node.checked = !!value;
    else if (value != null && value !== false)
      node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children.flat().filter((c) => c != null));
  return node;
}
export const button = (text, onclick, className = "button", attributes = {}) =>
  el(
    "button",
    { type: "button", class: className, onclick, ...attributes },
    text,
  );
export function toast(message, error = false) {
  const parent = [...document.querySelectorAll("dialog[open]")].at(-1) ?? document.body;
  const host =
    document.getElementById("toasts") ??
    document.body.appendChild(
      el("div", { id: "toasts", class: "toasts", popover: "manual", "aria-live": "polite" }),
    );
  if (host.parentNode !== parent) {
    host.hidePopover?.();
    parent.append(host);
  }
  const node = el(
    "div",
    { class: `toast ${error ? "error" : ""}`, role: "status" },
    message,
  );
  host.append(node);
  host.showPopover?.();
  setTimeout(() => {
    node.remove();
    if (!host.childElementCount && host.isConnected) host.hidePopover?.();
  }, 5500);
}
export function field(label, input) {
  return el("label", { class: "field" }, el("span", {}, label), input);
}
export function modal(title, content, actions = []) {
  const dialog = el(
    "dialog",
    { class: "modal" },
    el("h2", {}, title),
    content,
    el("div", { class: "actions" }, actions),
  );
  document.body.append(dialog);
  dialog.showModal();
  dialog.addEventListener("close", () => dialog.remove());
  return dialog;
}
export async function getJSON(file) {
  const r = await fetch(file);
  if (!r.ok) throw new Error(`Content unavailable: ${r.status}`);
  return r.json();
}
