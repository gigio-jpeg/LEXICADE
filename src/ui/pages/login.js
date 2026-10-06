import { el, button, field, toast, modal } from "../components.js";
import { t, lang } from "../../core/i18n.js";
import { config, path, dataLang } from "../../core/config.js";
import {
  signIn,
  signUp,
  recover,
  resetPassword,
  google,
  magic,
  session,
} from "../../core/auth.js";
import {
  usernameAvailable,
  ownProfile,
  importGuest,
  updateProfile,
} from "../../core/api.js";
import { guestProfile } from "../../core/guest.js";
import { read, write } from "../../core/storage.js";
const format = /^[A-Za-z0-9_]{3,20}$/;
export async function loginPage(main, kind = "login") {
  const panel = el("div", { class: "panel auth-panel" }),
    form = el("form", { class: "auth-form" }),
    tabs = el("div", { class: "auth-tabs" });
  main.replaceChildren(
    el(
      "div",
      { class: "container auth-layout" },
      el(
        "div",
        { class: "auth-art" },
        el("div", { class: "brand-mark", "aria-hidden": "true" }, "L"),
        el(
          "p",
          { class: "eyebrow" },
          config.name + " / " + t("nav.login").toUpperCase(),
        ),
        el("h1", {}, t("auth.title")),
        el("p", {}, t("auth.subtitle")),
        el(
          "a",
          { href: path(), class: "button ghost" },
          "← " + t("common.back"),
        ),
      ),
      panel,
    ),
  );
  let mode =
      kind === "reset" ? "reset" : kind === "onboard" ? "onboard" : "signin",
    busy = false,
    revision = 0,
    timer;
  const status = el("p", {
    class: "name-status",
    role: "status",
    "aria-live": "polite",
  });
  function render() {
    revision++;
    clearTimeout(timer);
    tabs.replaceChildren();
    form.replaceChildren();
    panel.replaceChildren(tabs, form);
    if (kind === "login")
      for (const [value, key] of [
        ["signin", "signin"],
        ["signup", "signup"],
        ["recover", "recover"],
      ])
        tabs.append(
          button(
            t(`auth.${key}`),
            () => {
              mode = value;
              render();
            },
            `chip ${mode === value ? "active" : ""}`,
          ),
        );
    const email = el("input", {
        type: "email",
        autocomplete: "email",
        required: true,
      }),
      password = el("input", {
        type: "password",
        autocomplete: mode === "signin" ? "current-password" : "new-password",
        minlength: 8,
        required: true,
      }),
      username = el("input", {
        autocomplete: "nickname",
        minlength: 3,
        maxlength: 20,
        pattern: "[A-Za-z0-9_]{3,20}",
        required: true,
      });
    if (!["reset", "onboard"].includes(mode))
      form.append(field(t("auth.email"), email));
    if (["signin", "signup", "reset"].includes(mode)) {
      const show = button(
        "◉",
        () => {
          password.type = password.type === "password" ? "text" : "password";
        },
        "icon-button",
        { "aria-label": t("auth.show") },
      );
      form.append(
        field(
          t("auth.password"),
          el("div", { class: "password-row" }, password, show),
        ),
      );
      if (mode !== "signin") {
        const bar = el(
          "div",
          { class: "strength", "aria-label": t("auth.passwordStrength") },
          el("span"),
        );
        password.addEventListener("input", () => {
          const strength = Math.min(
            100,
            password.value.length * 5 +
              (/[0-9]/.test(password.value) ? 15 : 0) +
              (/[^\w]/.test(password.value) ? 15 : 0),
          );
          bar.style.setProperty("--strength", `${strength}%`);
        });
        form.append(
          bar,
          el("p", { class: "auth-note" }, t("auth.passwordHint")),
        );
      }
    }
    if (["signup", "onboard"].includes(mode)) {
      form.append(
        field(t("auth.username"), username),
        el("p", { class: "auth-note" }, t("auth.usernameHint")),
        status,
      );
      status.textContent = "";
      username.addEventListener("input", () => {
        clearTimeout(timer);
        const snapshot = ++revision;
        if (!format.test(username.value)) {
          status.textContent = t("auth.unavailable");
          return;
        }
        timer = setTimeout(async () => {
          try {
            const available = await usernameAvailable(username.value);
            if (snapshot === revision)
              status.textContent = t(
                available ? "auth.available" : "auth.unavailable",
              );
          } catch {
            if (snapshot === revision) status.textContent = t("common.error");
          }
        }, 500);
      });
    }
    const age = el(
        "select",
        { required: true },
        ...["adult", "teen", "child"].map((value) =>
          el("option", { value }, t(`auth.${value}`)),
        ),
      ),
      terms = el("input", { type: "checkbox", required: true }),
      guardian = el("input", { type: "checkbox" });
    if (["signup", "onboard"].includes(mode)) {
      form.append(
        field(t("auth.age"), age),
        el("label", { class: "check-label" }, guardian, t("auth.guardian")),
        el(
          "label",
          { class: "check-label" },
          terms,
          el(
            "span",
            {},
            t("auth.terms"),
            " ",
            el(
              "a",
              {
                href: path("pages/sobre.html"),
                target: "_blank",
                rel: "noopener",
              },
              "↗",
            ),
          ),
        ),
      );
    }
    const key = {
      signin: "signin",
      signup: "signup",
      recover: "recover",
      reset: "reset",
      onboard: "onboard",
    }[mode];
    const submit = el(
      "button",
      { type: "submit", class: "button" },
      t(`auth.${key}`),
    );
    form.append(submit);
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (busy) return;
      if (["signup", "onboard"].includes(mode) && age.value === "child") {
        toast(t("auth.childBlocked"), true);
        return;
      }
      if (
        ["signup", "onboard"].includes(mode) &&
        age.value === "teen" &&
        !guardian.checked
      ) {
        toast(t("auth.guardian"), true);
        return;
      }
      busy = true;
      submit.disabled = true;
      try {
        if (mode === "signin") {
          await signIn(email.value.trim(), password.value);
          await afterLogin();
        } else if (mode === "signup") {
          await signUp(email.value.trim(), password.value, {
            username: username.value,
            preferred_lang: dataLang(lang()),
            age_band: age.value,
            guardian_consent: age.value === "teen" && guardian.checked,
            terms_accepted: true,
            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
          toast(t("auth.checkEmail"));
          if (session()) await afterLogin();
        } else if (mode === "recover") {
          await recover(email.value.trim());
          toast(t("auth.checkEmail"));
        } else if (mode === "reset") {
          await resetPassword(password.value);
          toast(t("common.saved"));
          location.href = path("pages/perfil.html");
        } else {
          await updateProfile({
            p_username: username.value,
            p_country: null,
            p_lang: dataLang(lang()),
            p_avatar: "default",
            p_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            p_age_band: age.value,
            p_guardian_consent: guardian.checked,
            p_terms_accepted: terms.checked,
          });
          await afterLogin();
        }
      } catch {
        toast(t("auth.failure"), true);
      } finally {
        busy = false;
        submit.disabled = false;
      }
    };
    if (mode === "signin" && config.googleEnabled)
      panel.append(
        button(
          t("auth.google"),
          () => google().catch(() => toast(t("auth.failure"), true)),
          "button ghost",
        ),
      );
    if (mode === "signin" && config.magicLinkEnabled)
      panel.append(
        button(
          t("auth.magic"),
          async () => {
            if (!email.reportValidity()) return;
            try {
              await magic(email.value.trim());
              toast(t("auth.checkEmail"));
            } catch {
              toast(t("auth.failure"), true);
            }
          },
          "button ghost",
        ),
      );
  }
  async function afterLogin() {
    const profile = await ownProfile();
    if (profile?.onboarding_required) {
      location.href = path("pages/escolher-nome.html");
      return;
    }
    const local = guestProfile();
    const importKey = `imported:${session()?.user.id}`;
    if (local.history.length && !read(importKey)) {
      const dialog = modal(t("nav.profile"), el("p", {}, t("auth.import")));
      dialog.append(
        el(
          "div",
          { class: "actions" },
          button(t("common.confirm"), async () => {
            try {
              await importGuest(local);
              write(importKey, true);
              dialog.close();
              location.href = path("pages/perfil.html");
            } catch {
              toast(t("common.error"), true);
            }
          }),
          button(
            t("common.skip"),
            () => {
              dialog.close();
              location.href = path("pages/perfil.html");
            },
            "button ghost",
          ),
        ),
      );
    } else location.href = path("pages/perfil.html");
  }
  if (mode === "onboard" && !session()) {
    location.href = path("pages/login.html");
    return;
  }
  render();
  return () => {
    clearTimeout(timer);
    revision++;
  };
}
