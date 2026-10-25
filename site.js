/* Winlucks site — shared script (no libraries)
 * One setting to fill in: your existing Google reCAPTCHA v2 site key
 * (copy it from the data-sitekey="..." attribute in the old contact.php).
 */
const WL_RECAPTCHA_SITE_KEY = "PASTE_YOUR_RECAPTCHA_SITE_KEY_HERE";
/* GitHub Pages hosting: paste the Google Apps Script web app URL (see SETUP-GITHUB.md).
 * Leave as is on PHP hosting: forms then post to mail.php / customer-mail.php / vendor.php. */
const WL_FORMS_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
const wlStarted = Date.now();
/* Microsoft Forms (GitHub version): paste your form's share link, e.g. "https://forms.office.com/r/AbC123xyz" */
const WL_MSFORM_URL = "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=VzJlxSuo6kiTYqBM10ym7EqHC0jeFHNKn2VEgrU50FdUMVVFWlZWMUI4ODhRN0g4RldSTkNJMTE3Sy4u";

/* Microsoft Forms embed on the Contact page */
(() => {
  const box = document.getElementById("msform"); if (!box) return;
  const ready = WL_MSFORM_URL.indexOf("PASTE") !== 0 && /^https:\/\/(forms\.office\.com|forms\.microsoft\.com|forms\.cloud\.microsoft)\//.test(WL_MSFORM_URL);
  const open = document.getElementById("msform-open");
  if (!ready) { document.getElementById("msform-wait").hidden = false; return; }
  const url = WL_MSFORM_URL + (WL_MSFORM_URL.indexOf("?") > -1 ? "&" : "?") + "embed=true";
  const f = document.createElement("iframe");
  f.src = url; f.title = "Contact Winlucks form"; f.loading = "lazy"; f.setAttribute("allowfullscreen", "");
  box.appendChild(f); box.hidden = false;
  if (open) { open.href = WL_MSFORM_URL; open.hidden = false; }
})();

document.documentElement.classList.add("js");

/* header shadow + mobile menu */
(() => {
  const head = document.querySelector(".site-head");
  const onScroll = () => head && head.classList.toggle("scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  const btn = document.querySelector(".menu-btn"), nav = document.getElementById("mainnav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", e => { if (e.target.closest("a")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  }
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();

/* reveal on scroll (content stays visible without JS or with reduced motion) */
(() => {
  const els = [...document.querySelectorAll(".reveal")];
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => e.classList.add("in")), 2500); // safety net
})();

/* FAQ search */
(() => {
  const q = document.getElementById("faq-q"); if (!q) return;
  const items = [...document.querySelectorAll(".faq details")], empty = document.getElementById("faq-empty");
  q.addEventListener("input", () => {
    const t = q.value.trim().toLowerCase(); let n = 0;
    items.forEach(d => { const hit = !t || d.textContent.toLowerCase().includes(t); d.hidden = !hit; if (hit) n++; d.open = !!t && hit && n <= 3; });
    if (empty) empty.hidden = n > 0;
  });
})();

/* contact tabs (deep links: contact.php#customer-support, #vendor-support, #queries) */
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')]; if (!tabs.length) return;
  const show = id => {
    tabs.forEach(t => { const on = t.getAttribute("aria-controls") === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute("aria-controls")).hidden = !on; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { show(t.getAttribute("aria-controls")); history.replaceState(null, "", "#" + t.getAttribute("aria-controls")); });
    t.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click(); } });
  });
  const fromHash = () => { const h = location.hash.slice(1); if (tabs.some(t => t.getAttribute("aria-controls") === h)) { show(h); document.getElementById("forms")?.scrollIntoView({ block: "start" }); } };
  fromHash(); window.addEventListener("hashchange", fromHash);
})();

/* reCAPTCHA (explicit render so one key serves every form) */
const wlCaptchas = {};
window.wlCaptchaReady = () => {
  if (WL_RECAPTCHA_SITE_KEY.indexOf("PASTE") === 0) return;
  document.querySelectorAll(".captcha").forEach(el => { wlCaptchas[el.id] = grecaptcha.render(el, { sitekey: WL_RECAPTCHA_SITE_KEY }); });
};

/* forms → existing PHP handlers (mail.php, customer-mail.php, vendor.php), same fields as before */
(() => {
  const toast = document.getElementById("toast");
  const showToast = msg => { if (!toast) return; toast.querySelector("span").textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 5000); };
  document.querySelectorAll("form[data-endpoint]").forEach(form => {
    const msg = form.querySelector(".form-msg"), btn = form.querySelector('button[type="submit"]'), cap = form.querySelector(".captcha");
    const say = (t, kind) => { msg.textContent = t; msg.className = "form-msg" + (kind ? " " + kind : ""); };
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      let token = "";
      if (window.grecaptcha && cap && cap.id in wlCaptchas) token = grecaptcha.getResponse(wlCaptchas[cap.id]);
      if (WL_RECAPTCHA_SITE_KEY.indexOf("PASTE") !== 0 && !token) { say("Please tick “I'm not a robot” before sending.", "err"); return; }
      const useSheet = WL_FORMS_ENDPOINT.indexOf("PASTE") !== 0;
      if (!useSheet && !form.dataset.endpoint) { say("This form isn't connected yet. Please WhatsApp us on +971 54 31 32 357 or email Info@winlucks.com.", "err"); return; }
      const fd = new FormData(form);
      btn.disabled = true; say("Sending…");
      try {
        let r;
        if (useSheet) {
          const data = Object.fromEntries(fd.entries());
          r = await fetch(WL_FORMS_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ ...data, kind: form.dataset.kind || "queries", token, elapsedSec: Math.round((Date.now() - wlStarted) / 1000), page: location.pathname }) });
        } else {
          fd.delete("website");
          const body = new URLSearchParams(fd);
          if (token && !body.has("g-recaptcha-response")) body.set("g-recaptcha-response", token);
          r = await fetch(form.dataset.endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" }, body });
        }
        const text = await r.text(); let ok = r.ok;
        try { const j = JSON.parse(text); if (j && (j.ok === false || j.success === false || j.status === "error" || j.status === false)) ok = false; } catch (_) { /* non-JSON reply: rely on HTTP status */ }
        if (!ok) throw new Error("bad");
        form.reset(); if (cap && cap.id in wlCaptchas) grecaptcha.reset(wlCaptchas[cap.id]);
        say("Thank you for contacting us. We will get back to you soon.", "ok");
        showToast("Message sent. We will get back to you soon.");
      } catch (_) {
        say("We couldn't send your message. Please try again, or WhatsApp us on +971 54 31 32 357.", "err");
      } finally { btn.disabled = false; }
    });
  });
})();
