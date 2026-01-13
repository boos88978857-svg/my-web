document.addEventListener("DOMContentLoaded", () => {

  // ===== 基本 DOM =====
  const pageHome = document.getElementById("pageHome");
  const pagePractice = document.getElementById("pagePractice");
  const pageRecords = document.getElementById("pageRecords");
  const pageSettings = document.getElementById("pageSettings");

  const tabs = document.querySelectorAll(".tab");

  const gradeBadge = document.getElementById("gradeBadge");
  const moduleBadge = document.getElementById("moduleBadge");
  const moduleGrid = document.getElementById("moduleGrid");

  const practiceTitle = document.getElementById("practiceTitle");
  const practiceMeta = document.getElementById("practiceMeta");
  const questionText = document.getElementById("questionText");
  const iconField = document.getElementById("iconField");
  const choicesEl = document.getElementById("choices");
  const statusEl = document.getElementById("status");
  const reportEl = document.getElementById("report");
  const nextBtn = document.getElementById("nextBtn");
  const backHomeBtn = document.getElementById("backHomeBtn");
  const exitPracticeBtn = document.getElementById("exitPracticeBtn");

  const historyListEl = document.getElementById("historyList");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const parentBtn = document.getElementById("parentBtn");
  const openParentFromSettings = document.getElementById("openParentFromSettings");
  const forgetPwdBtn = document.getElementById("forgetPwdBtn");

  const modalMask = document.getElementById("modalMask");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const savePwdBtn = document.getElementById("savePwdBtn");
  const newPwd = document.getElementById("newPwd");
  const newPwd2 = document.getElementById("newPwd2");
  const hintQ = document.getElementById("hintQ");
  const hintA = document.getElementById("hintA");

  if (!pageHome || !moduleGrid || !choicesEl) {
    alert("HTML 缺少必要元素，請確認 index.html 已完整覆蓋。");
    return;
  }

  // ===== 狀態 =====
  let selectedGrade = null;     // 1/2/3
  let selectedModuleId = null;  // 模組 id
  let current = null;           // 當前題目資料
  let locked = false;

  // ===== 題組統計（紀錄用） =====
  let startTimeMs = 0;
  let totalAnswered = 0;
  let correctAnswered = 0;

  // ===== 工具 =====
  const pad2 = (n) => String(n).padStart(2, "0");
  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const randInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

  function shuffle(arr){
    const a = arr.slice();
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  // 產生選項（數字型）
  function makeChoicesNumber(ans, count=4){
    const a = Number(ans);
    const set = new Set([a]);
    while (set.size < count){
      const delta = randInt(1, Math.max(3, Math.floor(a*0.25) || 3));
      let fake = Math.random()<0.5 ? a+delta : a-delta;
      if (fake < 0) fake = a + delta;
      set.add(fake);
    }
    const arr = shuffle([...set]);
    return { arr, correct: arr.indexOf(a) };
  }

  // ===== 5 大模組資料（先把小一做完整）=====
  // 你要改文字/順序只改這裡就行
  const MODULES = {
    1: [
      { id:"g1_count", icon:"🔢", title:"數對應數量", sub:"(0～20)", desc:"數數、對應數量", type:"count_0_20" },
      { id:"g1_know100", icon:"🧭", title:"認識 100", sub:"(不要求計算)", desc:"比大小、找數字", type:"know_100" },
      { id:"g1_place", icon:"🧩", title:"十與一", sub:"(位值)", desc:"十個=一個十", type:"place_value" },
      { id:"g1_make10", icon:"🧮", title:"湊 10", sub:"(補到 10)", desc:"為進位做準備", type:"make_10" },
      { id:"g1_addsub20", icon:"➕", title:"20 以內加減", sub:"(先理解)", desc:"不進位退位", type:"addsub_20_nocarry" },
    ],
    2: [
      { id:"g2_addsub100", icon:"➕", title:"加減", sub:"(100 內)", desc:"含進退位", type:"addsub_100" },
      { id:"g2_mul9", icon:"✖️", title:"乘法", sub:"(九九)", desc:"0～9", type:"mul_9" },
      { id:"g2_div", icon:"➗", title:"除法", sub:"(整除)", desc:"配合乘法", type:"div_9" },
      { id:"g2_place", icon:"🏷️", title:"位值", sub:"(千百十個)", desc:"讀寫數", type:"place_value_2" },
      { id:"g2_word", icon:"📝", title:"應用題", sub:"(基礎)", desc:"關鍵字理解", type:"word_basic" },
    ],
    3: [
      { id:"g3_mul12", icon:"🧠", title:"乘除", sub:"(12 內)", desc:"更熟練", type:"mul_12" },
      { id:"g3_big", icon:"📌", title:"位值與大數", sub:"(到萬位)", desc:"讀寫比較", type:"big_number" },
      { id:"g3_frac", icon:"🍰", title:"分數初步", sub:"(等分)", desc:"概念建立", type:"fraction_intro" },
      { id:"g3_measure", icon:"⏱️", title:"量與測量", sub:"(時間長度重量)", desc:"單位認識", type:"measure" },
      { id:"g3_word", icon:"🧾", title:"應用題", sub:"(進階)", desc:"步驟與檢查", type:"word_adv" },
    ]
  };

  // ===== 分頁切換 =====
  function showPage(name){
    pageHome.classList.remove("page-active");
    pagePractice.classList.remove("page-active");
    pageRecords.classList.remove("page-active");
    pageSettings.classList.remove("page-active");

    if (name==="home") pageHome.classList.add("page-active");
    if (name==="practice") pagePractice.classList.add("page-active");
    if (name==="records") pageRecords.classList.add("page-active");
    if (name==="settings") pageSettings.classList.add("page-active");

    tabs.forEach(t => t.classList.remove("tab-active"));
    document.querySelector(`.tab[data-tab="${name}"]`)?.classList.add("tab-active");
  }

  tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const tab = btn.dataset.tab;
      if (tab) {
        showPage(tab);
        if (tab==="records") renderHistory();
      }
    });
  });

  // ===== 年級選擇 =====
  document.querySelectorAll(".grade-card").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      selectedGrade = Number(btn.dataset.grade || 0);
      gradeBadge.textContent = `已選年級：小${selectedGrade}`;
      moduleBadge.textContent = `小${selectedGrade} 模組`;
      renderModules();
    });
  });

  // ===== 模組渲染（五大模組）=====
  function renderModules(){
    moduleGrid.innerHTML = "";
    selectedModuleId = null;

    if (!selectedGrade){
      moduleBadge.textContent = "請先選年級";
      return;
    }

    const list = MODULES[selectedGrade] || [];
    list.forEach(m=>{
      const card = document.createElement("button");
      card.type = "button";
      card.className = "module-card";

      // 你如果要鎖某些模組：在這裡加條件
      const isLocked = false;

      if (isLocked) card.classList.add("locked");

      card.innerHTML = `
        <div class="module-icon">${m.icon}</div>
        <div class="module-text">
          <div class="m-title">${m.title}</div>
          <div class="m-sub">${m.sub}</div>
          <div class="m-desc">${m.desc}</div>
        </div>
      `;

      card.addEventListener("click", ()=>{
        if (!selectedGrade){
          alert("請先選年級");
          return;
        }
        if (isLocked){
          alert("此模組尚未開放");
          return;
        }
        startPractice(m);
      });

      moduleGrid.appendChild(card);
    });
  }

  // ===== 出題：小一（先把重點做對）=====
  const COUNT_ICONS = ["🍎","🍊","🍇","🍓","⭐","🔵","🟡","🧊","🐟","🌸"];

  function renderIconCount(n){
    iconField.innerHTML = "";
    if (!n || n<=0) return;
    const icon = COUNT_ICONS[randInt(0, COUNT_ICONS.length-1)];
    for (let i=0;i<n;i++){
      const span = document.createElement("div");
      span.className = "icon-chip";
      span.textContent = icon;
      iconField.appendChild(span);
    }
  }

  function genQuestionByType(type){
    // 回傳：{ prompt, choices:[], correctIndex, meta:{...}, iconCount?:number }
    if (type==="count_0_20"){
      const n = randInt(0,20);
      const choice = makeChoicesNumber(n, 4);
      return {
        prompt: "請數一數：下面有幾個？",
        choices: choice.arr.map(String),
        correctIndex: choice.correct,
        meta: { grade: selectedGrade, module: type, ans: n },
        iconCount: n
      };
    }

    if (type==="know_100"){
      // 比大小：選 > / < / =
      const a = randInt(0,100);
      const b = randInt(0,100);
      let correct = "=";
      if (a>b) correct = ">";
      if (a<b) correct = "<";
      const ops = ["<", ">", "="];
      return {
        prompt: `請選正確符號：${a}  ?  ${b}`,
        choices: ops,
        correctIndex: ops.indexOf(correct),
        meta: { grade: selectedGrade, module: type, ans: correct },
        iconCount: null
      };
    }

    if (type==="place_value"){
      // 十與一：例如 34 = 3 個十 + 4 個一，選正確分解
      const n = randInt(10,99);
      const tens = Math.floor(n/10);
      const ones = n%10;
      const correctText = `${tens} 個十 + ${ones} 個一`;

      const set = new Set([correctText]);
      while (set.size < 4){
        const t = randInt(1,9);
        const o = randInt(0,9);
        set.add(`${t} 個十 + ${o} 個一`);
      }
      const arr = shuffle([...set]);
      return {
        prompt: `請選正確：${n} 是多少「十與一」？`,
        choices: arr,
        correctIndex: arr.indexOf(correctText),
        meta: { grade: selectedGrade, module: type, ans: correctText },
        iconCount: null
      };
    }

    if (type==="make_10"){
      // 湊 10：a + ? = 10
      const a = randInt(0,10);
      const ans = 10 - a;
      const c = makeChoicesNumber(ans, 4);
      return {
        prompt: `請選正確答案：${a} + ？ = 10`,
        choices: c.arr.map(String),
        correctIndex: c.correct,
        meta: { grade: selectedGrade, module: type, ans },
        iconCount: null
      };
    }

    if (type==="addsub_20_nocarry"){
      // 20 以內加減（不進位退位）
      const isAdd = Math.random() < 0.5;

      if (isAdd){
        // 不進位：個位相加 < 10
        const aT = randInt(0,1);
        const bT = randInt(0,1);
        const aO = randInt(0,9);
        const bO = randInt(0,9-aO);
        const a = aT*10 + aO;
        const b = bT*10 + bO;
        if (a+b>20) return genQuestionByType(type);
        const ans = a+b;
        const c = makeChoicesNumber(ans, 4);
        return {
          prompt: `請選正確答案：${a} + ${b} = ？`,
          choices: c.arr.map(String),
          correctIndex: c.correct,
          meta: { grade: selectedGrade, module: type, ans },
          iconCount: null
        };
      } else {
        // 不退位：個位相減不為負
        const a = randInt(0,20);
        const aO = a%10;
        const bO = randInt(0, aO);
        const bT = randInt(0, Math.floor(a/10));
        const b = bT*10 + bO;
        const ans = a-b;
        const c = makeChoicesNumber(ans, 4);
        return {
          prompt: `請選正確答案：${a} - ${b} = ？`,
          choices: c.arr.map(String),
          correctIndex: c.correct,
          meta: { grade: selectedGrade, module: type, ans },
          iconCount: null
        };
      }
    }

    // 小二小三先給可用的「加減乘除」基礎（避免你現在卡住）
    if (type==="addsub_100"){
      const a = randInt(0,100);
      const b = randInt(0,100);
      const ans = a + b;
      const c = makeChoicesNumber(ans, 4);
      return { prompt:`${a} + ${b} = ？`, choices:c.arr.map(String), correctIndex:c.correct, meta:{grade:selectedGrade,module:type,ans} };
    }
    if (type==="mul_9" || type==="mul_12"){
      const max = type==="mul_12" ? 12 : 9;
      const a = randInt(0,max);
      const b = randInt(0,max);
      const ans = a*b;
      const c = makeChoicesNumber(ans, 4);
      return { prompt:`${a} × ${b} = ？`, choices:c.arr.map(String), correctIndex:c.correct, meta:{grade:selectedGrade,module:type,ans} };
    }
    if (type==="div_9"){
      const d = 9;
      const divisor = randInt(1,d);
      const quotient = randInt(0,d);
      const dividend = divisor * quotient;
      const ans = quotient;
      const c = makeChoicesNumber(ans, 4);
      return { prompt:`${dividend} ÷ ${divisor} = ？`, choices:c.arr.map(String), correctIndex:c.correct, meta:{grade:selectedGrade,module:type,ans} };
    }

    // 其他先用提示（之後你要我再逐個補完整題庫）
    return {
      prompt: "此模組題庫尚在建置中（可用）",
      choices: ["知道了"],
      correctIndex: 0,
      meta: { grade: selectedGrade, module: type, ans: "ok" },
      iconCount: null
    };
  }

  // ===== 練習流程 =====
  let currentModule = null;
  let qIndex = 0;
  const BATCH_SIZE = 20;

  function startPractice(module){
    currentModule = module;
    selectedModuleId = module.id;

    startTimeMs = Date.now();
    totalAnswered = 0;
    correctAnswered = 0;
    qIndex = 0;

    reportEl.style.display = "none";
    reportEl.textContent = "";
    statusEl.style.color = "";
    statusEl.textContent = "請選擇答案";

    showPage("practice");

    practiceTitle.textContent = `小${selectedGrade}｜${module.title}`;
    practiceMeta.textContent = `第 1 / ${BATCH_SIZE} 題　｜　答對 0 / 作答 0`;

    nextBtn.disabled = true;
    locked = false;

    nextQuestion();
  }

  function renderQuestion(q){
    locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    questionText.textContent = q.prompt;

    // icon 題才顯示
    if (q.iconCount != null) {
      renderIconCount(q.iconCount);
      iconField.style.display = "flex";
    } else {
      iconField.innerHTML = "";
      iconField.style.display = "none";
    }

    q.choices.forEach((t, idx)=>{
      const b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = t;
      b.addEventListener("click", ()=>choose(idx));
      choicesEl.appendChild(b);
    });

    updateMeta();
  }

  function updateMeta(){
    const i = Math.min(qIndex+1, BATCH_SIZE);
    practiceMeta.textContent = `第 ${i} / ${BATCH_SIZE} 題　｜　答對 ${correctAnswered} / 作答 ${totalAnswered}`;
  }

  function choose(idx){
    if (locked) return;
    locked = true;

    totalAnswered++;

    const all = [...document.querySelectorAll(".choice")];
    if (all[current.correctIndex]) all[current.correctIndex].classList.add("correct");

    const ok = idx === current.correctIndex;

    if (ok){
      correctAnswered++;
      statusEl.textContent = "答對了 ✅";
      nextBtn.disabled = true;
      setTimeout(()=>nextQuestion(), 420);
    } else {
      if (all[idx]) all[idx].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      nextBtn.disabled = false;
    }

    updateMeta();
  }

  function nextQuestion(){
    if (!currentModule) return;

    if (qIndex >= BATCH_SIZE){
      finishBatch();
      return;
    }

    current = genQuestionByType(currentModule.type);
    renderQuestion(current);
    qIndex++;
  }

  function finishBatch(){
    const durationSec = Math.floor((Date.now() - startTimeMs)/1000);
    const percent = totalAnswered===0 ? 0 : Math.round((correctAnswered/totalAnswered)*100);

    const reportText =
      `學習報告：用時 ${durationSec} 秒｜作答 ${totalAnswered} 題｜答對 ${correctAnswered} 題｜正確率 ${percent}%`;

    statusEl.textContent = "🎉 本回合完成！";
    statusEl.style.color = "#2e7d32";

    reportEl.style.display = "block";
    reportEl.textContent = reportText;

    // 存紀錄
    localStorage.setItem(`report_${Date.now()}`, JSON.stringify({
      time: Date.now(),
      durationSec,
      totalAnswered,
      correctAnswered,
      percent,
      grade: selectedGrade,
      moduleId: currentModule.id,
      moduleTitle: currentModule.title
    }));

    // 回到紀錄頁讓你看得到
    renderHistory();
  }

  nextBtn.addEventListener("click", ()=> nextQuestion());
  backHomeBtn.addEventListener("click", ()=> showPage("home"));
  exitPracticeBtn.addEventListener("click", ()=> showPage("home"));

  // ===== 學習紀錄 =====
  function getAllReports(){
    const items=[];
    for (let k=0;k<localStorage.length;k++){
      const key=localStorage.key(k);
      if (key && key.startsWith("report_")){
        try{
          const obj=JSON.parse(localStorage.getItem(key));
          items.push(obj);
        }catch{}
      }
    }
    items.sort((a,b)=>(b.time||0)-(a.time||0));
    return items;
  }

  function renderHistory(){
    if (!historyListEl) return;
    const list = getAllReports().slice(0,7);

    historyListEl.innerHTML = "";
    if (list.length === 0){
      historyListEl.innerHTML = `<div class="empty">目前還沒有紀錄。</div>`;
      return;
    }

    list.forEach(r=>{
      const div = document.createElement("div");
      div.className = "item";
      const title = r.moduleTitle ? `｜${r.moduleTitle}` : "";
      div.innerHTML = `
        <b>${formatDate(r.time)}（小${r.grade}${title}）</b>
        <div>用時：${r.durationSec} 秒</div>
        <div>作答：${r.totalAnswered} 題｜答對：${r.correctAnswered} 題｜正確率：${r.percent}%</div>
      `;
      historyListEl.appendChild(div);
    });
  }

  if (refreshHistoryBtn) refreshHistoryBtn.addEventListener("click", renderHistory);

  // ===== 家長密碼（本機）=====
  const LS_PWD = "parent_pwd";
  const LS_Q = "parent_hint_q";
  const LS_A = "parent_hint_a";

  function hasPwd(){
    return !!localStorage.getItem(LS_PWD);
  }

  function openModal(){
    modalMask.style.display = "flex";
    // 填入目前提示問題
    hintQ.value = localStorage.getItem(LS_Q) || "";
    hintA.value = "";
    newPwd.value = "";
    newPwd2.value = "";
  }

  function closeModal(){
    modalMask.style.display = "none";
  }

  function saveParentPwd(){
    const p1 = (newPwd.value || "").trim();
    const p2 = (newPwd2.value || "").trim();
    const q = (hintQ.value || "").trim();
    const a = (hintA.value || "").trim();

    if (p1.length < 4){
      alert("密碼至少 4 碼。");
      return;
    }
    if (p1 !== p2){
      alert("兩次密碼不一致。");
      return;
    }
    if (!q || !a){
      alert("請填提示問題與提示答案（用於忘記密碼）。");
      return;
    }

    localStorage.setItem(LS_PWD, p1);
    localStorage.setItem(LS_Q, q);
    localStorage.setItem(LS_A, a);

    alert("已儲存家長密碼 ✅");
    closeModal();
  }

  function requirePwd(actionName){
    if (!hasPwd()){
      alert("尚未設定家長密碼，請先到「家長」設定。");
      openModal();
      return null;
    }
    const pwd = prompt(`${actionName} 需要家長密碼：`);
    if (pwd === null) return null;
    const ok = pwd === localStorage.getItem(LS_PWD);
    if (!ok){
      alert("密碼錯誤 ❌");
      return null;
    }
    return true;
  }

  // 清除紀錄（一定要密碼）
  if (clearHistoryBtn){
    clearHistoryBtn.addEventListener("click", ()=>{
      const ok = requirePwd("清除學習紀錄");
      if (!ok) return;

      const keys=[];
      for (let k=0;k<localStorage.length;k++){
        const key=localStorage.key(k);
        if (key && key.startsWith("report_")) keys.push(key);
      }
      keys.forEach(k=>localStorage.removeItem(k));
      alert("已清除學習紀錄 ✅");
      renderHistory();
    });
  }

  // 家長按鈕
  parentBtn?.addEventListener("click", openModal);
  openParentFromSettings?.addEventListener("click", openModal);
  closeModalBtn?.addEventListener("click", closeModal);
  modalMask?.addEventListener("click", (e)=>{
    if (e.target === modalMask) closeModal();
  });
  savePwdBtn?.addEventListener("click", saveParentPwd);

  // 忘記密碼：用提示問題 + 答案核對後允許重設
  forgetPwdBtn?.addEventListener("click", ()=>{
    if (!hasPwd()){
      alert("目前沒有設定密碼。");
      openModal();
      return;
    }
    const q = localStorage.getItem(LS_Q) || "提示問題";
    const ans = prompt(`忘記密碼\n\n${q}\n\n請輸入提示答案：`);
    if (ans === null) return;

    if ((ans.trim()) !== (localStorage.getItem(LS_A) || "")){
      alert("提示答案錯誤 ❌");
      return;
    }
    alert("驗證成功 ✅ 請重新設定密碼。");
    openModal();
  });

  // ===== 初始化 =====
  renderModules();
  renderHistory();
  showPage("home");

  // 避免你又遇到「點了沒反應」：留一個你看得到的載入提示
  console.log("script.js 已載入 ✅");

});