export function initContactForm() {
  const form = document.querySelector(".iletisim-form");
  if (!form) return;

  const submitBtn = form.querySelector(".form-submit");
  const successMsg = form.querySelector(".form-success");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Gönderiliyor…";

    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch(form.action, {
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
