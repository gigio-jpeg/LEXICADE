import { getClient } from "./supabase.js";
import { session } from "./auth.js";
import { write } from "./storage.js";
export async function rpc(name, params = {}) {
  const { data, error } = await (await getClient()).rpc(name, params);
  if (error) throw error;
  return data;
}
export const submitScore = (result) =>
  rpc("submit_score", {
    p_game: result.game,
    p_mode: result.mode,
    p_lang: result.lang,
    p_score: result.score,
    p_metrics: result.metrics,
    p_duration_ms: result.duration_ms,
  });
export const checkGuess = (date, lang, guess) =>
  rpc("check_guess", { p_play_date: date, p_lang: lang, p_guess: guess });
export const leaderboard = (params) => rpc("get_leaderboard", params);
export const myStats = () => rpc("get_my_stats");
export const updateProfile = (params) => rpc("update_profile", params);
export const buyItem = (id) => rpc("buy_item", { p_item_id: id });
export const equipItem = (id) => rpc("equip_item", { p_item_id: id });
export const importGuest = (payload) =>
  rpc("import_guest_data", { p_payload: payload });
export const deleteAccount = () => rpc("delete_my_account");
export const usernameAvailable = (name) =>
  rpc("username_available", { p_username: name });
export const dailyState = () => rpc("get_daily_state");
export const exportAccount = () => rpc("export_my_data");
export async function ownProfile() {
  if (!session()) return null;
  const { data, error } = await (await getClient())
    .from("profiles")
    .select("*")
    .eq("id", session().user.id)
    .maybeSingle();
  if (error) throw error;
  write("account-equipment", data?.equipped ?? {});
  if (data)
    write("account-summary", {
      username: data.username,
      level: data.level,
      xp: data.xp,
      equipped: data.equipped,
    });
  return data;
}
export async function publicProfile(username) {
  const { data, error } = await (await getClient())
    .from("public_profiles")
    .select("username,avatar_id,country,level,equipped")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data;
}
