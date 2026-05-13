import { getCmsApiOrigin } from "./content.js";

const KONU_LABEL = {
  siparis: "Ürün siparişi",
  "ozel-siparis": "Özel sipariş",
  atolye: "Atölye kaydı",
  "ozel-atolye": "Özel / kurumsal atölye",
  diger: "Diğer",
};

const METIN = {
  gonderiliyor: "Gönderiliyor…",
  gonderildi: "Gönderildi",
  gonder: "Gönder",
  basariTam: "Teşekkürler; mesajın bana ulaştı. En kısa sürede seninle iletişime geçeceğim.",
  basariEpostaEksik:
    "Mesajın kaydedildi. E-posta bildiriminde geçici bir sorun olmuş olabilir; yine de talebini gördüm ve en kısa sürede dönüş yapacağım.",
  agGenel: "Bağlantı kurulamadı. İnternetini kontrol edip biraz sonra yeniden dene.",
  agKisa: "Gönderilemedi. Alanları kontrol edip tekrar dene.",
};

function kullaniciDostuHata(ham) {
  const t = String(ham ?? "").trim();
  if (t === "Failed to fetch") return METIN.agGenel;
  if (/^HTTP\s+\d+$/i.test(t)) return METIN.agKisa;
  if (t.length <= 52) return t;
  return METIN.agKisa;
}

function buildFormSubmitPayload(data) {
  const ad = typeof data.ad === "string" ? data.ad.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const konu = typeof data.konu === "string" ? data.konu.trim() : "";
  const mesaj = typeof data.mesaj === "string" ? data.mesaj.trim() : "";
  const konuEtiket = KONU_LABEL[konu] || konu || "—";
  const subject =
    typeof data._subject === "string" && data._subject.trim()
      ? data._subject.trim()
      : "İletişim formu — elifnuroztekin.com";
  return {
    name: ad,
    email,
    _replyto: email,
    _subject: `${subject} · ${konuEtiket}`,
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
    submitBtn.textContent = METIN.gonderiliyor;
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
            useWorker && fallbackAction && !mailOk ? METIN.basariEpostaEksik : METIN.basariTam;
        }
        submitBtn.textContent = METIN.gonderildi;
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
      const ham = e instanceof Error ? e.message : METIN.agGenel;
      submitBtn.textContent = kullaniciDostuHata(ham);
      submitBtn.disabled = false;
      setTimeout(() => {
        submitBtn.textContent = METIN.gonder;
      }, 5200);
    }
  });
}
