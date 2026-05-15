import { initContactForm } from "./contact.js";
import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import { getUrunler } from "./content.js";
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

const kategoriMap = { seramik: "Seramik", tekstil: "Tekstil", kagit: "Kağıt & Baskı" };

function shopierPurchaseHref(urun) {
  const s = typeof urun.shopier_url === "string" ? urun.shopier_url.trim() : "";
  if (!s) return "";
  return /^https:\/\//i.test(s) ? s : "";
}

function buildUrunCard(urun) {
  const href = shopierPurchaseHref(urun);
  const outer = document.createElement(href ? "a" : "article");
  if (href) {
    outer.href = href;
    outer.target = "_blank";
    outer.rel = "noopener noreferrer";
    outer.className = "urun-card urun-card--link";
  } else {
    outer.className = "urun-card";
  }
  outer.dataset.category = urun.kategori;

  outer.innerHTML = `
    <div class="urun-img">
      <img src="${urun.gorsel}" alt="${urun.gorsel_alt ?? urun.isim}" />
      ${urun.rozet ? `<span class="urun-badge">${urun.rozet}</span>` : ""}
    </div>
    <div class="urun-info">
      <span class="urun-kategori">${kategoriMap[urun.kategori] ?? urun.kategori}</span>
      <h2 class="urun-name">${urun.isim}</h2>
      <p class="urun-fiyat">₺${urun.fiyat}</p>
    </div>
  `;
  return outer;
}

const siparisCard = `
  <article class="urun-card urun-card--siparis">
    <div class="urun-siparis-inner">
      <p class="siparis-label">Özel Sipariş</p>
      <h2 class="siparis-title">Sana özel bir tasarım mı istiyorsun?</h2>
      <a href="/iletisim" class="siparis-btn">Talep Oluştur →</a>
    </div>
  </article>
`;

async function loadUrunler() {
  const urunler = await getUrunler();
  const grid = document.querySelector(".urun-grid");
  if (!grid) return;

  grid.innerHTML = "";
  urunler.forEach((u) => grid.appendChild(buildUrunCard(u)));
  grid.insertAdjacentHTML("beforeend", siparisCard);

  // Filtre butonları — kartlar DOM'a eklendikten sonra başlat
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = grid.querySelectorAll(".urun-card[data-category]");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        card.classList.toggle("hidden", filter !== "all" && card.dataset.category !== filter);
      });
    });
  });
}

loadUrunler().catch(console.error);