document.addEventListener("DOMContentLoaded", () => {
  // ========= 難度規則（保持你原本邏輯）=========
  const SETTINGS = {
    batchSize: 20,
    choiceCount: 3,
    rules: {
      1: { ops: ["add", "sub"], addMaxSum: 20, subMax: 20 }, // 小1：<=20（乘除鎖定）
      2: { ops: ["add","sub","mul","div"], addSubMax: 100,  mulMax: 9,  divMax: 9  }, // 小2
      3: { ops: ["add","sub","mul","div"], addSubMax: 1000, mulMax: 12, divMax: 12 }  // 小3
    }
  };

  // ========= 家長密碼（新增）=========
  const PWD_KEY = "parent_password_v1";
  const REC_Q_KEY = "parent_recovery_q_v1";
  const REC_A_KEY = "parent_recovery_a_v1";

  function hasParentPassword(){
    const p = localStorage.getItem(PWD_KEY);
    return !!(p && p.length >= 4);
  }

  function setParentPasswordFlow(){
    alert("尚未設定家長密碼。\n\n請先設定密碼（至少 4 碼），並設定一個復原問題（忘記密碼用）。");
    const newPwd = prompt("請設定家長密碼（至少 4 碼）：");
    if (!newPwd || newPwd.trim().length < 4){
      alert("密碼至少 4 碼，已取消。");
      return false;
    }
    const q = prompt("請設定復原問題（例如：媽媽名字？）：");
    if (!q || !q.trim()){
      alert("復原問題不可空白，已取消。");
      return false;
    }
    const a = prompt("請設定復原答案（請記住）：");
    if (!a || !a.trim()){
      alert("復原答案不可空白，已取消。");
      return false;
    }
    localStorage.setItem(PWD_KEY, newPwd.trim());
    localStorage.setItem(REC_Q_KEY, q.trim());
    localStorage.setItem(REC_A_KEY, a.trim());
    alert("家長密碼設定完成 ✅");
    return true;
  }

  function verifyParentPassword(){
    if (!hasParentPassword()){
      return setParentPasswordFlow();
    }
    const input = prompt("請輸入家長密碼：");
    if (input === null) return false;
    const pwd = localStorage.getItem(PWD_KEY);
    if (input === pwd) return true;
    alert("密碼錯誤 ❌");
    return false;
  }

  function forgotPasswordFlow(){
    const q = localStorage.getItem(REC_Q_KEY) || "";
    const a = localStorage.getItem(REC_A_KEY) || "";
    if (!q || !a){
      alert("尚未設定復原問題/答案，無法使用忘記密碼。\n請用「家長模式」重新設定密碼。");
      return false;
    }
    const inputA = prompt(`忘記密碼：\n復原問題：${q}\n\n請輸入答案：`);
    if (inputA === null) return false;
    if (inputA.trim() !== a){
      alert("復原答案錯誤 ❌");
      return false;
    }
    const newPwd = prompt("答案正確 ✅\n請輸入新家長密碼（至少 4 碼）：");
    if (!newPwd || newPwd.trim().length < 4){
      alert("密碼至少 4 碼，已取消。");
      return false;
    }
    localStorage.setItem(PWD_KEY, newPwd.trim());
    alert("已重設家長密碼 ✅");
    return true;
  }

  function parentModeMenu(){
    // 入口：可設定/修改/忘記密碼
    if (!hasParentPassword()){
      setParentPasswordFlow();
      return;
    }

    const action = prompt(
      "家長模式：請輸入數字選項\n\n" +
      "1) 進入家長設定（需密碼）\n" +
      "2) 忘記密碼（用復原問題重設）\n" +
      "3) 取消"
    );

    if (action === "2"){
      forgotPasswordFlow();
      return;
    }
    if (action !== "1") return;

    if (!verifyParentPassword()) return;

    const menu = prompt(
      "家長設定：請輸入數字選項\n\n" +
      "1) 修改家長密碼\n" +
      "2) 修改復原問題/答案\n" +
      "3) 取消"
    );

    if (menu === "1"){
      const newPwd = prompt("請輸入新家長密碼（至少 4 碼）：");
      if (!newPwd || newPwd.trim().length < 4){
        alert("密碼至少 4 碼，已取消。");
        return;
      }
      localStorage.setItem(PWD_KEY, newPwd.trim());
      alert("家長密碼已更新 ✅");
      return;
    }

    if (menu === "2"){
      const q = prompt("請輸入新的復原問題：");
      if (!q || !q.trim()){
        alert("復原問題不可空白，已取消。");
        return;
      }
      const a = prompt("請輸入新的復原答案：");
      if (!a || !a.trim()){
        alert("復原答案不可空白，已取消。");
        return;
      }
      localStorage.setItem(REC_Q_KEY, q.trim());
      localStorage.setItem(REC_A_KEY, a.trim());
      alert("復原問題/答案已更新 ✅");
      return;
    }
  }

  // ========= DOM =========
  const btnAdd = document.getElementById("btnAdd");
  const btnSub = document.getElementById("btnSub");
  const btnMul = document.getElementById("btnMul");
  const btnDiv = document.getElementById("btnDiv");

  const gradeSelect = document.getElementById("gradeSelect");
  const chapterSelect = document.getElementById("chapterSelect");
  const backToGrade = document.getElementById("backToGrade");
  const pickedGradeText = document.getElementById("pickedGradeText");

  const chaptersEl = document.getElementById("chapters");
  const practiceEl = document.getElementById("practice");

  const chapterTitleEl = document.getElementById("chapterTitle");
  const questionEl = document.getElementById("question");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("next");
  const statusEl = document.getElementById("status");
  const goalTextEl = document.getElementById("goalText");
  const reportEl = document.getElementById("report");

  const historyListEl = document.getElementById("historyList");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const parentBtn = document.getElementById("parentBtn");

  const timerText = document.getElementById("timerText");
  const progressText = document.getElementById("progressText");
  const correctText = document.getElementById("correctText");
  const wrongText = document.getElementById("wrongText");

  if (!btnAdd || !btnSub || !chaptersEl || !practiceEl || !chapterTitleEl || !questionEl || !choicesEl || !nextBtn || !statusEl) {
    alert("index.html 缺少必要元素（按鈕或練習區塊）。");
    return;
  }

  // ========= 工具 =========
  function opName(op){
    return op==="add" ? "加法"
      : op==="sub" ? "減法"
      : op==="mul" ? "乘法"
      : op==="div" ? "除法"
      : op;
  }

  function shuffle(arr){
    const a = arr.slice();
    for(let j=a.length-1;j>0;j--){
      const k=Math.floor(Math.random()*(j+1));
      [a[j],a[k]]=[a[k],a[j]];
    }
    return a;
  }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  // ========= 年級選擇 =========
  let selectedGrade = 1;

  // ✅ 重要：小1 乘除「顯示但鎖定」；小2/小3 正常可按
  function applyOpVisibility(){
    const allowed = SETTINGS.rules[selectedGrade].ops;

    if (pickedGradeText) pickedGradeText.textContent = `已選：小${selectedGrade}`;

    // 乘法
    if (btnMul){
      btnMul.style.display = ""; // 永遠顯示
      const ok = allowed.includes("mul");
      btnMul.disabled = !ok;
      btnMul.style.opacity = ok ? "1" : "0.35";
    }
    // 除法
    if (btnDiv){
      btnDiv.style.display = ""; // 永遠顯示
      const ok = allowed.includes("div");
      btnDiv.disabled = !ok;
      btnDiv.style.opacity = ok ? "1" : "0.35";
    }
  }

  // 點年級大圖標
  document.querySelectorAll(".grade-card").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      selectedGrade = Number(btn.dataset.grade || 1);
      applyOpVisibility();
      if (gradeSelect) gradeSelect.style.display = "none";
      if (chapterSelect) chapterSelect.style.display = "block";
    });
  });

  // 返回選年級
  if (backToGrade){
    backToGrade.addEventListener("click", ()=>{
      if (chapterSelect) chapterSelect.style.display = "none";
      if (gradeSelect) gradeSelect.style.display = "grid";
    });
  }

  applyOpVisibility();

  // ========= 煙火（保留你原本）=========
  function showConfetti() {
    const box = document.getElementById("confetti");
    if (!box) return;
    box.innerHTML = "";
    const emojis = ["🎉", "🎊"];
    const cx = window.innerWidth/2;
    const sy = window.innerHeight*0.38;

    for (let k=0;k<36;k++){
      const s=document.createElement("span");
      s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      s.style.position="fixed";
      s.style.left=cx+"px";
      s.style.top=sy+"px";
      s.style.fontSize="26px";
      s.style.pointerEvents="none";
      s.style.zIndex=9999;
      box.appendChild(s);

      const ang=Math.random()*Math.PI*2;
      const spread=140+Math.random()*160;
      const x=Math.cos(ang)*spread;
      const y=Math.sin(ang)*spread-110;
      const fall=360+Math.random()*260;

      s.animate(
        [
          {transform:"translate(0,0)",opacity:1},
          {transform:`translate(${x}px,${y}px)`,opacity:1,offset:0.4},
          {transform:`translate(${x}px,${y+fall}px)`,opacity:0}
        ],
        {duration:3200,easing:"ease-out"}
      );
      setTimeout(()=>s.remove(),3400);
    }
  }

  // ========= 題目生成（按年級，保持你原本）=========
  function makeChoices(ans){
    const a = Number(ans);
    const set = new Set([String(a)]);
    while (set.size < SETTINGS.choiceCount){
      const delta = randInt(1, Math.max(3, Math.floor(a*0.2) || 3));
      let fake = Math.random()<0.5 ? a+delta : a-delta;
      if (fake < 0) fake = a+delta;
      set.add(String(fake));
    }
    const arr = shuffle([...set]);
    return { arr, correct: arr.indexOf(String(a)) };
  }

  function makeOneQuestion(grade, op){
    const rule = SETTINGS.rules[grade];

    // 小1：<=20
    if (grade === 1){
      if (op === "add"){
        const a = randInt(0, rule.addMaxSum);
        const b = randInt(0, rule.addMaxSum - a); // 保證和<=20
        const ans = a + b;
        const c = makeChoices(ans);
        return { q:`${a} + ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
      }
      if (op === "sub"){
        const a = randInt(0, rule.subMax);
        const b = randInt(0, a); // 保證不為負
        const ans = a - b;
        const c = makeChoices(ans);
        return { q:`${a} - ${b} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
      }
    }

    // 小2/小3
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
      const dividend = divisor * quotient; // 整除
      const ans = quotient;
      const c = makeChoices(ans);
      return { q:`${dividend} ÷ ${divisor} = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans} };
    }

    const c = makeChoices(0);
    return { q:`0 = ?`, a:c.arr, correct:c.correct, meta:{grade,op,ans:0} };
  }

  function buildBatch(op){
    const grade = selectedGrade;
    const qs = [];
    for (let k=0;k<SETTINGS.batchSize;k++){
      qs.push(makeOneQuestion(grade, op));
    }
    return qs;
  }

  // ========= 練習邏輯（保持你原本）=========
  let currentOp = "add";
  let questions = [];
  let i = 0;
  let locked = false;

  let startTimeMs = 0;
  let totalAnswered = 0;
  let correctAnswered = 0;

  let mode = "main";
  let wrongPool = [];

  let timerId = null;

  function updateStatsBar(){
    const sec = Math.floor((Date.now() - startTimeMs)/1000);
    if (timerText) timerText.textContent = `${sec}s`;
    if (progressText) progressText.textContent = `${questions.length ? (i+1) : 0}/${questions.length}`;
    if (correctText) correctText.textContent = `${correctAnswered}`;
    if (wrongText) wrongText.textContent = `${Math.max(0, totalAnswered - correctAnswered)}`;
  }

  function startTimer(){
    stopTimer();
    timerId = setInterval(updateStatsBar, 250);
  }
  function stopTimer(){
    if (timerId){
      clearInterval(timerId);
      timerId = null;
    }
  }

  function updateTopText(){
    const total = questions.length;
    const progress = `${Math.min(i+1,total)}/${total}`;
    const roundName = mode==="main" ? "練習" : "錯題重練";
    if (goalTextEl) goalTextEl.textContent = `小${selectedGrade}｜${opName(currentOp)}｜${roundName}：${progress}｜錯題：${wrongPool.length}`;
    updateStatsBar();
  }

  function startOp(op){
    const allowed = SETTINGS.rules[selectedGrade].ops;
    if (!allowed.includes(op)){
      alert(`小${selectedGrade} 暫不提供 ${opName(op)}。`);
      return;
    }

    currentOp = op;
    mode = "main";
    questions = buildBatch(op);
    i = 0;
    locked = false;
    wrongPool = [];

    startTimeMs = Date.now();
    totalAnswered = 0;
    correctAnswered = 0;

    chaptersEl.style.display="none";
    practiceEl.style.display="block";
    if (reportEl){ reportEl.style.display="none"; reportEl.textContent=""; }

    chapterTitleEl.textContent = `小${selectedGrade}｜${opName(op)}`;
    statusEl.textContent = "請選擇答案";
    statusEl.style.color = "";

    startTimer();
    render();
  }

  function render(){
    locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    const q = questions[i];
    questionEl.textContent = `第 ${i+1} 題：${q.q}`;

    q.a.forEach((t,idx)=>{
      const b=document.createElement("button");
      b.className="choice";
      b.textContent=t;
      b.onclick=()=>choose(idx);
      choicesEl.appendChild(b);
    });

    updateTopText();
  }

  function choose(idx){
    if (locked) return;
    locked = true;

    totalAnswered++;
    const q = questions[i];
    const all = [...document.querySelectorAll(".choice")];
    if (all[q.correct]) all[q.correct].classList.add("correct");

    const ok = idx===q.correct;

    if (ok){
      correctAnswered++;
      statusEl.textContent = "答對了 ✅";
      nextBtn.disabled = true;
      updateTopText();
      setTimeout(()=>nextQuestion(), 450); // 答對自動下一題
    } else {
      if (all[idx]) all[idx].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      const key = q.q;
      if (!wrongPool.some(it=>it.q.q===key)) wrongPool.push({q, wrongIndex: idx});
      nextBtn.disabled = false; // 答錯才手動下一題
      updateTopText();
    }
  }

  function nextQuestion(){
    if (i < questions.length-1){
      i++; render();
    } else {
      finishRound();
    }
  }

  function finishRound(){
    if (wrongPool.length>0){
      const wrongQs = wrongPool.map(it=>it.q);
      wrongPool = [];
      mode = "wrong";

      questions = wrongQs.map(oldQ=>{
        const ans = oldQ.meta.ans;
        const c = makeChoices(ans);
        return { q: oldQ.q, a: c.arr, correct: c.correct, meta: oldQ.meta };
      });

      i=0; locked=false;
      chapterTitleEl.textContent = `小${selectedGrade}｜${opName(currentOp)}｜錯題重練`;
      statusEl.textContent = "還有錯題，自動進入錯題重練…";
      nextBtn.disabled = true;
      render();
      return;
    }

    finishSuccess();
  }

  function finishSuccess(){
    statusEl.textContent = "🎉 已完成學習目標（全對）！";
    statusEl.style.color="#2e7d32";
    showConfetti();

    const durationSec = Math.floor((Date.now()-startTimeMs)/1000);
    const percent = totalAnswered===0 ? 0 : Math.round((correctAnswered/totalAnswered)*100);
    const reportText = `學習報告：用時 ${durationSec} 秒｜作答 ${totalAnswered} 題｜答對 ${correctAnswered} 題｜正確率 ${percent}%`;

    if (reportEl){
      reportEl.style.display="block";
      reportEl.textContent=reportText;
    }

    localStorage.setItem(`report_${Date.now()}`, JSON.stringify({
      time: Date.now(),
      durationSec,
      totalAnswered,
      correctAnswered,
      percent,
      grade: selectedGrade,
      op: currentOp
    }));
    renderHistory();

    setTimeout(()=>{
      stopTimer();
      practiceEl.style.display="none";
      chaptersEl.style.display="block";
      choicesEl.innerHTML="";
      questionEl.textContent="";
      nextBtn.disabled=true;
      statusEl.style.color="";
    }, 2000);
  }

  // ========= 歷史紀錄（繁體修正）=========
  function pad2(n){ return String(n).padStart(2,"0"); }
  function formatDate(ts){
    const d=new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function getAllReports(){
    const items=[];
    for(let k=0;k<localStorage.length;k++){
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
    const list=getAllReports().slice(0,7);
    historyListEl.innerHTML="";
    if (list.length===0){
      historyListEl.innerHTML=`<p class="hint">目前還沒有紀錄。</p>`;
      return;
    }
    list.forEach(r=>{
      const div=document.createElement("div");
      div.className="wrongItem";
      div.innerHTML=`
        <b>${formatDate(r.time)}（小${r.grade}｜${opName(r.op)}）</b>
        <div>用時：${r.durationSec} 秒</div>
        <div>作答：${r.totalAnswered} 題｜答對：${r.correctAnswered} 題｜正確率：${r.percent}%</div>
      `;
      historyListEl.appendChild(div);
    });
  }
  renderHistory();
  if (refreshHistoryBtn) refreshHistoryBtn.onclick = renderHistory;

  // ✅ 清除紀錄：改成「家長密碼」驗證（你要求的）
  if (clearHistoryBtn){
    clearHistoryBtn.onclick = () => {
      if (!verifyParentPassword()) return;

      const keys=[];
      for(let k=0;k<localStorage.length;k++){
        const key=localStorage.key(k);
        if (key && key.startsWith("report_")) keys.push(key);
      }
      keys.forEach(k=>localStorage.removeItem(k));
      alert("已清除學習紀錄 ✅");
      renderHistory();
    };
  }

  // ✅ 家長模式：改為「點擊可設定/修改/忘記密碼」（你要求的）
  if (parentBtn){
    parentBtn.onclick = () => parentModeMenu();
  }

  // ========= 綁定按鈕 =========
  btnAdd.onclick = () => startOp("add");
  btnSub.onclick = () => startOp("sub");
  if (btnMul) btnMul.onclick = () => startOp("mul");
  if (btnDiv) btnDiv.onclick = () => startOp("div");
  nextBtn.onclick = () => nextQuestion();
});
