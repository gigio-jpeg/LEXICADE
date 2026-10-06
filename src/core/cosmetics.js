import { config } from "./config.js";
import { guestProfile } from "./guest.js";
import { read } from "./storage.js";
import { session } from "./auth.js";
export function themeChoices() {
  const owned = session() ? read("account-items", []) : guestProfile().items;
  return [
    ...config.themes,
    ...["nebula", "dawn"].filter((name) => owned.includes(`theme-${name}`)),
  ];
}

export function avatarGlyph(equipped) {
  return (
    {
      "avatar-spark": "✦",
      "avatar-nova": "◈",
      "avatar-leaf": "❋",
      "avatar-comet": "↟",
    }[equipped?.avatar] ?? "L"
  );
}
