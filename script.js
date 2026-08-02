window.__portfolioErrors = [];
window.addEventListener("error", (event) => {
  window.__portfolioErrors.push(event.message || "Unknown runtime error");
});
window.addEventListener("unhandledrejection", (event) => {
  window.__portfolioErrors.push(String(event.reason || "Unhandled promise rejection"));
});

const header = document.getElementById("header");
const hero = document.getElementById("hero");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const siteNav = document.getElementById("siteNav");
const main = document.getElementById("main");
const wordmark = document.querySelector(".wordmark");
const headerCta = document.querySelector(".header-cta");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

if (header && hero && "IntersectionObserver" in window) {
  const headerObserver = new IntersectionObserver(
    ([entry]) => header.classList.toggle("is-scrolled", entry.boundingClientRect.top < -24),
    { threshold: [0, 1] }
  );

  headerObserver.observe(hero);
}

const revealElements = [
  ...document.querySelectorAll("[data-reveal]"),
  ...document.querySelectorAll(".project-row"),
];

function animateReveal(element) {
  if (reduceMotion.matches || element.dataset.motionPlayed === "true") return;
  element.dataset.motionPlayed = "true";

  const kind = element.dataset.reveal;
  const sharedOptions = {
    duration: 540,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  if (element.classList.contains("project-row")) {
    const parts = element.querySelectorAll(".project-name > span");
    parts.forEach((part, index) => {
      part.animate(
        [
          { opacity: 0, transform: "translate3d(0, 72%, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        { ...sharedOptions, delay: index * 45 }
      );
    });
    return;
  }

  const frames = {
    type: [
      { opacity: 0.18, clipPath: "inset(0 0 100% 0)", transform: "translate3d(0, 28px, 0)" },
      { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "translate3d(0, 0, 0)" },
    ],
    press: [
      { opacity: 0.3, clipPath: "inset(0 100% 0 0)" },
      { opacity: 1, clipPath: "inset(0 0 0 0)" },
    ],
    quote: [
      { opacity: 0.25, clipPath: "inset(0 0 18% 0)", transform: "translate3d(0, 42px, 0)" },
      { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "translate3d(0, 0, 0)" },
    ],
    image: [
      { opacity: 0.45, clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
      { opacity: 1, clipPath: "polygon(0 2%, 96% 0, 100% 96%, 3% 100%)" },
    ],
    rule: [
      { opacity: 0.35, transform: "scaleX(0.92)" },
      { opacity: 1, transform: "scaleX(1)" },
    ],
  };

  element.animate(frames[kind] || frames.type, sharedOptions);
}

function revealEverything() {
  document.body.classList.remove("motion-ready");
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

if (!reduceMotion.matches && "IntersectionObserver" in window) {
  document.body.classList.add("motion-ready");

  const markViewportReveals = () => {
    revealElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.93 && rect.bottom > 0) {
        animateReveal(element);
        element.classList.add("is-visible");
      }
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateReveal(entry.target);
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.13, rootMargin: "0px 0px -7% 0px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
  markViewportReveals();
  window.setTimeout(markViewportReveals, 120);
  reduceMotion.addEventListener("change", ({ matches }) => {
    if (matches) revealEverything();
  });
} else {
  revealEverything();
}

let focusBeforeMenu = null;

function setPageInert(enabled) {
  [main, wordmark, menuToggle, headerCta].forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    element.inert = enabled;
  });
}

function setInstantMenu(enabled) {
  if (!siteNav || !enabled) return;
  siteNav.classList.add("instant");
  requestAnimationFrame(() => siteNav.classList.remove("instant"));
}

function openMenu(instant = false) {
  if (!siteNav || !menuToggle || !menuClose) return;
  focusBeforeMenu = document.activeElement;
  setInstantMenu(instant || reduceMotion.matches);
  siteNav.classList.add("is-open");
  document.body.classList.add("menu-open");
  menuToggle.setAttribute("aria-expanded", "true");
  setPageInert(true);
  menuClose.focus({ preventScroll: true });
}

function closeMenu(instant = false, restoreFocus = true) {
  if (!siteNav || !menuToggle) return;
  setInstantMenu(instant || reduceMotion.matches);
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  setPageInert(false);

  if (restoreFocus && focusBeforeMenu instanceof HTMLElement) {
    focusBeforeMenu.focus({ preventScroll: true });
  }
}

menuToggle?.addEventListener("click", (event) => openMenu(event.detail === 0));
menuClose?.addEventListener("click", (event) => closeMenu(event.detail === 0));

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => closeMenu(event.detail === 0, false));
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    const selector = link.getAttribute("href");
    const target = selector && selector !== "#" ? document.querySelector(selector) : null;
    if (!(target instanceof HTMLElement)) return;

    event.preventDefault();
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    const headerOffset = header?.getBoundingClientRect().height || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: targetTop, behavior: "auto" });
    history.pushState(null, "", selector);
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousBehavior;
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (!siteNav?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu(true);
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...siteNav.querySelectorAll("button, a[href]")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function attachMagneticMotion(element) {
  const strength = 0.14;
  let bounds = null;
  let frame = 0;
  let nextX = 0;
  let nextY = 0;

  element.addEventListener("pointerenter", () => {
    if (reduceMotion.matches || !finePointer.matches) return;
    bounds = element.getBoundingClientRect();
  });

  element.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || !finePointer.matches || !bounds) return;
    const offsetX = event.clientX - (bounds.left + bounds.width / 2);
    const offsetY = event.clientY - (bounds.top + bounds.height / 2);
    nextX = offsetX * strength;
    nextY = offsetY * strength;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      element.style.translate = `${nextX}px ${nextY}px`;
      frame = 0;
    });
  });

  element.addEventListener("pointerleave", () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    bounds = null;
    element.style.translate = "0 0";
  });
}

document.querySelectorAll(".magnetic").forEach(attachMagneticMotion);

document.querySelectorAll("figure img").forEach((image) => {
  image.addEventListener("error", () => {
    image.closest("figure")?.setAttribute("data-error", "true");
    image.hidden = true;
  });
});

const loopingElements = [...document.querySelectorAll(".contact-stamp")];

document.addEventListener("visibilitychange", () => {
  const state = document.hidden ? "paused" : "running";
  loopingElements.forEach((element) => {
    element.style.animationPlayState = state;
  });
});
