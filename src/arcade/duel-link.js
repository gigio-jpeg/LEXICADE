import { read, write, remove } from "../core/storage.js";
export const validDuelId = (id) => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
export function rememberDuel(id) { if (validDuelId(id)) write('pending-duel', { id, at: Date.now() }); }
export function pendingDuel() { const value = read('pending-duel'); return value && Date.now() - value.at < 15 * 60 * 1000 && validDuelId(value.id) ? value.id : null; }
export const clearDuel = () => remove('pending-duel');
