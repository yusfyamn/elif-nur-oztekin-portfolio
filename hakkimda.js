import { initContactForm } from "./contact.js";
import { initNavHover, initMobileMenu, setLenis } from "./nav.js";
import { initTransitions } from "./transition.js";
import Lenis from "lenis";

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

// Hash ile gelindiyse (örn. #iletisim) scroll et
if (window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) {
    setTimeout(() => {
      lenis.scrollTo(target, { offset: -80, duration: 1.2 });
    }, 400);
  }
}
