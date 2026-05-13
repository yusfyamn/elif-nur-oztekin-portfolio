/**
 * Ortak site metinleri / nav / footer / SEO — public/content/site.json (+ KV)
 * Tüm sayfa scriptleri: initNavHover / initMobileMenu öncesi await ensureSite()
 */

import { getSite } from "./content.js";

function normPath(p) {
  const x = (p || "").replace(/\/$/, "") || "/";
  if (x === "/home.html" || x === "/index.html") return "/anasayfa";
  return x;
}

function setNavActive(links) {
  const cur = normPath(window.location.pathname);
  document.querySelectorAll(".nav-links > a").forEach((a, i) => {
    const l = links[i];
    if (!l) return;
    a.href = l.href;
    a.textContent = l.label;
    const href = normPath(l.href);
    const active = href === "/anasayfa" ? cur === "/anasayfa" || cur === "/" : cur === href || cur.startsWith(href + "/");
    a.classList.toggle("active", !!active);
  });
}

function applyFooterSocial(site) {
  const s = site.sosyal;
  if (!s) return;
  const order = ["instagram", "pinterest", "youtube", "tiktok"];
  document.querySelectorAll(".footer-social a").forEach((a, i) => {
    const key = order[i];
    if (!key || !s[key]) return;
    a.href = s[key];
  });
}

function applyIletisimHome(site) {
  const il = site.iletisim;
  const h = site.home;
  if (!il || !h) return;
  const section = document.querySelector(".iletisim-section");
  if (!section) return;

  const title = section.querySelector(".iletisim-title");
  if (title) title.textContent = h.iletisimTitle ?? title.textContent;

  const desc = section.querySelector(".iletisim-desc");
  if (desc) desc.textContent = h.iletisimDesc ?? desc.textContent;

  const lis = section.querySelectorAll(".iletisim-channels li");
  if (lis[0]) {
    const lab = lis[0].querySelector(".channel-label");
    const val = lis[0].querySelector(".channel-value");
    if (lab) lab.textContent = h.channelEmailLabel ?? "E-posta";
    if (val) {
      val.href = il.emailMailto ?? val.getAttribute("href");
      val.textContent = il.emailDisplay ?? val.textContent;
    }
  }
  if (lis[1]) {
    const lab = lis[1].querySelector(".channel-label");
    const val = lis[1].querySelector(".channel-value");
    if (lab) lab.textContent = h.channelInstagramLabel ?? "Instagram";
    if (val) {
      val.href = site.sosyal?.instagram ?? val.getAttribute("href");
      val.textContent = il.instagramDisplay ?? val.textContent;
    }
  }
  if (lis[2]) {
    const lab = lis[2].querySelector(".channel-label");
    const val = lis[2].querySelector(".channel-value");
    if (lab) lab.textContent = il.konumLabel ?? lab.textContent;
    if (val && val.tagName === "SPAN") val.textContent = il.konumValue ?? val.textContent;
  }

  const form = section.querySelector(".iletisim-form");
  if (form && il.formSubmitUrl) {
    form.action = il.formSubmitUrl;
    const sub = form.querySelector('input[name="_subject"]');
    if (sub && il.formSubject) sub.value = il.formSubject;
  }
}

