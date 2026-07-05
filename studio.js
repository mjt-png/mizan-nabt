/* ميزان النبط — استوديو التسجيل (تحويل إلى MP3 عبر lamejs) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800);
  }

  const iconRec = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>';
  const iconStop = '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  const iconDl = '<svg viewBox="0 0 24 24"><path d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14" stroke="#20160a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- تسجيل مايكروفون → MP3 ---------- */
  function makeRecorder() {
    let mediaRec = null, chunks = [], stream = null;

    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      const opts = {};
      // نفضّل صيغة يفكّها المتصفح لاحقًا
      if (MediaRecorder.isTypeSupported("audio/webm")) opts.mimeType = "audio/webm";
      else if (MediaRecorder.isTypeSupported("audio/mp4")) opts.mimeType = "audio/mp4";
      mediaRec = new MediaRecorder(stream, opts);
      mediaRec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      mediaRec.start();
    }

    function stop() {
      return new Promise((resolve, reject) => {
        mediaRec.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: mediaRec.mimeType || "audio/webm" });
            const mp3 = await toMp3(blob);
            resolve(mp3);
          } catch (err) { reject(err); }
          finally { if (stream) stream.getTracks().forEach(t => t.stop()); }
        };
        mediaRec.stop();
      });
    }
    return { start, stop };
  }

  // فكّ الترميز إلى PCM ثم ترميزه MP3
  async function toMp3(blob) {
    const buf = await blob.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const audio = await ctx.decodeAudioData(buf);
    const ch = audio.getChannelData(0);        // قناة واحدة (مونو)
    const sampleRate = audio.sampleRate;
    // Float32 → Int16
    const samples = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let s = Math.max(-1, Math.min(1, ch[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    ctx.close();

    const enc = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const block = 1152;
    const out = [];
    for (let i = 0; i < samples.length; i += block) {
      const slice = samples.subarray(i, i + block);
      const b = enc.encodeBuffer(slice);
      if (b.length) out.push(b);
    }
    const end = enc.flush();
    if (end.length) out.push(end);
    return new Blob(out, { type: "audio/mp3" });
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const supported = !!(navigator.mediaDevices && window.MediaRecorder && window.lamejs);

  /* ---------- بناء بطاقات التسجيل من data.js ---------- */
  function slotCard(word, tag, filename) {
    const card = el("div", "rec");
    card.innerHTML = `
      <div class="top">
        <div class="word"></div>
        <span class="tag">${tag}</span>
      </div>
      <div class="file">${filename}</div>
      <div class="row">
        <button class="rbtn record">${iconRec}تسجيل</button>
        <button class="rbtn dl" disabled>${iconDl}تنزيل</button>
        <span class="status"></span>
      </div>
      <audio controls></audio>`;
    card.querySelector(".word").textContent = word;
    const recBtn = card.querySelector(".record");
    const dlBtn = card.querySelector(".dl");
    const status = card.querySelector(".status");
    const audio = card.querySelector("audio");
    let rec = null, lastBlob = null, recording = false;

    recBtn.addEventListener("click", async () => {
      if (!supported) { toast("متصفحك لا يدعم التسجيل — جرّب Chrome أو Safari حديث."); return; }
      if (!recording) {
        try {
          rec = makeRecorder(); await rec.start();
          recording = true;
          recBtn.classList.add("on"); recBtn.innerHTML = iconStop + "إيقاف";
          status.textContent = "يسجّل…";
        } catch (e) { toast("تعذّر الوصول للمايكروفون — تأكد من الإذن."); }
      } else {
        recBtn.disabled = true; status.textContent = "يعالج…";
        try {
          lastBlob = await rec.stop();
          audio.src = URL.createObjectURL(lastBlob);
          card.classList.add("has", "saved");
          dlBtn.disabled = false;
          status.textContent = "جاهز ✓";
        } catch (e) { toast("صار خطأ أثناء المعالجة."); status.textContent = "خطأ"; }
        recording = false;
        recBtn.disabled = false; recBtn.classList.remove("on"); recBtn.innerHTML = iconRec + "إعادة";
      }
    });

    dlBtn.addEventListener("click", () => {
      if (lastBlob) { download(lastBlob, filename); toast("تنزّل: " + filename); }
    });
    return card;
  }

  const groupsRoot = $("#groups");
  SITE.lesson.roots.forEach(r => {
    const g = el("div", "group");
    const h = el("h2"); h.textContent = "جذر «" + r.root + "»";
    g.appendChild(h);
    const grid = el("div", "rec-grid");
    SITE.lesson.states.forEach(st => {
      grid.appendChild(slotCard(r[st.key], st.label, r.id + "-" + st.key + ".mp3"));
    });
    g.appendChild(grid);
    groupsRoot.appendChild(g);
  });

  /* ---------- التسجيل الحرّ ---------- */
  (function customRec() {
    const btn = $("#custom-rec"), dl = $("#custom-dl"), st = $("#custom-status"),
      audio = $("#custom-audio"), nameIn = $("#custom-name");
    let rec = null, blob = null, on = false;
    btn.addEventListener("click", async () => {
      if (!supported) { toast("متصفحك لا يدعم التسجيل."); return; }
      if (!on) {
        try { rec = makeRecorder(); await rec.start(); on = true;
          btn.classList.add("on"); btn.innerHTML = iconStop + "إيقاف"; st.textContent = "يسجّل…";
        } catch { toast("تعذّر الوصول للمايكروفون."); }
      } else {
        btn.disabled = true; st.textContent = "يعالج…";
        try { blob = await rec.stop(); audio.src = URL.createObjectURL(blob);
          audio.style.display = "block"; dl.disabled = false; st.textContent = "جاهز ✓";
        } catch { toast("صار خطأ."); st.textContent = "خطأ"; }
        on = false; btn.disabled = false; btn.classList.remove("on"); btn.innerHTML = iconRec + "إعادة";
      }
    });
    dl.addEventListener("click", () => {
      if (!blob) return;
      let n = (nameIn.value || "clip").trim().replace(/\s+/g, "-").replace(/\.mp3$/i, "");
      download(blob, n + ".mp3"); toast("تنزّل: " + n + ".mp3");
    });
  })();

  if (!supported) toast("للتسجيل استخدم Chrome أو Safari حديث عبر HTTPS.");
})();
