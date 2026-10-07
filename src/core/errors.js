const layoutWarnings = new Set([
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications.",
]);
export function isLayoutWarning(event) {
  return !event.error && layoutWarnings.has(event.message);
}
export function installErrorReporter(target, report, log = console.error) {
  function error(event) {
    if (isLayoutWarning(event)) return;
    log(event.error ?? event.message);
    report();
  }
  function rejection(event) {
    log(event.reason);
    report();
  }
  target.addEventListener("error", error);
  target.addEventListener("unhandledrejection", rejection);
  return () => {
    target.removeEventListener("error", error);
    target.removeEventListener("unhandledrejection", rejection);
  };
}
