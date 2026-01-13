document.addEventListener("DOMContentLoaded", () => {
  // =============================
  // 工具
  // =============================
  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, "0");
  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [a[i], a[k]] = [a[k], a[i]];
    }
    return a;
  };

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // =============================
  // 資料：年級＋五大模組（自建、避版權）
  // =============================
  const MODULES = {
    1: [
      { id: "g1_count", icon: "🔢", title: "數與數量", subtitle: "（0～20）", desc: "數數、對應數量" },
      { id: "g1_number100", icon: "🧭", title: "認識 100", subtitle: "（不要求計算）", desc: "比大小、找數字" },
      { id: "g1_place", icon: "🧩", title: "十與一", subtitle: "（位值）", desc: "十個一＝一個十" },
      { id: "g1_make10", icon: "🧮", title: "湊 10", subtitle: "（補到 10）", desc: "為進位做準備" },
      { id: "g1_addsub20", icon: "➕", title: "20 以內加減", subtitle: "（先理解）", desc: "不比快、先正確" },
    ],
    2: [
      { id: "g2_addsub100", icon: "➕", title: "加減", subtitle: "（100 內）", desc: "含進退位" },
      { id: "g2_mul9", icon: "✖️", title: "乘法", subtitle: "（九九 0～9）", desc: "基礎熟練" },
      { id: "g2_div", icon: "➗", title: "除法", subtitle: "（整除）", desc: "配合乘法" },
      { id: "g2_place1000", icon: "🏷️", title: "位值", subtitle: "（千百十個）", desc: "讀寫數" },
      { id: "g2_word", icon: "📝", title: "應用題", subtitle: "（基礎）", desc: "關鍵字理解" },
    ],
    3: [
      { id: "g3_muldiv12", icon: "🧠", title: "乘除", subtitle: "（12 以內）", desc: "更熟練" },
      { id: "g3_place_big", icon: "📌", title: "位值與大數", subtitle: "（到萬位）", desc: "數的大小與表示" },
      { id: "g3_fraction", icon: "🍰", title: "分數初步", subtitle: "（等分概念）", desc: "1/2、1/3" },
      { id: "g3_measure", icon: "⏱️", title: "量與測量", subtitle: "（時間、長度、重量）", desc: "單位與換算" },
      { id: "g3_word_adv", icon: "🧾", title: "應用題", subtitle: "（進階）", desc: "步驟與檢查" },
    ],
  };

  // =============================
  // 題目生成（五大模組各自的簡單題型）
  // - 全部自建、不使用教材圖
  // - 題型以「概念順序」與「可擴充」為主
  // =============================
  function makeChoices(correct, count = 4) {
    const ans = String(correct);
    const set = new Set([ans]);
    const base = Number(correct);
    while (set.size < count) {
      let fake = base + randInt(-6, 6);
      if (!Number.isFinite(fake)) fake = base + 1;
      if (fake < 0) fake = base + randInt(1, 6);
      set.add(String(fake));
    }
    const arr = shuffle([...set]);
    return { arr, correct: arr.indexOf(ans) };
  }

  function q_count_0_20() {
    // 用「●」表示數量（純符號，不是圖片）
    const n = randInt(0, 20);
    const dots = "●".repeat(n);
    const ask = (n <= 12)
      ? `看符號：${dots || "（沒有）"}\n共有幾個？`
      : `共有 ${dots.length} 個 ●。請選正確數字。`;
    const c = makeChoices(n, 4);
    return { q: ask, a: c.arr, correct: c.correct, meta: { ans: n } };
  }

  function q_recognize_100() {
    const a = randInt(0, 100);
    const b = randInt(0, 100);
    const type = randInt(1, 3);
    if (type === 1) {
      const bigger = a > b ? a : b;
      const c = makeChoices(bigger, 4);
      return { q: `比大小：${a} 和 ${b}\n哪個比較大？`, a: c.arr, correct: c.correct, meta: { ans: bigger } };
    }
    if (type === 2) {
      const smaller = a < b ? a : b;
      const c = makeChoices(smaller, 4);
      return { q: `比大小：${a} 和 ${b}\n哪個比較小？`, a: c.arr, correct: c.correct, meta: { ans: smaller } };
    }
    // 找數字：在一排數字中找出指定數
    const target = randInt(0, 100);
    const options = shuffle([
      target,
      randInt(0, 100),
      randInt(0, 100),
      randInt(0, 100),
    ]).map(String);
    return { q: `找數字：請選出「${target}」`, a: options, correct: options.indexOf(String(target)), meta: { ans: target } };
  }

  function q_place_tens_ones(max = 99) {
    const n = randInt(0, max);
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const type = randInt(1, 2);
    if (type === 1) {
      const c = makeChoices(tens, 4);
      return { q: `位值：${n}\n有幾個「十」？`, a: c.arr, correct: c.correct, meta: { ans: tens } };
    } else {
      const c = makeChoices(ones, 4);
      return { q: `位值：${n}\n有幾個「一」？`, a: c.arr, correct: c.correct, meta: { ans: ones } };
    }
  }

  function q_make_10() {
    const a = randInt(0, 10);
    const b = 10 - a;
    const c = makeChoices(b, 4);
    return { q: `湊 10：${a} + ? = 10`, a: c.arr, correct: c.correct, meta: { ans: b } };
  }

  function q_addsub(max = 20, allowCarry = false) {
    const op = Math.random() < 0.5 ? "add" : "sub";
    let a, b, ans;
    if (op === "add") {
      a = randInt(0, max);
      b = randInt(0, max);
      ans = a + b;
      if (!allowCarry && ans > max) {
        b = randInt(0, max - a);
        ans = a + b;
      }
      const c = makeChoices(ans, 4);
      return { q: `${a} + ${b} = ?`, a: c.arr, correct: c.correct, meta: { ans } };
    } else {
      a = randInt(0, max);
      b = randInt(0, max);
      if (b > a) [a, b] = [b, a];
      ans = a - b;
      const c = makeChoices(ans, 4);
      return { q: `${a} - ${b} = ?`, a: c.arr, correct: c.correct, meta: { ans } };
    }
  }

  function q_mul(max = 9) {
    const a = randInt(0, max);
    const b = randInt(0, max);
    const ans = a * b;
    const c = makeChoices(ans, 4);
    return { q: `${a} × ${b} = ?`, a: c.arr, correct: c.correct, meta: { ans } };
  }

  function q_div(max = 9) {
    const divisor = randInt(1, max);
    const quotient = randInt(0, max);
    const dividend = divisor * quotient;
    const ans = quotient;
    const c = makeChoices(ans, 4);
    return { q: `${dividend} ÷ ${divisor} = ?`, a: c.arr, correct: c.correct, meta: { ans } };
  }

  function q_place_1000() {
    const n = randInt(0, 999);
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    const type = randInt(1, 3);
    if (type === 1) {
      const c = makeChoices(hundreds, 4);
      return { q: `位值：${n}\n有幾個「百」？`, a: c.arr, correct: c.correct, meta: { ans: hundreds } };
    }
    if (type === 2) {
      const c = makeChoices(tens, 4);
      return { q: `位值：${n}\n十位數是幾？`, a: c.arr, correct: c.correct, meta: { ans: tens } };
    }
    const c = makeChoices(ones, 4);
    return { q: `位值：${n}\n個位數是幾？`, a: c.arr, correct: c.correct, meta: { ans: ones } };
  }

  function q_word_basic() {
    // 自建小應用題（不引用教材）
    const a = randInt(10, 99);
    const b = randInt(1, 30);
    const type = randInt(1, 2);
    if (type === 1) {
      const ans = a + b;
      const c = makeChoices(ans, 4);
      return { q: `應用題：小明有 ${a} 顆糖，又得到 ${b} 顆。\n現在共有幾顆？`, a: c.arr, correct: c.correct, meta: { ans } };
    } else {
      const ans = a - b;
      const c = makeChoices(ans, 4);
      return { q: `應用題：盒子裡有 ${a} 顆球，拿走 ${b} 顆。\n還剩幾顆？`, a: c.arr, correct: c.correct, meta: { ans } };
    }
  }

  function q_place_big_to_10000() {
    const n = randInt(0, 9999);
    const thousands = Math.floor(n / 1000);
    const hundreds = Math.floor((n % 1000) / 100);
    const type = randInt(1, 2);
    if (type === 1) {
      const c = makeChoices(thousands, 4);
      return { q: `大數位值：${n}\n千位數是幾？`, a: c.arr, correct: c.correct, meta: { ans: thousands } };
    } else {
      const c = makeChoices(hundreds, 4);
      return { q: `大數位值：${n}\n百位數是幾？`, a: c.arr, correct: c.correct, meta: { ans: hundreds } };
    }
  }

  function q_fraction_intro() {
    // 分數等分（自建）
    const den = randInt(2, 4); // 2~4
    const num = randInt(1, den - 1);
    const askType = randInt(1, 2);
    if (askType === 1) {
      const ans = `${num}/${den}`;
      const options = shuffle([ans, `1/${den}`, `${den-1}/${den}`, `1/2`].map(String)).slice(0, 4);
      return { q: `分數：把一個整體平均分成 ${den} 份，取其中 ${num} 份。\n用分數表示是？`, a: options, correct: options.indexOf(ans), meta: { ans } };
    } else {
      const ans = den;
      const c = makeChoices(ans, 4);
      return { q: `分數：分母代表「平均分成幾份」。\n${num}/${den} 的分母是多少？`, a: c.arr, correct: c.correct, meta: { ans } };
    }
  }

  function q_measure_intro() {
    // 簡單單位題（自建）
    const type = randInt(1, 3);
    if (type === 1) {
      const ans = 60;
      const c = makeChoices(ans, 4);
      return { q: `時間：1 小時等於幾分鐘？`, a: c.arr, correct: c.correct, meta: { ans } };
    }
    if (type === 2) {
      const ans = 100;
      const c = makeChoices(ans, 4);
      return { q: `長度：1 公尺等於幾公分？`, a: c.arr, correct: c.correct, meta: { ans } };
    }
    const ans = 1000;
    const options = shuffle([String(ans), "100", "10", "60"]);
    return { q: `重量：1 公斤等於幾公克？`, a: options, correct: options.indexOf(String(ans)), meta: { ans } };
  }

  function q_word_advanced() {
    // 兩步驟（仍是自建）
    const a = randInt(20, 80);
    const b = randInt(10, 60);
    const c = randInt(1, 20);
    const ans = a + b - c;
    const choices = makeChoices(ans, 4);
    return {
      q: `進階應用：店裡原有 ${a} 盒彩筆，又進貨 ${b} 盒，後來賣出 ${c} 盒。\n現在剩下幾盒？`,
      a: choices.arr,
      correct: choices.correct,
      meta: { ans }
    };
  }

  function generatorFor(grade, moduleId) {
    // 回傳「一題」的生成器
    const map = {
      // 小一
      g1_count: () => q_count_0_20(),
      g1_number100: () => q_recognize_100(),
      g1_place: () => q_place_tens_ones(99),
      g1_make10: () => q_make_10(),
      g1_addsub20: () => q_addsub(20, false),

      // 小二
      g2_addsub100: () => q_addsub(100, true),
      g2_mul9: () => q_mul(9),
      g2_div: () => q_div(9),
      g2_place1000: () => q_place_1000(),
      g2_word: () => q_word_basic(),

      // 小三
      g3_muldiv12: () => (Math.random() < 0.5 ? q_mul(12) : q_div(12)),
      g3_place_big: () => q_place_big_to_10000(),
      g3_fraction: () => q_fraction_intro(),
      g3_measure: () => q_measure_intro(),
      g3_word_adv: () => q_word_advanced(),
    };
    return map[moduleId] || (() => ({ q: "尚未定義題型", a: ["OK"], correct: 0, meta: { ans: "OK" } }));
  }

  // =============================
  // 狀態
  // =============================
  const STATE = {
    selectedGrade: null,
    selectedModuleId: null,
    batchSize: 20,
    currentBatch: [],
    index: 0,
    locked: false,
    total: 0,
    correct: 0,
    startTime: 0,
  };

  // =============================
  // DOM
  // =============================
  const gradeBadge = $("gradeBadge");
  const moduleBadge = $("moduleBadge");
  const moduleGrid = $("moduleGrid");

  const practiceTitle = $("practiceTitle");
  const practiceBadge = $("practiceBadge");
  const practiceIntro = $("practiceIntro");
  const practiceArea = $("practiceArea");
  const questionEl = $("question");
  const choicesEl = $("choices");
  const statusEl = $("status");
  const nextBtn = $("nextBtn");
  const exitBtn = $("exitBtn");
  const reportEl = $("report");
  const progressText = $("progressText");
  const scoreText = $("scoreText");

  const historyListEl = $("historyList");
  const refreshHistoryBtn = $("refreshHistoryBtn");
  const clearHistoryBtn = $("clearHistoryBtn");

  const parentBtn = $("parentBtn");
  const openParentFromSettingsBtn = $("openParentFromSettingsBtn");
  const parentStatusBadge = $("parentStatusBadge");

  const modalMask = $("modalMask");
  const parentModal = $("parentModal");
  const parentModalBody = $("parentModalBody");
  const closeParentModalBtn = $("closeParentModalBtn");

  // =============================
  // 分頁切換
  // =============================
  const pages = {
    Home: $("pageHome"),
    Practice: $("pagePractice"),
    Records: $("pageRecords"),
    Settings: $("pageSettings"),
  };

  function showPage(name) {
    Object.keys(pages).forEach(k => pages[k].classList.remove("active"));
    pages[name].classList.add("active");

    document.querySelectorAll(".tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === name);
    });

    // 進入紀錄頁就刷新一次（確保不跑回首頁）
    if (name === "Records") renderHistory();
    if (name === "Settings") refreshParentStatusBadge();
  }

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  // =============================
  // 首頁：年級選擇
  // =============================
  function setGrade(grade) {
    STATE.selectedGrade = grade;
    STATE.selectedModuleId = null;

    // UI: 年級卡片 active
    document.querySelectorAll(".grade-card").forEach(b => {
      b.classList.toggle("active", Number(b.dataset.grade) === grade);
    });

    gradeBadge.textContent = `已選年級：小${grade}`;
    moduleBadge.textContent = `小${grade} 模組`;
    renderModules();
  }

  document.querySelectorAll(".grade-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const g = Number(btn.dataset.grade);
      setGrade(g);
    });
  });

  // =============================
  // 首頁：五大模組渲染（你要的排版：標題一行、副標小字下一行）
  // =============================
  function renderModules() {
    moduleGrid.innerHTML = "";
    const g = STATE.selectedGrade;
    if (!g) {
      moduleBadge.textContent = "請先選年級";
      return;
    }

    const list = MODULES[g] || [];
    list.forEach(m => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "module-card";
      btn.dataset.moduleId = m.id;

      btn.innerHTML = `
        <div class="module-icon">${m.icon}</div>
        <div class="module-text">
          <div class="module-title">${m.title}</div>
          <div class="module-subtitle">${m.subtitle}</div>
          <div class="module-desc">${m.desc}</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        STATE.selectedModuleId = m.id;
        startPracticeFromModule();
      });

      moduleGrid.appendChild(btn);
    });
  }

  // =============================
  // 練習：開始 / 出題 / 作答
  // =============================
  function currentModuleMeta() {
    const g = STATE.selectedGrade;
    if (!g) return null;
    return (MODULES[g] || []).find(x => x.id === STATE.selectedModuleId) || null;
  }

  function buildBatch() {
    const g = STATE.selectedGrade;
    const mid = STATE.selectedModuleId;
    const gen = generatorFor(g, mid);
    const qs = [];
    for (let i = 0; i < STATE.batchSize; i++) qs.push(gen());
    return qs;
  }

  function startPracticeFromModule() {
    const meta = currentModuleMeta();
    if (!STATE.selectedGrade || !meta) {
      showPage("Home");
      return;
    }

    // 切到練習頁
    showPage("Practice");

    practiceIntro.style.display = "none";
    practiceArea.style.display = "block";

    practiceTitle.textContent = `小${STATE.selectedGrade}｜${meta.title}`;
    practiceBadge.textContent = meta.subtitle;

    // reset
    STATE.currentBatch = buildBatch();
    STATE.index = 0;
    STATE.locked = false;
    STATE.total = 0;
    STATE.correct = 0;
    STATE.startTime = Date.now();

    reportEl.style.display = "none";
    reportEl.textContent = "";
    statusEl.style.color = "";
    statusEl.textContent = "請選擇答案";
    nextBtn.disabled = true;

    renderQuestion();
  }

  function renderQuestion() {
    STATE.locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    const q = STATE.currentBatch[STATE.index];
    questionEl.textContent = q.q;

    q.a.forEach((txt, idx) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = txt;
      b.addEventListener("click", () => choose(idx));
      choicesEl.appendChild(b);
    });

    progressText.textContent = `第 ${STATE.index + 1} 題 / ${STATE.currentBatch.length} 題`;
    scoreText.textContent = `正確 ${STATE.correct} / 作答 ${STATE.total}`;
  }

  function choose(idx) {
    if (STATE.locked) return;
    STATE.locked = true;

    STATE.total++;
    const q = STATE.currentBatch[STATE.index];
    const all = [...document.querySelectorAll(".choice")];

    if (all[q.correct]) all[q.correct].classList.add("correct");
    const ok = idx === q.correct;

    if (ok) {
      STATE.correct++;
      statusEl.textContent = "答對了 ✅";
      nextBtn.disabled = true;
      setTimeout(() => nextQuestion(), 380);
    } else {
      if (all[idx]) all[idx].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      nextBtn.disabled = false;
    }

    scoreText.textContent = `正確 ${STATE.correct} / 作答 ${STATE.total}`;
  }

  function nextQuestion() {
    if (STATE.index < STATE.currentBatch.length - 1) {
      STATE.index++;
      statusEl.textContent = "請選擇答案";
      renderQuestion();
    } else {
      finishPractice();
    }
  }

  function finishPractice() {
    const durationSec = Math.floor((Date.now() - STATE.startTime) / 1000);
    const percent = STATE.total === 0 ? 0 : Math.round((STATE.correct / STATE.total) * 100);

    statusEl.textContent = "🎉 完成本次練習！";
    statusEl.style.color = "#2e7d32";

    const meta = currentModuleMeta();
    const reportText = `學習報告：用時 ${durationSec} 秒｜作答 ${STATE.total} 題｜答對 ${STATE.correct} 題｜正確率 ${percent}%`;

    reportEl.style.display = "block";
    reportEl.textContent = reportText;

    // 存紀錄（只在紀錄頁顯示）
    const record = {
      time: Date.now(),
      durationSec,
      total: STATE.total,
      correct: STATE.correct,
      percent,
      grade: STATE.selectedGrade,
      moduleId: STATE.selectedModuleId,
      moduleTitle: meta ? meta.title : "",
      moduleSub: meta ? meta.subtitle : "",
    };
    localStorage.setItem(`record_${record.time}`, JSON.stringify(record));

    // 退出按鈕仍可用（不自動跳回首頁，避免你覺得亂）
    nextBtn.disabled = true;
  }

  nextBtn.addEventListener("click", nextQuestion);
  exitBtn.addEventListener("click", () => {
    // 回到練習頁引導，避免卡住
    practiceArea.style.display = "none";
    practiceIntro.style.display = "block";
    practiceTitle.textContent = "練習";
    practiceBadge.textContent = "尚未選擇模組";
    showPage("Home");
  });

  // =============================
  // 紀錄頁：渲染 / 清除（需要家長密碼）
  // =============================
  function getAllRecords() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("record_")) {
        try {
          items.push(JSON.parse(localStorage.getItem(k)));
        } catch {}
      }
    }
    items.sort((a, b) => (b.time || 0) - (a.time || 0));
    return items;
  }

  function renderHistory() {
    if (!historyListEl) return;
    const list = getAllRecords().slice(0, 20);
    historyListEl.innerHTML = "";

    if (list.length === 0) {
      historyListEl.innerHTML = `<div class="item"><b>目前還沒有紀錄。</b><div class="small">完成一次練習後會出現在這裡。</div></div>`;
      return;
    }

    list.forEach(r => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <b>${formatDate(r.time)}（小${r.grade}｜${r.moduleTitle} ${r.moduleSub || ""}）</b>
        <div>用時：${r.durationSec} 秒</div>
        <div>作答：${r.total} 題｜答對：${r.correct} 題｜正確率：${r.percent}%</div>
      `;
      historyListEl.appendChild(div);
    });
  }

  refreshHistoryBtn.addEventListener("click", renderHistory);

  // =============================
  // 家長模式：密碼＋安全問題（忘記密碼可重設）
  // =============================
  const PARENT = {
    hashKey: "parent_pwd_hash",
    qKey: "parent_sec_q",
    aHashKey: "parent_sec_a_hash",
  };

  function isParentConfigured() {
    return !!localStorage.getItem(PARENT.hashKey);
  }

  function refreshParentStatusBadge() {
    if (!parentStatusBadge) return;
    parentStatusBadge.textContent = isParentConfigured() ? "家長：已設定密碼" : "家長：未設定密碼";
  }

  function openModal() {
    modalMask.style.display = "block";
    parentModal.style.display = "block";
  }
  function closeModal() {
    modalMask.style.display = "none";
    parentModal.style.display = "none";
    parentModalBody.innerHTML = "";
  }

  modalMask.addEventListener("click", closeModal);
  closeParentModalBtn.addEventListener("click", closeModal);

  async function verifyParentPassword(pwd) {
    const saved = localStorage.getItem(PARENT.hashKey);
    if (!saved) return false;
    const h = await sha256(pwd);
    return h === saved;
  }

  function renderParentModalHome() {
    const configured = isParentConfigured();
    refreshParentStatusBadge();

    if (!configured) {
      parentModalBody.innerHTML = `
        <div class="small">尚未設定家長密碼。請先設定密碼與安全問題（用於忘記密碼重設）。</div>

        <div class="field">
          <label>設定家長密碼（至少 4 碼）</label>
          <input id="setPwd" type="password" placeholder="例如：1234" />
        </div>

        <div class="field">
          <label>安全問題（忘記密碼用）</label>
          <input id="setQ" type="text" placeholder="例如：你最喜歡的顏色？" />
        </div>

        <div class="field">
          <label>安全答案</label>
          <input id="setA" type="password" placeholder="請輸入答案" />
        </div>

        <div class="row">
          <button id="saveParentBtn" class="pill2" type="button">儲存</button>
          <button id="cancelParentBtn" class="pill2 danger" type="button">取消</button>
        </div>
      `;

      $("cancelParentBtn").addEventListener("click", closeModal);
      $("saveParentBtn").addEventListener("click", async () => {
        const pwd = $("setPwd").value.trim();
        const q = $("setQ").value.trim();
        const a = $("setA").value.trim();
        if (pwd.length < 4) { alert("密碼至少 4 碼"); return; }
        if (!q) { alert("請填安全問題"); return; }
        if (!a) { alert("請填安全答案"); return; }

        localStorage.setItem(PARENT.hashKey, await sha256(pwd));
        localStorage.setItem(PARENT.qKey, q);
        localStorage.setItem(PARENT.aHashKey, await sha256(a));
        alert("已設定家長密碼 ✅");
        renderParentModalHome();
      });

      return;
    }

    parentModalBody.innerHTML = `
      <div class="small">已設定家長密碼。你可以變更密碼，或忘記密碼時用安全問題重設。</div>

      <div class="row" style="margin-top:12px;">
        <button id="changePwdBtn" class="pill2" type="button">變更密碼</button>
        <button id="forgotPwdBtn" class="pill2" type="button">忘記密碼</button>
      </div>

      <div class="row" style="margin-top:10px;">
        <button id="closeParentBtn" class="pill2 danger" type="button">關閉</button>
      </div>
    `;

    $("closeParentBtn").addEventListener("click", closeModal);
    $("changePwdBtn").addEventListener("click", renderChangePwd);
    $("forgotPwdBtn").addEventListener("click", renderForgotPwd);
  }

  function renderChangePwd() {
    parentModalBody.innerHTML = `
      <div class="small">請先輸入舊密碼驗證，再設定新密碼。</div>

      <div class="field">
        <label>舊密碼</label>
        <input id="oldPwd" type="password" placeholder="輸入舊密碼" />
      </div>

      <div class="field">
        <label>新密碼（至少 4 碼）</label>
        <input id="newPwd" type="password" placeholder="輸入新密碼" />
      </div>

      <div class="row">
        <button id="doChangePwdBtn" class="pill2" type="button">確認變更</button>
        <button id="backParentBtn" class="pill2 danger" type="button">返回</button>
      </div>
    `;

    $("backParentBtn").addEventListener("click", renderParentModalHome);
    $("doChangePwdBtn").addEventListener("click", async () => {
      const oldPwd = $("oldPwd").value.trim();
      const newPwd = $("newPwd").value.trim();
      if (newPwd.length < 4) { alert("新密碼至少 4 碼"); return; }
      const ok = await verifyParentPassword(oldPwd);
      if (!ok) { alert("舊密碼錯誤 ❌"); return; }
      localStorage.setItem(PARENT.hashKey, await sha256(newPwd));
      alert("已變更密碼 ✅");
      renderParentModalHome();
    });
  }

  function renderForgotPwd() {
    const q = localStorage.getItem(PARENT.qKey) || "（未設定）";
    parentModalBody.innerHTML = `
      <div class="small">請回答安全問題以重設密碼。</div>

      <div class="field">
        <label>安全問題</label>
        <input type="text" value="${q.replaceAll('"','&quot;')}" disabled />
      </div>

      <div class="field">
        <label>安全答案</label>
        <input id="secAnswer" type="password" placeholder="輸入安全答案" />
      </div>

      <div class="field">
        <label>新密碼（至少 4 碼）</label>
        <input id="resetPwd" type="password" placeholder="輸入新密碼" />
      </div>

      <div class="row">
        <button id="doResetPwdBtn" class="pill2" type="button">重設密碼</button>
        <button id="backParentBtn2" class="pill2 danger" type="button">返回</button>
      </div>
    `;

    $("backParentBtn2").addEventListener("click", renderParentModalHome);
    $("doResetPwdBtn").addEventListener("click", async () => {
      const ans = $("secAnswer").value.trim();
      const pwd = $("resetPwd").value.trim();
      if (pwd.length < 4) { alert("新密碼至少 4 碼"); return; }
      const savedA = localStorage.getItem(PARENT.aHashKey);
      if (!savedA) { alert("缺少安全答案資料，請重新設定家長密碼。"); return; }
      const ok = (await sha256(ans)) === savedA;
      if (!ok) { alert("安全答案錯誤 ❌"); return; }
      localStorage.setItem(PARENT.hashKey, await sha256(pwd));
      alert("已重設密碼 ✅");
      renderParentModalHome();
    });
  }

  function openParentModal() {
    openModal();
    renderParentModalHome();
  }

  parentBtn.addEventListener("click", openParentModal);
  openParentFromSettingsBtn.addEventListener("click", openParentModal);

  // 清除紀錄：一定要家長密碼
  clearHistoryBtn.addEventListener("click", async () => {
    if (!isParentConfigured()) {
      alert("尚未設定家長密碼，請先到「設定」>「家長模式」設定密碼。");
      showPage("Settings");
      return;
    }
    const pwd = prompt("清除學習紀錄需要家長密碼：");
    if (pwd === null) return;
    const ok = await verifyParentPassword(pwd.trim());
    if (!ok) { alert("密碼錯誤 ❌"); return; }

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("record_")) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    alert("已清除學習紀錄 ✅");
    renderHistory();
  });

  // =============================
  // 初始化
  // =============================
  renderModules();
  renderHistory();
  refreshParentStatusBadge();
  showPage("Home");
});