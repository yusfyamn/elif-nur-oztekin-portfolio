import { initContactForm } from "./contact.js";
import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import { getAtolyeler, getAtolyeGaleri } from "./content.js";
import { ensureSite } from "./site-chrome.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

await ensureSite();

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
setLenis(lenis);

initNavHover();
initMobileMenu();
initContactForm();
initTransitions();

// ── Atölye kartı oluştur ───────────────────────────────────
function buildAtolyeItem(atolye) {
  const article = document.createElement("article");
  article.className = `atolye-item${atolye.reverse ? " atolye-item--reverse" : ""}`;
  article.setAttribute("data-reveal", "row");

  const isDolu = atolye.durum === "dolu";

  const tagClass = isDolu ? "atolye-tag" : "atolye-tag atolye-tag--aktif";
  const tagLabel = isDolu ? "Dolu" : atolye.durum === "yakinda" ? "Yakında" : "Kayıt Açık";

  const bilgilerHtml = (atolye.bilgiler ?? [])
    .map((b) => `<li><span>${b.etiket}</span><span>${b.deger}</span></li>`)
    .join("");

  const btnHtml = isDolu
    ? `<button class="atolye-btn atolye-btn--disabled atolye-btn--center" disabled>Liste Dolu</button>`
    : `<a href="/iletisim" class="atolye-btn atolye-btn--center">Kayıt Ol →</a>`;

  article.innerHTML = `
    <div class="atolye-img${isDolu ? " atolye-img--dolu" : ""}">
      <img src="${atolye.gorsel}" alt="${atolye.gorsel_alt ?? atolye.isim}" />
      ${isDolu ? `<div class="atolye-dolu-overlay">Dolu</div>` : ""}
    </div>
    <div class="atolye-detail">
      <div class="atolye-meta">
        <span class="${tagClass}">${tagLabel}</span>
        <span class="atolye-tarih">${atolye.tarih}</span>
      </div>
      <h2 class="atolye-name">${atolye.isim}</h2>
      <p class="atolye-desc">${atolye.aciklama}</p>
      <ul class="atolye-bilgi">${bilgilerHtml}</ul>
      ${btnHtml}
    </div>
  `;
  return article;
}

// ── Atölye galeri fotoğrafı ────────────────────────────────
function buildKarelerItem(foto) {
  const boyutClass = foto.boyut === "tall"
    ? " kareler-item--tall"
    : foto.boyut === "wide"
    ? " kareler-item--wide"
    : "";

  const figure = document.createElement("figure");
  figure.className = `kareler-item${boyutClass}`;
  figure.setAttribute("data-reveal", "photo");
  figure.innerHTML = `<img src="${foto.gorsel}" alt="${foto.alt ?? "Atölye"}" />`;
  return figure;
}

// ── Lightbox ───────────────────────────────────────────────
function initLightbox() {
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
  const lbImg   = lightbox.querySelector(".lightbox-img");

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

  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  lbClose.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
}

// ── Scroll reveals ─────────────────────────────────────────
function initScrollReveals() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    const all = document.querySelectorAll("[data-reveal]");
    gsap.set(all, { opacity: 0 });
    ScrollTrigger.batch(all, {
      onEnter: (batch) => gsap.to(batch, { opacity: 1, duration: 0.5, stagger: 0.05 }),
      once: true, start: "top 92%",
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

  document.querySelectorAll("[data-reveal='from-left']").forEach((el) => {
    gsap.set(el, { opacity: 0, x: -50, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(el, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  document.querySelectorAll("[data-reveal='from-right']").forEach((el) => {
    gsap.set(el, { opacity: 0, x: 50, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(el, { opacity: 1, x: 0, duration: 0.9, delay: 0.1, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  document.querySelectorAll("[data-reveal='row']").forEach((el) => {
    gsap.set(el, { opacity: 0, y: 60, willChange: "transform, opacity" });
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", clearProps: "will-change" }),
    });
  });

  const photos = document.querySelectorAll("[data-reveal='photo']");
  gsap.set(photos, { opacity: 0, scale: 0.95, willChange: "transform, opacity" });
  ScrollTrigger.batch(photos, {
    start: "top 90%", once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.07, ease: "power3.out", clearProps: "will-change" }),
  });
}

// ── İçerik yükle ──────────────────────────────────────────
async function loadContent() {
  const [atolyeler, galeri] = await Promise.all([getAtolyeler(), getAtolyeGaleri()]);

  const atolyeList = document.querySelector(".atolye-list");
  if (atolyeList) {
    atolyeList.innerHTML = "";
    atolyeler.forEach((a) => atolyeList.appendChild(buildAtolyeItem(a)));
  }

  const karelerGrid = document.querySelector(".kareler-grid");
  if (karelerGrid) {
    karelerGrid.innerHTML = "";
    galeri.forEach((f) => karelerGrid.appendChild(buildKarelerItem(f)));
  }

  initScrollReveals();
  initLightbox();
  ScrollTrigger.refresh();
}

loadContent().catch(console.error);