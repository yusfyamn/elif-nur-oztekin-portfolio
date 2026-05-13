import { initContactForm } from "./contact.js";
import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import { getDuyurular, getUrunler, getYorumlar } from "./content.js";
import { ensureSite } from "./site-chrome.js";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(CustomEase, SplitText, ScrollTrigger);
CustomEase.create("hop", "0.85, 0, 0.15, 1");

await ensureSite();

function setVhProp() {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
}
setVhProp();
window.addEventListener("orientationchange", () => {
  setTimeout(setVhProp, 200);
});

const isMobileDevice = () => window.innerWidth <= 1024;

const lenis = new Lenis({
  smoothTouch: true,
  lerp: 0.1,
  duration: 1.2,
  touchMultiplier: 1.5,
});

if (!isMobileDevice()) {
  lenis.on("scroll", ScrollTrigger.update);
}

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
  if (isMobileDevice()) {
    ScrollTrigger.update();
  }
});
gsap.ticker.lagSmoothing(0);
setLenis(lenis);

lenis.stop();
document.body.style.overflow = "hidden";

initTransitions({ skipEnter: true });

// ── Hero animasyonu ────────────────────────────────────────
const counterProgress = document.querySelector(".counter h1");
const counter = { value: 0 };

function initHeroAnimation() {
  const isMobile = window.innerWidth <= 1024;
  const split = SplitText.create(".hero-header h1", {
    type: isMobile ? "lines" : "words",
    mask: isMobile ? "lines" : "words",
    wordsClass: "word",
    linesClass: "word",
  });

  const counterTl = gsap.timeline({ delay: 0.5 });
  const overlayTextTl = gsap.timeline({ delay: 0.75 });
  const revealTl = gsap.timeline({ delay: 0.5 });

  counterTl.to(counter, {
    value: 100,
    duration: 5,
    ease: "power2.out",
    onUpdate: () => {
      counterProgress.textContent = Math.floor(counter.value);
    },
  });

  overlayTextTl
    .to(".overlay-text", { y: "0", duration: 0.75, ease: "hop" })
    .to(".overlay-text", { y: "-2rem", duration: 0.75, ease: "hop", delay: 0.75 })
    .to(".overlay-text", { y: "-4rem", duration: 0.75, ease: "hop", delay: 0.75 })
    .to(".overlay-text", { y: "-6rem", duration: 0.75, ease: "hop", delay: 1 });

  revealTl
    .to(".img", { y: 0, opacity: 1, stagger: 0.05, duration: 1, ease: "hop" })
    .to(".hero-images", { gap: "0.75vw", duration: 1, delay: 0.5, ease: "hop" })
    .to(".img", { scale: 1, duration: 1, ease: "hop" }, "<")
    .to(".img:not(.hero-img)", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      stagger: 0.1,
      ease: "hop",
    })
    .to(".hero-img", { scale: 2, duration: 1, ease: "hop" })
    .to(".hero-overlay", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      ease: "hop",
    })
    .to(
      ".hero-header h1 .word",
      { y: "0", duration: 0.75, stagger: 0.1, ease: "power3.out" },
      "-=0.5"
    )
    .to(".hero-side", { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.3")
    .call(() => {
      document.body.style.overflow = "";
      lenis.start();
    })
    .call(() => {
      document.querySelector(".page-content").style.pointerEvents = "auto";
      document.querySelector(".site-footer").style.pointerEvents = "auto";
      gsap.to([".page-content", ".site-footer"], {
        opacity: 1,
        duration: 0.9,
        ease: "power2.inOut",
        onStart: () => {
          initParallax();
          initScrollReveals();
          initWaveScrollTriggers();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              ScrollTrigger.refresh();
            });
          });
        },
      });
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroAnimation);
} else {
  initHeroAnimation();
}

window.addEventListener("pageshow", (e) => {
  if (e.persisted) window.location.reload();
});

// ── Hero parallax ──────────────────────────────────────────
function initParallax() {
  const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 };
  gsap.to(".hero-img img", { yPercent: -30, ease: "none", scrollTrigger: st });
  gsap.to(".hero-header", { yPercent: -12, ease: "none", scrollTrigger: st });
  gsap.to(".hero-side", { yPercent: -20, opacity: 0, ease: "none", scrollTrigger: st });
}

