const base = { background: '#060910', wall: '#090d15', floor: '#525967', ambient: '#94cde1', ground: '#1c1740', ambientIntensity: 1.5, keyIntensity: 1.4, exposure: 1.1, bloom: 0.22, shell: '#253347', dark: '#04090e', paintGain: 0.28 };
export const ROOM_THEMES = Object.freeze({
  neon: base,
  soft: { ...base, background: '#20242e', wall: '#313745', floor: '#777f90', ambient: '#d2ddff', ground: '#40465b', ambientIntensity: 2, shell: '#51596b', bloom: 0.08 },
  light: { ...base, background: '#dce5ee', wall: '#b8c7d6', floor: '#e0e8ee', ambient: '#ffffff', ground: '#8195aa', ambientIntensity: 2.6, keyIntensity: 2, exposure: 1.35, shell: '#d1dce5', dark: '#334a60', paintGain: 0.6, bloom: 0.04 },
  phosphor: { ...base, background: '#06140a', wall: '#11291a', floor: '#467b54', ambient: '#b1ffc7', ground: '#123b1b', shell: '#22432b', bloom: 0.3 },
  minimal: { ...base, background: '#181818', wall: '#303030', floor: '#7c7c7c', ambient: '#eeeeee', ground: '#282828', shell: '#525252', ambientIntensity: 2, bloom: 0 },
  nebula: { ...base, background: '#160d2b', wall: '#29173f', floor: '#725885', ambient: '#dbbaff', ground: '#4a1e70', shell: '#492b66', bloom: 0.3 },
  dawn: { ...base, background: '#301c24', wall: '#472631', floor: '#9b7079', ambient: '#ffd9ae', ground: '#5c2733', shell: '#774555', ambientIntensity: 2, bloom: 0.15 },
});
export const roomTheme = (name) => ROOM_THEMES[name] ?? ROOM_THEMES.neon;
