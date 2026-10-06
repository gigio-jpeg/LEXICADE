export const bossWave = (wave) => wave % 5 === 0;
export const waveCount = (wave) => Math.min(9, 2 + Math.floor(wave / 2));
export const waveSpeed = (wave) => Math.min(48, 7 + wave * 2);
export function hitEnemy(enemies, word) {
  const i = enemies.findIndex((e) => e.word === word);
  return i < 0 ? null : enemies[i];
}
