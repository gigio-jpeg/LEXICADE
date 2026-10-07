import { read, write } from "../core/storage.js";
import { session } from "../core/auth.js";
import { rpc } from "../core/api.js";
import { guestProfile } from "../core/guest.js";
export const FINISHES = Object.freeze({ original: { color: null, rounds: 0 }, sky: { color: '#65cfff', rounds: 3 }, violet: { color: '#bd97ff', rounds: 10 }, gold: { color: '#ffd078', rounds: 25 } });
export const STICKERS = Object.freeze({ none: { glyph: '', rounds: 0 }, star: { glyph: '★', rounds: 5 }, crown: { glyph: '♛', rounds: 25 } });
const key = () => `cabinet:${session()?.user.id ?? 'guest'}`;
export const cabinetStyle = () => ({ title: '', finish: 'original', sticker: 'none', ...read(key(), {}) });
export function applyCabinetStyle(value) { write(key(), value); document.dispatchEvent(new CustomEvent('cabinetstyle', { detail: value })); }
export async function loadCabinetStyle() {
  if (!session()) return { style: cabinetStyle(), rounds: guestProfile().totalRounds ?? 0 };
  const user = session().user.id;
  const data = await rpc('get_arcade_style');
  if (session()?.user.id === user) applyCabinetStyle(data.style);
  return data;
}
export async function saveCabinetStyle(style, rounds) {
  if (!FINISHES[style.finish] || !STICKERS[style.sticker] || FINISHES[style.finish].rounds > rounds || STICKERS[style.sticker].rounds > rounds) throw new Error('locked');
  const value = session() ? await rpc('save_arcade_style', { p_style: style }) : style;
  applyCabinetStyle(value); return value;
}
