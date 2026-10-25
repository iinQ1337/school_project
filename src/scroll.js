import { stage } from "./stage.js";

const REVEAL_EDGE = 0.06; 

function stageOffset(el) {
  let top = 0;
  let node = el;
  while (node && !node.classList.contains("screen__stage")) {
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return top;
}

function initReveal() {
  const items = [...document.querySelectorAll(".reveal")].map((el) => ({ el, screen: el.closest(".screen") }));
  let raf = 0;

  const measure = () => {
    const { scale } = stage;
    for (const item of items) {
      const top = item.screen.offsetTop + stage.top + stageOffset(item.el) * scale;
      item.top = top;
      item.bottom = top + item.el.offsetHeight * scale;
    }
  };

  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    const from = window.scrollY + vh * REVEAL_EDGE;
    const to = window.scrollY + vh * (1 - REVEAL_EDGE);
    for (const { el, top, bottom } of items) {
      const inview = bottom > from && top < to;
      el.classList.toggle("is-inview", inview);
      if (!inview) el.classList.toggle("is-above", bottom <= from);
    }
  };

  const request = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    request();
  });
  document.fonts?.ready.then(() => {
    measure();
    update();
  });
  measure();
  update();
}

function initNavSpy() {
  const links = new Map(
    [...document.querySelectorAll(".site-nav__link")].map((a) => [a.getAttribute("href").slice(1), a]),
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.dataset.nav;
        links.forEach((a, key) => {
          const on = key === id;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      }
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );
  document.querySelectorAll("[data-nav]").forEach((s) => io.observe(s));
}

function initNavTheme() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;
  const screens = [...document.querySelectorAll(".screen")];
  const PROBE_PX = 85;
  let raf = 0;
  const update = () => {
    raf = 0;
    const y = stage.top + PROBE_PX * stage.scale;
    const under = screens.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    nav.dataset.theme = under?.dataset.theme ?? "dark";
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true },
  );
  window.addEventListener("resize", update);
  update();
}

const PAGE_MS = 900;
const WHEEL_THRESHOLD = 30; 
const WHEEL_IDLE_MS = 180; 
const SWIPE_PX = 50;
const SETTLE_MS = 150; 

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function initPager() {
  const screens = [...document.querySelectorAll(".screen")];
  if (!screens.length) return;
  const button = document.querySelector(".scroll-down");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const last = screens.length - 1;

  let index = 0;
  let raf = 0;
  let animating = false;

  const nearest = () => {
    let best = 0;
    screens.forEach((s, i) => {
      if (Math.abs(s.offsetTop - window.scrollY) < Math.abs(screens[best].offsetTop - window.scrollY)) best = i;
    });
    return best;
  };

  const setIndex = (i) => {
    index = Math.max(0, Math.min(last, i));
    button?.classList.toggle("is-hidden", index === last);
  };

  function goTo(i) {
    setIndex(i);
    cancelAnimationFrame(raf);
    animating = false;
    const from = window.scrollY;
    const to = screens[index].offsetTop;
    if (from === to) return;
    if (reducedMotion.matches) {
      window.scrollTo(0, to);
      return;
    }
    animating = true;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / PAGE_MS);
      window.scrollTo(0, from + (to - from) * easeInOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else animating = false;
    };
    raf = requestAnimationFrame(step);
  }

  let wheelSum = 0;
  let wheelSpent = false;
  let wheelTimer = 0;
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; 
      e.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelSum = 0;
        wheelSpent = false;
      }, WHEEL_IDLE_MS);
      if (wheelSpent || animating) return;
      wheelSum += e.deltaMode === 0 ? e.deltaY : e.deltaY * 40; 
      if (Math.abs(wheelSum) < WHEEL_THRESHOLD) return;
      wheelSpent = true;
      goTo(index + Math.sign(wheelSum));
    },
    { passive: false },
  );

  window.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    let target;
    switch (e.key) {
      case "ArrowDown":
      case "PageDown":
        target = index + 1;
        break;
      case "ArrowUp":
      case "PageUp":
        target = index - 1;
        break;
      case " ":
        if (e.target.closest?.("button, a")) return; 
        target = e.shiftKey ? index - 1 : index + 1;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    goTo(target);
  });

  let touchY = null;
  window.addEventListener(
    "touchstart",
    (e) => {
      touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (touchY !== null) e.preventDefault();
    },
    { passive: false },
  );
  window.addEventListener("touchend", (e) => {
    if (touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) > SWIPE_PX) goTo(index + Math.sign(dy));
  });

  document.querySelectorAll('.site-nav a[href^="#"]').forEach((a) => {
    const i = screens.findIndex((s) => s.id === a.hash.slice(1));
    if (i < 0) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(i);
    });
  });
  button?.addEventListener("click", () => goTo(index + 1));

  let settleTimer = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (animating) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (!animating) goTo(nearest());
      }, SETTLE_MS);
    },
    { passive: true },
  );

  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    animating = false;
    window.scrollTo(0, screens[index].offsetTop);
  });

  const fromHash = screens.findIndex((s) => s.id && `#${s.id}` === window.location.hash);
  setIndex(fromHash >= 0 ? fromHash : nearest());
  window.scrollTo(0, screens[index].offsetTop);
}

export function initScroll() {
  initPager();
  initReveal();
  initNavSpy();
  initNavTheme();
}
