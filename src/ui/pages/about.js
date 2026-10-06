import { el } from "../components.js";
import { t } from "../../core/i18n.js";
import { path, config } from "../../core/config.js";
import { page } from "../page-utils.js";
export function aboutPage(main) {
  const content = page(main, "about.title");
  content.append(
    el(
      "article",
      { class: "about-copy" },
      el("p", {}, t("about.story").replaceAll("LEXICADE", config.name)),
      el("p", { class: "legal-notice" }, t("common.legalPending")),
      el("h2", {}, t("about.privacyTitle")),
      el("p", {}, t("about.privacy")),
      el("h2", {}, t("about.termsTitle")),
      el("p", {}, t("about.terms")),
      el("h2", {}, t("about.licenses")),
      el(
        "p",
        {},
        "FrequencyWords / Hermit Dave · CC BY-SA 4.0. Silkscreen / Jason Kottke · SIL OFL 1.1. Supabase JS · MIT.",
      ),
      el(
        "a",
        { href: path("docs/LICENCAS.md"), class: "button ghost" },
        t("about.licenses"),
      ),
    ),
  );
}
