/**
 * Elif Nur Öztekin — CMS API (GitHub yok)
 * KV: JSON içerik | Küçük görseller KV asset (R2 yoksa)
 *
 * Secrets: ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET
 * Opsiyonel: MEDIA (R2 binding) — açılırsa upload R2'ye gider
 */

const ALLOWED_ORIGINS = [
  "https://www.elifnuroztekin.com",
  "https://elifnuroztekin.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
];

/** CORS: sabit liste + Vercel önizleme (*.vercel.app) */
function isAllowedCorsOrigin(o) {
  if (!o) return false;
  if (ALLOWED_ORIGINS.includes(o)) return true;
  try {
    const u = new URL(o);
    if (u.protocol === "https:" && u.hostname.endsWith(".vercel.app")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function corsHeaders(origin) {
  const acao = isAllowedCorsOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

const SLUGS = new Set([
  "site",
  "duyurular",
  "urunler",
  "atolyeler",
  "yorumlar",
  "galeri",
  "hakkimda",
  "atolye-galeri",
]);

const MAX_KV_ASSET_BYTES = 900_000;

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function err(msg, status = 400, origin = "") {
  return json({ error: msg }, status, origin);
}

function text(data, status, origin, contentType = "text/plain;charset=UTF-8") {
  return new Response(data, {
    status,
    headers: { "Content-Type": contentType, ...corsHeaders(origin) },
  });
}

async function importKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function b64urlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function decodeB64url(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

function base64UrlToBytes(b64url) {
  const s = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (s.length % 4)) % 4;
  const bin = atob(s + "=".repeat(pad));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}

async function signJwt(payload, secret) {
  const key = await importKey(secret);
  const header = b64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64urlEncode(sig)}`;
}

async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, sig] = parts;
  const key = await importKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(sig), new TextEncoder().encode(`${h}.${b}`));
  if (!ok) return null;
  try {
    const payload = JSON.parse(decodeB64url(b));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function authenticate(request, env) {
  const raw = request.headers.get("Authorization") || "";
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return verifyJwt(token, env.JWT_SECRET);
}

function kvJsonKey(slug) {
  return `json:${slug}`;
}

function seedPath(slug) {
  return `/content/${slug}.json`;
}

async function readContent(env, slug) {
  const cached = await env.CMS_CONTENT.get(kvJsonKey(slug), "json");
  if (cached !== null) return cached;
  const origin = env.SEED_ORIGIN || "https://www.elifnuroztekin.com";
  const res = await fetch(`${origin}${seedPath(slug)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function safeFilePart(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Public medya (KV veya R2) ──
    if (path.startsWith("/media/") && request.method === "GET") {
      const key = decodeURIComponent(path.slice("/media/".length));
      if (!key || key.includes("..")) return new Response("Not found", { status: 404 });

      if (env.MEDIA) {
        const obj = await env.MEDIA.get(key);
        if (!obj) return new Response("Not found", { status: 404 });
        const ct = obj.httpMetadata?.contentType || "application/octet-stream";
        return new Response(obj.body, {
          headers: {
            "Content-Type": ct,
            "Cache-Control": "public, max-age=31536000",
            ...corsHeaders(origin),
          },
        });
      }

      const raw = await env.CMS_CONTENT.get(`asset:${key}`, "json");
      if (!raw || typeof raw.b64 !== "string") return new Response("Not found", { status: 404 });
      const bytes = Uint8Array.from(atob(raw.b64), (c) => c.charCodeAt(0));
      return new Response(bytes, {
        headers: {
          "Content-Type": raw.ct || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000",
          ...corsHeaders(origin),
        },
      });
    }

    // ── Login ──
    if (path === "/login" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Geçersiz istek", 400, origin);
      }
      const { email, password } = body;
      if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
        return err("E-posta veya şifre hatalı", 401, origin);
      }
      const token = await signJwt(
        {
          sub: email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        },
        env.JWT_SECRET
      );
      return json({ token }, 200, origin);
    }

    // ── Public JSON (KV öncelik, yoksa seed siteden) ──
    if (path.startsWith("/api/public/") && request.method === "GET") {
      const slug = path.slice("/api/public/".length).replace(/\/$/, "");
      if (!SLUGS.has(slug)) return err("Geçersiz içerik", 404, origin);
      const data = await readContent(env, slug);
      if (data === null) return err("İçerik bulunamadı", 404, origin);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const CONTACT_INBOX_KEY = "json:contact-inbox";
    const FORMSUBMIT_TO = "https://formsubmit.co/ajax/elifnuroztekinn@gmail.com";

    // ── Public iletişim formu (KV gelen kutusu + FormSubmit ile e-posta) ──
    if (path === "/api/contact" && request.method === "POST") {
      if (origin && !isAllowedCorsOrigin(origin)) {
        return err("Origin izinli değil", 403, origin);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Geçersiz JSON", 400, origin);
      }
      const honey = body._honey;
      if (typeof honey === "string" && honey.trim() !== "") {
        return json({ ok: true }, 200, origin);
      }

      const ad = typeof body.ad === "string" ? body.ad.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const konu = typeof body.konu === "string" ? body.konu.trim() : "";
      const mesaj = typeof body.mesaj === "string" ? body.mesaj.trim() : "";

      if (ad.length < 2 || ad.length > 120) return err("Ad geçersiz", 400, origin);
      if (mesaj.length < 5 || mesaj.length > 8000) return err("Mesaj 5–8000 karakter olmalı", 400, origin);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("E-posta geçersiz", 400, origin);
      const allowedKonu = new Set(["siparis", "ozel-siparis", "atolye", "ozel-atolye", "diger"]);
      if (!allowedKonu.has(konu)) return err("Konu seçimi geçersiz", 400, origin);

      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rlKey = `rl:contact:${ip}`;
      const prev = Number((await env.CMS_CONTENT.get(rlKey)) || "0");
      if (prev > 20) return err("Çok fazla deneme, lütfen daha sonra tekrar deneyin.", 429, origin);
      await env.CMS_CONTENT.put(rlKey, String(prev + 1), { expirationTtl: 86_400 });

      const inbox = (await env.CMS_CONTENT.get(CONTACT_INBOX_KEY, "json")) || { items: [] };
      const items = Array.isArray(inbox.items) ? inbox.items : [];
      const id = crypto.randomUUID();
      const createdAt = Date.now();
      items.unshift({ id, createdAt, ad, email, konu, mesaj: mesaj.slice(0, 8000) });
      await env.CMS_CONTENT.put(CONTACT_INBOX_KEY, JSON.stringify({ items: items.slice(0, 250) }));

      const konuEtiket = {
        siparis: "Ürün siparişi",
        "ozel-siparis": "Özel sipariş",
        atolye: "Atölye kaydı",
        "ozel-atolye": "Özel/kurumsal atölye",
        diger: "Diğer",
      }[konu] || konu;

      try {
        await fetch(FORMSUBMIT_TO, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: ad,
            email,
            _replyto: email,
            _subject: `İletişim formu: ${konuEtiket}`,
            _captcha: "false",
            message: `Konu: ${konuEtiket}\n\n${mesaj}`,
          }),
        });
      } catch {
        /* e-posta başarısız olsa bile KV kaydı tutuldu */
      }

      return json({ ok: true }, 200, origin);
    }

    // ── Admin JSON ──
    const authPayload = await authenticate(request, env);
    if (!authPayload) return err("Yetkisiz", 401, origin);

    const adminMatch = /^\/api\/admin\/content\/([^/]+)$/.exec(path);
    if (adminMatch) {
      const slug = adminMatch[1];
      if (!SLUGS.has(slug)) return err("Geçersiz içerik", 400, origin);

      if (request.method === "GET") {
        const data = await readContent(env, slug);
        if (data === null) return err("İçerik bulunamadı", 404, origin);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        });
      }

      if (request.method === "PUT") {
        let body;
        try {
          body = await request.json();
        } catch {
          return err("Geçersiz JSON", 400, origin);
        }
        await env.CMS_CONTENT.put(kvJsonKey(slug), JSON.stringify(body));
        return json({ ok: true }, 200, origin);
      }
    }

    if (path === "/api/admin/contact-inbox" && request.method === "GET") {
      const inbox = (await env.CMS_CONTENT.get(CONTACT_INBOX_KEY, "json")) || { items: [] };
      return json(inbox, 200, origin);
    }

    if (path === "/api/admin/contact-inbox" && request.method === "PUT") {
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Geçersiz JSON", 400, origin);
      }
      const items = Array.isArray(body.items) ? body.items : [];
      const sanitized = items
        .filter((x) => x && typeof x.id === "string")
        .slice(0, 250)
        .map((x) => ({
          id: String(x.id).slice(0, 80),
          createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
          ad: String(x.ad ?? "").slice(0, 200),
          email: String(x.email ?? "").slice(0, 200),
          konu: String(x.konu ?? "").slice(0, 80),
          mesaj: String(x.mesaj ?? "").slice(0, 8000),
        }));
      await env.CMS_CONTENT.put(CONTACT_INBOX_KEY, JSON.stringify({ items: sanitized }));
      return json({ ok: true }, 200, origin);
    }

    // ── Upload ──
    if (path === "/api/upload" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Geçersiz JSON", 400, origin);
      }
      const { filename, contentType, base64 } = body;
      if (!base64 || typeof base64 !== "string") return err("base64 gerekli", 400, origin);

      let bytes;
      try {
        bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      } catch {
        return err("Geçersiz base64", 400, origin);
      }

      const ct = typeof contentType === "string" && contentType.length < 200 ? contentType : "application/octet-stream";
      const part = safeFilePart(filename);
      const key = `u/${Date.now()}-${part}`;

      if (env.MEDIA) {
        await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: ct } });
      } else {
        if (bytes.byteLength > MAX_KV_ASSET_BYTES) {
          return err(
            "Dosya çok büyük (max ~900KB). Cloudflare Dashboard'dan R2'yi açıp wrangler.toml içindeki R2 binding'ini etkinleştirin.",
            413,
            origin
          );
        }
        await env.CMS_CONTENT.put(`asset:${key}`, JSON.stringify({ ct, b64: base64 }));
      }

      const publicUrl = `${url.origin}/media/${encodeURIComponent(key)}`;
      return json({ url: publicUrl }, 200, origin);
    }

    return err("Bulunamadı", 404, origin);
  },
};
