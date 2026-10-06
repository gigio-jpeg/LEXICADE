import { el, button, getJSON, toast } from "../components.js";
import { t, lang } from "../../core/i18n.js";
import { path } from "../../core/config.js";
import { guestProfile, buyGuest, equipGuest } from "../../core/guest.js";
import { settings, saveSettings, write } from "../../core/storage.js";
import { session } from "../../core/auth.js";
import { myStats, buyItem, equipItem, ownProfile } from "../../core/api.js";
import { page, stat } from "../page-utils.js";
export async function collectionPage(main, type) {
  const shop = type === "shop",
    content = page(
      main,
      shop ? "shop.title" : "achievements.title",
      shop ? "shop.subtitle" : "",
    ),
    catalog = await getJSON(
      path(`data/${shop ? "shop" : "achievements"}.json`),
    );
  let p = guestProfile(),
    unlocked = p.achievements;
  if (session())
    try {
      const stats = await myStats();
      p = await ownProfile();
      p.items = stats.items.map((i) => i.item_id);
      write("account-items", p.items);
      unlocked = stats.achievements.map((a) => a.achievement_id);
    } catch {
      toast(t("common.error"), true);
    }
  const summary = el("div", { class: "stat-grid" }),
    grid = el("div", {
      class: shop ? "shop-grid" : "achievement-grid",
      style: "margin-top:25px",
    });
  content.append(summary, grid);
  function render() {
    if (session()) write("account-items", p.items ?? []);
    summary.replaceChildren(
      stat("common.coins", p.coins ?? 0),
      stat("common.level", p.level ?? 1),
      stat("nav.achievements", unlocked.length),
      stat("common.xp", p.xp ?? 0),
    );
    grid.replaceChildren();
    for (const item of catalog) {
      if (!shop) {
        const owned = unlocked.includes(item.id);
        grid.append(
          el(
            "article",
            { class: `achievement-card ${owned ? "unlocked" : "locked"}` },
            el("span", { class: "badge", "aria-hidden": "true" }, item.icon),
            el("h3", {}, item.name[lang()]),
            el("p", {}, item.description[lang()]),
            el("p", { class: "mono" }, `+${item.xp} XP · +${item.coins} ◈`),
            el(
              "span",
              { class: "status" },
              t(owned ? "achievements.unlocked" : "achievements.locked"),
            ),
          ),
        );
        continue;
      }
      const owned = (p.items ?? []).includes(item.id),
        equipped = p.equipped?.[item.type] === item.id;
      const action = button(
        t(equipped ? "shop.equipped" : owned ? "shop.equip" : "shop.buy"),
        async () => {
          action.disabled = true;
          try {
            if (!owned) {
              if (session()) {
                const response = await buyItem(item.id);
                p.coins = response.coins;
                (p.items ??= []).push(item.id);
              } else if (!buyGuest(item)) {
                toast(t("shop.insufficient"), true);
                return;
              }
            } else {
              if (session()) {
                await equipItem(item.id);
                p.equipped = { ...p.equipped, [item.type]: item.id };
              } else equipGuest(item);
              if (item.type === "cursor") saveSettings({ cursor: item.value });
              if (item.type === "music")
                saveSettings({ music: true, sound: true, melody: item.value });
              if (item.type === "effect") saveSettings({ effect: item.value });
              if (item.type === "theme") saveSettings({ theme: item.value });
              if (!session()) p = guestProfile();
            }
            if (!session()) p = guestProfile();
            render();
          } catch {
            toast(t("common.error"), true);
          } finally {
            action.disabled = false;
          }
        },
        "button small ghost",
        { disabled: equipped },
      );
      grid.append(
        el(
          "article",
          { class: "shop-card" },
          el("span", { class: "badge", "aria-hidden": "true" }, item.icon),
          el("h3", {}, item.name[lang()]),
          el(
            "div",
            { class: "actions" },
            el("span", { class: "price" }, `${item.price} ◈`),
            action,
          ),
        ),
      );
    }
  }
  render();
}
