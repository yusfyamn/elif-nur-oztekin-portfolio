/** CMS içerik — önce Cloudflare CMS API (KV), yoksa statik /content/*.json */

const PROD_CMS_DEFAULT = "https://elif-nur-oztekin-cms.yusufyaman209.workers.dev";

const CMS_API = (() => {
  const fromEnv =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_CMS_API;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "www.elifnuroztekin.com" || h === "elifnuroztekin.com") return PROD_CMS_DEFAULT;
  }
  return "";
})();

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`İçerik yüklenemedi: ${path} (${res.status})`);
  return res.json();
}

async function fetchCmsOrStatic(slug) {
  if (CMS_API) {
    const url = `${CMS_API}/api/public/${slug}`;
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      /* ağ hatası — statik fallback */
    }
  }
  return fetchJson(`/content/${slug}.json`);
}

export async function getDuyurular() {
  const data = await fetchCmsOrStatic("duyurular");
  return (data.duyurular ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getUrunler() {
  const data = await fetchCmsOrStatic("urunler");
  return (data.urunler ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getAtolyeler() {
  const data = await fetchCmsOrStatic("atolyeler");
  return (data.atolyeler ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getYorumlar() {
  const data = await fetchCmsOrStatic("yorumlar");
  return (data.yorumlar ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getGaleri() {
  const data = await fetchCmsOrStatic("galeri");
  return (data.galeri ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getHakkimda() {
  return fetchCmsOrStatic("hakkimda");
}

export async function getAtolyeGaleri() {
  const data = await fetchCmsOrStatic("atolye-galeri");
  return data.fotograflar ?? [];
}

/** Nav, footer, SEO, anasayfa sabit metinleri — site.json / KV */
export async function getSite() {
  return fetchCmsOrStatic("site");
}
