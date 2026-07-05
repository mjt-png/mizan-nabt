/* =====================================================================
   ميزان النبط — قفل الأدوات الخاصة (بوابة كلمة مرور خفيفة)
   ---------------------------------------------------------------------
   كلمة المرور الافتراضية: mizan-nabt
   لتغييرها: افتح لوحة الأدوات (panel.html)، وفي شاشة القفل اضغط
   «تغيير كلمة المرور»، اكتب كلمتك، وانسخ السطر الناتج وضعه مكان
   PASS_HASH بالأسفل. (لا تُخزَّن كلمة المرور نصًّا، بل بصمتها فقط.)

   ملاحظة أمنية بصراحة: هذا «قفل ناعم» يمنع الفضول العابر فقط، وليس
   حماية حقيقية — الحماية الحقيقية أن نشر أي تعديل يتطلب رفعًا على
   مستودعك في GitHub، وأنت وحدك تملكه.
   ===================================================================== */

window.MizanLock = (function () {
  const PASS_HASH = "a17fc48abdcbda19cd198f836bb3b31fdb17b48cfad206763b923864703382d8";
  const KEY = "mizan-unlocked";

  async function sha(t) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  }
  function isUnlocked() { try { return sessionStorage.getItem(KEY) === PASS_HASH; } catch (e) { return false; } }
  function markUnlocked() { try { sessionStorage.setItem(KEY, PASS_HASH); } catch (e) {} }

  function overlay() {
    const o = document.createElement("div");
    o.id = "mizan-lock";
    o.innerHTML = `
      <style>
        #mizan-lock{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
          background:radial-gradient(900px 500px at 50% 0%,#1a2138,#080b14 70%);
          font-family:"Cairo",system-ui,sans-serif;color:#f5efe1;padding:20px}
        #mizan-lock .box{width:min(400px,92vw);text-align:center}
        #mizan-lock img{width:88px;height:88px;border-radius:20px;margin:0 auto 18px;
          filter:drop-shadow(0 18px 40px rgba(217,168,92,.3))}
        #mizan-lock h2{font-family:"Aref Ruqaa",serif;color:#f0cd82;font-size:1.8rem;margin:0 0 4px}
        #mizan-lock p{color:#a8a390;font-size:.92rem;margin:0 0 22px}
        #mizan-lock input{width:100%;background:#0a0d18;border:1px solid #2a3252;color:#f5efe1;
          border-radius:12px;padding:14px 16px;font-family:"Cairo";font-size:1rem;text-align:center}
        #mizan-lock input:focus{outline:none;border-color:#c0873c}
        #mizan-lock button{margin-top:12px;width:100%;border:none;cursor:pointer;border-radius:12px;
          padding:14px;font-family:"Cairo";font-weight:700;font-size:1rem;color:#20160a;
          background:linear-gradient(135deg,#f0cd82,#c0873c)}
        #mizan-lock .err{color:#e5807a;font-size:.85rem;min-height:20px;margin-top:10px}
        #mizan-lock details{margin-top:26px;text-align:start;color:#a8a390;font-size:.85rem}
        #mizan-lock summary{cursor:pointer;color:#d9a85c}
        #mizan-lock .gen{margin-top:12px;display:flex;gap:8px}
        #mizan-lock .gen input{text-align:start}
        #mizan-lock .out{direction:ltr;text-align:start;background:#0a0d18;border:1px solid #2a3252;
          border-radius:10px;padding:10px;font-family:ui-monospace,monospace;font-size:.72rem;
          margin-top:10px;word-break:break-all;color:#ecd39a;display:none}
      </style>
      <div class="box">
        <img src="logo.png" alt="ميزان النبط">
        <h2>أدوات خاصة</h2>
        <p>هذه الصفحة للمالك فقط — أدخل كلمة المرور.</p>
        <input id="ml-pass" type="password" placeholder="كلمة المرور" autocomplete="current-password">
        <button id="ml-go">دخول</button>
        <div class="err" id="ml-err"></div>
        <details>
          <summary>تغيير كلمة المرور</summary>
          <p style="margin:10px 0 0">اكتب كلمتك الجديدة، وانسخ السطر الناتج وضعه مكان
            <code>PASS_HASH</code> في ملف <code>lock.js</code>.</p>
          <div class="gen">
            <input id="ml-new" placeholder="كلمة المرور الجديدة">
            <button id="ml-hash" style="width:auto;padding:10px 16px;margin:0">توليد</button>
          </div>
          <div class="out" id="ml-out"></div>
        </details>
      </div>`;
    return o;
  }

  async function guard() {
    if (isUnlocked()) return;
    document.documentElement.style.overflow = "hidden";
    const o = overlay();
    document.body.appendChild(o);
    const pass = o.querySelector("#ml-pass"), go = o.querySelector("#ml-go"), err = o.querySelector("#ml-err");
    pass.focus();
    async function tryOpen() {
      const h = await sha(pass.value);
      if (h === PASS_HASH) {
        markUnlocked();
        document.documentElement.style.overflow = "";
        o.remove();
        window.dispatchEvent(new Event("mizan-unlocked"));
      } else { err.textContent = "كلمة المرور غير صحيحة."; pass.select(); }
    }
    go.addEventListener("click", tryOpen);
    pass.addEventListener("keydown", e => { if (e.key === "Enter") tryOpen(); });
    // مولّد البصمة
    const nw = o.querySelector("#ml-new"), hb = o.querySelector("#ml-hash"), out = o.querySelector("#ml-out");
    hb.addEventListener("click", async () => {
      if (!nw.value) return;
      const h = await sha(nw.value);
      out.style.display = "block";
      out.textContent = 'const PASS_HASH = "' + h + '";';
    });
  }

  return { guard, isUnlocked };
})();

// تفعيل القفل تلقائيًا على أي صفحة تستدعي هذا الملف
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", () => window.MizanLock.guard());
else window.MizanLock.guard();
