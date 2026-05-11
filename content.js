/** CMS içerik yükleyicisi — public/content/ JSON dosyalarını okur. */

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`İçerik yüklenemedi: ${path} (${res.status})`);
  return res.json();
}

export async function getDuyurular() {
  const data = await fetchJson("/content/duyurular.json");
  return (data.duyurular ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getUrunler() {
  const data = await fetchJson("/content/urunler.json");
  return (data.urunler ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getAtolyeler() {
  const data = await fetchJson("/content/atolyeler.json");
  return (data.atolyeler ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getYorumlar() {
  const data = await fetchJson("/content/yorumlar.json");
  return (data.yorumlar ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getGaleri() {
  const data = await fetchJson("/content/galeri.json");
  return (data.galeri ?? []).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}

export async function getHakkimda() {
  return fetchJson("/content/hakkimda.json");
}

export async function getAtolyeGaleri() {
  const data = await fetchJson("/content/atolye-galeri.json");
  return data.fotograflar ?? [];
}