import test from "node:test";
import assert from "node:assert/strict";
import { installErrorReporter, isLayoutWarning } from "../src/core/errors.js";

test("Avisos específicos de ResizeObserver não são falhas de aplicação", () => {
  assert.equal(isLayoutWarning({ message: "ResizeObserver loop completed with undelivered notifications." }), true);
  assert.equal(isLayoutWarning({ message: "ResizeObserver loop limit exceeded" }), true);
  assert.equal(isLayoutWarning({ message: "ResizeObserver loop limit exceeded", error: new Error("real") }), false);
  assert.equal(isLayoutWarning({ message: "Erro de aplicação" }), false);
});
test("Erros reais e rejeições continuam registrados e notificados", () => {
  const target = new EventTarget(), logs = [];
  let reports = 0;
  const dispose = installErrorReporter(target, () => reports++, (value) => logs.push(value));
  const warning = new Event("error");
  warning.message = "ResizeObserver loop limit exceeded";
  target.dispatchEvent(warning);
  assert.equal(reports, 0);
  const error = new Event("error");
  error.error = new TypeError("falha real");
  target.dispatchEvent(error);
  const rejection = new Event("unhandledrejection");
  rejection.reason = new Error("requisição rejeitada");
  target.dispatchEvent(rejection);
  assert.equal(reports, 2);
  assert.deepEqual(logs, [error.error, rejection.reason]);
  dispose();
  target.dispatchEvent(error);
  assert.equal(reports, 2);
});
