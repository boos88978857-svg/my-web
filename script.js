(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ---------- State ----------
  const state = {
    grade: null,            // "P1" | "P2" | "P3"
    moduleId: null,         // string
    qCount: 20,
    qIndex: 0,
    answered: 0,
    correct: 0,
    currentAnswer: null,
    currentOptions: [],
  };

  // ---------- Data ----------
  const GRADE_LABEL = {
    P1: "小1",
    P2: "小2",
    P3: "小3",
  };

  // 这里就是你的“五大模組”内容来源
  const MODULES_BY_GRADE = {
    P1: [
      { id:"p1_count", icon:"🔢", title:"數對應數量", range:"(0～20)", desc:"數數、對應數量", enabled:true },
      { id:"p1_100",   icon:"🧭", title:"認識 100",    range:"(不要求計算)", desc:"比大小、找數字", enabled:true },
      { id:"p1_ten1",  icon:"🧩", title:"十與一",      range:"(位值)", desc:"十個＝一個十", enabled:true },
      { id:"p1_make10",icon:"🧮", title:"湊 10",       range:"(補到 10)", desc:"為進位做準備", enabled:true },
      { id:"p1_20",    icon:"➕", title:"20 以內加減", range:"(先理解)", desc:"不比快、先正確", enabled:true },
    ],
    P2: [
      { id:"p2_addsub", icon:"➕", title:"加減", range:"(100 內)", desc:"含進退位", enabled:true },
      { id:"p2_mul99",  icon:"✖️", title:"乘法", range:"(九九)", desc:"0～9", enabled:true },
      { id:"p2_div",    icon:"➗", title:"除法", range:"(整除)", desc:"配合乘法", enabled:true },
      { id:"p2_place",  icon:"🏷️", title:"位值", range:"(千百十個)", desc:"讀寫數", enabled:true },
      { id:"p2_word",   icon:"📝", title:"應用題", range:"(基礎)", desc:"關鍵字理解", enabled:true },
    ],
    P3: [
      { id:"p3_div12",  icon:"🧠", title:"乘除", range:"(12 內)", desc:"更熟練", enabled:true },
      { id:"p3_place",  icon:"📌", title:"位值與大數", range:"(到萬位)", desc:"讀寫比較", enabled:true },
      { id:"p3_frac",   icon:"🍰", title:"分數初步", range:"(等分)", desc:"概念建立", enabled:true },
      { id:"p3_meas",   icon:"⏱️", title:"量與測量", range:"(時間長度重量)", desc:"單位認識", enabled:true },
      { id:"p3_word2",  icon:"🧾", title:"應用題", range:"(進階)", desc:"步驟與檢查", enabled:true },
    ],
  };

  // ---------- Page / Nav ----------
  function showPage(pageName){
    const pages = ["home","practice","records","settings"];
    pages.forEach(p => {
      const el = $("#page-" + p);
      if (!el) return;
      el.hidden = (p !== pageName);
    });

    $$(".navBtn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === pageName);
    });
  }

  // ---------- Grade ----------
  function setGrade(grade){
    state.grade = grade;
    state.moduleId = null;

    $("#gradeBadge").textContent = `已選年級：${GRADE_LABEL[grade]}`;
    $("#moduleBadge").textContent = `${GRADE_LABEL[grade]} 模組`;

    // active style
    $$(".gradeCard").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.grade === grade);
    });

    renderModules();
  }

  // ---------- Modules ----------
  function renderModules(){
    const grid = $("#moduleGrid");
    grid.innerHTML = "";

    if (!state.grade){
      $("#moduleBadge").textContent = "請先選年級";
      return;
    }

    const list = MODULES_BY_GRADE[state.grade] || [];
    list.forEach(m => {
      const btn = document.createElement("button");
      btn.className = "moduleCard";
      btn.type = "button";
      btn.dataset.moduleId = m.id;
      if (!m.enabled) btn.disabled = true;

      btn.innerHTML = `
        <div class="iconBubble">${m.icon}</div>
        <div class="moduleText">
          <div class="moduleTitle">${m.title}</div>
          <div class="moduleRange">${m.range || ""}</div>
          <div class="moduleDesc">${m.desc || ""}</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        if (!state.grade) return;
        if (btn.disabled) return;
        startPractice(m);
      });

      grid.appendChild(btn);
    });
  }

  // ---------- Practice ----------
  function startPractice(module){
    state.moduleId = module.id;
    state.qIndex = 0;
    state.answered = 0;
    state.correct = 0;

    $("#practiceTitle").textContent = `${GRADE_LABEL[state.grade]}｜${module.title}`;
    $("#practiceBadge").textContent = module.range || "—";

    buildQuestion();
    showPage("practice");
  }

  function buildQuestion(){
    // 这里做“数对应数量”类题目：用点点显示，不把答案写在题目上
    const isCountModule = (state.moduleId === "p1_count");
    let answer;

    if (isCountModule){
      answer = randInt(1, 20);
      $("#questionPrompt").textContent = "共有幾個 ● ？請選正確數字。";
      renderDots(answer);
    } else {
      // 其他模块给一个简单占位题型（不影响 UI）
      answer = randInt(0, 20);
      $("#questionPrompt").textContent = "請選正確答案。";
      renderDots(null);
    }

    state.currentAnswer = answer;
    state.currentOptions = makeOptions(answer, 4, 0, 20);

    renderOptions();
    updatePracticeMeta();
  }

  function renderDots(n){
    const wrap = $("#dots");
    wrap.innerHTML = "";
    if (typeof n !== "number") return;
    for (let i=0;i<n;i++){
      const d = document.createElement("span");
      d.className = "dot";
      wrap.appendChild(d);
    }
  }

  function renderOptions(){
    const wrap = $("#options");
    wrap.innerHTML = "";
    state.currentOptions.forEach(val => {
      const b = document.createElement("button");
      b.className = "optionBtn";
      b.type = "button";
      b.textContent = String(val);
      b.addEventListener("click", () => onChoose(val, b));
      wrap.appendChild(b);
    });
  }

  function onChoose(val, btnEl){
    // 防止重复答题
    if ($$(".optionBtn").some(b => b.disabled)) return;

    state.answered += 1;
    if (val === state.currentAnswer){
      state.correct += 1;
      btnEl.classList.add("correct");
    } else {
      btnEl.classList.add("wrong");
      // 标出正确
      $$(".optionBtn").forEach(b => {
        if (Number(b.textContent) === state.currentAnswer) b.classList.add("correct");
      });
    }

    // disable all
    $$(".optionBtn").forEach(b => b.disabled = true);
    updatePracticeMeta();
  }

  function updatePracticeMeta(){
    $("#qProgress").textContent = `第 ${state.qIndex + 1} 題 / ${state.qCount} 題`;
    $("#qScore").textContent = `正確 ${state.correct} / 作答 ${state.answered}`;
  }

  function nextQuestion(){
    if (state.qIndex + 1 >= state.qCount){
      // 记录到 records
      saveRecord();
      alert("本次練習完成 ✅ 已寫入學習紀錄");
      showPage("records");
      renderRecords();
      return;
    }
    state.qIndex += 1;
    buildQuestion();
  }

  function exitPractice(){
    saveRecord();
    showPage("home");
  }

  // ---------- Records ----------
  function saveRecord(){
    if (!state.grade || !state.moduleId) return;

    const rec = {
      t: new Date().toISOString(),
      grade: state.grade,
      moduleId: state.moduleId,
      qCount: state.qCount,
      answered: state.answered,
      correct: state.correct
    };

    const key = "records_v1";
    const old = JSON.parse(localStorage.getItem(key) || "[]");
    old.unshift(rec);
    localStorage.setItem(key, JSON.stringify(old.slice(0, 50)));
  }

  function renderRecords(){
    const key = "records_v1";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    const wrap = $("#recordList");

    if (!list.length){
      wrap.textContent = "目前還沒有紀錄，完成一次練習就會顯示在這裡。";
      $("#recordBadge").textContent = "—";
      return;
    }

    $("#recordBadge").textContent = `${list.length} 筆`;
    wrap.innerHTML = list.map(r => {
      const dt = new Date(r.t);
      const grade = GRADE_LABEL[r.grade] || r.grade;
      const acc = (r.answered ? Math.round((r.correct / r.answered) * 100) : 0);
      return `
        <div class="recordItem">
          <div><b>${dt.toLocaleString()}</b>（${grade}）</div>
          <div>題數：${r.qCount}｜作答：${r.answered}｜答對：${r.correct}｜正確率：${acc}%</div>
        </div>
      `;
    }).join("");
  }

  function clearRecords(){
    const pwd = localStorage.getItem("parent_pwd_v1");
    if (pwd){
      const input = prompt("請輸入家長密碼以清除紀錄：");
      if (input !== pwd){
        alert("密碼錯誤");
        return;
      }
    }
    localStorage.removeItem("records_v1");
    renderRecords();
  }

  // ---------- Settings ----------
  function setQCount(n){
    state.qCount = n;
    $("#qCountHint").textContent = `目前題數：${n} 題`;
    $$("#qCountRow .chip").forEach(c => {
      c.classList.toggle("active", Number(c.dataset.count) === n);
    });
  }

  function changePassword(){
    const pwd = prompt("設定家長密碼（留空=取消）：");
    if (!pwd) return;
    localStorage.setItem("parent_pwd_v1", pwd);
    alert("已設定家長密碼 ✅");
  }

  function forgotPassword(){
    alert("離線版本無法找回密碼。你可以在 localStorage 清除 parent_pwd_v1 來重設。");
  }

  // ---------- Utils ----------
  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeOptions(answer, count=4, min=0, max=20){
    const s = new Set([answer]);
    while (s.size < count){
      s.add(randInt(min, max));
    }
    return shuffle(Array.from(s));
  }

  function shuffle(arr){
    for (let i=arr.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- Bind events ----------
  function bind(){
    // nav
    $$(".navBtn").forEach(btn => {
      btn.addEventListener("click", () => showPage(btn.dataset.page));
    });

    // grade
    $$(".gradeCard").forEach(btn => {
      btn.addEventListener("click", () => setGrade(btn.dataset.grade));
    });

    // practice buttons
    $("#nextBtn").addEventListener("click", nextQuestion);
    $("#exitBtn").addEventListener("click", exitPractice);

    // records
    $("#refreshRecordBtn").addEventListener("click", renderRecords);
    $("#clearRecordBtn").addEventListener("click", clearRecords);

    // settings
    $("#changePwdBtn").addEventListener("click", changePassword);
    $("#forgotPwdBtn").addEventListener("click", forgotPassword);

    $$("#qCountRow .chip").forEach(chip => {
      chip.addEventListener("click", () => setQCount(Number(chip.dataset.count)));
    });

    // parent
    $("#parentBtn").addEventListener("click", () => showPage("settings"));
  }

  // ---------- Boot ----------
  bind();
  renderModules();
  renderRecords();
  setQCount(20);
  showPage("home");
})();