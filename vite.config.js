import { defineConfig } from "vite";
import { resolve } from "path";

const CLEAN_URL_MAP = {
  "/": "/home.html",
  "/anasayfa": "/home.html",
  "/urunler": "/urunler.html",
  "/atolyeler": "/atolyeler.html",
  "/hakkimda": "/hakkimda.html",
  "/galeri": "/galeri.html",
  "/iletisim": "/hakkimda.html",
  "/gizlilik": "/gizlilik.html",
  "/kullanim-kosullari": "/kullanim-kosullari.html",
};

const cleanUrlPlugin = {
  name: "clean-url-rewrite",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url?.split("?")[0];
      if (url && CLEAN_URL_MAP[url]) {
        req.url = CLEAN_URL_MAP[url];
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [cleanUrlPlugin],
  /** Cloudflare Pages: VITE_CMS_API = https://…workers.dev (KV CMS Worker) */
  envPrefix: ["VITE_"],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "home.html"),
        urunler: resolve(__dirname, "urunler.html"),
        atolyeler: resolve(__dirname, "atolyeler.html"),
        hakkimda: resolve(__dirname, "hakkimda.html"),
        gizlilik: resolve(__dirname, "gizlilik.html"),
        kullanim: resolve(__dirname, "kullanim-kosullari.html"),
        galeri: resolve(__dirname, "galeri.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks: {
          gsap: ["gsap"],
          lenis: ["lenis"],
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
  },
});