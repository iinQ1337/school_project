import { DAYS } from "./defense1941.js";

/*
 * Экран «1941»: календарь 22.06–23.07 (Figma: компонент Calendar/Day)
 * и сводка выбранного дня. Даты кликабельны, стрелки листают.
 */

const MONTH = { "06": "июнь", "07": "июль" };

const ordinal = (n) => `${n}-й день войны`;

export function initDefense1941(root = document) {
  const section = root.querySelector(".defense");
  if (!section) return;
  const calendar = section.querySelector(".defense__calendar");
  const report = section.querySelector(".defense__report");

  const cells = DAYS.map((day, i) => {
    const [d, m] = day.date.split(".");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day" + (day.key ? " day--key" : "");
    btn.dataset.index = String(i);
    btn.setAttribute("aria-label", `${Number(d)} ${m === "06" ? "июня" : "июля"} — ${day.title}`);
    // месяц подписан только у первого дня каждого месяца — меньше шума в сетке
    const firstOfMonth = i === 0 || d === "01";
    btn.innerHTML = `<span class="day__num">${Number(d)}</span>${firstOfMonth ? `<span class="day__month">${MONTH[m]}</span>` : ""}`;
    calendar.appendChild(btn);
    return btn;
  });

  let current = -1;

  function select(i, { focus = false } = {}) {
    if (i === current || i < 0 || i >= DAYS.length) return;
    cells[current]?.classList.remove("is-selected");
    cells[current]?.setAttribute("aria-pressed", "false");
    current = i;
    const cell = cells[i];
    cell.classList.add("is-selected");
    cell.setAttribute("aria-pressed", "true");
    if (focus) cell.focus();

    const day = DAYS[i];
    report.innerHTML = `
      <div class="report__body">
        <header class="report__head">
          <span class="report__date">${day.date}</span>
          <span class="report__day">${ordinal(i + 1)}</span>
        </header>
        <h3 class="report__title">${day.title}</h3>
        <p class="report__text">${day.text}</p>
      </div>
      <p class="report__source">по материалам Википедии: «Оборона Брестской крепости»</p>`;
  }

  cells.forEach((c) => c.setAttribute("aria-pressed", "false"));

  section.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-index]");
    if (btn && section.contains(btn)) select(Number(btn.dataset.index));
  });

  // ←/→ — по дням, ↑/↓ — по неделям
  calendar.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 }[e.key];
    if (!step) return;
    e.preventDefault();
    select(Math.max(0, Math.min(DAYS.length - 1, current + step)), { focus: true });
  });

  select(0);
}
