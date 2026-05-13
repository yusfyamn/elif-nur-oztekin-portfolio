import { initContactForm } from "./contact.js";
import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import { getHakkimda } from "./content.js";
import { ensureSite } from "./site-chrome.js";
import Lenis from "lenis";

await ensureSite();

const lenis = new Lenis();
function rafLoop(time) {
  lenis.raf(time);
  requestAnimationFrame(rafLoop);
}
requestAnimationFrame(rafLoop);
setLenis(lenis);

initNavHover();
initMobileMenu();
initContactForm();
initTransitions();

if (window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) {
    setTimeout(() => {
      lenis.scrollTo(target, { offset: -80, duration: 1.2 });
    }, 400);
  }
}

async function loadHakkimda() {
  const data = await getHakkimda();

  const titleEl = document.querySelector(".bio-title");
  if (titleEl) titleEl.textContent = data.baslik;

  const subEl = document.querySelector(".bio-sub");
  if (subEl) subEl.textContent = data.alt_baslik;

  const imgEl = document.querySelector(".bio-img img");
  if (imgEl) {
    imgEl.src = data.profil_foto;
    imgEl.alt = data.baslik;
  }

  const bodyEl = document.querySelector(".bio-body");
  if (bodyEl && Array.isArray(data.paragraflar)) {
    bodyEl.innerHTML = data.paragraflar
      .map((p) => `<p>${p}</p>`)
      .join("");
  }
}

loadHakkimda().catch(console.error);