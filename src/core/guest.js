import { read, write } from "./storage.js";
import { rewards, levelForXP } from "./scoring.js";
import { dayKey } from "./rng.js";

export const guestProfile = () => ({
  xp: 0,
  coins: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  bests: {},
  history: [],
  achievements: [],
  items: [],
  equipped: {},
  daily: {},
  ...read("guest", {}),
});
export function saveGuest(result) {
  const p = guestProfile();
  const key = `${result.game}:${result.mode}:${result.lang}`;
  const old = p.bests[key]?.score ?? 0;
  const record = result.score > old;
  const today = dayKey();
  const dailyKey = `${today}:${result.game}:${result.lang}`;
  if (result.daily && p.daily[dailyKey]) {
    return {
      xp_ganho: 0,
      moedas_ganhas: 0,
      novo_recorde: false,
      level: p.level,
    };
  }
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (p.lastDay !== today)
    p.streak = p.lastDay === yesterday ? p.streak + 1 : 1;
  p.lastDay = today;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  const daily = result.daily && !p.daily[dailyKey];
  const reward = rewards({
    score: result.score,
    duration: result.duration_ms,
    record,
    daily,
    streak: p.streak,
  });
  p.xp += reward.xp;
  p.coins += reward.coins;
  p.level = levelForXP(p.xp);
  if (record) p.bests[key] = result;
  p.totalRounds = (p.totalRounds ?? p.history.length) + 1;
  p.totalTime = (p.totalTime ?? 0) + result.duration_ms;
  p.gameCounts = {
    ...p.gameCounts,
    [result.game]: (p.gameCounts?.[result.game] ?? 0) + 1,
  };
  if (result.game === "decifra") {
    const ds = p.decifraStats ?? {
      played: 0,
      wins: 0,
      streak: 0,
      bestStreak: 0,
      distribution: {},
    };
    ds.played++;
    if (result.metrics.resolvido) {
      ds.wins++;
      ds.streak++;
      ds.bestStreak = Math.max(ds.bestStreak, ds.streak);
      ds.distribution[result.metrics.tentativas] =
        (ds.distribution[result.metrics.tentativas] ?? 0) + 1;
    } else ds.streak = 0;
    p.decifraStats = ds;
  }
  p.gamesPlayed = [...new Set([...(p.gamesPlayed ?? []), result.game])];
  p.languagesPlayed = [...new Set([...(p.languagesPlayed ?? []), result.lang])];
  p.history = [
    { ...result, created_at: new Date().toISOString() },
    ...p.history,
  ].slice(0, 200);
  if (result.daily) p.daily[dailyKey] = true;
  write("guest", p);
  return {
    xp_ganho: reward.xp,
    moedas_ganhas: reward.coins,
    novo_recorde: record,
    level: p.level,
  };
}
export function unlockGuest(catalog) {
  const p = guestProfile();
  const unlocked = [];
  for (const achievement of catalog) {
    if (p.achievements.includes(achievement.id)) continue;
    const target = achievement.target;
    const value =
      achievement.kind === "games"
        ? (p.gamesPlayed ?? []).length
        : achievement.kind === "langs"
          ? (p.languagesPlayed ?? []).length
          : achievement.kind === "level"
            ? p.level
            : achievement.kind === "streak"
              ? p.streak
              : achievement.kind === "ppm"
                ? Math.max(0, ...p.history.map((r) => r.metrics?.ppm ?? 0))
                : achievement.kind === "score"
                  ? Math.max(0, ...p.history.map((r) => r.score))
                  : (p.totalRounds ?? p.history.length);
    if (value >= target) {
      p.achievements.push(achievement.id);
      p.xp += achievement.xp;
      p.coins += achievement.coins;
      unlocked.push(achievement);
    }
  }
  p.level = levelForXP(p.xp);
  write("guest", p);
  return unlocked;
}
export function buyGuest(item) {
  const p = guestProfile();
  if (p.items.includes(item.id)) return true;
  if (p.coins < item.price) return false;
  p.coins -= item.price;
  p.items.push(item.id);
  write("guest", p);
  return true;
}
export function equipGuest(item) {
  const p = guestProfile();
  if (!p.items.includes(item.id)) return false;
  p.equipped[item.type] = item.id;
  write("guest", p);
  return true;
}
