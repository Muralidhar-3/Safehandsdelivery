/* SafeHands Delivery: site behaviour.
   Edit CONFIG below with real business details. */
const CONFIG = {
  phone: "+447442236518", // e.g. "+441234567890"
  email: "",            // e.g. "hello@safehandsdelivery.co.uk"
  whatsapp: "447442236518", // digits only with country code, e.g. "441234567890"
  // Optional: a form endpoint (e.g. Formspree) so quote requests are emailed to you.
  formEndpoint: "",
  // Illustrative pricing for the estimator only. Replace with real rates.
  rates: { bike: { base: 9, mile: 1.1 }, small: { base: 18, mile: 1.4 }, medium: { base: 25, mile: 1.7 }, luton: { base: 40, mile: 2.2 } },
  speedMult: { standard: 1, express: 1.6, scheduled: 0.9 }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* contact links */
$$("[data-contact]").forEach(a => {
  const t = a.dataset.contact, v = CONFIG[t];
  if (!v) { if (t === "whatsapp") a.hidden = true; return; }
  a.href = t === "phone" ? "tel:" + v : t === "email" ? "mailto:" + v : "https://wa.me/" + v;
  if (t !== "whatsapp") if (t === "phone") a.textContent = "07442 236518";
});
$("#yr").textContent = new Date().getFullYear();

/* mobile nav */
const toggle = $(".nav-toggle"), nav = $("#nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
$$("#nav a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); }));

/* UK postcode check (format only) */
const PC = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const validPC = v => PC.test(v.trim());

/* deterministic pseudo-distance from two postcodes (placeholder for a real routing API) */
function fakeMiles(a, b) {
  const h = s => [...s.toUpperCase().replace(/\s/g, "")].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 997, 7);
  const area = s => s.trim().toUpperCase().match(/^[A-Z]{1,2}/)[0];
  if (area(a) === area(b)) return 3 + (h(a) + h(b)) % 14;
  return 20 + (h(a) * 3 + h(b) * 2) % 230;
}

/* quick estimate */
$("#quickQuote").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, out = $("#estimate");
  const from = f.from.value, to = f.to.value;
  [f.from, f.to].forEach(i => i.classList.toggle("bad", !validPC(i.value)));
  if (!validPC(from) || !validPC(to)) { out.style.color = "#c62828"; out.textContent = "Please enter two valid UK postcodes."; return; }
  const r = CONFIG.rates[f.vehicle.value], miles = fakeMiles(from, to);
  const price = (r.base + r.mile * miles) * CONFIG.speedMult[f.speed.value];
  out.style.color = "";
  out.innerHTML = `Estimated <strong>£${Math.round(price)}</strong> <small>(~${miles} miles, excl. VAT)</small><br><a href="#quote">Get your confirmed quote →</a>`;
  const q = $("#quoteForm");
  q.from.value = from; q.to.value = to;
});

/* tracking demo (replace with real backend lookup) */
const STAGES = ["Booked", "Driver assigned", "Collected", "In transit", "Delivered"];
$("#trackForm").addEventListener("submit", e => {
  e.preventDefault();
  const ref = e.target.ref.value.trim().toUpperCase(), note = $("#trackNote"), tl = $("#timeline");
  if (!/^SH-\d{4,8}$/.test(ref)) { tl.hidden = true; note.className = "note err"; note.textContent = "Reference should look like SH-100245."; return; }
  const idx = Number(ref.slice(-1)) % STAGES.length;
  tl.innerHTML = STAGES.map((s, i) => `<li class="${i < idx ? "done" : i === idx ? "done now" : ""}">${s}</li>`).join("");
  tl.hidden = false; note.className = "note"; note.textContent = "Demo tracking view. Live tracking connects once your booking system is linked.";
});

/* coverage */
$("#coverForm").addEventListener("submit", e => {
  e.preventDefault();
  const note = $("#coverNote"), v = e.target.pc.value;
  if (!validPC(v)) { note.className = "note err"; note.textContent = "Please enter a valid UK postcode."; return; }
  note.className = "note ok"; note.textContent = "Good news: we can collect and deliver in your area.";
});

/* full quote form */
$("#quoteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, note = $("#formNote");
  const bad = [f.name, f.phone, f.email, f.from, f.to].filter(i => !i.value.trim() || (i === f.email && !/^\S+@\S+\.\S+$/.test(i.value)) || ((i === f.from || i === f.to) && !validPC(i.value)));
  $$("input", f).forEach(i => i.classList.remove("bad"));
  if (bad.length) { bad.forEach(i => i.classList.add("bad")); note.className = "note err"; note.textContent = "Please check the highlighted fields."; bad[0].focus(); return; }
  if (CONFIG.formEndpoint) {
    try {
      const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(f) });
      if (!r.ok) throw 0;
    } catch { note.className = "note err"; note.textContent = "Sorry, something went wrong. Please call or WhatsApp us."; return; }
  }
  note.className = "note ok"; note.textContent = "Thanks! We've got your request and will reply shortly.";
  f.reset();
});

/* count-up stats + reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target; io.unobserve(el);
  if (el.dataset.count) {
    const end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
    const tick = t => { const p = Math.min((t - t0) / 900, 1); el.textContent = Math.round(end * p) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  } else el.classList.add("in");
}), { threshold: .2 });
$$("[data-count]").forEach(el => io.observe(el));
$$(".card.svc,.why,.steps li,details").forEach(el => { el.classList.add("reveal"); io.observe(el); });
