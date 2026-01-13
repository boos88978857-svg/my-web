document.addEventListener("DOMContentLoaded", () => {
  alert("JS 已啟動 ✅");

  // ====== DOM ======
  const pages = {
    Home: document.getElementById("pageHome"),
    Practice: document.getElementById("pagePractice"),
    Records: document.getElementById("pageRecords"),
    Settings: document.getElementById("pageSettings"),
  };

  const navBtns = [...document.querySelectorAll(".navBtn")];

  const parentBtn = document.getElementById("parentBtn");

  const gradeBadge = document.getElementById("gradeBadge");
  const moduleBadge = document.getElementById("moduleBadge");
  const gradeBtns = [...document.querySelectorAll(".gradeBtn")];
  const moduleGrid = document.getElementById("moduleGrid");

  const practiceTitle = document.getElementById("practiceTitle");
  const practiceMeta = document.getElementById("practiceMeta");
  const progressText = document.getElementById("progressText");
  const scoreText = document.getElementById("scoreText");
  const promptText = document.getElementById("promptText");
  const visualArea = document.getElementById("visualArea");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("nextBtn");
  const exitBtn = document.getElementById("exitBtn");
  const statusEl = document.getElementById("status");

  const historyListEl = document.getElementById("historyList");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const setPwdBtn = document.getElementById("setPwdBtn");
  const forgotPwdBtn = document.getElementById("forgotPwdBtn");
  const batchBtns = [...document.querySelectorAll(".batchBtn")];
  const batchHint = document.getElementById("batchHint");

  // ====== 小工具 ======
  const pad2 = (n) => String(n).padStart(2, "0");
  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  };
  const randInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

  function goPage(name){
    Object.keys(pages).forEach(k => pages[k].classList.remove("active"));
    pages[name].classList.add("active");
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.page === name));
    // 每次切到紀錄就刷新
    if (name === "Records") renderHistory();
  }

  navBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>goPage(btn.dataset.page));
  });

  // ====== 家長密碼（離線版） ======
  // localStorage keys
  const LS_PWD = "parent_pwd";
  const LS_HINT_Q = "parent_hint_q";
  const LS_HINT_A = "parent_hint_a";

  function hasPwd(){
    return !!localStorage.getItem(LS_PWD);
  }

  function verifyPwd(promptText="請輸入家長密碼"){
    const pwd = localStorage.getItem(LS_PWD);
    if (!pwd){
      alert("尚未設定家長密碼，請到【設定】先設定。");
      goPage("Settings");
      return false;
    }
    const input = prompt(promptText);
    if (input === null) return false;
    if (input !== pwd){
      alert("密碼錯誤 ❌");
      return false;
    }
    return true;
  }

  parentBtn.addEventListener("click", ()=>{
    // 這裡先做簡單入口：成功驗證就跳設定頁（你可之後擴充更多家長功能）
    if (verifyPwd("家長模式：請輸入密碼")){
      alert("已進入家長模式 ✅（目前導向設定頁）");
      goPage("Settings");
    }
  });

  setPwdBtn.addEventListener("click", ()=>{
    const old = localStorage.getItem(LS_PWD);
    if (old){
      const ok = verifyPwd("變更密碼：請先輸入舊密碼");
      if (!ok) return;
    }

    const newPwd = prompt("請設定新家長密碼（至少 4 碼）");
    if (newPwd === null) return;
    if (String(newPwd).trim().length < 4){
      alert("密碼至少 4 碼。");
      return;
    }

    const q = prompt("設定「忘記密碼」提示問題（例：孩子生日？）");
    if (q === null || String(q).trim().length < 2){
      alert("提示問題不可空白。");
      return;
    }
    const a = prompt("設定提示答案（請記好，忘記密碼會用到）");
    if (a === null || String(a).trim().length < 1){
      alert("提示答案不可空白。");
      return;
    }

    localStorage.setItem(LS_PWD, String(newPwd).trim());
    localStorage.setItem(LS_HINT_Q, String(q).trim());
    localStorage.setItem(LS_HINT_A, String(a).trim());
    alert("家長密碼已設定 ✅");
  });

  forgotPwdBtn.addEventListener("click", ()=>{
    if (!hasPwd()){
      alert("尚未設定家長密碼。");
      return;
    }
    const q = localStorage.getItem(LS_HINT_Q) || "提示問題";
    const ans = prompt(`忘記密碼：請回答提示問題\n\n${q}`);
    if (ans === null) return;
    const a = localStorage.getItem(LS_HINT_A) || "";
    if (String(ans).trim() !== String(a).trim()){
      alert("提示答案錯誤 ❌");
      return;
    }
    const newPwd = prompt("驗證成功 ✅\n請輸入新密碼（至少 4 碼）");
    if (newPwd === null) return;
    if (String(newPwd).trim().length < 4){
      alert("密碼至少 4 碼。");
      return;
    }
    localStorage.setItem(LS_PWD, String(newPwd).trim());
    alert("已重設密碼 ✅");
  });

  // ====== 題數設定 ======
  const LS_BATCH = "setting_batch";
  function getBatch(){
    const n = Number(localStorage.getItem(LS_BATCH) || 20);
    return [10,20,30].includes(n) ? n : 20;
  }
  function setBatch(n){
    localStorage.setItem(LS_BATCH, String(n));
    batchHint.textContent = `目前題數：${n} 題`;
  }
  setBatch(getBatch());
  batchBtns.forEach(b=>{
    b.addEventListener("click", ()=>{
      setBatch(Number(b.dataset.batch));
      alert("已更新題數 ✅");
    });
  });

  // ====== 年級 & 模組資料 ======
  const MODULES = {
    1: [
      { id:"g1_count", icon:"🔢", title:"數與數量", range:"(0～20)", desc:"數數、對應數量", enabled:true },
      { id:"g1_100", icon:"🧭", title:"認識100", range:"(不要求計算)", desc:"比大小、找數字", enabled:true },
      { id:"g1_place", icon:"🧩", title:"十與一", range:"(位值)", desc:"十個＝一個十", enabled:true },
      { id:"g1_make10", icon:"🧮", title:"湊10", range:"(補到10)", desc:"為進位做準備", enabled:true },
      { id:"g1_addsub", icon:"➕", title:"20以內加減", range:"(先理解)", desc:"不比快、先正確", enabled:true },
    ],
    2: [
      { id:"g2_addsub", icon:"➕", title:"加減", range:"(100內)", desc:"含進退位", enabled:true },
      { id:"g2_mul", icon:"✖️", title:"乘法", range:"(九九)", desc:"0～9", enabled:true },
      { id:"g2_div", icon:"➗", title:"除法", range:"(整除)", desc:"配合乘法", enabled:true },
      { id:"g2_place", icon:"🏷️", title:"位值", range:"(千百十個)", desc:"讀寫數", enabled:true },
      { id:"g2_word", icon:"📝", title:"應用題", range:"(基礎)", desc:"關鍵字理解", enabled:true },
    ],
    3: [
      { id:"g3_muldiv", icon:"🧠", title:"乘除", range:"(12內)", desc:"更熟練", enabled:true },
      { id:"g3_big", icon:"📌", title:"位值與大數", range:"(到萬位)", desc:"比較與讀寫", enabled:true },
      { id:"g3_frac", icon:"🍰", title:"分數初步", range:"(等分)", desc:"概念建立", enabled:true },
      { id:"g3_meas", icon:"⏱️", title:"量與測量", range:"(時間長度重量)", desc:"基本單位", enabled:true },
      { id:"g3_word", icon:"🧾", title:"應用題", range:"(進階)", desc:"步驟與檢查", enabled:true },
    ],
  };

  let selectedGrade = 0;
  let selectedModuleId = "";
  let batchSize = getBatch();

  function updateBadges(){
    if (!selectedGrade){
      gradeBadge.textContent = "未選年級";
      moduleBadge.textContent = "請先選年級";
      return;
    }
    gradeBadge.textContent = `已選年級：小${selectedGrade}`;
    moduleBadge.textContent = `小${selectedGrade} 模組`;
  }

  function renderModules(){
    moduleGrid.innerHTML = "";
    if (!selectedGrade){
      updateBadges();
      return;
    }
    const list = MODULES[selectedGrade] || [];
    list.forEach(m=>{
      const btn = document.createElement("button");
      btn.className = "moduleCard";
      btn.type = "button";
      if (!m.enabled) btn.setAttribute("disabled","disabled");

      btn.innerHTML = `
        <div class="iconBubble">${m.icon}</div>
        <div class="moduleText">
          <div class="moduleTitle">${m.title}</div>
          <div class="moduleRange">${m.range}</div>
          <div class="moduleDesc">${m.desc}</div>
        </div>
      `;

      btn.addEventListener("click", ()=>{
        if (!selectedGrade) return;
        startPractice(m.id);
      });

      moduleGrid.appendChild(btn);
    });

    updateBadges();
  }

  gradeBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      selectedGrade = Number(btn.dataset.grade || 0);
      gradeBtns.forEach(b=>b.classList.toggle("active", b === btn));
      renderModules();
    });
  });

  // ====== 練習核心 ======
  let questions = [];
  let idx = 0;
  let locked = false;
  let correct = 0;
  let answered = 0;
  let startMs = 0;

  function makeChoicesNumber(ans, count=4){
    const set = new Set([ans]);
    while (set.size < count){
      const delta = randInt(1, 4);
      const fake = Math.random() < 0.5 ? ans + delta : ans - delta;
      if (fake >= 0) set.add(fake);
    }
    return shuffle([...set]);
  }

  function buildQuestion(moduleId){
    // 小一：數與數量（0~20）：用 ● 顯示，不把答案寫在題目
    if (moduleId === "g1_count"){
      const n = randInt(1, 20);
      const choices = makeChoicesNumber(n, 4);
      return {
        moduleId,
        prompt: "請數一數：有幾個●？",
        visual: { type:"dots", n },
        choices,
        answer: n
      };
    }

    // 小一：湊10
    if (moduleId === "g1_make10"){
      const a = randInt(1, 9);
      const ans = 10 - a;
      const choices = makeChoicesNumber(ans, 4);
      return {
        moduleId,
        prompt: `${a} 還差幾到 10？`,
        visual: { type:"none" },
        choices,
        answer: ans
      };
    }

    // 小一：20以內加減（理解）
    if (moduleId === "g1_addsub"){
      const isAdd = Math.random() < 0.5;
      if (isAdd){
        const x = randInt(0, 20);
        const y = randInt(0, 20-x);
        const ans = x + y;
        const choices = makeChoicesNumber(ans, 4);
        return { moduleId, prompt:`${x} + ${y} = ?`, visual:{type:"none"}, choices, answer:ans };
      } else {
        const x = randInt(0, 20);
        const y = randInt(0, x);
        const ans = x - y;
        const choices = makeChoicesNumber(ans, 4);
        return { moduleId, prompt:`${x} - ${y} = ?`, visual:{type:"none"}, choices, answer:ans };
      }
    }

    // 小一：十與一（位值）
    if (moduleId === "g1_place"){
      const n = randInt(10, 99);
      const tens = Math.floor(n/10);
      const ones = n % 10;
      const candidates = shuffle([
        `${tens}個十 + ${ones}個一`,
        `${tens-1}個十 + ${ones+10}個一`,
        `${tens+1}個十 + ${Math.max(0, ones-10)}個一`,
        `${ones}個十 + ${tens}個一`,
      ]).slice(0,4);

      const correctText = `${tens}個十 + ${ones}個一`;
      if (!candidates.includes(correctText)) candidates[0] = correctText;

      return {
        moduleId,
        prompt: `${n} 是哪一種組合？`,
        visual:{type:"none"},
        choices: candidates,
        answer: correctText
      };
    }

    // 小一：認識100（不要求計算）→ 比大小
    if (moduleId === "g1_100"){
      const a = randInt(0, 100);
      let b = randInt(0, 100);
      if (b === a) b = (b+7)%101;
      const ans = a > b ? "左邊較大" : "右邊較大";
      const choices = shuffle(["左邊較大","右邊較大","一樣大","看不出來"]).slice(0,4);
      if (!choices.includes(ans)) choices[0] = ans;

      return {
        moduleId,
        prompt: `哪個比較大？（只看大小，不用算）`,
        visual:{type:"text", text:`左：${a}　　右：${b}`},
        choices,
        answer: ans
      };
    }

    // 小二/小三先做可運作的基本題（你之後要再加題型，我再幫你擴充）
    if (moduleId === "g2_mul" || moduleId === "g3_muldiv"){
      const max = moduleId === "g3_muldiv" ? 12 : 9;
      const x = randInt(0, max);
      const y = randInt(0, max);
      const ans = x*y;
      const choices = makeChoicesNumber(ans, 4);
      return { moduleId, prompt:`${x} × ${y} = ?`, visual:{type:"none"}, choices, answer: ans };
    }

    if (moduleId === "g2_div"){
      const d = randInt(1,9);
      const q = randInt(0,9);
      const n = d*q;
      const ans = q;
      const choices = makeChoicesNumber(ans, 4);
      return { moduleId, prompt:`${n} ÷ ${d} = ?（整除）`, visual:{type:"none"}, choices, answer: ans };
    }

    if (moduleId === "g2_addsub"){
      const isAdd = Math.random() < 0.5;
      if (isAdd){
        const x = randInt(0, 100);
        const y = randInt(0, 100);
        const ans = x+y;
        const choices = makeChoicesNumber(ans, 4);
        return { moduleId, prompt:`${x} + ${y} = ?`, visual:{type:"none"}, choices, answer: ans };
      } else {
        let x = randInt(0, 100);
        let y = randInt(0, 100);
        if (y>x) [x,y]=[y,x];
        const ans = x-y;
        const choices = makeChoicesNumber(ans, 4);
        return { moduleId, prompt:`${x} - ${y} = ?`, visual:{type:"none"}, choices, answer: ans };
      }
    }

    // 其他先放「可點可進」的簡單題
    const ans = randInt(1, 10);
    const choices = makeChoicesNumber(ans, 4);
    return { moduleId, prompt:`請選出：${ans}`, visual:{type:"none"}, choices, answer: ans };
  }

  function moduleName(id){
    const all = [...(MODULES[1]||[]),...(MODULES[2]||[]),...(MODULES[3]||[])];
    const m = all.find(x=>x.id===id);
    return m ? `${m.title} ${m.range}` : "模組";
  }

  function startPractice(moduleId){
    if (!selectedGrade){
      alert("請先選年級。");
      return;
    }
    batchSize = getBatch();
    selectedModuleId = moduleId;

    questions = Array.from({length: batchSize}, ()=>buildQuestion(moduleId));
    idx = 0;
    correct = 0;
    answered = 0;
    locked = false;
    startMs = Date.now();

    practiceTitle.textContent = `小${selectedGrade}｜${moduleName(moduleId)}`;
    practiceMeta.textContent = "開始練習";
    statusEl.textContent = "請選擇答案";
    statusEl.style.color = "";

    goPage("Practice");
    renderQuestion();
  }

  function renderVisual(v){
    visualArea.innerHTML = "";
    if (!v || v.type === "none") return;

    if (v.type === "dots"){
      const wrap = document.createElement("div");
      wrap.className = "dots";
      for (let i=0;i<v.n;i++){
        const d = document.createElement("div");
        d.className = "dot";
        wrap.appendChild(d);
      }
      visualArea.appendChild(wrap);
      return;
    }

    if (v.type === "text"){
      const div = document.createElement("div");
      div.style.fontSize = "22px";
      div.style.fontWeight = "1000";
      div.textContent = v.text || "";
      visualArea.appendChild(div);
      return;
    }
  }

  function renderQuestion(){
    locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    const q = questions[idx];
    promptText.textContent = q.prompt;

    renderVisual(q.visual);

    progressText.textContent = `第 ${idx+1} 題 / ${questions.length} 題`;
    scoreText.textContent = `正確 ${correct} / 作答 ${answered}`;

    q.choices.forEach((c)=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = String(c);
      btn.addEventListener("click", ()=>chooseAnswer(c));
      choicesEl.appendChild(btn);
    });
  }

  function chooseAnswer(pick){
    if (locked) return;
    locked = true;
    answered++;

    const q = questions[idx];
    const isCorrect = String(pick) === String(q.answer);

    const btns = [...choicesEl.querySelectorAll(".choice")];
    btns.forEach(b=>{
      if (String(b.textContent) === String(q.answer)) b.classList.add("correct");
      if (String(b.textContent) === String(pick) && !isCorrect) b.classList.add("wrong");
    });

    if (isCorrect){
      correct++;
      statusEl.textContent = "答對了 ✅";
      statusEl.style.color = "#2e7d32";
      setTimeout(()=>nextQuestion(), 450);
    } else {
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      statusEl.style.color = "#d32f2f";
      nextBtn.disabled = false;
    }
    scoreText.textContent = `正確 ${correct} / 作答 ${answered}`;
  }

  function nextQuestion(){
    if (idx < questions.length - 1){
      idx++;
      statusEl.style.color = "";
      statusEl.textContent = "請選擇答案";
      renderQuestion();
    } else {
      finishPractice();
    }
  }

  function finishPractice(){
    const sec = Math.floor((Date.now()-startMs)/1000);
    const percent = answered ? Math.round((correct/answered)*100) : 0;

    statusEl.style.color = "#2e7d32";
    statusEl.textContent = `完成 ✅ 用時 ${sec} 秒｜正確率 ${percent}%`;

    // 存紀錄
    const item = {
      time: Date.now(),
      grade: selectedGrade,
      moduleId: selectedModuleId,
      moduleName: moduleName(selectedModuleId),
      total: questions.length,
      answered,
      correct,
      percent,
      sec
    };
    localStorage.setItem(`report_${Date.now()}`, JSON.stringify(item));
    renderHistory();

    nextBtn.disabled = true;
  }

  nextBtn.addEventListener("click", ()=>nextQuestion());
  exitBtn.addEventListener("click", ()=>{
    goPage("Home");
  });

  // ====== 紀錄 ======
  function getAllReports(){
    const list = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (k && k.startsWith("report_")){
        try{
          const obj = JSON.parse(localStorage.getItem(k));
          list.push(obj);
        }catch{}
      }
    }
    list.sort((a,b)=>(b.time||0)-(a.time||0));
    return list;
  }

  function renderHistory(){
    if (!historyListEl) return;
    const list = getAllReports().slice(0, 20);
    historyListEl.innerHTML = "";

    if (list.length === 0){
      historyListEl.innerHTML = `<div class="item"><b>目前還沒有紀錄</b>完成一次練習就會顯示在這裡。</div>`;
      return;
    }

    list.forEach(r=>{
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <b>${formatDate(r.time)}（小${r.grade}｜${r.moduleName}）</b>
        <div>用時：${r.sec} 秒</div>
        <div>題數：${r.total}｜作答：${r.answered}｜答對：${r.correct}｜正確率：${r.percent}%</div>
      `;
      historyListEl.appendChild(div);
    });
  }

  refreshHistoryBtn.addEventListener("click", renderHistory);

  clearHistoryBtn.addEventListener("click", ()=>{
    // 清除一定要密碼
    if (!verifyPwd("清除紀錄：請輸入家長密碼")) return;

    const keys = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (k && k.startsWith("report_")) keys.push(k);
    }
    keys.forEach(k=>localStorage.removeItem(k));
    alert("已清除所有紀錄 ✅");
    renderHistory();
  });

  // ====== 初始化 ======
  renderModules();
  renderHistory();
  goPage("Home");
});