// ── Scroll reveal ──────────────────────────────────────────
function initScrollReveals() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    gsap.set("[data-reveal='label'], [data-reveal='card'], [data-reveal='from-left'], [data-reveal='from-right']", { opacity: 0 });
    ScrollTrigger.batch("[data-reveal='label'], [data-reveal='card'], [data-reveal='from-left'], [data-reveal='from-right']", {
      onEnter: (batch) => gsap.to(batch, { opacity: 1, duration: 0.5, stagger: 0.05 }),
      once: true,
      start: "top 92%",
    });
    return;
  }

  document.querySelectorAll("[data-reveal='label']").forEach((el) => {
    gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => gsap.to(el, { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "power3.inOut" }),
    });
  });

  const cardGrids = [".duyuru-grid", ".urunler-preview-grid"];
  cardGrids.forEach((sel) => {
    const grid = document.querySelector(sel);
    if (!grid) return;
    const cards = grid.querySelectorAll("[data-reveal='card']");
    gsap.set(cards, { opacity: 0, y: 48, scale: 0.97, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: grid, start: "top 88%", once: true,
      onEnter: () => gsap.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.09, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  const yorumlarGrid = document.querySelector(".yorumlar-grid");
  if (yorumlarGrid) {
    const cards = yorumlarGrid.querySelectorAll(".yorum-card");
    gsap.set(cards, { opacity: 0, willChange: "opacity" });
    ScrollTrigger.create({
      trigger: yorumlarGrid, start: "top 88%", once: true,
      onEnter: () => gsap.to(cards, { opacity: 1, duration: 0.6, stagger: 0.07, ease: "power2.out", clearProps: "will-change" }),
    });
  }

  const infoEl = document.querySelector("[data-reveal='from-left']");
  const formEl = document.querySelector("[data-reveal='from-right']");

  if (infoEl) {
    gsap.set(infoEl, { opacity: 0, x: -40, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: infoEl, start: "top 90%", once: true,
      onEnter: () => gsap.to(infoEl, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", clearProps: "will-change" }),
    });
  }
  if (formEl) {
    gsap.set(formEl, { opacity: 0, x: 40, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: formEl, start: "top 90%", once: true,
      onEnter: () => gsap.to(formEl, { opacity: 1, x: 0, duration: 0.9, delay: 0.1, ease: "power3.out", clearProps: "will-change" }),
    });
  }
}

// ── Wave portfolyo ─────────────────────────────────────────
const WAVE_CONFIG = {
  waves: {
    base:   { amp: 0.1,   freq: 1.0, speed: 1.0, phase: 5.0  },
    flow:   { amp: 0.15,  freq: 5.0, speed: 5.0, phase: 10.0 },
    detail: { amp: 0.025, freq: 5.0, speed: 1.5, phase: 2.5  },
  },
  clipMax: 20,
  clipPower: 2,
};

const TOTAL_IMAGES = 12;
const ASPECT_RATIOS = ["3/4"];
const IMAGE_WIDTH_VW = 0.28;
const portfolyoSirasi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3];

const container = document.getElementById("portfolyo-images");

for (let i = 0; i < TOTAL_IMAGES; i++) {
  const item = document.createElement("div");
  item.classList.add("wave-image");
  item.style.aspectRatio = ASPECT_RATIOS[i % ASPECT_RATIOS.length];
  const img = document.createElement("img");
  img.src = `/portfolio/${portfolyoSirasi[i]}.webp`;
  img.alt = "";
  item.appendChild(img);
  container.appendChild(item);
}

const waveItems = gsap.utils.toArray(".wave-image");

function updateWaveSizes() {
  const vw = window.innerWidth;
  const containerW = Math.min(vw, container.offsetWidth || vw);
  const widthVw = vw < 768 ? 0.55 : IMAGE_WIDTH_VW;
  const baseWidth = Math.round(containerW * widthVw);

  waveItems.forEach((item, i) => {
    const shrinkStart = Math.floor(TOTAL_IMAGES * 0.75);
    const shrinkFactor = i >= shrinkStart ? (i - shrinkStart + 1) / (TOTAL_IMAGES - shrinkStart) : 0;
    const w = Math.round(baseWidth * (1 - shrinkFactor * 0.35));
    item.style.width = `${w}px`;
    item.style.height = "";
  });
}

function initWaveScrollTriggers() {
  updateWaveSizes();
  waveItems.forEach((item) => { item.style.willChange = "transform, clip-path"; });

  const pending = new Array(TOTAL_IMAGES).fill(null);
  let rafId = null;

  function flushPending() {
    rafId = null;
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      if (!p) continue;
      waveItems[i].style.transform = `translateX(${p.x}px)`;
      waveItems[i].style.clipPath = `inset(0 ${p.clip}% 0 ${p.clip}%)`;
      pending[i] = null;
    }
  }

  waveItems.forEach((item, index) => {
    const normalizedIndex = index / (TOTAL_IMAGES - 1);
    ScrollTrigger.create({
      trigger: item,
      start: "top bottom",
      end: "bottom top",
      onUpdate: ({ progress }) => {
        const { base, flow, detail } = WAVE_CONFIG.waves;
        const vw = window.innerWidth;
        const containerW = Math.min(vw, container.offsetWidth || vw);

        const baseWave = Math.sin(normalizedIndex * base.freq + (1 - progress) * base.speed + base.phase);
        const flowWave = 0.5 + Math.sin(normalizedIndex * flow.freq + flow.phase + progress * flow.speed);
        const detailWave = 0.5 + Math.sin(normalizedIndex * detail.freq + detail.phase + progress * detail.speed);

        const translateX =
          (containerW - item.offsetWidth) / 2 -
          containerW * 0.1 +
          baseWave * containerW * base.amp +
          flowWave * containerW * flow.amp +
          detailWave * containerW * detail.amp;

        const centerOffset = Math.abs(progress - 0.5) * 2;
        const clipAmount = Math.pow(centerOffset, WAVE_CONFIG.clipPower) * WAVE_CONFIG.clipMax;

        pending[index] = { x: translateX, clip: clipAmount };
        if (!rafId) rafId = requestAnimationFrame(flushPending);
      },
    });
  });
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    updateWaveSizes();
    ScrollTrigger.refresh();
  }, 150);
});

