import { initDefense1941 } from "./defense1941-ui.js";
import { initGlass } from "./glass.js";
import { initScroll } from "./scroll.js";
import { updateStage } from "./stage.js";

const root = document.documentElement;

// до initScroll: его обработчики resize читают уже пересчитанный размер сцены
updateStage();
window.addEventListener("resize", updateStage);

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
