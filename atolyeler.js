import { initContactForm } from "./contact.js";
import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
setLenis(lenis);

initNavHover();
initMobileMenu();
initContactForm();
initTransitions();

// ── Scroll reveals ─────────────────────────────────────────
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  if (reducedMotion) {
    const all = document.querySelectorAll("[data-reveal]");
    gsap.set(all, { opacity: 0 });
    ScrollTrigger.batch(all, {
      onEnter: (batch) => gsap.to(batch, { opacity: 1, duration: 0.5, stagger: 0.05 }),
      once: true,
      start: "top 92%",
    });
    return;
  }

  // Section label'lar — clip-path wipe
  document.querySelectorAll("[data-reveal='label']").forEach((el) => {
    gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => gsap.to(el, { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "power3.inOut" }),
    });
  });

  // Muny tanıtım — karşılıklı slide
  const fromLeftEls = document.querySelectorAll("[data-reveal='from-left']");
  const fromRightEls = document.querySelectorAll("[data-reveal='from-right']");

  fromLeftEls.forEach((el) => {
    gsap.set(el, { opacity: 0, x: -50, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  fromRightEls.forEach((el) => {
    gsap.set(el, { opacity: 0, x: 50, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, x: 0, duration: 0.9, delay: 0.1, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  // Atölye satırları — y + opacity, her biri kendi trigger'ına sahip
  document.querySelectorAll("[data-reveal='row']").forEach((el) => {
    gsap.set(el, { opacity: 0, y: 60, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  // Kareler grid — scale + opacity stagger
  const photos = document.querySelectorAll("[data-reveal='photo']");
  gsap.set(photos, { opacity: 0, scale: 0.95, willChange: "transform, opacity" });
  ScrollTrigger.batch(photos, {
    start: "top 90%",
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "will-change",
      });
    },
    once: true,
  });

  // ── Lightbox ────────────────────────────────────────────
  const lightbox = document.createElement("div");
  lightbox.id = "lightbox";
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Kapat">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <line x1="4" y1="4" x2="20" y2="20" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="20" y1="4" x2="4" y2="20" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
    <img class="lightbox-img" src="" alt="" />
  `;
  document.body.appendChild(lightbox);

  const lbClose = lightbox.querySelector(".lightbox-close");
  const lbImg = lightbox.querySelector(".lightbox-img");

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt;
    lightbox.classList.add("is-open");
    lenis.stop();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lenis.start();
  }

  document.querySelectorAll(".kareler-item img").forEach((img) => {
    img.style.cursor = "zoom-in";
    img.parentElement.addEventListener("click", () => openLightbox(img.src, img.alt));
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  lbClose.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
});
