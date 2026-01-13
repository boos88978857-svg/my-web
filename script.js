alert("JS 有執行");
(() => {
  // ====== Basic helpers ======
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));

  const LS = {
    grade: "ml_grade",
    qcount: "ml_qcount",
    records: "ml_records",
    pwd: "ml_pwd",
  };

  const state = {
    grade: localStorage.getItem(LS.grade) || "",
    qCount: Number(localStorage.getItem(LS.qcount) || 20),
    activeModule: null,
    session: null,
  };

  // ====== UI: pages / nav ======
  function showPage(name){
    $$(".page").forEach(p => p.classList.toggle("is-active", p.dataset.page === name));
    $$(".navItem").forEach(b => b.classList.toggle("is-active", b.dataset.nav === name));
  }

  $$(".navItem").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.nav));
  });

  // ====== Toast ======
  const toast = $("#toast");
  const toastText = $("#toastText");
  $("#toastClose").addEventListener("click", () => { toast.hidden = true; });
  function alertBox(msg){
    toastText.textContent = msg;
    toast.hidden = false;
  }

  // ====== Data: modules by grade ======
  // icon uses emoji to keep it simple/fast.
  const MODULES = {
    g1: [
      { id:"g1_count", title:"數對應數量", range:"(0～20)", desc:"數數、對應數量", icon:"🔢" },
      { id:"g1_100",   title:"認識 100",   range:"(不要求計算)", desc:"比大小、找數字", icon:"🧭" },
      { id:"g1_place", title:"十與一",     range:"(位值)", desc:"十個＝一個十", icon:"🧩" },
      { id:"g1_make10",title:"湊 10",      range:"(補到10)", desc:"為進位做準備", icon:"🧮" },
      { id:"g1_addsub",title:"20 以內加減", range:"(先理解)", desc:"不比快、先正確", icon:"➕" },
    ],
    g2: [
      { id:"g2_addsub", title:"加減", range:"(100 內)", desc:"含進退位", icon:"➕" },
      { id:"g2_mul", title:"乘法", range:"(九九)", desc:"0～9", icon:"✖️" },
      { id:"g2_div", title:"除法", range:"(整除)", desc:"配合乘法", icon:"➗" },
      { id:"g2_place", title:"位值", range:"(千百十個)", desc:"讀寫數", icon:"🏷️" },
      { id:"g2_word", title:"應用題", range:"(基礎)", desc:"關鍵字理解", icon:"📝" },
    ],
    g3: [
      { id:"g3_mul", title:"乘除", range:"(12 內)", desc:"更熟練", icon:"🧠" },
      { id:"g3_big", title:"位值與大數", range:"(到萬位)", desc:"讀寫比較", icon:"📌" },
      { id:"g3_frac", title:"分數初步", range:"(等分)", desc:"概念建立", icon:"🍰" },
      { id:"g3_measure", title:"量與測量", range:"(時間長度重量)", desc:"單位認識", icon:"⏱️" },
      { id:"g3_word", title:"應用題", range:"(進階)", desc:"步驟與檢查", icon:"🧾" },
    ],
  };

  // ====== Grade selection ======
  const gradeRow = $("#gradeRow");
  const gradeChip = $("#gradeChip");
  const moduleChip = $("#moduleChip");
  const moduleGrid = $("#moduleGrid");

  function renderGrade(){
    $$(".gradeCard").forEach(b => b.classList.toggle("is-active", b.dataset.grade === state.grade));
    if(!state.grade){
      gradeChip.textContent = "未選年級";
      moduleChip.textContent = "請先選年級";
    }else{
      const name = state.grade === "g1" ? "小1" : state.grade === "g2" ? "小2" : "小3";
      gradeChip.textContent = `已選年級：${name}`;
      moduleChip.textContent = `${name} 模組`;
    }
  }

  function renderModules(){
    moduleGrid.innerHTML = "";
    if(!state.grade){
      // show disabled skeleton
      ["—","—","—","—","—"].forEach(() => {
        const btn = document.createElement("button");
        btn.className = "moduleCard";
        btn.disabled = true;
        btn.innerHTML = `
          <div class="iconBubble">⬜</div>
          <div class="moduleText">
            <div class="moduleTitle">請先選年級</div>
            <div class="moduleDesc">—</div>
          </div>`;
        moduleGrid.appendChild(btn);
      });
      return;
    }

    const list = MODULES[state.grade] || [];
    list.forEach(m => {
      const btn = document.createElement("button");
      btn.className = "moduleCard";
      btn.type = "button";
      btn.dataset.moduleId = m.id;
      btn.innerHTML = `
        <div class="iconBubble">${m.icon}</div>
        <div class="moduleText">
          <div class="moduleTitle">${m.title} <span class="moduleRange">${m.range}</span></div>
          <div class="moduleDesc">${m.desc}</div>
        </div>
      `;
      btn.addEventListener("click", () => startModule(m));
      moduleGrid.appendChild(btn);
    });
  }

  gradeRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".gradeCard");
    if(!btn) return;
    state.grade = btn.dataset.grade;
    localStorage.setItem(LS.grade, state.grade);
    renderGrade();
    renderModules();
  });

  // ====== Practice engine ======
  const practiceTitle = $("#practiceTitle");
  const practiceChip = $("#practiceChip");
  const metaLeft = $("#metaLeft");
  const metaRight = $("#metaRight");
  const questionText = $("#questionText");
  const countStage = $("#countStage");
  const dots = $("#dots");
  const options = $("#options");
  const nextBtn = $("#nextBtn");
  const exitBtn = $("#exitBtn");
  const smallHint = $("#smallHint");

  function startModule(module){
    if(!state.grade){
      alertBox("請先選年級");
      return;
    }
    state.activeModule = module;

    // setup session
    state.session = {
      startAt: Date.now(),
      grade: state.grade,
      moduleId: module.id,
      moduleTitle: module.title,
      total: state.qCount,
      idx: 0,
      correct: 0,
      answered: 0,
    };

    practiceTitle.textContent = `${(state.grade==="g1"?"小1":state.grade==="g2"?"小2":"小3")}｜${module.title}`;
    practiceChip.textContent = `${module.range.replace(/[()]/g,"")}`;
    showPage("practice");
    nextBtn.disabled = true;
    buildQuestion();
  }

  function buildQuestion(){
    const s = state.session;
    if(!s) return;

    s.idx += 1;
    nextBtn.disabled = true;
    options.innerHTML = "";
    dots.innerHTML = "";
    smallHint.textContent = "請選擇答案";

    // meta
    metaLeft.textContent = `第 ${s.idx} 題 / ${s.total} 題`;
    metaRight.textContent = `正確 ${s.correct} / 作答 ${s.answered}`;

    // Decide question type:
    // Only "數對應數量" uses dots; others use simple number-choice placeholder.
    if(s.moduleId === "g1_count"){
      // random count 0-20 but avoid 0 for kids (use 3-20)
      const ans = randInt(3, 20);
      s._answer = ans;

      questionText.textContent = "請數一數下面有幾個●，選出正確數字。";
      countStage.hidden = false;

      // render dots
      const n = ans;
      for(let i=0;i<n;i++){
        const d = document.createElement("div");
        d.className = "dot";
        dots.appendChild(d);
      }

      // options: correct + 3
      const opts = makeOptions(ans, 3, 2, 20);
      renderOptions(opts, ans);
      return;
    }

    // Other modules: simple demo question (you can expand later)
    countStage.hidden = true;

    // placeholder question: choose larger
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    const ans = a > b ? a : b;
    s._answer = ans;

    questionText.textContent = `哪一個比較大？`;
    const opts = shuffle([a,b, randNear(ans), randNear(ans)]);
    const unique = Array.from(new Set(opts)).slice(0,4);
    while(unique.length<4) unique.push(randInt(10,99));
    renderOptions(shuffle(unique), ans);
  }

  function renderOptions(optArr, answer){
    options.innerHTML = "";
    optArr.forEach(v => {
      const btn = document.createElement("button");
      btn.className = "optBtn";
      btn.type = "button";
      btn.textContent = String(v);
      btn.addEventListener("click", () => choose(btn, v, answer));
      options.appendChild(btn);
    });
  }

  function choose(btn, value, answer){
    const s = state.session;
    if(!s) return;

    // prevent multi click
    $$(".optBtn").forEach(b => b.disabled = true);

    s.answered += 1;
    if(value === answer){
      s.correct += 1;
      btn.classList.add("is-right");
      smallHint.textContent = "答對了！";
    }else{
      btn.classList.add("is-wrong");
      // mark correct
      $$(".optBtn").forEach(b => {
        if(Number(b.textContent) === answer) b.classList.add("is-right");
      });
      smallHint.textContent = "再想想～（已標示正確答案）";
    }

    metaRight.textContent = `正確 ${s.correct} / 作答 ${s.answered}`;
    nextBtn.disabled = false;

    // end?
    if(s.idx >= s.total){
      nextBtn.textContent = "完成";
    }else{
      nextBtn.textContent = "下一題";
    }
  }

  nextBtn.addEventListener("click", () => {
    const s = state.session;
    if(!s) return;

    if(s.idx >= s.total){
      finishSession();
      return;
    }
    // enable options again will happen in buildQuestion
    buildQuestion();
  });

  exitBtn.addEventListener("click", () => {
    if(!state.session){
      showPage("home");
      return;
    }
    finishSession(true);
  });

  function finishSession(isExit=false){
    const s = state.session;
    const durSec = Math.max(1, Math.round((Date.now() - s.startAt)/1000));
    const gradeName = s.grade==="g1" ? "小1" : s.grade==="g2" ? "小2" : "小3";

    // save record
    const rec = {
      ts: Date.now(),
      time: durSec,
      grade: gradeName,
      module: s.moduleTitle,
      total: s.total,
      answered: s.answered,
      correct: s.correct,
      acc: s.answered ? Math.round((s.correct/s.answered)*100) : 0
    };

    const list = JSON.parse(localStorage.getItem(LS.records) || "[]");
    list.unshift(rec);
    localStorage.setItem(LS.records, JSON.stringify(list));

    state.session = null;
    state.activeModule = null;
    nextBtn.textContent = "下一題";
    nextBtn.disabled = true;
    $$(".optBtn").forEach(b => b.disabled = false);

    if(isExit){
      alertBox("已退出，紀錄已保存");
    }else{
      alertBox("完成！紀錄已保存");
    }
    renderRecords();
    showPage("record");
  }

  // ====== Records ======
  const recordList = $("#recordList");
  $("#refreshRecordBtn").addEventListener("click", renderRecords);

  $("#clearRecordBtn").addEventListener("click", () => {
    // simple guard: require password if set
    const pwd = localStorage.getItem(LS.pwd);
    if(pwd){
      const input = prompt("請輸入家長密碼：");
      if(input !== pwd){
        alertBox("密碼錯誤");
        return;
      }
    }
    localStorage.removeItem(LS.records);
    renderRecords();
    alertBox("已清除紀錄");
  });

  function renderRecords(){
    const list = JSON.parse(localStorage.getItem(LS.records) || "[]");
    if(!list.length){
      recordList.textContent = "目前還沒有紀錄完成一次練習就會顯示在這裡。";
      return;
    }
    recordList.innerHTML = "";
    list.slice(0, 50).forEach(r => {
      const el = document.createElement("div");
      el.className = "recordItem";
      const dt = new Date(r.ts);
      const dateStr = `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
      el.innerHTML = `
        <div class="line1">${dateStr}（${r.grade}｜${r.module}）</div>
        <div class="line2">用時：${r.time} 秒　題數：${r.total}　作答：${r.answered}　答對：${r.correct}　正確率：${r.acc}%</div>
      `;
      recordList.appendChild(el);
    });
  }

  // ====== Settings ======
  const qBtns = $$(".pillBtn");
  const currentQCount = $("#currentQCount");

  function renderQCount(){
    qBtns.forEach(b => b.classList.toggle("is-active", Number(b.dataset.qcount) === state.qCount));
    currentQCount.textContent = `目前題數：${state.qCount} 題`;
  }

  qBtns.forEach(b => {
    b.addEventListener("click", () => {
      state.qCount = Number(b.dataset.qcount);
      localStorage.setItem(LS.qcount, String(state.qCount));
      renderQCount();
      alertBox("已更新題數設定");
    });
  });

  $("#setPwdBtn").addEventListener("click", () => {
    const pwd = prompt("設定家長密碼（留空＝取消）：");
    if(!pwd) return;
    localStorage.setItem(LS.pwd, pwd);
    alertBox("已設定密碼");
  });

  $("#hintPwdBtn").addEventListener("click", () => {
    if(!localStorage.getItem(LS.pwd)){
      alertBox("尚未設定密碼");
      return;
    }
    alertBox("離線版暫不提供提示答案：請自行在瀏覽器清除 localStorage 重設。");
  });

  $("#parentBtn").addEventListener("click", () => {
    showPage("settings");
  });

  // ====== Utils ======
  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pad2(n){ return String(n).padStart(2,"0"); }

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function makeOptions(answer, count=3, min=0, max=20){
    const s = new Set([answer]);
    while(s.size < count+1){
      s.add(randInt(min, max));
    }
    return shuffle(Array.from(s));
  }

  function randNear(x){
    const delta = randInt(1, 12);
    return Math.random() < 0.5 ? x - delta : x + delta;
  }

  // ====== Boot ======
  renderGrade();
  renderModules();
  renderRecords();
  renderQCount();

  // Default to home
  showPage("home");

  // Debug popup once
  // alertBox("JS 已啟動 ✅");
})();
document.querySelectorAll('.gradeCard').forEach(btn=>{
  btn.addEventListener('click', () => {
    const grade = btn.dataset.grade;
    // 这里先用 console 确认有抓到
    console.log('选到年级:', grade);
  });
  
  document.addEventListener('click', (e) => {
  // 年级按钮
  const g = e.target.closest('.gradeCard');
  if (g) {
    const grade = g.dataset.grade;
    console.log('选到年级:', grade);
    // 这里写你的选择年级逻辑（例如 setGrade(grade); renderModules();）
    return;
  }

  // 五大模组按钮（你如果模组卡片 class 是 moduleCard 就用这个）
  const m = e.target.closest('.moduleCard');
  if (m) {
    const moduleId = m.dataset.module;
    console.log('点到模组:', moduleId);
    // 这里写进入练习逻辑（例如 startModule(moduleId)）
    return;
  }

  // 底部导航（如果你的导航按钮是 navBtn）
  const n = e.target.closest('[data-page]');
  if (n) {
    const page = n.dataset.page;
    console.log('切换页面:', page);
    // showPage(page);
    return;
  }
});
});
});