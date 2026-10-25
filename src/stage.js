const STAGE_W = 1440;
const STAGE_H = 1080;

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
