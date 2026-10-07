import { el, button, field, toast, modal } from "../components.js";
import { t, lang } from "../../core/i18n.js";
import { config, path } from "../../core/config.js";
import { settings, saveSettings, clearLocal } from "../../core/storage.js";
import { guestProfile } from "../../core/guest.js";
import { session, signOut } from "../../core/auth.js";
import { exportAccount, deleteAccount } from "../../core/api.js";
import { themeChoices } from "../../core/cosmetics.js";
import { page, downloadJSON } from "../page-utils.js";
export function settingsPage(main) {
  const content = page(main, "settings.title"),
    grid = el("div", { class: "settings-grid" }),
    visual = el("section", { class: "panel" }, el("h2", {}, t("nav.theme"))),
    play = el("section", { class: "panel" }, el("h2", {}, t("nav.play")));
  grid.append(visual, play);
  content.append(grid);
  const s = settings();
  function select(key, label, values, parent) {
    const node = el(
      "select",
      { onchange: (e) => saveSettings({ [key]: e.target.value }) },
      ...values.map(([value, text]) =>
        el("option", { value, selected: value === s[key] }, text),
      ),
    );
    parent.append(field(t(label), node));
  }
  select(
    "theme",
    "nav.theme",
    themeChoices().map((k) => [k, t(`theme.${k}`)]),
    visual,
  );
  select(
    "cursor",
    "settings.cursor",
    [
      ["line", t("cursor.line")],
      ["block", t("cursor.block")],
      ["underline", t("cursor.underline")],
    ],
    visual,
  );
  const font = el("input", {
    type: "range",
    min: 14,
    max: 22,
    value: s.fontSize,
    "aria-label": t("settings.font"),
    oninput: (e) => saveSettings({ fontSize: Number(e.target.value) }),
  });
  visual.append(field(t("settings.font"), font));
  function toggle(key, label, parent) {
    const input = el("input", {
      type: "checkbox",
      checked: s[key],
      onchange: (e) => {
        saveSettings({ [key]: e.target.checked });
      },
    });
    parent.append(el("label", { class: "toggle" }, input, t(label)));
  }
  for (const [key, label] of [
    ["crt", "settings.crt"],
    ["reducedMotion", "settings.motion"],
    ["colorblind", "settings.colorblind"],
  ])
    toggle(key, label, visual);
  for (const [key, label] of [
    ["sound", "nav.sound"],
    ["music", "settings.music"],
    ["accents", "game.accents"],
    ["focus", "game.focus"],
  ])
    toggle(key, label, play);
  const volume = el("input", {
    type: "range",
    min: 0,
    max: 0.3,
    step: 0.01,
    value: s.volume,
    "aria-label": t("settings.volume"),
    oninput: (e) => saveSettings({ volume: Number(e.target.value) }),
  });
  play.append(field(t("settings.volume"), volume));
  const privacy = el(
    "section",
    { class: "panel", style: "margin-top:20px" },
    el("h2", {}, t("nav.profile")),
  );
  content.append(privacy);
  privacy.append(
    el(
      "div",
      { class: "actions" },
      button(t("settings.export"), async () => {
        try {
          downloadJSON(
            session()
              ? await exportAccount()
              : {
                  profile: guestProfile(),
                  settings: settings(),
                  exported_at: new Date().toISOString(),
                },
          );
        } catch {
          toast(t("common.error"), true);
        }
      }),
      button(
        t("settings.clear"),
        () => {
          const dialog = modal(
            t("settings.clear"),
            el("p", {}, t("settings.clearConfirm")),
          );
          dialog.append(
            el(
              "div",
              { class: "actions" },
              button(
                t("common.confirm"),
                () => {
                  clearLocal();
                  dialog.close();
                  location.reload();
                },
                "button danger",
              ),
              button(t("common.cancel"), () => dialog.close(), "button ghost"),
            ),
          );
        },
        "button ghost",
      ),
    ),
  );
  if (session())
    privacy.append(
      el(
        "div",
        { class: "actions", style: "margin-top:20px" },
        el(
          "a",
          { class: "button ghost", href: path("pages/redefinir-senha.html") },
          t("auth.reset"),
        ),
        button(
          t("nav.logout"),
          () => signOut().then(() => (location.href = path())),
          "button ghost",
        ),
        button(
          t("settings.delete"),
          () => {
            const confirmation = el("input", {
                "aria-label": t("settings.delete"),
              }),
              dialog = modal(
                t("settings.delete"),
                el(
                  "div",
                  {},
                  el("p", {}, t("settings.deleteConfirm")),
                  confirmation,
                ),
              );
            dialog.append(
              el(
                "div",
                { class: "actions" },
                button(
                  t("common.confirm"),
                  async () => {
                    if (confirmation.value !== t("settings.deleteWord")) return;
                    try {
                      await deleteAccount();
                      await signOut();
                      dialog.close();
                      location.href = path();
                    } catch {
                      toast(t("common.error"), true);
                    }
                  },
                  "button danger",
                ),
                button(
                  t("common.cancel"),
                  () => dialog.close(),
                  "button ghost",
                ),
              ),
            );
          },
          "button danger",
        ),
      ),
    );
  return () => {};
}
