import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.85, 0, 0.15, 1");

function getCurtain() {
  let curtain = document.getElementById("page-curtain");
  if (!curtain) {
    curtain = document.createElement("div");
    curtain.id = "page-curtain";
    Object.assign(curtain.style, {
      position: "fixed", inset: "0",
      background: "#0f0f0f", zIndex: "9998",
      pointerEvents: "none",
    });
    document.body.appendChild(curtain);
  }

  // Marka etiketi — bir kez oluştur
  if (!document.getElementById("curtain-label")) {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position:  "absolute",
      top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      overflow:  "hidden",
    });

    const label = document.createElement("div");
    label.id = "curtain-label";
    Object.assign(label.style, { transform: "translateY(110%)" });

    const line1 = document.createElement("div");
    line1.textContent = "ELİF NUR ÖZTEKİN";
    Object.assign(line1.style, {
      color: "#fff", fontFamily: '"DM Sans", sans-serif',
      fontSize: "clamp(1.6rem, 4vw, 3.2rem)", fontWeight: "500",
      letterSpacing: "0.08em", textTransform: "uppercase",
      whiteSpace: "nowrap", lineHeight: "1.15",
    });

    const line2 = document.createElement("div");
    line2.textContent = "MONAMUJ DESIGN & MUNY ART LAB";
    Object.assign(line2.style, {
      color: "rgba(255,255,255,0.45)", fontFamily: '"DM Mono", monospace',
      fontSize: "clamp(0.5rem, 1.1vw, 0.7rem)", fontWeight: "400",
      letterSpacing: "0.14em", textTransform: "uppercase",
      whiteSpace: "nowrap", marginTop: "0.3rem",
    });

    label.appendChild(line1);
    label.appendChild(line2);
    wrapper.appendChild(label);
    curtain.appendChild(wrapper);
  }

  return curtain;
}

const isDesktop = () => window.innerWidth > 1024;

// skipEnter: true → home.html (hero kendi karanlığını yönetir)
export function initTransitions({ skipEnter = false } = {}) {
  const curtain = getCurtain();
  const label   = document.getElementById("curtain-label");

  if (skipEnter) {
    if (isDesktop()) {
      gsap.set(curtain, { scaleX: 0, transformOrigin: "left center" });
    } else {
      gsap.set(curtain, { scaleY: 0, transformOrigin: "top center" });
    }
    gsap.set(label, { y: "110%" });
  } else {
    if (isDesktop()) {
      // Masaüstü giriş: soldan sağa açılır
      gsap.set(curtain, { scaleX: 1, transformOrigin: "left center" });
      gsap.set(label, { y: "0%" });
      const tl = gsap.timeline({ delay: 0.05 });
      tl
        .to(label,   { y: "110%", duration: 0.45, ease: "power3.in" }, 0.1)
        .to(curtain, { scaleX: 0, duration: 0.9, ease: "power4.inOut" }, 0);
    } else {
      // Mobil giriş: yukarıdan aşağı
      gsap.set(curtain, { scaleY: 1, transformOrigin: "top center" });
      gsap.set(label, { y: "0%" });
      const tl = gsap.timeline({ delay: 0.05 });
      tl
        .to(label,   { y: "110%", duration: 0.45, ease: "power3.in" }, 0.1)
        .to(curtain, { scaleY: 0, duration: 0.9, ease: "power4.inOut" }, 0);
    }
  }

  // Hover'da fetch başlat — cache'e al
  const fetchCache = new Map();

  function warmPage(href) {
    if (fetchCache.has(href)) return;
    const p = fetch(href, { credentials: "same-origin" }).catch(() => {});
    fetchCache.set(href, p);
  }

  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href.startsWith("http") || href.startsWith("//") || href.startsWith("mailto:")) return;
    if (href.startsWith("#")) return;
    // Mobil menü linkleri nav.js tarafından yönetilir — çakışmayı önle
    if (link.closest(".mobile-menu")) return;

    link.addEventListener("mouseenter", () => warmPage(href), { once: true });

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const dest = href;

      if (dest === "/anasayfa" || dest === "/home.html" || dest === "home.html" || dest === "/") {
        window.location.href = dest;
        return;
      }

      gsap.set(label, { y: "110%" });

      const tl = gsap.timeline({
        onComplete: () => {
          window.location.href = dest;
        },
      });

      if (isDesktop()) {
        tl
          .fromTo(curtain,
            { scaleX: 0, transformOrigin: "right center" },
            { scaleX: 1, duration: 0.6, ease: "power4.inOut" }
          )
          .to(label, { y: "0%", duration: 0.4, ease: "power3.out" }, "-=0.3");
      } else {
        tl
          .fromTo(curtain,
            { scaleY: 0, transformOrigin: "bottom center" },
            { scaleY: 1, duration: 0.6, ease: "power4.inOut" }
          )
          .to(label, { y: "0%", duration: 0.4, ease: "power3.out" }, "-=0.3");
      }
    });
  });
}
