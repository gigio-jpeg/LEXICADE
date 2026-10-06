import { test } from "node:test";
import { validateContent } from "./validate-content.mjs";
test("Dados, idiomas, catálogo e todas as 180 grades são válidos", async () => {
  await validateContent();
});