// ── Duyuru Slider ──────────────────────────────────────────
function buildDuyuruCard(duyuru) {
  const article = document.createElement("article");
  article.className = "duyuru-card";

  article.innerHTML = `
    <img src="${duyuru.gorsel}" alt="${duyuru.gorsel_alt ?? ""}" class="duyuru-bg" />
    <div class="duyuru-content">
      <span class="duyuru-tag">${duyuru.etiket}</span>
      <h2 class="duyuru-title">${duyuru.baslik}</h2>
      <p class="duyuru-body">${duyuru.aciklama}</p>
      <a href="${duyuru.link.url}" class="duyuru-link">${duyuru.link.metin}</a>
    </div>
  `;
  return article;
}

function initDuyuruSlider(duyurular) {
  const slider   = document.querySelector(".duyuru-slider");
  if (!slider) return;

  const track    = slider.querySelector(".duyuru-track");
  const dotsWrap = slider.querySelector(".duyuru-dots-bar .duyuru-dots");
  const prevBtn  = slider.querySelector(".duyuru-prev");
  const nextBtn  = slider.querySelector(".duyuru-next");

  track.innerHTML = "";
  duyurular.forEach((d) => track.appendChild(buildDuyuruCard(d)));

  const cards = track.querySelectorAll(".duyuru-card");
  const TOTAL = cards.length;
  let VISIBLE, cardW, MAX, current = 0, timer;

  function setup() {
    VISIBLE = window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
    cardW   = slider.offsetWidth / VISIBLE;
    MAX     = TOTAL - VISIBLE;
    current = Math.min(current, MAX);
    cards.forEach((c) => { c.style.flex = `0 0 ${cardW}px`; });

    dotsWrap.innerHTML = "";
    for (let i = 0; i <= MAX; i++) {
      const dot = document.createElement("button");
      dot.className = "duyuru-dot" + (i === current ? " duyuru-dot--active" : "");
      dot.setAttribute("aria-label", String(i + 1));
      dot.addEventListener("click", () => { goTo(i); startTimer(); });
      dotsWrap.appendChild(dot);
    }
    goTo(current, false);
  }

  function updateUI() {
    dotsWrap.querySelectorAll(".duyuru-dot").forEach((d, i) => {
      d.classList.toggle("duyuru-dot--active", i === current);
    });
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === MAX;
  }

  function goTo(index, animate = true) {
    current = Math.max(0, Math.min(index, MAX));
    gsap.to(track, { x: -cardW * current, duration: animate ? 0.7 : 0, ease: "power3.inOut" });
    updateUI();
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current >= MAX ? 0 : current + 1), 4000);
  }

  prevBtn?.addEventListener("click", () => { goTo(current - 1); startTimer(); });
  nextBtn?.addEventListener("click", () => { goTo(current + 1); startTimer(); });

  let dragStart = 0, dragX = 0, isDragging = false;
  const isDesktopDrag = () => window.innerWidth > 1024;

  track.addEventListener("pointerdown", (e) => {
    if (!isDesktopDrag()) return;
    isDragging = true;
    dragStart  = e.clientX;
    dragX      = gsap.getProperty(track, "x");
    track.setPointerCapture(e.pointerId);
    clearInterval(timer);
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    gsap.set(track, { x: dragX + (e.clientX - dragStart) });
  });

  track.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    const delta = e.clientX - dragStart;
    goTo(Math.abs(delta) > cardW * 0.2 ? (delta < 0 ? current + 1 : current - 1) : current);
    startTimer();
  });

  window.addEventListener("resize", setup);
  setup();
  startTimer();
}

