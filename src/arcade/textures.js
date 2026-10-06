import * as THREE from "../../vendor/three/three.module.js";
import { t, lang } from "../core/i18n.js";
import { COLORS } from "./navigation.js";
const surface = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d") };
};
export function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
export function marquee(name, index) {
  const { canvas, ctx } = surface(1024, 224),
    color = COLORS[index];
  const fill = ctx.createLinearGradient(0, 0, 1024, 224);
  fill.addColorStop(0, "#152b2a");
  fill.addColorStop(1, "#060b14");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 1024, 224);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 1000, 200);
  ctx.fillStyle = color;
  ctx.font = 'bold 82px "Silkscreen",monospace';
  ctx.textAlign = "center";
  ctx.shadowColor = color;
  ctx.shadowBlur = 28;
  ctx.fillText(name.toUpperCase(), 512, 135, 940);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.42;
  ctx.font = "19px monospace";
  ctx.fillText(`LEXICADE  /  0${index + 1}  /  WORDS ONLY`, 512, 181);
  return canvasTexture(canvas);
}
export function sideArt(index) {
  const { canvas, ctx } = surface(512, 1024),
    color = COLORS[index];
  ctx.fillStyle = "#0b121b";
  ctx.fillRect(0, 0, 512, 1024);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-50, 810 + i * 47);
    ctx.lineTo(480, 300 + i * 47);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#13232c";
  ctx.beginPath();
  ctx.arc(270, 435, 176, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = 'bold 176px "Silkscreen",monospace';
  ctx.fillText(["Aa", "?", "L", "AB"][index], 270, 489, 330);
  ctx.globalAlpha = 0.55;
  ctx.font = "18px monospace";
  ctx.fillText("LEXICADE  •  2026", 255, 925);
  return canvasTexture(canvas);
}
export function preview(index) {
  const { canvas, ctx } = surface(720, 600),
    color = COLORS[index];
  let last = -1;
  const draw = (time) => {
    if (Math.floor(time * 8) === last) return false;
    last = Math.floor(time * 8);
    ctx.fillStyle = "#061216";
    ctx.fillRect(0, 0, 720, 600);
    const glow = ctx.createRadialGradient(360, 270, 20, 360, 270, 500);
    glow.addColorStop(0, color + "19");
    glow.addColorStop(1, "#050a12");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 720, 600);
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = "18px monospace";
    ctx.fillText("LEXICADE  /  ORIGINAL ARCADE", 360, 45);
    if (index === 0) {
      ctx.font = "bold 29px monospace";
      const title=t("room.tagline"),split=title.lastIndexOf(" ",Math.ceil(title.length*.7));
      const words=[title.slice(0,split),title.slice(split+1)];
      words.forEach((word, i) => {
        ctx.fillStyle = i === 0 ? "#d8ede5" : color;
        ctx.fillText(word, 360, 222 + i * 54);
      });
      const typed = Math.floor(time * 6) % 27;
      ctx.fillStyle = color;
      ctx.fillRect(110 + Math.min(typed, 26) * 18, 312, 15, 3);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(110, 332, 500, 2);
      ctx.globalAlpha = 1;
      ctx.font = '50px "Silkscreen",monospace';
      ctx.fillText("60:00", 360, 435);
    } else if (index === 1) {
      const rows = lang()==="en" ? ["DREAM","CLOUD","WORDS"] : lang()==="es" ? ["SUENO","LIBRO","LETRA"] : ["SONHO", "LIVRO", "LETRA"];
      ctx.font = "bold 35px monospace";
      rows.forEach((word, row) =>
        [...word].forEach((letter, column) => {
          const x = 181 + column * 73,
            y = 133 + row * 78;
          ctx.fillStyle =
            row === 2 ? color : column === row ? "#65874b" : "#162b29";
          ctx.fillRect(x, y, 62, 64);
          ctx.fillStyle = row === 2 ? "#122419" : "#e9efd4";
          ctx.fillText(letter, x + 31, y + 45);
        }),
      );
      ctx.font = "19px monospace";
      ctx.fillStyle = color;
      ctx.fillText(t("room.guess").toUpperCase(), 360, 451,580);
    } else if (index === 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      for (let y = 0; y < 9; y++)
        for (let x = 0; x < 13; x++)
          if ((x * y + x + y) % 5 < 2) {
            ctx.strokeRect(111 + x * 38, 122 + y * 38, 30, 30);
          }
      ctx.shadowBlur = 0;
      ctx.font = "27px monospace";
      ctx.fillStyle = "#ffdca9";
      ["L", "E", "T", "R", "A"].forEach((l, i) =>
        ctx.fillText(l, 140 + i * 91, 205 + (i % 2) * 130),
      );
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(130 + ((time * 40) % 420), 398, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#181524";
      ctx.fillRect(133 + ((time * 40) % 420), 390, 5, 5);
    } else {
      ctx.font = "bold 58px monospace";
      ["L", "E", "T", "R", "A"].forEach((l, i) => {
        const x = 142 + i * 90,
          y = 217 + Math.sin(time + i) * 12;
        ctx.fillStyle = "#27273d";
        ctx.fillRect(x - 32, y - 47, 68, 81);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 32, y - 47, 68, 81);
        ctx.fillStyle = color;
        ctx.fillText(l, x + 2, y + 11);
      });
      ctx.font = "25px monospace";
      ctx.fillStyle = "#e9dffc";
      ctx.fillText(t("room.letters"), 360, 382,600);
    }
    ctx.fillStyle = color;
    ctx.font = '21px "Silkscreen",monospace';
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(time * 2);
    ctx.fillText(t("room.play").toUpperCase(), 360, 538);
    ctx.globalAlpha = 1;
    for (let y = 0; y < 600; y += 4) {
      ctx.fillStyle = "#00000022";
      ctx.fillRect(0, y, 720, 1);
    }
    return true;
  };
  draw(0);
  return { texture: canvasTexture(canvas), draw };
}
