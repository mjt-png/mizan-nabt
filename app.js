/* ميزان النبط — منطق الصفحة الرئيسية */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

  /* --- تعبئة النصوص --- */
  $("#site-name").textContent = SITE.name;
  $("#tagline").textContent = SITE.tagline;
  $("#hero-line").textContent = SITE.heroLine;
  $("#hero-sub").textContent = SITE.heroSub;
  document.querySelectorAll("#appstore-btn, #appstore-btn2, #appstore-btn3, #nav-cta")
    .forEach(a => { if (a) a.href = SITE.appStoreUrl; });
  $("#privacy-link").href = SITE.privacyUrl;
  $("#support-link").href = "mailto:" + SITE.supportEmail;

  /* --- الشريط التسويقي --- */
  const ticker = $("#ticker");
  SITE.marketing.concat(SITE.marketing).forEach(t => {
    const s = el("span", "ticker-item"); s.textContent = t; ticker.appendChild(s);
  });

  /* --- المزايا --- */
  const fg = $("#features-grid");
  const arNum = ["٠١","٠٢","٠٣","٠٤","٠٥","٠٦","٠٧","٠٨","٠٩"];
  SITE.features.forEach((f, i) => {
    const c = el("div", "card");
    c.innerHTML = `<div class="num">${arNum[i] || (i+1)}</div><h3></h3><p></p>`;
    c.querySelector("h3").textContent = f.title;
    c.querySelector("p").textContent = f.desc;
    fg.appendChild(c);
  });

  /* --- كشف عند التمرير --- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .1 });
  document.querySelectorAll(".reveal").forEach(n => io.observe(n));
})();
