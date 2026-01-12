document.addEventListener("DOMContentLoaded", () => {
  // ========= 基本設定 =========
  const SETTINGS = {
    batchSize: 10,
    choiceCount: 3,
    // 小一先做五大模組；小二小三可擴充更多
    gradeRules: {
      1: { allow: ["numSense", "compare100", "placeValue", "make10", "addSub20"] },
      2: { allow: ["numSense", "compare100", "placeValue", "make10", "addSub20"] },
      3: { allow: ["numSense", "compare100", "placeValue", "make10", "addSub20"] }
    },
    // 家長密碼
    parent: {
      resetCode: "8899" // 忘記密碼用（你可以改）
    }
  };

  // ========= DOM =========
  const pageHome = document.getElementById("pageHome");
  const pagePractice = document.getElementById("pagePractice");

  const gradeTag = document.getElementById("gradeTag");
  const moduleTag = document.getElementById("moduleTag");

  const btnParent = document.getElementById("btnParent");
  const btnRefreshHistory = document.getElementById("btnRefreshHistory");
  const btnClearHistory = document.getElementById("btnClearHistory");
  const historyList = document.getElementById("historyList");

  const btnBackHome = document.getElementById("btnBackHome");
  const practiceTag = document.getElementById("practiceTag");
  const practiceTitle = document.getElementById("practiceTitle");
  const practiceHint = document.getElementById("practiceHint");
  const questionEl = document.getElementById("question");
  const choicesEl = document.getElementById("choices");
  const btnNext = document.getElementById("btnNext");
  const statusEl = document.getElementById("status");
  const reportEl = document.getElementById("report");

  const navBtns = document.querySelectorAll(".navBtn");

  // 防呆：檔名/連結錯會導致找不到元素
  if (!pageHome || !pagePractice || !questionEl || !choicesEl) {
    alert("頁面元素找不到：請確認 index.html / style.css / script.js 檔名與連結是否正確。");
    return;
  }

  // ========= 狀態 =========
  let selectedGrade = 0;
  let selectedModule = "";
  let questions = [];
  let idx = 0;
  let locked = false;
  let startTimeMs = 0;
  let totalAnswered = 0;
  let correctAnswered = 0;

  // ========= 工具 =========
  const MODULE_NAME = {
    numSense: "數與數量",
    compare100: "認識 100",
    placeValue: "十與一（位值）",
    make10: "湊 10",
    addSub20: "20 以內加減"
  };

  function setActiveNav(key){
    navBtns.forEach(b => {
      b.classList.toggle("active", b.dataset.nav === key);
    });
  }

  function goHome(){
    pagePractice.style.display = "none";
    pageHome.style.display = "block";
    setActiveNav("home");
  }

  function goPractice(){
    pageHome.style.display = "none";
    pagePractice.style.display = "block";
    setActiveNav("practice");
  }

  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeChoices(ans){
    const a = Number(ans);
    const set = new Set([String(a)]);
    while (set.size < SETTINGS.choiceCount){
      const delta = randInt(1, 5);
      let fake = Math.random() < 0.5 ? a + delta : a - delta;
      if (fake < 0) fake = a + delta;
      set.add(String(fake));
    }
    const arr = shuffle([...set]);
    return { arr, correct: arr.indexOf(String(a)) };
  }

  // ========= 題庫（小一先做「概念型」） =========
  function buildQuestions(moduleKey){
    const qs = [];
    for (let k=0; k<SETTINGS.batchSize; k++){
      qs.push(makeOne(moduleKey));
    }
    return qs;
  }

  function makeOne(moduleKey){
    // 小一概念題：用「符號/數字」不碰版權圖片
    if (moduleKey === "numSense"){
      // 0~20 數量對應：用 ● 表示數量
      const n = randInt(0, 20);
      const dots = "●".repeat(n);
      const c = makeChoices(n);
      return { q: `請選出「●」有幾個？\n${dots || "（沒有●）"}`, a: c.arr, correct: c.correct, ans: n };
    }

    if (moduleKey === "compare100"){
      // 比大小：0~100
      const a = randInt(0, 100);
      const b = randInt(0, 100);
      const correct = a === b ? "=" : (a > b ? ">" : "<");
      const options = shuffle(["<", ">", "="]);
      return { q: `請選擇：${a} ＿ ${b}`, a: options, correct: options.indexOf(correct), ans: correct };
    }

    if (moduleKey === "placeValue"){
      // 位值：十與一（0~99）
      const n = randInt(0, 99);
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      const correct = `${tens}個十 + ${ones}個一`;
      const wrong1 = `${ones}個十 + ${tens}個一`;
      const wrong2 = `${tens+1}個十 + ${Math.max(0, ones-1)}個一`;
      const options = shuffle([correct, wrong1, wrong2]);
      return { q: `數字 ${n} 是哪一種組合？`, a: options, correct: options.indexOf(correct), ans: correct };
    }

    if (moduleKey === "make10"){
      // 湊10：0~10 的補數
      const a = randInt(0, 10);
      const ans = 10 - a;
      const c = makeChoices(ans);
      return { q: `要湊成 10：${a} + ＿ = 10`, a: c.arr, correct: c.correct, ans };
    }

    if (moduleKey === "addSub20"){
      // 20 以內加減（不進位退位優先）
      const isAdd = Math.random() < 0.5;
      if (isAdd){
        const x = randInt(0, 20);
        const y = randInt(0, 20 - x); // 確保 <=20
        const ans = x + y;
        const c = makeChoices(ans);
        return { q: `${x} + ${y} = ?`, a: c.arr, correct: c.correct, ans };
      } else {
        const x = randInt(0, 20);
        const y = randInt(0, x); // 不為負
        const ans = x - y;
        const c = makeChoices(ans);
        return { q: `${x} - ${y} = ?`, a: c.arr, correct: c.correct, ans };
      }
    }

    // fallback
    const c = makeChoices(0);
    return { q: "0 = ?", a: c.arr, correct: c.correct, ans: 0 };
  }

  // ========= 練習流程 =========
  function startPractice(moduleKey){
    if (!selectedGrade){
      alert("請先選年級。");
      return;
    }
    const allow = SETTINGS.gradeRules[selectedGrade].allow;
    if (!allow.includes(moduleKey)){
      alert("此年級尚未開放此模組。");
      return;
    }

    selectedModule = moduleKey;
    questions = buildQuestions(moduleKey);
    idx = 0;
    locked = false;
    startTimeMs = Date.now();
    totalAnswered = 0;
    correctAnswered = 0;

    practiceTag.textContent = `小${selectedGrade}`;
    practiceTitle.textContent = `小${selectedGrade}｜${MODULE_NAME[moduleKey] || "練習"}`;
    practiceHint.textContent = "選擇答案後作答。答對自動下一題，答錯請按「下一題」。";

    reportEl.style.display = "none";
    reportEl.textContent = "";

    goPractice();
    renderQ();
  }

  function renderQ(){
    locked = false;
    btnNext.disabled = true;
    choicesEl.innerHTML = "";

    const q = questions[idx];
    questionEl.textContent = `第 ${idx+1} 題（共 ${questions.length} 題）\n${q.q}`;
    statusEl.textContent = "請選擇答案";
    statusEl.style.color = "";

    q.a.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = t;
      b.addEventListener("click", () => choose(i));
      choicesEl.appendChild(b);
    });
  }

  function choose(choiceIndex){
    if (locked) return;
    locked = true;

    totalAnswered++;
    const q = questions[idx];
    const all = [...document.querySelectorAll(".choice")];
    if (all[q.correct]) all[q.correct].classList.add("correct");

    const ok = choiceIndex === q.correct;
    if (ok){
      correctAnswered++;
      statusEl.textContent = "答對了 ✅";
      btnNext.disabled = true;
      setTimeout(nextQ, 450);
    } else {
      if (all[choiceIndex]) all[choiceIndex].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      btnNext.disabled = false;
    }
  }

  function nextQ(){
    if (idx < questions.length - 1){
      idx++;
      renderQ();
    } else {
      finish();
    }
  }

  function finish(){
    const durationSec = Math.floor((Date.now() - startTimeMs) / 1000);
    const percent = totalAnswered ? Math.round((correctAnswered / totalAnswered) * 100) : 0;

    statusEl.textContent = "✅ 本回合完成！";
    statusEl.style.color = "#2e7d32";

    const report = `學習報告：用時 ${durationSec} 秒｜作答 ${totalAnswered} 題｜答對 ${correctAnswered} 題｜正確率 ${percent}%`;
    reportEl.style.display = "block";
    reportEl.textContent = report;

    // 存紀錄
    const key = `report_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({
      time: Date.now(),
      grade: selectedGrade,
      module: selectedModule,
      durationSec,
      totalAnswered,
      correctAnswered,
      percent
    }));
    renderHistory();
  }

  // ========= 學習紀錄 =========
  function pad2(n){ return String(n).padStart(2, "0"); }
  function formatDate(ts){
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function getReports(){
    const list = [];
    for (let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if (k && k.startsWith("report_")){
        try{
          list.push(JSON.parse(localStorage.getItem(k)));
        }catch{}
      }
    }
    list.sort((a,b)=>(b.time||0)-(a.time||0));
    return list;
  }

  function renderHistory(){
    if (!historyList) return;
    const list = getReports().slice(0, 10);

    if (!list.length){
      historyList.innerHTML = `<div class="empty">目前還沒有紀錄。</div>`;
      return;
    }

    historyList.innerHTML = "";
    list.forEach(r => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div><b>${formatDate(r.time)}</b>（小${r.grade}｜${MODULE_NAME[r.module] || r.module}）</div>
        <div>用時：${r.durationSec} 秒</div>
        <div>作答：${r.totalAnswered}｜答對：${r.correctAnswered}｜正確率：${r.percent}%</div>
      `;
      historyList.appendChild(div);
    });
  }

  // ========= 家長功能：設定密碼/清除紀錄要密碼 =========
  function getParentPwd(){
    return localStorage.getItem("parent_pwd") || "";
  }
  function setParentPwd(pwd){
    localStorage.setItem("parent_pwd", pwd);
  }

  function parentMenu(){
    const hasPwd = !!getParentPwd();
    const msg = hasPwd
      ? "家長選單：\n1) 變更密碼\n2) 忘記密碼（用重設碼）\n（取消請按取消）"
      : "尚未設定家長密碼：\n1) 立即設定密碼\n（取消請按取消）";
    const choice = prompt(msg);
    if (!choice) return;

    if (!hasPwd && choice.trim() === "1"){
      const pwd = prompt("請設定家長密碼（至少4碼）");
      if (!pwd || pwd.length < 4){ alert("密碼至少 4 碼"); return; }
      setParentPwd(pwd);
      alert("已設定家長密碼 ✅");
      return;
    }

    if (hasPwd && choice.trim() === "1"){
      const oldPwd = prompt("請輸入舊密碼");
      if (oldPwd !== getParentPwd()){ alert("舊密碼錯誤 ❌"); return; }
      const newPwd = prompt("請輸入新密碼（至少4碼）");
      if (!newPwd || newPwd.length < 4){ alert("新密碼至少 4 碼"); return; }
      setParentPwd(newPwd);
      alert("已更新密碼 ✅");
      return;
    }

    if (hasPwd && choice.trim() === "2"){
      const code = prompt(`請輸入重設碼（預設：${SETTINGS.parent.resetCode}）`);
      if (code !== SETTINGS.parent.resetCode){ alert("重設碼錯誤 ❌"); return; }
      const newPwd = prompt("請輸入新密碼（至少4碼）");
      if (!newPwd || newPwd.length < 4){ alert("新密碼至少 4 碼"); return; }
      setParentPwd(newPwd);
      alert("已重設密碼 ✅");
      return;
    }

    alert("無效選項。");
  }

  function requireParentPwd(){
    const pwd = getParentPwd();
    if (!pwd){
      alert("尚未設定家長密碼，請先按右上角「家長」設定。");
      return false;
    }
    const input = prompt("請輸入家長密碼");
    if (input !== pwd){
      alert("密碼錯誤 ❌");
      return false;
    }
    return true;
  }

  function clearHistory(){
    if (!requireParentPwd()) return;
    const keys = [];
    for (let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if (k && k.startsWith("report_")) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    alert("已清除紀錄 ✅");
    renderHistory();
  }

  // ========= UI：年級選擇＆模組鎖定 =========
  function setGrade(g){
    selectedGrade = g;
    gradeTag.textContent = `已選：小${g}`;
    moduleTag.textContent = `可開始選模組`;
    applyModuleLocks();
  }

  function applyModuleLocks(){
    const allow = SETTINGS.gradeRules[selectedGrade]?.allow || [];
    document.querySelectorAll(".moduleBtn").forEach(btn => {
      const key = btn.dataset.module;
      const locked = !selectedGrade || !allow.includes(key);
      btn.classList.toggle("locked", locked);
      btn.disabled = locked;
    });
  }

  // ========= 綁定事件 =========
  document.querySelectorAll(".gradeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const g = Number(btn.dataset.grade);
      setGrade(g);
    });
  });

  document.querySelectorAll(".moduleBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.module;
      startPractice(key);
    });
  });

  btnBackHome.addEventListener("click", goHome);
  btnNext.addEventListener("click", nextQ);

  btnRefreshHistory.addEventListener("click", renderHistory);
  btnClearHistory.addEventListener("click", clearHistory);

  btnParent.addEventListener("click", parentMenu);

  // 底部導覽（簡化：home/practice/history/settings）
  navBtns.forEach(b => {
    b.addEventListener("click", () => {
      const key = b.dataset.nav;
      if (key === "home") goHome();
      if (key === "practice") {
        // 沒選模組就回首頁
        if (!selectedModule) { alert("請先在首頁選年級與模組。"); goHome(); return; }
        goPractice();
      }
      if (key === "history") {
        // 捲動到紀錄區
        goHome();
        setTimeout(() => {
          document.getElementById("historyList")?.scrollIntoView({behavior:"smooth", block:"start"});
        }, 50);
      }
      if (key === "settings") {
        alert("設定頁：之後可放音效/題量/難度/家長重設碼等。");
      }
      setActiveNav(key);
    });
  });

  // ========= 初始化 =========
  applyModuleLocks();
  renderHistory();
  goHome();

  // 用來確認 JS 有載入
  console.log("✅ script.js 已載入");
});
