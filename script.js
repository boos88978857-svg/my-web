document.addEventListener("DOMContentLoaded", () => {
  // ===== 難度規則（保留：按年級）=====
  const SETTINGS = {
    batchSize: 10,
    choiceCount: 3,
    rules: {
      1: { ops: ["add", "sub"], addMaxSum: 20, subMax: 20 },
      2: { ops: ["add","sub","mul","div"], addSubMax: 100, mulMax: 9, divMax: 9 },
      3: { ops: ["add","sub","mul","div"], addSubMax: 1000, mulMax: 12, divMax: 12 }
    }
  };

  // ===== DOM =====
  const subTitle = document.getElementById("subTitle");
  const pickedGrade = document.getElementById("pickedGrade");
  const chapterGrid = document.getElementById("chapterGrid");

  const screenHome = document.getElementById("screenHome");
  const screenPractice = document.getElementById("screenPractice");
  const screenRecords = document.getElementById("screenRecords");
  const screenSettings = document.getElementById("screenSettings");

  const practiceTitle = document.getElementById("practiceTitle");
  const practiceMeta = document.getElementById("practiceMeta");
  const timerText = document.getElementById("timerText");
  const progressText = document.getElementById("progressText");
  const questionText = document.getElementById("questionText");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("nextBtn");
  const statusText = document.getElementById("statusText");
  const reportBox = document.getElementById("reportBox");
  const backBtn = document.getElementById("backBtn");

  const historyList = document.getElementById("historyList");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const navBtns = document.querySelectorAll(".navBtn");

  const parentBtn = document.getElementById("parentBtn");
  const setPwdBtn = document.getElementById("setPwdBtn");
  const resetPwdBtn = document.getElementById("resetPwdBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const pwdHint = document.getElementById("pwdHint");

  // ===== 小工具 =====
  function opName(op){ return op==="add"?"加法":op==="sub"?"減法":op==="mul"?"乘法":op==="div"?"除法":op; }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  // ===== 導覽 =====
  function setActiveScreen(name){
    [screenHome, screenPractice, screenRecords, screenSettings].forEach(s=>s.classList.remove("active"));
    navBtns.forEach(b=>b.classList.remove("active"));

    if (name==="Home") screenHome.classList.add("active");
    if (name==="Practice") screenPractice.classList.add("active");
    if (name==="Records") screenRecords.classList.add("active");
    if (name==="Settings") screenSettings.classList.add("active");

    document.querySelector(`.navBtn[data-screen="${name}"]`)?.classList.add("active");
  }

  navBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const name = btn.dataset.screen;
      if (name === "Practice" && !practice.running) {
        setActiveScreen("Home");
        return;
      }
      setActiveScreen(name);
    });
  });

  // ===== 年級選擇 + 章節可用性 =====
  let selectedGrade = 0;

  function applyOpsVisibility(){
    const allowed = SETTINGS.rules[selectedGrade]?.ops || [];
    chapterGrid.querySelectorAll(".chapterCard").forEach(card=>{
      const op = card.dataset.op;
      card.classList.toggle("disabled", !allowed.includes(op));
    });
  }

  document.querySelectorAll(".gradeCard").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".gradeCard").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      selectedGrade = Number(btn.dataset.grade || 0);
      pickedGrade.textContent = selectedGrade ? `已選：小${selectedGrade}` : "未選年級";
      subTitle.textContent = selectedGrade ? `已選小${selectedGrade}，請選擇章節` : "請先選擇年級";
      applyOpsVisibility();
    });
  });

  // ===== 題目生成 =====
  function makeChoices(ans){
    const a = Number(ans);
    const set = new Set([String(a)]);
    while (set.size < SETTINGS.choiceCount){
      const delta = randInt(1, Math.max(3, Math.floor(Math.abs(a)*0.2) || 3));
      let fake = Math.random()<0.5 ? a+delta : a-delta;
      if (fake < 0) fake = a + delta;
      set.add(String(fake));
    }
    const arr = shuffle([...set]);
    return { arr, correct: arr.indexOf(String(a)) };
  }

  function makeOneQuestion(grade, op){
    const rule = SETTINGS.rules[grade];

    if (grade === 1){
      if (op === "add"){
        const a = randInt(0, rule.addMaxSum);
        const b = randInt(0, rule.addMaxSum - a);
        const ans = a + b;
        const c = makeChoices(ans);
        return { q:`${a} + ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
      }
      if (op === "sub"){
        const a = randInt(0, rule.subMax);
        const b = randInt(0, a);
        const ans = a - b;
        const c = makeChoices(ans);
        return { q:`${a} - ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
      }
    }

    if (op === "add"){
      const max = rule.addSubMax;
      const a = randInt(0, max);
      const b = randInt(0, max);
      const ans = a + b;
      const c = makeChoices(ans);
      return { q:`${a} + ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
    }
    if (op === "sub"){
      const max = rule.addSubMax;
      let a = randInt(0, max);
      let b = randInt(0, max);
      if (b>a) [a,b]=[b,a];
      const ans = a - b;
      const c = makeChoices(ans);
      return { q:`${a} - ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
    }
    if (op === "mul"){
      const m = rule.mulMax;
      const a = randInt(0, m);
      const b = randInt(0, m);
      const ans = a * b;
      const c = makeChoices(ans);
      return { q:`${a} × ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
    }
    if (op === "div"){
      const d = rule.divMax;
      const divisor = randInt(1, d);
      const quotient = randInt(0, d);
      const dividend = divisor * quotient;
      const ans = quotient;
      const c = makeChoices(ans);
      return { q:`${dividend} ÷ ${divisor} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
    }

    const c = makeChoices(0);
    return { q:`0 = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans:0} };
  }

  function buildBatch(op){
    const qs = [];
    for (let k=0;k<SETTINGS.batchSize;k++) qs.push(makeOneQuestion(selectedGrade, op));
    return qs;
  }

  // ===== 練習狀態 =====
  const practice = {
    running:false,
    op:"add",
    questions:[],
    i:0,
    locked:false,
    wrongPool:[],
    mode:"main",
    startTimeMs:0,
    timerId:null,
    totalAnswered:0,
    correctAnswered:0
  };

  function startTimer(){
    stopTimer();
    practice.timerId = setInterval(()=>{
      const sec = Math.floor((Date.now()-practice.startTimeMs)/1000);
      timerText.textContent = `${sec}s`;
    }, 250);
  }
  function stopTimer(){
    if (practice.timerId) clearInterval(practice.timerId);
    practice.timerId = null;
  }

  function updatePracticeHeader(){
    const total = practice.questions.length || 0;
    progressText.textContent = total ? `${Math.min(practice.i+1,total)}/${total}` : "0/0";
    practiceMeta.textContent = `小${selectedGrade}｜${opName(practice.op)}｜${practice.mode==="main"?"練習":"錯題重練"}｜錯題：${practice.wrongPool.length}`;
  }

  function renderQuestion(){
    practice.locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    const q = practice.questions[practice.i];
    questionText.textContent = `第 ${practice.i+1} 題：${q.q}`;

    q.a.forEach((t,idx)=>{
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = t;
      b.addEventListener("click", ()=>choose(idx));
      choicesEl.appendChild(b);
    });

    statusText.textContent = "請選擇答案";
    statusText.style.color = "";
    updatePracticeHeader();
  }

  function choose(idx){
    if (practice.locked) return;
    practice.locked = true;

    practice.totalAnswered++;
    const q = practice.questions[practice.i];
    const all = [...document.querySelectorAll(".choice")];
    if (all[q.correct]) all[q.correct].classList.add("correct");

    const ok = idx === q.correct;
    if (ok){
      practice.correctAnswered++;
      statusText.textContent = "答對了 ✅（自動下一題）";
      nextBtn.disabled = true;
      setTimeout(()=>nextQuestion(), 450);
    }else{
      if (all[idx]) all[idx].classList.add("wrong");
      statusText.textContent = "答錯了 ❌（請按下一題）";
      const key = q.q;
      if (!practice.wrongPool.some(it=>it.q.q===key)) practice.wrongPool.push({q});
      nextBtn.disabled = false;
    }
    updatePracticeHeader();
  }

  function nextQuestion(){
    if (practice.i < practice.questions.length-1){
      practice.i++;
      renderQuestion();
    }else{
      finishRound();
    }
  }

  function finishRound(){
    if (practice.wrongPool.length>0){
      const wrongQs = practice.wrongPool.map(it=>it.q);
      practice.wrongPool = [];
      practice.mode = "wrong";

      practice.questions = wrongQs.map(oldQ=>{
        const ans = oldQ.meta.ans;
        const c = makeChoices(ans);
        return { q: oldQ.q, a: c.arr, correct: c.correct, meta: oldQ.meta };
      });

      practice.i = 0;
      practiceTitle.textContent = `錯題重練`;
      renderQuestion();
      return;
    }

    finishSuccess();
  }

  // ===== 🎉 煙花 =====
  function showFx(){
    const box = document.getElementById("fx");
    box.innerHTML = "";
    const emojis = ["🎉","🎊","✨"];
    const cx = window.innerWidth/2;
    const sy = window.innerHeight*0.35;

    for (let k=0;k<42;k++){
      const s = document.createElement("span");
      s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      s.style.position="fixed";
      s.style.left=cx+"px";
      s.style.top=sy+"px";
      s.style.fontSize="26px";
      s.style.pointerEvents="none";
      s.style.zIndex=9999;
      box.appendChild(s);

      const ang=Math.random()*Math.PI*2;
      const spread=160+Math.random()*220;
      const x=Math.cos(ang)*spread;
      const y=Math.sin(ang)*spread-140;
      const fall=380+Math.random()*340;

      s.animate(
        [
          {transform:"translate(0,0)",opacity:1},
          {transform:`translate(${x}px,${y}px)`,opacity:1,offset:0.42},
          {transform:`translate(${x}px,${y+fall}px)`,opacity:0}
        ],
        {duration:3600,easing:"ease-out"}
      );
      setTimeout(()=>s.remove(),3800);
    }
  }

  function finishSuccess(){
    stopTimer();
    practice.running = false;

    statusText.textContent = "🎉 已完成學習目標（全對）！";
    statusText.style.color = "#2e7d32";
    showFx();

    const durationSec = Math.floor((Date.now()-practice.startTimeMs)/1000);
    const percent = practice.totalAnswered===0 ? 0 : Math.round((practice.correctAnswered/practice.totalAnswered)*100);
    const reportText = `學習報告：用時 ${durationSec} 秒｜作答 ${practice.totalAnswered} 題｜答對 ${practice.correctAnswered} 題｜正確率 ${percent}%`;

    reportBox.style.display = "block";
    reportBox.textContent = reportText;

    localStorage.setItem(`report_${Date.now()}`, JSON.stringify({
      time: Date.now(),
      durationSec,
      totalAnswered: practice.totalAnswered,
      correctAnswered: practice.correctAnswered,
      percent,
      grade: selectedGrade,
      op: practice.op
    }));
    renderHistory();

    setTimeout(()=>{
      reportBox.style.display = "none";
      reportBox.textContent = "";
      setActiveScreen("Home");
    }, 2000);
  }

  function startOp(op){
    if (!selectedGrade){
      alert("請先選擇年級");
      return;
    }
    const allowed = SETTINGS.rules[selectedGrade].ops;
    if (!allowed.includes(op)){
      alert(`小${selectedGrade} 暫不提供 ${opName(op)}`);
      return;
    }

    practice.running = true;
    practice.op = op;
    practice.mode = "main";
    practice.questions = buildBatch(op);
    practice.i = 0;
    practice.locked = false;
    practice.wrongPool = [];
    practice.startTimeMs = Date.now();
    practice.totalAnswered = 0;
    practice.correctAnswered = 0;

    practiceTitle.textContent = `${opName(op)}練習`;
    timerText.textContent = "0s";
    reportBox.style.display = "none";
    reportBox.textContent = "";

    startTimer();
    renderQuestion();
    setActiveScreen("Practice");
  }

  chapterGrid.querySelectorAll(".chapterCard").forEach(card=>{
    card.addEventListener("click", ()=>startOp(card.dataset.op));
  });

  nextBtn.addEventListener("click", ()=>nextQuestion());
  backBtn.addEventListener("click", ()=>{
    stopTimer();
    practice.running = false;
    setActiveScreen("Home");
  });

  // ===== 紀錄 =====
  function pad2(n){ return String(n).padStart(2,"0"); }
  function formatDate(ts){
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function getAllReports(){
    const items=[];
    for(let k=0;k<localStorage.length;k++){
      const key=localStorage.key(k);
      if (key && key.startsWith("report_")){
        try{ items.push(JSON.parse(localStorage.getItem(key))); }catch{}
      }
    }
    items.sort((a,b)=>(b.time||0)-(a.time||0));
    return items;
  }
  function renderHistory(){
    historyList.innerHTML = "";
    const list = getAllReports().slice(0,12);
    if (list.length===0){
      historyList.innerHTML = `<div class="muted">目前沒有紀錄</div>`;
      return;
    }
    list.forEach(r=>{
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="t">${formatDate(r.time)}（小${r.grade}｜${opName(r.op)}）</div>
        <div class="s">用時：${r.durationSec}s｜作答：${r.totalAnswered}｜答對：${r.correctAnswered}｜正確率：${r.percent}%</div>
      `;
      historyList.appendChild(div);
    });
  }
  renderHistory();
  refreshHistoryBtn.addEventListener("click", renderHistory);

  // ===== 家長密碼：設定/修改/忘記重設 + 清除需密碼 =====
  const LS_PWD = "parent_pwd";
  const LS_RESET = "parent_reset_code";

  function hasPwd(){ return !!localStorage.getItem(LS_PWD); }
  function pwdOk(input){ return input === localStorage.getItem(LS_PWD); }

  function ensureResetCode(){
    let code = localStorage.getItem(LS_RESET);
    if (!code){
      code = String(Math.floor(100000 + Math.random()*900000)); // 6 位
      localStorage.setItem(LS_RESET, code);
    }
    return code;
  }

  function updatePwdHint(){
    pwdHint.textContent = hasPwd() ? "已設定（清除紀錄需驗證）" : "尚未設定（建議先設定）";
  }
  updatePwdHint();

  setPwdBtn.addEventListener("click", ()=>{
    const old = hasPwd() ? prompt("請輸入目前家長密碼") : null;
    if (hasPwd() && !pwdOk(old || "")){
      alert("密碼錯誤");
      return;
    }
    const next = prompt("請設定新家長密碼（建議 4-8 碼）");
    if (!next || next.length < 4){
      alert("密碼長度不足");
      return;
    }
    localStorage.setItem(LS_PWD, next);
    const code = ensureResetCode();
    alert(`已設定 ✅\n忘記密碼重設碼（請保存）：${code}`);
    updatePwdHint();
  });

  resetPwdBtn.addEventListener("click", ()=>{
    const code = ensureResetCode();
    const input = prompt("輸入重設碼（6 位數）");
    if (input !== code){
      alert("重設碼錯誤");
      return;
    }
    const next = prompt("請設定新家長密碼（建議 4-8 碼）");
    if (!next || next.length < 4){
      alert("密碼長度不足");
      return;
    }
    localStorage.setItem(LS_PWD, next);
    alert("已重設 ✅");
    updatePwdHint();
  });

  parentBtn.addEventListener("click", ()=>setActiveScreen("Settings"));

  function requireParentPwdOrGoSettings(){
    if (!hasPwd()){
      alert("請先到【家長】頁設定密碼");
      setActiveScreen("Settings");
      return null;
    }
    const input = prompt("請輸入家長密碼");
    if (!pwdOk(input || "")){
      alert("密碼錯誤");
      return null;
    }
    return true;
  }

  clearHistoryBtn.addEventListener("click", ()=>{
    if (!requireParentPwdOrGoSettings()) return;
    const keys=[];
    for(let k=0;k<localStorage.length;k++){
      const key=localStorage.key(k);
      if (key && key.startsWith("report_")) keys.push(key);
    }
    keys.forEach(k=>localStorage.removeItem(k));
    alert("已清除 ✅");
    renderHistory();
  });

  clearAllBtn.addEventListener("click", ()=>{
    if (!requireParentPwdOrGoSettings()) return;

    // 清除 report_*
    const keys=[];
    for(let k=0;k<localStorage.length;k++){
      const key=localStorage.key(k);
      if (key && key.startsWith("report_")) keys.push(key);
    }
    keys.forEach(k=>localStorage.removeItem(k));

    alert("已清除全部學習紀錄 ✅");
    renderHistory();
  });

  // ===== 預設畫面 =====
  setActiveScreen("Home");
  applyOpsVisibility();
});
