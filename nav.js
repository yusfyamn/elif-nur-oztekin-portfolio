import gsap from "gsap";

// Lenis instance'ına dışarıdan erişim için — home.js'te set edilir
let _lenis = null;
export function setLenis(instance) {
  _lenis = instance;
}

function lockScroll() {
  if (_lenis) _lenis.stop();
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  if (_lenis) _lenis.start();
  document.body.style.overflow = "";
}

// Hover efekti — desktop link'lere slot-machine animasyonu
export function initNavHover() {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const text = link.textContent.trim();
    link.innerHTML = `<span class="nav-t">${text}</span><span class="nav-t nav-t--clone">${text}</span>`;
  });
}

// Mobil menü
export function initMobileMenu() {
  const nav = document.querySelector(".page-nav");
  if (!nav) return;

  // Hamburger butonu
  const burger = document.createElement("button");
  burger.className = "nav-burger";
  burger.setAttribute("aria-label", "Menüyü Aç");
  burger.setAttribute("aria-expanded", "false");
  burger.innerHTML = `
  <svg class="burger-icon" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line class="burger-line burger-line--top" x1="3" y1="9" x2="23" y2="9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
    <line class="burger-line burger-line--bot" x1="3" y1="17" x2="23" y2="17" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
  </svg>
`;
  nav.appendChild(burger);

  // Overlay oluştur
  const overlay = document.createElement("div");
  overlay.className = "mobile-menu";
  overlay.setAttribute("aria-hidden", "true");

  // Linkleri nav-links'ten kopyala — initNavHover span'larını bypass et
  const links = [...document.querySelectorAll(".nav-links a")];
  const linksHtml = links
    .map((a) => {
      const text = a.querySelector(".nav-t")?.textContent.trim() ?? a.textContent.trim();
      const active = a.classList.contains("active") ? ' class="active"' : "";
      return `<a href="${a.getAttribute("href")}"${active}>${text}</a>`;
    })
    .join("");

  overlay.innerHTML = `
    <div class="mobile-menu-inner">
      <nav class="mobile-menu-links">${linksHtml}</nav>
      <div class="mobile-menu-foot">
        <div class="mobile-menu-foot-brand">
          <span class="mobile-menu-foot-name">Monamuj Design<br>Muny Art Lab</span>
          <span class="mobile-menu-foot-location">İstanbul — 2026</span>
        </div>
        <div class="mobile-menu-foot-links">
          <a href="https://www.instagram.com/elifnuroztekin/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">Pinterest</a>
          <a href="https://behance.net" target="_blank" rel="noopener noreferrer">Behance</a>
        </div>
      </div>
    </div>
  `;

  // Backdrop (masaüstü sidebar karartması)
  const backdrop = document.createElement("div");
  backdrop.className = "mobile-menu-backdrop";
  document.body.appendChild(backdrop);
  document.body.appendChild(overlay);

  // Linklere hover efekti
  overlay.querySelectorAll("a").forEach((link) => {
    const text = link.textContent.trim();
    link.innerHTML = `<span class="nav-t">${text}</span><span class="nav-t nav-t--clone">${text}</span>`;
  });

  let isOpen = false;
  const isMobile = () => window.innerWidth <= 1024;

  function openMenu() {
    isOpen = true;
    burger.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
    lockScroll();
    burger.classList.add("is-open");
    document.querySelector(".nav-logo")?.classList.add("is-menu-open");

    const menuLinks = overlay.querySelectorAll(".mobile-menu-links a");
    gsap.set(menuLinks, { y: 30, opacity: 0 });
    gsap.set(".mobile-menu-foot", { opacity: 0 });

    if (isMobile()) {
      overlay.classList.add("is-active");
      gsap.set(overlay, { clipPath: "inset(0 0 100% 0)" });
      gsap.timeline()
        .to(overlay, { clipPath: "inset(0 0 0% 0)", duration: 0.55, ease: "power4.inOut" })
        .to(menuLinks, { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: "power3.out" }, "-=0.2")
        .to(".mobile-menu-foot", { opacity: 1, duration: 0.4 }, "-=0.1");
    } else {
      overlay.classList.add("is-active");
      backdrop.classList.add("is-active");
      gsap.timeline({ delay: 0.1 })
        .to(menuLinks, { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: "power3.out" })
        .to(".mobile-menu-foot", { opacity: 1, duration: 0.4 }, "-=0.1");
    }
  }

  function closeMenu(onComplete) {
    isOpen = false;
    burger.setAttribute("aria-expanded", "false");
    burger.classList.remove("is-open");
    document.querySelector(".nav-logo")?.classList.remove("is-menu-open");

    if (isMobile()) {
      gsap.to(overlay, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.45,
        ease: "power4.inOut",
        onComplete: () => {
          overlay.classList.remove("is-active");
          overlay.setAttribute("aria-hidden", "true");
          unlockScroll();
          onComplete?.();
        },
      });
    } else {
      overlay.classList.remove("is-active");
      backdrop.classList.remove("is-active");
      unlockScroll();
      overlay.setAttribute("aria-hidden", "true");
      onComplete?.();
    }
  }

  burger.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));
  backdrop.addEventListener("click", () => closeMenu());

  // Sayfa geçişi için curtain referansı — transition.js ile senkron
  function getCurtain() {
    return document.getElementById("page-curtain");
  }

  overlay.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    // Harici linkler, anchor'lar veya hash — doğrudan kapat
    const isExternal = href.startsWith("http") || href.startsWith("//") || href.startsWith("mailto:");
    const isHash = href.startsWith("#");

    const isHome = href === "/anasayfa" || href === "/home.html" || href === "home.html" || href === "/";

    a.addEventListener("click", (e) => {
      if (isExternal || isHash || isHome) {
        closeMenu();
        return;
      }

      e.preventDefault();
      const dest = href;

      const curtain = getCurtain();
      const label = document.getElementById("curtain-label");
      curtain.style.zIndex = "9998";
      if (label) gsap.set(label, { y: "110%" });

      isOpen = false;
      burger.setAttribute("aria-expanded", "false");
      burger.classList.remove("is-open");
      document.querySelector(".nav-logo")?.classList.remove("is-menu-open");

      if (isMobile()) {
        // 1) Menü kapanır, 2) biter bitmez curtain + navigate
        gsap.to(overlay, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.4,
          ease: "power4.inOut",
          onComplete: () => {
            overlay.classList.remove("is-active");
            overlay.setAttribute("aria-hidden", "true");
            unlockScroll();

            gsap.timeline({
              onComplete: () => { window.location.href = dest; },
            })
              .fromTo(curtain,
                { scaleY: 0, transformOrigin: "bottom center" },
                { scaleY: 1, duration: 0.5, ease: "power4.inOut" }
              )
              .to(label, { y: "0%", duration: 0.35, ease: "power3.out" }, "-=0.2")
              .to({}, { duration: 0.1 });
          },
        });
      } else {
        overlay.classList.remove("is-active");
        backdrop.classList.remove("is-active");
        unlockScroll();
        overlay.setAttribute("aria-hidden", "true");

        gsap.timeline({
          onComplete: () => { window.location.href = dest; },
        })
          .fromTo(curtain,
            { scaleX: 0, transformOrigin: "right center" },
            { scaleX: 1, duration: 0.55, ease: "power4.inOut" }
          )
          .to(label, { y: "0%", duration: 0.35, ease: "power3.out" }, "-=0.2")
          .to({}, { duration: 0.1 });
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeMenu();
  });
}