// ── Ürünler önizleme ───────────────────────────────────────
function buildUrunPreviewCard(urun) {
  const a = document.createElement("a");
  a.href = "/urunler";
  a.className = "preview-card";
  a.setAttribute("data-reveal", "card");

  const kategoriMap = { seramik: "Seramik", tekstil: "Tekstil", kagit: "Kağıt & Baskı" };

  a.innerHTML = `
    <div class="preview-card-img">
      <img src="${urun.gorsel}" alt="${urun.gorsel_alt ?? urun.isim}" />
      ${urun.rozet ? `<span class="preview-card-badge">${urun.rozet}</span>` : ""}
    </div>
    <div class="preview-card-info">
      <span class="preview-card-cat">${kategoriMap[urun.kategori] ?? urun.kategori}</span>
      <h3 class="preview-card-name">${urun.isim}</h3>
      <p class="preview-card-price">₺${urun.fiyat}</p>
    </div>
  `;
  return a;
}

// ── Yorumlar ───────────────────────────────────────────────
function buildYorumCard(yorum) {
  const article = document.createElement("article");
  article.className = `yorum-card${yorum.stil === "alt" ? " yorum-card--alt" : ""}`;
  article.setAttribute("data-reveal", "card");

  const yildizlar = "★".repeat(yorum.yildiz);

  article.innerHTML = `
    <div class="yorum-yildiz">${yildizlar}</div>
    <p class="yorum-metin">"${yorum.metin}"</p>
    <footer class="yorum-footer">
      <span class="yorum-isim">${yorum.isim}</span>
    </footer>
  `;
  return article;
}

// ── İçerik yükle ve DOM'u doldur ──────────────────────────
async function loadContent() {
  const [duyurular, urunPreview, yorumlar] = await Promise.all([
    getDuyurular(),
    getUrunler(),
    getYorumlar(),
  ]);

  initDuyuruSlider(duyurular);

  const urunGrid = document.querySelector(".urunler-preview-grid");
  if (urunGrid) {
    urunGrid.innerHTML = "";
    urunPreview.slice(0, 4).forEach((u) => urunGrid.appendChild(buildUrunPreviewCard(u)));
  }

  const yorumGrid = document.querySelector(".yorumlar-grid");
  if (yorumGrid) {
    yorumGrid.innerHTML = "";
    yorumlar.forEach((y) => yorumGrid.appendChild(buildYorumCard(y)));
  }
}

loadContent().catch(console.error);

// ── Nav + form (ensureSite modül başında) ───────────────────
initNavHover();
initMobileMenu();
initContactForm();