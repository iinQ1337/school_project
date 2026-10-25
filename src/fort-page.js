import { FORTS } from "./forts.js";
import { updateStage } from "./stage.js";

const PHOTOS = import.meta.glob("./assets/forts/*.jpg", { eager: true, import: "default" });
const photoUrl = (file) => PHOTOS[`./assets/forts/${file}`];

const SWITCH_OUT_MS = 220; 
const TEXT_SIZES = { max: 22, min: 16, step: 0.5 }; 

const page = document.querySelector(".fort-page");
const field = (name) => page.querySelector(`[data-field="${name}"]`);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

updateStage();
window.addEventListener("resize", updateStage);

const indexFromUrl = () => {
  const n = Number(new URLSearchParams(window.location.search).get("n"));
  return Number.isInteger(n) && n >= 1 && n <= FORTS.length ? n - 1 : 0;
};

let current = indexFromUrl();

const list = field("list");
const links = FORTS.map((fort, i) => {
  const a = document.createElement("a");
  a.className = "fort-page__link";
  a.href = `?n=${i + 1}`;
  a.textContent = fort.numeral;
  a.setAttribute("aria-label", `Форт ${fort.numeral}`);
  list.appendChild(a);
  return a;
});

function fitText() {
  const col = page.querySelector(".fort-page__col--text");
  for (let size = TEXT_SIZES.max; size >= TEXT_SIZES.min; size -= TEXT_SIZES.step) {
    col.style.setProperty("--fort-text-size", `${size}px`);
    if (col.scrollHeight <= col.clientHeight) break;
  }
}

function render(i) {
  const fort = FORTS[i];
  document.title = `Форт ${fort.numeral} — Форты Брестской крепости`;
  field("numeral").textContent = fort.numeral;
  field("place").textContent = fort.place;
  field("history").innerHTML = fort.history;
  field("now").innerHTML = fort.now;

  const img = field("photo");
  img.src = photoUrl(fort.photo.file);
  img.alt = fort.photo.alt;
  field("photo-frame").classList.toggle("is-contain", Boolean(fort.photo.contain));
  field("credit").innerHTML = `${fort.photo.caption} · ${fort.photo.author}, <a href="${fort.photo.url}" target="_blank" rel="noopener">${fort.photo.license} · Wikimedia Commons</a>`;

  field("facts").innerHTML = fort.facts
    .map((f) => `<div class="fort-fact"><dt class="fort-fact__value">${f.value}</dt><dd class="fort-fact__label">${f.label}</dd></div>`)
    .join("");

  links.forEach((a, k) => {
    a.classList.toggle("is-active", k === i);
    if (k === i) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  fitText();
}

function show(i, { push = true } = {}) {
  if (i === current && push) return;
  current = i;
  if (push) history.pushState({ n: i + 1 }, "", `?n=${i + 1}`);
  if (reducedMotion.matches) {
    render(i);
    return;
  }
  page.classList.add("is-leaving");
  setTimeout(() => {
    render(i);
    page.classList.remove("is-leaving");
    page.classList.remove("is-entering");
    void page.offsetWidth;
    page.classList.add("is-entering");
  }, SWITCH_OUT_MS);
}

list.addEventListener("click", (e) => {
  const a = e.target.closest(".fort-page__link");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return; 
  e.preventDefault();
  show(links.indexOf(a));
});


window.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
  if (!step) return;
  e.preventDefault();
  show((current + step + FORTS.length) % FORTS.length);
});

window.addEventListener("popstate", () => show(indexFromUrl(), { push: false }));

render(current);
document.fonts?.ready.then(fitText);

// появление после загрузки шрифтов (не дольше 2 с), как на главной
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2000)]).then(() => {
  requestAnimationFrame(() => page.classList.add("is-entering"));
});