function applyHomeOnly(site) {
  const h = site.home;
  if (!h) return;

  const heroH1 = document.querySelector(".hero-header h1");
  if (heroH1) heroH1.textContent = h.heroTitle ?? heroH1.textContent;

  const overlayPs = document.querySelectorAll(".overlay-text p");
  (h.heroOverlay ?? []).forEach((t, i) => {
    if (overlayPs[i]) overlayPs[i].textContent = t;
  });

  const leftSpans = document.querySelectorAll(".hero-side--left span");
  (h.heroSideLeft ?? []).forEach((t, i) => {
    if (leftSpans[i]) leftSpans[i].textContent = t;
  });
  const rightSpans = document.querySelectorAll(".hero-side--right span");
  (h.heroSideRight ?? []).forEach((t, i) => {
    if (rightSpans[i]) rightSpans[i].textContent = t;
  });

  const heroImgs = document.querySelectorAll(".hero-images .img img");
  (h.heroImages ?? []).forEach((src, i) => {
    if (heroImgs[i] && typeof src === "string") heroImgs[i].src = cacheBustSrc(src, site.updatedAt);
  });

  const map = [
    [".duyurular-section .section-label", h.sectionDuyurular],
    ["#portfolyo .section-label", h.sectionPortfolyo],
    [".urunler-preview-section .section-label", h.sectionUrunler],
    [".yorumlar-section .section-label", h.sectionYorumlar],
    [".iletisim-section .section-label", h.sectionIletisim],
  ];
  for (const [sel, text] of map) {
    if (!text) continue;
    const el = document.querySelector(sel);
    if (el) el.textContent = text;
  }

  const previewLink = document.querySelector(".preview-all-link");
  if (previewLink && h.previewAllLink) previewLink.textContent = h.previewAllLink;
}

export function cacheBustSrc(url, ts) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return ts ? `${url}${sep}v=${ts}` : url;
}

function applyHeadSeo(site) {
  const seo = site.seo;
  if (!seo) return;
  const p = normPath(window.location.pathname);
  if (p !== "/anasayfa" && p !== "/") return;
  if (seo.title) document.title = seo.title;
  const md = document.querySelector('meta[name="description"]');
  if (md && seo.description) md.setAttribute("content", seo.description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && seo.title) ogTitle.setAttribute("content", seo.title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && seo.description) ogDesc.setAttribute("content", seo.description);
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg && seo.ogImage) ogImg.setAttribute("content", seo.ogImage);
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle && seo.title) twTitle.setAttribute("content", seo.title);
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc && seo.description) twDesc.setAttribute("content", seo.description);
  const twImg = document.querySelector('meta[name="twitter:image"]');
  if (twImg && seo.ogImage) twImg.setAttribute("content", seo.ogImage);
}

function applyPreloads(site) {
  const p = normPath(window.location.pathname);
  if (p !== "/anasayfa" && p !== "/") return;
  const list = site.home?.preloadPortfolio;
  if (!Array.isArray(list) || !list.length) return;
  document.querySelectorAll('link[rel="preload"][as="image"]').forEach((link, i) => {
    if (list[i]) link.href = cacheBustSrc(list[i], site.updatedAt);
  });
}

function applyNavLogoFooter(site) {
  const navLogo = document.querySelector(".nav-logo a span:first-child");
  if (navLogo && site.nav?.logoTitle) navLogo.textContent = site.nav.logoTitle;
  const navSub = document.querySelector(".nav-logo a .nav-logo-sub");
  if (navSub && site.nav?.logoSub) navSub.textContent = site.nav.logoSub;

  const fbStrong = document.querySelector(".footer-brand strong");
  if (fbStrong && site.footer?.brandTitle) fbStrong.textContent = site.footer.brandTitle;
  const fbSub = document.querySelector(".footer-brand-sub");
  if (fbSub && site.footer?.brandSub) fbSub.textContent = site.footer.brandSub;

  const copyA = document.querySelector(".footer-bottom > a.footer-copy");
  if (copyA && site.footer?.copyrightText) {
    copyA.textContent = site.footer.copyrightText;
    if (site.footer.copyrightUrl) copyA.href = site.footer.copyrightUrl;
  }
  const byA = document.querySelector(".footer-by");
  if (byA && site.footer?.creditText) {
    byA.textContent = site.footer.creditText;
    if (site.footer.creditUrl) byA.href = site.footer.creditUrl;
  }
}

export async function ensureSite() {
  if (window.__SITE_READY) return window.__SITE__;
  const site = await getSite();
  window.__SITE__ = site;
  window.__SITE_READY = true;

  if (site.nav?.links?.length) setNavActive(site.nav.links);
  applyNavLogoFooter(site);
  applyFooterSocial(site);
  applyHeadSeo(site);
  applyPreloads(site);
  applyHomeOnly(site);
  applyIletisimHome(site);

  return site;
}
