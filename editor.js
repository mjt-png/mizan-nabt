/* ميزان النبط — محرّر كلمات الدرس (بنية الجذور الثلاثية) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const DRAFT_KEY = "mizan-lesson-draft";

  let toastT;
  function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

  const model = clone(SITE);
  const STATES = model.lesson.states; // [{key,label,hint}]

  /* --- المسودّة --- */
  function saveDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(model.lesson));
    $("#savestate").textContent = "حُفظت المسودّة تلقائيًا ✓"; } catch (e) {} }
  function loadDraftInto() { try { const d = localStorage.getItem(DRAFT_KEY); if (d) { model.lesson = JSON.parse(d); return true; } } catch (e) {} return false; }
  function hasDraft() { try { return !!localStorage.getItem(DRAFT_KEY); } catch (e) { return false; } }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

  /* --- إدراج التشكيل --- */
  let lastInput = null;
  document.addEventListener("focusin", e => { if (e.target.matches(".wordin, .notein, .intro-field")) lastInput = e.target; });
  document.querySelectorAll(".mark").forEach(btn => {
    btn.addEventListener("mousedown", e => e.preventDefault());
    btn.addEventListener("click", () => {
      const ch = btn.getAttribute("data-ins");
      if (!lastInput) { toast("اكتب داخل خانة أولًا ثم اضغط العلامة."); return; }
      const s = lastInput.selectionStart, en = lastInput.selectionEnd, v = lastInput.value;
      lastInput.value = v.slice(0, s) + ch + v.slice(en);
      lastInput.selectionStart = lastInput.selectionEnd = s + ch.length;
      lastInput.dispatchEvent(new Event("input", { bubbles: true }));
      lastInput.focus();
    });
  });

  const groupsRoot = $("#groups");

  function render() {
    groupsRoot.innerHTML = "";

    // تمهيد الدرس
    const introWrap = el("div", "group");
    const ih = el("h2"); ih.textContent = "تمهيد الدرس"; introWrap.appendChild(ih);
    const intro = el("textarea", "intro-field"); intro.rows = 2; intro.value = model.lesson.intro || "";
    intro.addEventListener("input", () => { model.lesson.intro = intro.value; saveDraft(); });
    introWrap.appendChild(intro);
    groupsRoot.appendChild(introWrap);

    // الجذور
    const g = el("div", "group");
    const h = el("h2"); h.textContent = "الجذور"; g.appendChild(h);
    const exs = el("div", "exs");
    model.lesson.roots.forEach((r, i) => exs.appendChild(rootRow(r, i)));
    g.appendChild(exs);
    const add = el("button", "abtn ghost addbtn");
    add.textContent = "＋ أضف جذرًا";
    add.addEventListener("click", () => {
      const id = "root-" + nextNum(model.lesson.roots);
      const nw = { id, root: "", note: "" };
      STATES.forEach(st => nw[st.key] = "");
      model.lesson.roots.push(nw); saveDraft(); render();
    });
    g.appendChild(add);
    groupsRoot.appendChild(g);
  }

  function nextNum(list) {
    let max = 0;
    list.forEach(e => { const m = /-(\d+)$/.exec(e.id || ""); if (m) max = Math.max(max, +m[1]); });
    return max + 1;
  }

  function rootRow(r, i) {
    const row = el("div", "ex");
    const stateFields = STATES.map(st => `
      <div class="field">
        <label>${st.label} <span style="color:var(--muted-2);font-weight:400">(${st.hint})</span></label>
        <input class="wordin" dir="rtl" data-key="${st.key}">
        <div class="prev"></div>
      </div>`).join("");
    const files = STATES.map(st => r.id + "-" + st.key + ".mp3").join(" &nbsp;|&nbsp; ");
    row.innerHTML = `
      <div class="exhead"><b>جذر ${toAr(i + 1)}</b><button class="del">حذف</button></div>
      <div class="field" style="margin-bottom:14px">
        <label>الجذر مجرّدًا (٣ حروف — يظهر كعنوان)</label>
        <input class="wordin rootin" dir="rtl" style="font-size:1.3rem">
      </div>
      <div class="fields">
        ${stateFields}
        <div class="field full">
          <label>ملاحظة (تظهر تحت الجذر)</label>
          <input class="notein" dir="rtl">
        </div>
        <div class="files">ملفات الصوت: ${files}</div>
      </div>`;

    const rootin = row.querySelector(".rootin");
    rootin.value = r.root || "";
    rootin.addEventListener("input", () => { r.root = rootin.value; saveDraft(); });

    row.querySelectorAll(".field .wordin[data-key]").forEach(inp => {
      const key = inp.getAttribute("data-key");
      const prev = inp.parentElement.querySelector(".prev");
      inp.value = r[key] || ""; prev.textContent = r[key] || "";
      inp.addEventListener("input", () => { r[key] = inp.value; prev.textContent = inp.value; saveDraft(); });
    });

    const note = row.querySelector(".notein");
    note.value = r.note || "";
    note.addEventListener("input", () => { r.note = note.value; saveDraft(); });

    row.querySelector(".del").addEventListener("click", () => {
      if (!confirm("حذف هذا الجذر؟")) return;
      model.lesson.roots.splice(i, 1); saveDraft(); render();
    });
    return row;
  }

  function toAr(n) { return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]); }

  /* --- تصدير data.js --- */
  function q(s) { return JSON.stringify(s == null ? "" : s); }
  function serialize(m) {
    const mkt = m.marketing.map(x => "    " + q(x) + ",").join("\n");
    const feat = m.features.map(f => "    { title: " + q(f.title) + ", desc: " + q(f.desc) + " },").join("\n");
    const states = m.lesson.states.map(s =>
      "      { key: " + q(s.key) + ", label: " + q(s.label) + ", hint: " + q(s.hint) + " },").join("\n");
    const roots = m.lesson.roots.map(r =>
      "      { id: " + q(r.id) + ", root: " + q(r.root) +
      ", mushaddad: " + q(r.mushaddad) + ", sakin: " + q(r.sakin) +
      ", mutaharrik: " + q(r.mutaharrik) + ", note: " + q(r.note) + " },").join("\n");
    return `/* =====================================================================
   ميزان النبط — ملف المحتوى (لوحة التحكم)
   وُلِّد من محرّر الكلمات. استبدل به assets/data.js في مستودعك.
   ===================================================================== */

const SITE = {
  name: ${q(m.name)},
  tagline: ${q(m.tagline)},
  appStoreUrl: ${q(m.appStoreUrl)},
  supportEmail: ${q(m.supportEmail)},
  privacyUrl: ${q(m.privacyUrl)},

  heroLine: ${q(m.heroLine)},
  heroSub: ${q(m.heroSub)},

  marketing: [
${mkt}
  ],

  features: [
${feat}
  ],

  lesson: {
    title: ${q(m.lesson.title)},
    intro: ${q(m.lesson.intro)},
    states: [
${states}
    ],
    roots: [
${roots}
    ],
  },
};
`;
  }

  $("#export").addEventListener("click", () => {
    const blob = new Blob([serialize(model)], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "data.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("نزّل data.js — ضعه في مجلّد assets/ بمستودعك.");
  });

  $("#reset").addEventListener("click", () => {
    if (!confirm("استعادة المنشور وتجاهل تعديلاتك غير المنشورة؟")) return;
    clearDraft(); model.lesson = clone(SITE.lesson); render(); toast("رجعت للنسخة المنشورة.");
  });

  if (hasDraft()) {
    $("#draft-note").classList.add("show");
    $("#use-draft").addEventListener("click", () => { loadDraftInto(); render(); $("#draft-note").classList.remove("show"); toast("حمّلت مسودّتك."); });
    $("#drop-draft").addEventListener("click", () => { clearDraft(); $("#draft-note").classList.remove("show"); toast("بدأنا من المنشور."); });
  }

  render();
})();
