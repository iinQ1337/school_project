/*
 * Размер сцены. Макет — рабочая область 1440×1080 (4:3). Сцена вписывается в окно
 * целиком: по ширине и по высоте, — чтобы каждый экран помещался на одну страницу
 * и на маленьких и почти квадратных мониторах (1024×768, 1280×1024). Крупнее
 * макета не растягиваем. Экран — ровно высота окна, сцена в нём по центру.
 */

const STAGE_W = 1440;
const STAGE_H = 1080;

// поля по бокам: на 4:3 сцена иначе встала бы вплотную к краям окна
const sideGutter = (w) => Math.min(48, Math.max(16, w * 0.03));

export const stage = { scale: 1, top: 0, height: STAGE_H };

export function updateStage() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  stage.scale = Math.min(1, (w - 2 * sideGutter(w)) / STAGE_W, h / STAGE_H);
  stage.height = h;
  stage.top = (h - STAGE_H * stage.scale) / 2;

  const root = document.documentElement.style;
  root.setProperty("--stage-scale", String(stage.scale));
  root.setProperty("--stage-top", `${stage.top}px`);
  root.setProperty("--screen-h", `${h}px`);
}
