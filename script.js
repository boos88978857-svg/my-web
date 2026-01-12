document.addEventListener("DOMContentLoaded", () => {
  // ========= 基本設定 =========
  const SETTINGS = {
    batchSize: 12,        // 每回合題數（可調）
    choiceCount: 4,       // 4 選 1（較像正式教材練習）
    autoNextMs: 450,      // 答對自動下一題延遲
  };

  // ========= DOM =========
  const parentBtn = document.getElementById("parentBtn");

  const gradeSelect = document.getElementById("gradeSelect");
  const moduleSelect = document.getElementById("moduleSelect");
  const moduleGrid = document.getElementById("moduleGrid");
  const backToGrade = document.getElementById("backToGrade");
  const pickedGradeText = document.getElementById("pickedGradeText");

  const chaptersEl = document.getElementById("chapters");
  const practiceEl = document.getElementById("practice");

  const chapterTitleEl = document.getElementById("chapterTitle");
  const questionEl = document.getElementById("question");
  const visualEl = document.getElementById("visual");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("next");
  const backToModulesBtn = document.getElementById("backToModules");
  const statusEl = document.getElementById("status");
  const goalTextEl = document.getElementById("goalText");
  const reportEl = document.getElementById("report");
  const timerEl = document.getElementById("timer");

  const historyListEl = document.getElementById("historyList");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  // ========= 工具 =========
  function shuffle(arr){
    const a = arr.slice();
    for(let j=a.length-1;j>0;j--){
      const k = Math.floor(Math.random()*(j+1));
      [a[j],a[k]]=[a[k],a[j]];
    }
    return a;
  }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function pad2(n){ return String(n).padStart(2,"0"); }
  function formatDate(ts){
    const d=new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function gradeName(g){ return g===1?"小一":g===2?"小二":"小三"; }

  function makeChoicesNumeric(answer, min=0, max=9999){
    const a = Number(answer);
    const set = new Set([a]);
    while(set.size < SETTINGS.choiceCount){
      const delta = randInt(1, Math.max(3, Math.floor(Math.abs(a)*0.2) || 3));
      let fake = Math.random()<0.5 ? a+delta : a-delta;
      if (fake < min) fake = a + delta;
      if (fake > max) fake = a - delta;
      if (fake < min) fake = min;
      if (fake > max) fake = max;
      set.add(fake);
    }
    const arr = shuffle([...set]).map(n => String(n));
    return { arr, correct: arr.indexOf(String(a)) };
  }

  // ========= 視覺呈現（無圖片、結構化符號） =========
  function clearVisual(){
    visualEl.innerHTML = "";
  }

  // 點點（教材感：等距）
  function renderDots(n){
    const dot = "●";
    const maxPerLine = 10;
    let out = "";
    for(let i=1;i<=n;i++){
      out += dot + " ";
      if (i % maxPerLine === 0) out += "\n";
    }
    const box = document.createElement("div");
    box.className = "mono";
    box.textContent = out.trim();
    visualEl.innerHTML = "";
    visualEl.appendChild(box);
  }

  // 十格框（ten-frame）
  function renderTenFrame(n){
    const wrap = document.createElement("div");
    wrap.className = "tenframe";
    for(let i=1;i<=10;i++){
      const c = document.createElement("div");
      c.className = "cell" + (i<=n ? " filled" : "");
      wrap.appendChild(c);
    }
    visualEl.innerHTML = "";
    visualEl.appendChild(wrap);
  }

  // 十與一（tens & ones）
  function renderTensOnes(num){
    const tens = Math.floor(num/10);
    const ones = num % 10;

    const root = document.createElement("div");
    root.className = "tensones";

    // 十（每個十一條）
    for(let t=0;t<tens;t++){
      const bar = document.createElement("div");
      bar.className = "tenbar";
      for(let i=0;i<10;i++){
        const u = document.createElement("div");
        u.className = "unit";
        bar.appendChild(u);
      }
      root.appendChild(bar);
    }

    // 個
    const onesBox = document.createElement("div");
    onesBox.className = "ones";
    for(let i=0;i<ones;i++){
      const o = document.createElement("div");
      o.className = "one";
      onesBox.appendChild(o);
    }
    root.appendChild(onesBox);

    visualEl.innerHTML = "";
    visualEl.appendChild(root);
  }

  // 乘法陣列（array）
  function renderArray(rows, cols){
    const dot = "●";
    let out = "";
    for(let r=0;r<rows;r++){
      out += (dot + " ").repeat(cols).trim() + "\n";
    }
    const box = document.createElement("div");
    box.className = "mono";
    box.textContent = out.trim();
    visualEl.innerHTML = "";
    visualEl.appendChild(box);
  }

  // ========= 模組藍圖（教材同步、非抄題） =========
  // 每個模組：id, title, sub, gradeMin, gradeMax, generator()
  const MODULES = [
    // ===== 小一（數感/認識/結構）=====
    {
      id:"g1_count_20",
      title:"數與數量（0～20）",
      sub:"數一數、數字↔數量",
      grades:[1],
      gen: () => {
        const n = randInt(0, 20);
        const askType = randInt(1,2); // 1:看數量選數字  2:看數字選數量（用十格框）
        if (askType === 1){
          questionEl.textContent = "看圖示：這裡有幾個？";
          if (n<=10) renderTenFrame(n);
          else renderDots(n);
          const c = makeChoicesNumeric(n, 0, 20);
          return { answerIndex: c.correct, choices: c.arr, meta:{ ans:n } };
        } else {
          const target = n;
          questionEl.textContent = `請選出「${target}」的十格框數量`;
          clearVisual();
          // 這題用選項呈現 ten-frame 的數量（每個選項顯示數字即可，避免 UI 太複雜）
          const c = makeChoicesNumeric(target, 0, 20);
          // 視覺區顯示目標數字（教材常見：先看到數字）
          const box = document.createElement("div");
          box.className = "mono";
          box.textContent = `目標：${target}`;
          visualEl.appendChild(box);
          return { answerIndex: c.correct, choices: c.arr, meta:{ ans:target } };
        }
      }
    },
    {
      id:"g1_to_100",
      title:"認識 100（不要求計算）",
      sub:"數到100、比大小、找數字",
      grades:[1],
      gen: () => {
        const mode = randInt(1,3);
        if (mode === 1){
          // 找數字
          const target = randInt(0,100);
          questionEl.textContent = "請找出正確的數字：";
          const box = document.createElement("div");
          box.className = "mono";
          box.textContent = `目標：${target}`;
          visualEl.innerHTML = ""; visualEl.appendChild(box);
          const c = makeChoicesNumeric(target, 0, 100);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans:target } };
        }
        if (mode === 2){
          // 比大小
          const a = randInt(0,100);
          let b = randInt(0,100);
          if (b===a) b = (b+1)%101;
          questionEl.textContent = "哪一個比較大？";
          const box = document.createElement("div");
          box.className = "mono";
          box.textContent = `${a}  vs  ${b}`;
          visualEl.innerHTML = ""; visualEl.appendChild(box);
          const ans = a>b ? a : b;
          const choices = shuffle([String(a), String(b), String(ans===a?b:a), String(randInt(0,100))]).slice(0,4);
          const correct = choices.indexOf(String(ans));
          return { answerIndex:correct, choices, meta:{ ans } };
        }
        // 數的前後（+1/-1）
        const x = randInt(1,99);
        const askNext = Math.random()<0.5;
        questionEl.textContent = askNext ? `「${x}」的下一個數字是？` : `「${x}」的上一個數字是？`;
        const ans = askNext ? x+1 : x-1;
        const box = document.createElement("div");
        box.className = "mono";
        box.textContent = `數字：${x}`;
        visualEl.innerHTML = ""; visualEl.appendChild(box);
        const c = makeChoicesNumeric(ans, 0, 100);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
      }
    },
    {
      id:"g1_tens_ones",
      title:"十與一（位值概念）",
      sub:"34＝3個十＋4個一",
      grades:[1],
      gen: () => {
        const num = randInt(10, 99);
        const mode = randInt(1,2);
        if (mode===1){
          questionEl.textContent = "看結構：這代表哪個數字？";
          renderTensOnes(num);
          const c = makeChoicesNumeric(num, 0, 99);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans:num } };
        } else {
          questionEl.textContent = `請用「十與一」理解：${num} 是幾個十？`;
          renderTensOnes(num);
          const tens = Math.floor(num/10);
          const c = makeChoicesNumeric(tens, 0, 9);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans:tens } };
        }
      }
    },
    {
      id:"g1_make_10",
      title:"湊 10（為進位做準備）",
      sub:"看十格框，還差多少到10",
      grades:[1],
      gen: () => {
        const n = randInt(0,10);
        questionEl.textContent = "看十格框：還差多少才到 10？";
        renderTenFrame(n);
        const ans = 10 - n;
        const c = makeChoicesNumeric(ans, 0, 10);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
      }
    },
    {
      id:"g1_addsub_20",
      title:"20 以內加減（不進位退位）",
      sub:"理解為主，不比快",
      grades:[1],
      gen: () => {
        const op = Math.random()<0.5 ? "add" : "sub";
        if (op==="add"){
          const a = randInt(0,20);
          const b = randInt(0,20-a);
          const ans = a+b;
          questionEl.textContent = `${a} + ${b} = ?`;
          // 視覺輔助（用點點）
          clearVisual(); renderDots(Math.min(ans,20));
          const c = makeChoicesNumeric(ans, 0, 20);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
        } else {
          const a = randInt(0,20);
          const b = randInt(0,a);
          const ans = a-b;
          questionEl.textContent = `${a} − ${b} = ?`;
          clearVisual(); renderDots(a);
          const c = makeChoicesNumeric(ans, 0, 20);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
        }
      }
    },

    // ===== 小二 =====
    {
      id:"g2_addsub_100",
      title:"100 以內加減（含進退位）",
      sub:"兩位數加減，分級練習",
      grades:[2],
      gen: () => {
        const op = Math.random()<0.5 ? "add" : "sub";
        const level = randInt(1,3); // 1不進退位 2單次進退位 3較混合
        let a,b,ans;

        function makeNoCarryAdd(){
          const a1 = randInt(0,9), a10 = randInt(0,9);
          const b1 = randInt(0, 9-a1);
          const b10 = randInt(0, 9-a10);
          return {a: a10*10+a1, b: b10*10+b1};
        }
        function makeCarryAdd(){
          const a1 = randInt(5,9), b1 = randInt(5,9); // 會進位
          const a10 = randInt(0,8), b10 = randInt(0, 8-a10);
          return {a: a10*10+a1, b: b10*10+b1};
        }
        function makeNoBorrowSub(){
          const a1 = randInt(0,9), b1 = randInt(0,a1);
          const a10 = randInt(0,9), b10 = randInt(0,a10);
          return {a: a10*10+a1, b: b10*10+b1};
        }
        function makeBorrowSub(){
          const a1 = randInt(0,4), b1 = randInt(a1+1,9); // 需要借位
          const a10 = randInt(1,9), b10 = randInt(0,a10-1);
          return {a: a10*10+a1, b: b10*10+b1};
        }

        if (op==="add"){
          const pair =
            level===1 ? makeNoCarryAdd()
            : level===2 ? makeCarryAdd()
            : (Math.random()<0.5 ? makeNoCarryAdd() : makeCarryAdd());
          a = pair.a; b = pair.b; ans = a+b;
          questionEl.textContent = `${a} + ${b} = ?`;
          clearVisual(); renderTensOnes(a); // 給一點位值感（不抄課本）
          const c = makeChoicesNumeric(ans, 0, 200);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
        } else {
          const pair =
            level===1 ? makeNoBorrowSub()
            : level===2 ? makeBorrowSub()
            : (Math.random()<0.5 ? makeNoBorrowSub() : makeBorrowSub());
          a = pair.a; b = pair.b; ans = a-b;
          questionEl.textContent = `${a} − ${b} = ?`;
          clearVisual();
          const box = document.createElement("div");
          box.className="mono";
          box.textContent = `提示：想想十位/個位`;
          visualEl.appendChild(box);
          const c = makeChoicesNumeric(ans, 0, 100);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
        }
      }
    },
    {
      id:"g2_estimate",
      title:"估算與合理性",
      sub:"大約是多少？是否合理？",
      grades:[2],
      gen: () => {
        const a = randInt(10,99);
        const b = randInt(10,99);
        const op = Math.random()<0.5 ? "add" : "sub";
        if (op==="add"){
          questionEl.textContent = `估算：${a} + ${b} 大約是多少？（四捨五入到十位）`;
          clearVisual();
          const approx = (Math.round(a/10)*10) + (Math.round(b/10)*10);
          const c = makeChoicesNumeric(approx, 0, 200);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans:approx } };
        } else {
          const big = Math.max(a,b), small = Math.min(a,b);
          questionEl.textContent = `估算：${big} − ${small} 大約是多少？（四捨五入到十位）`;
          clearVisual();
          const approx = (Math.round(big/10)*10) - (Math.round(small/10)*10);
          const c = makeChoicesNumeric(approx, 0, 100);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans:approx } };
        }
      }
    },
    {
      id:"g2_mul_array",
      title:"乘法概念（陣列）",
      sub:"幾行幾列→幾個",
      grades:[2],
      gen: () => {
        const rows = randInt(2,5);
        const cols = randInt(2,5);
        const ans = rows*cols;
        questionEl.textContent = `看陣列：共有幾個？（${rows} 行 × ${cols} 列）`;
        renderArray(rows, cols);
        const c = makeChoicesNumeric(ans, 0, 50);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
      }
    },
    {
      id:"g2_times_table",
      title:"九九乘法（熟練）",
      sub:"2～9 乘法練習",
      grades:[2],
      gen: () => {
        const a = randInt(2,9);
        const b = randInt(2,9);
        const ans = a*b;
        questionEl.textContent = `${a} × ${b} = ?`;
        clearVisual();
        const c = makeChoicesNumeric(ans, 0, 81);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
      }
    },
    {
      id:"g2_div_exact",
      title:"除法入門（整除）",
      sub:"平均分配、整除題",
      grades:[2],
      gen: () => {
        const divisor = randInt(2,9);
        const quotient = randInt(2,9);
        const dividend = divisor * quotient;
        questionEl.textContent = `${dividend} ÷ ${divisor} = ?`;
        clearVisual();
        const c = makeChoicesNumeric(quotient, 0, 20);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans:quotient } };
      }
    },

    // ===== 小三 =====
    {
      id:"g3_addsub_1000",
      title:"三位數加減",
      sub:"含進位/退位",
      grades:[3],
      gen: () => {
        const op = Math.random()<0.5 ? "add" : "sub";
        if (op==="add"){
          const a = randInt(100,999);
          const b = randInt(100,999);
          const ans = a+b;
          questionEl.textContent = `${a} + ${b} = ?`;
          clearVisual();
          const c = makeChoicesNumeric(ans, 0, 1998);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
        } else {
          let a = randInt(100,999);
          let b = randInt(100,999);
          if (b>a) [a,b]=[b,a];
          const ans = a-b;
          questionEl.textContent = `${a} − ${b} = ?`;
          clearVisual();
          const c = makeChoicesNumeric(ans, 0, 999);
          return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
        }
      }
    },
    {
      id:"g3_mul_2x1",
      title:"乘法進階（兩位×一位）",
      sub:"例如 23×4",
      grades:[3],
      gen: () => {
        const a = randInt(12,99);
        const b = randInt(2,9);
        const ans = a*b;
        questionEl.textContent = `${a} × ${b} = ?`;
        clearVisual();
        const c = makeChoicesNumeric(ans, 0, 900);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans } };
      }
    },
    {
      id:"g3_div_2x1",
      title:"除法進階（兩位÷一位）",
      sub:"以整除為主",
      grades:[3],
      gen: () => {
        const divisor = randInt(2,9);
        const quotient = randInt(10,99);
        const dividend = divisor * quotient; // 整除
        questionEl.textContent = `${dividend} ÷ ${divisor} = ?`;
        clearVisual();
        const c = makeChoicesNumeric(quotient, 0, 200);
        return { answerIndex:c.correct, choices:c.arr, meta:{ ans:quotient } };
      }
    },
    {
      id:"g3_mix_ops",
      title:"混合運算（基礎）",
      sub:"先乘除後加減（不含括號）",
      grades:[3],
      gen: () => {
        const a = randInt(1,9);
        const b = randInt(1,9);
        const c = randInt(1,9);
        const form = Math.random()<0.5 ? "a_plus_b_mul_c" : "a_mul_b_plus_c";
        let expr, ans;
        if (form==="a_plus_b_mul_c"){
          expr = `${a} + ${b} × ${c}`;
          ans = a + (b*c);
        } else {
          expr = `${a} × ${b} + ${c}`;
          ans = (a*b) + c;
        }
        questionEl.textContent = `計算：${expr} = ?`;
        clearVisual();
        const ch = makeChoicesNumeric(ans, 0, 200);
        return { answerIndex:ch.correct, choices:ch.arr, meta:{ ans } };
      }
    },
    {
      id:"g3_word_2step",
      title:"兩步應用題（文字）",
      sub:"把算式套進情境",
      grades:[3],
      gen: () => {
        // 自寫題幹（不抄教材）
        const mode = randInt(1,2);
        if (mode===1){
          const packs = randInt(2,8);
          const each = randInt(2,9);
          const give = randInt(1,10);
          const total = packs*each;
          const ans = total - give;
          questionEl.textContent = `有 ${packs} 盒貼紙，每盒 ${each} 張。送出 ${give} 張後，還剩幾張？`;
          clearVisual();
          const ch = makeChoicesNumeric(ans, 0, 200);
          return { answerIndex:ch.correct, choices:ch.arr, meta:{ ans } };
        } else {
          const a = randInt(20,80);
          const b = randInt(10,40);
          const times = randInt(2,4);
          const ans = (a-b)*times;
          questionEl.textContent = `班上原有 ${a} 本書，借出 ${b} 本後，剩下的數量是原來的 ${times} 倍嗎？剩下幾本？`;
          clearVisual();
          const ch = makeChoicesNumeric(ans, 0, 300);
          return { answerIndex:ch.correct, choices:ch.arr, meta:{ ans } };
        }
      }
    },
  ];

  function modulesForGrade(g){
    return MODULES.filter(m => m.grades.includes(g));
  }

  // ========= 家長密碼（可設定/修改/忘記） =========
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
    if (!hasParentPassword()){
      promptNewPasswordFlow();
      return;
    }
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
  }
  if (parentBtn) parentBtn.onclick = handleParentMode;

  // ========= 煙火 =========
  function showConfetti() {
    const box = document.getElementById("confetti");
    if (!box) return;
    box.innerHTML = "";
    const emojis = ["🎉", "🎊"];
    const cx = window.innerWidth/2;
    const sy = window.innerHeight*0.38;

    for (let k=0;k<44;k++){
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
      const spread=160+Math.random()*220;
      const x=Math.cos(ang)*spread;
      const y=Math.sin(ang)*spread-130;
      const fall=420+Math.random()*320;

      s.animate(
        [
          {transform:"translate(0,0)",opacity:1},
          {transform:`translate(${x}px,${y}px)`,opacity:1,offset:0.42},
          {transform:`translate(${x}px,${y+fall}px)`,opacity:0}
        ],
        {duration:3400,easing:"ease-out"}
      );
      setTimeout(()=>s.remove(),3600);
    }
  }

  // ========= 歷史紀錄 =========
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
        <b>${formatDate(r.time)}（${gradeName(r.grade)}｜${r.moduleTitle}）</b>
        <div>用時：${r.durationSec} 秒</div>
        <div>作答：${r.totalAnswered} 題｜答對：${r.correctAnswered} 題｜正確率：${r.percent}%</div>
      `;
      historyListEl.appendChild(div);
    });
  }
  renderHistory();
  if (refreshHistoryBtn) refreshHistoryBtn.onclick = renderHistory;

  // 清除紀錄：需要家長密碼（家長自訂）
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

  // ========= 年級 & 模組 UI =========
  let selectedGrade = 1;
  let selectedModule = null;

  function showModulesForGrade(g){
    selectedGrade = g;
    if (pickedGradeText) pickedGradeText.textContent = `已選：${gradeName(g)}`;

    const mods = modulesForGrade(g);
    moduleGrid.innerHTML = "";
    mods.forEach(m=>{
      const b = document.createElement("button");
      b.className = "module-card";
      b.innerHTML = `<div class="m-title">${m.title}</div><div class="m-sub">${m.sub}</div>`;
      b.onclick = () => startModule(m);
      moduleGrid.appendChild(b);
    });

    gradeSelect.style.display = "none";
    moduleSelect.style.display = "block";
  }

  document.querySelectorAll(".grade-card").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const g = Number(btn.dataset.grade || 1);
      showModulesForGrade(g);
    });
  });

  if (backToGrade){
    backToGrade.onclick = () => {
      moduleSelect.style.display = "none";
      gradeSelect.style.display = "grid";
    };
  }

  // ========= 練習邏輯（錯題重練 / 全對完成） =========
  let questions = [];
  let i = 0;
  let locked = false;
  let wrongPool = []; // 存題目物件
  let mode = "main";

  let startTimeMs = 0;
  let timerTick = null;

  let totalAnswered = 0;
  let correctAnswered = 0;

  function startTimer(){
    stopTimer();
    startTimeMs = Date.now();
    timerTick = setInterval(()=>{
      const sec = Math.floor((Date.now()-startTimeMs)/1000);
      if (timerEl) timerEl.textContent = `⏱ ${sec} 秒`;
    }, 400);
  }
  function stopTimer(){
    if (timerTick) clearInterval(timerTick);
    timerTick = null;
  }

  function updateTopText(){
    const total = questions.length;
    const progress = `${Math.min(i+1,total)}/${total}`;
    const roundName = mode==="main" ? "練習" : "錯題重練";
    if (goalTextEl) goalTextEl.textContent = `${gradeName(selectedGrade)}｜${selectedModule.title}｜${roundName}：${progress}｜錯題：${wrongPool.length}`;
  }

  function buildBatch(module){
    const qs = [];
    for (let k=0;k<SETTINGS.batchSize;k++){
      qs.push(makeQuestionFromModule(module));
    }
    return qs;
  }

  function makeQuestionFromModule(module){
    // 由模組 generator 決定題幹、視覺、選項與答案
    // 注意：題幹與視覺是在 render() 裡顯示；這裡先生成一個可重播的「生成器快照」
    // 為了錯題重練，我們把「題目生成結果」保存下來。
    const snapshot = {};
    // 暫存：真正內容在 renderQuestion() 生成（這裡用「一次生成」確保重練同一題）
    const q = {
      moduleId: module.id,
      moduleTitle: module.title,
      // payload：呼叫 module.gen() 生成一次並保存
      payload: null
    };
    // 先生成一次存起來（避免下一次重畫變不同題）
    q.payload = generateOnce(module);
    return q;

    function generateOnce(mod){
      // mod.gen() 會直接操作 DOM（題幹/視覺），這裡不想動 DOM
      // 所以我們用「虛擬渲染」：暫存目前 DOM，再還原
      const prevQ = questionEl.textContent;
      const prevV = visualEl.innerHTML;

      // 生成
      const out = mod.gen();

      // 把生成時寫到 DOM 的題幹/視覺抓下來，存進 payload
      const payload = {
        questionText: questionEl.textContent,
        visualHTML: visualEl.innerHTML,
        choices: out.choices,
        answerIndex: out.answerIndex,
        ansMeta: out.meta || {}
      };

      // 還原 DOM（避免 buildBatch 時畫面亂跳）
      questionEl.textContent = prevQ;
      visualEl.innerHTML = prevV;

      return payload;
    }
  }

  function startModule(module){
    selectedModule = module;
    mode = "main";
    wrongPool = [];
    questions = buildBatch(module);
    i = 0;
    locked = false;

    totalAnswered = 0;
    correctAnswered = 0;

    chaptersEl.style.display = "none";
    practiceEl.style.display = "block";
    if (reportEl){ reportEl.style.display="none"; reportEl.textContent=""; }
    statusEl.textContent = "請選擇答案";
    statusEl.style.color = "";

    chapterTitleEl.textContent = `${gradeName(selectedGrade)}｜${module.title}`;
    startTimer();
    render();
  }

  function render(){
    locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    const q = questions[i];
    // 套用 payload
    questionEl.textContent = `第 ${i+1} 題：${q.payload.questionText}`;
    visualEl.innerHTML = q.payload.visualHTML || "";
    if (!q.payload.visualHTML) clearVisual();

    q.payload.choices.forEach((t,idx)=>{
      const b=document.createElement("button");
      b.className="choice";
      b.textContent = t;
      b.onclick = ()=>choose(idx);
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
    if (all[q.payload.answerIndex]) all[q.payload.answerIndex].classList.add("correct");

    const ok = idx === q.payload.answerIndex;

    if (ok){
      correctAnswered++;
      statusEl.textContent = "答對了 ✅";
      nextBtn.disabled = true;
      setTimeout(()=>nextQuestion(), SETTINGS.autoNextMs);
    } else {
      if (all[idx]) all[idx].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      // 只記錄一次
      if (!wrongPool.includes(q)) wrongPool.push(q);
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
    if (wrongPool.length > 0){
      // 進入錯題重練：重練 wrongPool 裡的題（同一題同一選項）
      mode = "wrong";
      questions = wrongPool.slice();
      wrongPool = [];
      i = 0;
      locked = false;
      chapterTitleEl.textContent = `${gradeName(selectedGrade)}｜${selectedModule.title}｜錯題重練`;
      statusEl.textContent = "還有錯題，自動進入錯題重練…";
      nextBtn.disabled = true;
      render();
      return;
    }
    finishSuccess();
  }

  function finishSuccess(){
    stopTimer();
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
      moduleId: selectedModule.id,
      moduleTitle: selectedModule.title
    }));
    renderHistory();

    setTimeout(()=>{
      practiceEl.style.display="none";
      chaptersEl.style.display="block";
      choicesEl.innerHTML="";
      questionEl.textContent="";
      visualEl.innerHTML="";
      nextBtn.disabled=true;
      statusEl.style.color="";
      if (timerEl) timerEl.textContent = "⏱ 0 秒";
    }, 1800);
  }

  // 返回模組
  if (backToModulesBtn){
    backToModulesBtn.onclick = () => {
      stopTimer();
      practiceEl.style.display = "none";
      chaptersEl.style.display = "block";
      // 回到模組選擇頁
      gradeSelect.style.display = "none";
      moduleSelect.style.display = "block";
      showModulesForGrade(selectedGrade);
    };
  }

  // 下一題
  nextBtn.onclick = () => nextQuestion();

  // 初始（預設顯示年級）
  gradeSelect.style.display = "grid";
  moduleSelect.style.display = "none";
});
