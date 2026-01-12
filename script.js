document.addEventListener("DOMContentLoaded", () => {
  // ========= 難度規則 =========
  const SETTINGS = {
    batchSize: 20,
    choiceCount: 3,
    rules: {
      1: { ops: ["add", "sub"], addMaxSum: 20, subMax: 20 },                       // 小一：≤20
      2: { ops: ["add","sub","mul","div"], addSubMax: 100, mulMax: 9, divMax: 9 }, // 小二
      3: { ops: ["add","sub","mul","div"], addSubMax: 1000, mulMax: 12, divMax: 12 } // 小三
    }
  };

  // ========= DOM =========
  const parentBtn = document.getElementById("parentBtn");

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
    const a=arr.slice();
    for(let j=a.length-1;j>0;j--){
      const k=Math.floor(Math.random()*(j+1));
      [a[j],a[k]]=[a[k],a[j]];
    }
    return a;
  }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  // ========= 家長密碼（依你需求新增；不影響出題邏輯）=========
  const PWD_KEY = "parent_password_v1";

  function hasParentPassword(){
    const p = localStorage.getItem(PWD_KEY);
    return typeof p === "string" && p.length > 0;
  }
  function getParentPassword(){
    return localStorage.getItem(PWD_KEY) || "";
  }
  function setParentPassword(pwd){
    localStorage.setItem(PWD_KEY, pwd);
  }
  function clearAllReportsAndPassword(){
    // 只清掉本機這個學習機用到的資料：report_* + 密碼
    const keysToRemove = [];
    for(let k=0;k<localStorage.length;k++){
      const key = localStorage.key(k);
      if (!key) continue;
      if (key.startsWith("report_") || key === PWD_KEY) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  function promptNewPasswordFlow(){
    const p1 = prompt("請輸入要設定的家長密碼（至少 4 碼）");
    if (p1 === null) return false;
    const pwd = String(p1).trim();
    if (pwd.length < 4){
      alert("密碼至少 4 碼，請重新設定。");
      return false;
    }
    const p2 = prompt("請再輸入一次確認密碼");
    if (p2 === null) return false;
    if (String(p2).trim() !== pwd){
      alert("兩次輸入不一致，未設定。");
      return false;
    }
    setParentPassword(pwd);
    alert("已設定家長密碼 ✅");
    return true;
  }

  function verifyPasswordFlow(){
    const input = prompt("請輸入家長密碼");
    if (input === null) return false;
    const ok = String(input).trim() === getParentPassword();
    if (!ok) alert("密碼錯誤 ❌");
    return ok;
  }

  function handleParentMode(){
    // 依你需求：家長模式 = 點擊可設定密碼（已設過則可修改/忘記）
    if (!hasParentPassword()){
      const ok = promptNewPasswordFlow();
      if (ok) return;
      return;
    }

    // 已有密碼：給家長選擇
    const choice = prompt(
      "家長模式：請選擇功能\n" +
      "1：修改密碼\n" +
      "2：忘記密碼（將清除所有學習紀錄與密碼）\n" +
      "3：取消"
    );
    if (choice === null) return;

    const c = String(choice).trim();
    if (c === "1"){
      if (!verifyPasswordFlow()) return;
      promptNewPasswordFlow();
      return;
    }
    if (c === "2"){
      const confirm1 = confirm("忘記密碼將『清除所有學習紀錄』與『家長密碼』，確定要繼續嗎？");
      if (!confirm1) return;
      const confirm2 = confirm("再次確認：真的要重置嗎？（此動作無法復原）");
      if (!confirm2) return;
      clearAllReportsAndPassword();
      alert("已重置 ✅（學習紀錄與密碼已清除）");
      renderHistory();
      return;
    }
    // 其他視為取消
  }

  if (parentBtn){
    parentBtn.onclick = handleParentMode;
  }

  // ========= 年級選擇 =========
  let selectedGrade = 1;
  function applyOpVisibility(){
    const allowed = SETTINGS.rules[selectedGrade].ops;
    if (btnMul) btnMul.style.display = allowed.includes("mul") ? "" : "none";
    if (btnDiv) btnDiv.style.display = allowed.includes("div") ? "" : "none";
    if (pickedGradeText) pickedGradeText.textContent = `已選：小${selectedGrade}`;
  }

  // 點年級大圖示
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

  // ========= 煙火 =========
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

  // ========= 題目生成（按年級） =========
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

    // 小一：≤20
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

    // 小二/小三
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
    const grade = selectedGrade;
    const qs = [];
    for (let k=0;k<SETTINGS.batchSize;k++){
      qs.push(makeOneQuestion(grade, op));
    }
    return qs;
  }

  // ========= 練習邏輯 =========
  let currentOp = "add";
  let questions = [];
  let i = 0;
  let locked = false;

  let startTimeMs = 0;
  let totalAnswered = 0;
  let correctAnswered = 0;

  let mode = "main";
  let wrongPool = [];

  function updateTopText(){
    const total = questions.length;
    const progress = `${Math.min(i+1,total)}/${total}`;
    const roundName = mode==="main" ? "練習" : "錯題重練";
    if (goalTextEl) goalTextEl.textContent = `小${selectedGrade}｜${opName(currentOp)}｜${roundName}：${progress}｜錯題：${wrongPool.length}`;
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
      setTimeout(()=>nextQuestion(), 450);
    } else {
      if (all[idx]) all[idx].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      const key = q.q;
      if (!wrongPool.some(it=>it.q.q===key)) wrongPool.push({q, wrongIndex: idx});
      nextBtn.disabled = false;
    }
    updateTopText();
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
      practiceEl.style.display="none";
      chaptersEl.style.display="block";
      choicesEl.innerHTML="";
      questionEl.textContent="";
      nextBtn.disabled=true;
      statusEl.style.color="";
    }, 2000);
  }

  // ========= 歷史紀錄 =========
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

  // 清除紀錄：依你需求 → 顯示家長密碼（家長自訂）
  if (clearHistoryBtn){
    clearHistoryBtn.onclick = () => {
      if (!hasParentPassword()){
        alert("尚未設定家長密碼，請先點「家長模式」設定密碼。");
        return;
      }
      if (!verifyPasswordFlow()) return;

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

  // ========= 綁定按鈕 =========
  btnAdd.onclick = () => startOp("add");
  btnSub.onclick = () => startOp("sub");
  if (btnMul) btnMul.onclick = () => startOp("mul");
  if (btnDiv) btnDiv.onclick = () => startOp("div");
  nextBtn.onclick = () => nextQuestion();
});
