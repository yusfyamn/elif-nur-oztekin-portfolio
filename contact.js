import { getCmsApiOrigin } from "./content.js";

export function initContactForm() {
  const form = document.querySelector(".iletisim-form");
  if (!form) return;

  const submitBtn = form.querySelector(".form-submit");
  const successMsg = form.querySelector(".form-success");
  const fallbackAction = form.getAttribute("action") || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Gönderiliyor…";

    const data = Object.fromEntries(new FormData(form));
    const api = getCmsApiOrigin();
    const url = api ? `${api}/api/contact` : fallbackAction;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        form.reset();
        if (successMsg) successMsg.hidden = false;
        submitBtn.textContent = "Gönderildi ✓";
      } else {
        throw new Error("Sunucu hatası");
      }
    } catch {
      submitBtn.textContent = "Hata — tekrar dene";
      submitBtn.disabled = false;
      setTimeout(() => {
        submitBtn.textContent = "Gönder";
      }, 3000);
    }
  });
}
