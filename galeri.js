import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
setLenis(lenis);

initNavHover();
initMobileMenu();
initTransitions();

// ── Görseller ──────────────────────────────────────────────
const IMAGES = [
  { src: "/portfolio/1.webp", alt: "" },
  { src: "/portfolio/2.webp", alt: "" },
  { src: "/portfolio/3.webp", alt: "" },
  { src: "/portfolio/4.webp", alt: "" },
  { src: "/portfolio/5.webp", alt: "" },
  { src: "/portfolio/6.webp", alt: "" },
  { src: "/portfolio/7.webp", alt: "" },
  { src: "/portfolio/8.webp", alt: "" },
  { src: "/portfolio/9.webp", alt: "" },
];

const grid = document.getElementById("galeri-grid");
let currentIndex = 0;

// Grid'i doldur
IMAGES.forEach((image, i) => {
  const item = document.createElement("div");
  item.className = "galeri-item";
  item.dataset.index = String(i);

  const img = document.createElement("img");
  img.src = image.src;
  img.alt = image.alt;
  img.loading = i < 4 ? "eager" : "lazy";

  item.appendChild(img);
  grid.appendChild(item);
});

// ── Scroll reveal ──────────────────────────────────────────
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-reveal='label']").forEach((el) => {
  if (reducedMotion) {
    gsap.set(el, { opacity: 0 });
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => gsap.to(el, { opacity: 1, duration: 0.5 }),
    });
    return;
  }
  gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
  ScrollTrigger.create({
    trigger: el, start: "top 92%", once: true,
    onEnter: () => gsap.to(el, { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "power3.inOut" }),
  });
});

const items = grid.querySelectorAll(".galeri-item");
gsap.set(items, { opacity: 0, y: 32, scale: 0.97 });
ScrollTrigger.batch(items, {
  start: "top 92%",
  onEnter: (batch) => gsap.to(batch, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.7, stagger: 0.06, ease: "power3.out",
    clearProps: "will-change",
  }),
  once: true,
});

// ── Lightbox ───────────────────────────────────────────────
const lightbox = document.createElement("div");
lightbox.className = "galeri-lightbox";
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.innerHTML = `
  <button class="galeri-lightbox-close" aria-label="Kapat">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <line x1="4" y1="4" x2="24" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="24" y1="4" x2="4" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
  <button class="galeri-lightbox-prev" aria-label="Önceki">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M17 6L9 14L17 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  <img class="galeri-lightbox-img" src="" alt="" />
  <button class="galeri-lightbox-next" aria-label="Sonraki">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M11 6L19 14L11 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  <span class="galeri-lightbox-counter"></span>
`;
document.body.appendChild(lightbox);

const lbImg = lightbox.querySelector(".galeri-lightbox-img");
const lbCounter = lightbox.querySelector(".galeri-lightbox-counter");
const lbClose = lightbox.querySelector(".galeri-lightbox-close");
const lbPrev = lightbox.querySelector(".galeri-lightbox-prev");
const lbNext = lightbox.querySelector(".galeri-lightbox-next");

function openLightbox(index) {
  currentIndex = index;
  lbImg.src = IMAGES[currentIndex].src;
  lbImg.alt = IMAGES[currentIndex].alt;
  lbCounter.textContent = `${currentIndex + 1} / ${IMAGES.length}`;
  lightbox.classList.add("is-open");
  lenis.stop();
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lenis.start();
  document.body.style.overflow = "";
}

function navigate(dir) {
  currentIndex = (currentIndex + dir + IMAGES.length) % IMAGES.length;
  gsap.to(lbImg, {
    opacity: 0, x: dir * -30, duration: 0.18, ease: "power2.in",
    onComplete: () => {
      lbImg.src = IMAGES[currentIndex].src;
      lbCounter.textContent = `${currentIndex + 1} / ${IMAGES.length}`;
      gsap.fromTo(lbImg, { opacity: 0, x: dir * 30 }, { opacity: 1, x: 0, duration: 0.22, ease: "power2.out" });
    },
  });
}

grid.addEventListener("click", (e) => {
  const item = e.target.closest(".galeri-item");
  if (!item) return;
  openLightbox(Number(item.dataset.index));
});

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", () => navigate(-1));
lbNext.addEventListener("click", () => navigate(1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("is-open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "ArrowRight") navigate(1);
});
