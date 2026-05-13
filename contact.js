import { getCmsApiOrigin } from "./content.js";

const KONU_LABEL = {
  siparis: "Ürün siparişi",
  "ozel-siparis": "Özel sipariş",
  atolye: "Atölye kaydı",
  "ozel-atolye": "Özel/kurumsal atölye",
  diger: "Diğer",
};

function buildFormSubmitPayload(data) {
  const ad = typeof data.ad === "string" ? data.ad.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const konu = typeof data.konu === "string" ? data.konu.trim() : "";
  const mesaj = typeof data.mesaj === "string" ? data.mesaj.trim() : "";
  const konuEtiket = KONU_LABEL[konu] || konu || "—";
  const subject =
    typeof data._subject === "string" && data._subject.trim()
      ? data._subject.trim()
      : "Yeni iletişim formu";
  return {
    name: ad,
    email,
    _replyto: email,
    _subject: `${subject} [${konuEtiket}]`,
    _captcha: "false",
    message: `Konu: ${konuEtiket}\n\n${mesaj}`,
  };
}

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
    if (successMsg) successMsg.hidden = true;

    const raw = Object.fromEntries(new FormData(form));
    const api = getCmsApiOrigin();
    const useWorker = Boolean(api);
    const url = useWorker ? `${api}/api/contact` : fallbackAction;
    const body = useWorker ? raw : buildFormSubmitPayload(raw);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        let mailOk = true;
        if (useWorker && fallbackAction) {
          try {
            const mr = await fetch(fallbackAction, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify(buildFormSubmitPayload(raw)),
            });
            mailOk = mr.ok;
          } catch {
            mailOk = false;
          }
        }

        form.reset();
        if (successMsg) {
          successMsg.hidden = false;
          successMsg.textContent =
            useWorker && fallbackAction && !mailOk
              ? "Mesajın kaydedildi. E-posta bildirimi şu an ulaşmadı; en kısa sürede yine de dönüş yapılır."
              : "Mesajın alındı — yakında döneceğim.";
        }
        submitBtn.textContent = "Gönderildi ✓";
        return;
      }

      let detail = `HTTP ${response.status}`;
      try {
        const j = await response.json();
        if (j && typeof j.error === "string") detail = j.error;
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ağ hatası";
      const short =
        msg === "Failed to fetch"
          ? "Bağlantı hatası — engel veya ağ"
          : msg.length > 40
            ? `${msg.slice(0, 37)}…`
            : msg;
      submitBtn.textContent = short;
      submitBtn.disabled = false;
      setTimeout(() => {
        submitBtn.textContent = "Gönder";
      }, 4500);
    }
  });
}
