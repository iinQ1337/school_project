/*
 * Liquid glass для меток фортов.
 *
 * Преломление: карта смещений для капсулы 47.556×35.159 (размер стекла из макета)
 * рисуется на canvas и подключается в SVG-фильтр feDisplacementMap. Чем ближе к краю
 * капсулы, тем сильнее карта под стеклом «затягивается» внутрь — как у толстой линзы.
 * Фильтр висит на .fort__lens, которая не повёрнута относительно стекла, поэтому
 * одна карта смещений подходит для всех меток.
 */

const GLASS_W = 47.556;
const GLASS_H = 35.159;
const MAP_SCALE = 3; // разрешение карты смещений относительно css px
const REFRACTION = { rest: 5, hover: 16 }; // px, сила преломления у края

function buildDisplacementMap() {
  const w = Math.ceil(GLASS_W * MAP_SCALE);
  const h = Math.ceil(GLASS_H * MAP_SCALE);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);

  const r = GLASS_H / 2;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = (px + 0.5) / MAP_SCALE;
      const y = (py + 0.5) / MAP_SCALE;
      // ближайшая точка на средней линии капсулы
      const qx = Math.min(Math.max(x, r), GLASS_W - r);
      const vx = x - qx;
      const vy = y - r;
      const d = Math.hypot(vx, vy);
      let dx = 0;
      let dy = 0;
      if (d > 0.0001 && d <= r) {
        const t = Math.min(1, (r - d) / (r * 0.85)); // 0 у края, 1 в глубине
        const m = (1 - t) ** 2.5;
        dx = (-vx / d) * m;
        dy = (-vy / d) * m;
      }
      const i = (py * w + px) * 4;
      img.data[i] = Math.round(128 + dx * 127);
      img.data[i + 1] = Math.round(128 + dy * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

function injectFilters() {
  const href = buildDisplacementMap();
  const filter = (id, scale) => `
    <filter id="${id}" x="0" y="0" width="${GLASS_W}" height="${GLASS_H}"
      filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage href="${href}" x="0" y="0" width="${GLASS_W}" height="${GLASS_H}"
        preserveAspectRatio="none" result="lens" />
      <feDisplacementMap in="SourceGraphic" in2="lens" scale="${scale}"
        xChannelSelector="R" yChannelSelector="G" />
    </filter>`;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.innerHTML = `<defs>${filter("fort-refract-rest", REFRACTION.rest)}${filter("fort-refract-hover", REFRACTION.hover)}</defs>`;
  document.body.appendChild(svg);
  document.documentElement.classList.add("glass-ready");
}

// капсула чуть тянется к курсору и сплющивается поперёк движения — «желе»
function bindJelly(fort) {
  const set = (dx, dy) => {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    fort.style.setProperty("--jx", `${dx * 3}px`);
    fort.style.setProperty("--jy", `${dy * 3}px`);
    fort.style.setProperty("--stx", (ax * 0.1 - ay * 0.05).toFixed(3));
    fort.style.setProperty("--sty", (ay * 0.1 - ax * 0.05).toFixed(3));
    fort.style.setProperty("--hx", dx.toFixed(3));
    fort.style.setProperty("--hy", dy.toFixed(3));
  };
  fort.addEventListener("pointermove", (e) => {
    const r = fort.getBoundingClientRect();
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    set(clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2)), clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
  });
  fort.addEventListener("pointerleave", () => set(0, 0));
}

export function initGlass(root = document) {
  const forts = [...root.querySelectorAll(".fort")];
  if (!forts.length) return;
  injectFilters();
  forts.forEach(bindJelly);
}
