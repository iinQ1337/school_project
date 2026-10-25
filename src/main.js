import { initDefense1941 } from "./defense1941-ui.js";
import { initGlass } from "./glass.js";
import { initScroll } from "./scroll.js";
import { updateStage } from "./stage.js";

const root = document.documentElement;

// до initScroll: его обработчики resize читают уже пересчитанный размер сцены
updateStage();
window.addEventListener("resize", updateStage);

// Описание на первом экране: самый крупный кегль, при котором оба абзаца
// заканчиваются над нижним краем сцены. Меряем в координатах сцены, поэтому
// от размера окна результат не зависит — только от шрифта: перемеряем, когда он загрузится
const HERO_TEXT_BOTTOM = 1040; // px сцены 1440×1080
const HERO_TEXT_SIZES = { max: 22, min: 15, step: 0.5 };
function fitHeroText() {
  const box = document.querySelector(".hero__text");
  if (!box) return;
  const limit = HERO_TEXT_BOTTOM - box.offsetTop;
  for (let size = HERO_TEXT_SIZES.max; size >= HERO_TEXT_SIZES.min; size -= HERO_TEXT_SIZES.step) {
    box.style.setProperty("--hero-lead-size", `${size}px`);
    if (box.offsetHeight <= limit) break;
  }
}
fitHeroText();
document.fonts?.ready.then(fitHeroText); // до initScroll: .reveal перемеряются после этого

initDefense1941(); // до initScroll: календарь и сводка должны быть в DOM, когда меряются .reveal
initScroll();
initGlass();

// выделение отключено в CSS; перетаскивание картинок — здесь (Firefox не знает -webkit-user-drag)
document.addEventListener("dragstart", (e) => e.preventDefault());

// ---------- Появление ----------
// Ждём шрифты (не дольше 2 с), чтобы текст не прыгнул при подмене шрифта, затем
// включаем CSS-анимации (html.is-ready). Когда всё появилось, снимаем .intro —
// дальше тексты ведёт скролл.
const INTRO_MS = 2100;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fontsReady = Promise.all([
  document.fonts.load("900 96px 'Roboto Flex'"),
  document.fonts.load("410 16px 'Roboto Flex'"),
  document.fonts.load("40px Caveat"),
]).catch(() => {});

Promise.race([fontsReady, wait(2000)]).then(() => {
  requestAnimationFrame(() => {
    root.classList.add("is-ready");
    setTimeout(() => root.classList.remove("intro"), INTRO_MS);
  });
});
