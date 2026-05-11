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

const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".urun-card[data-category]");

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    cards.forEach((card) => {
      const matches = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hidden", !matches);
    });
  });
});
