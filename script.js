document.addEventListener("DOMContentLoaded", () => {
  // ======================
  // 基本狀態
  // ======================
  const state = {
    grade: null,              // 1/2/3
    moduleId: null,           // 選到的模組
    quiz: {
      running: false,
      questions: [],
      i: 0,
      locked: false,
      startTimeMs: 0,
      totalAnswered: 0,
      correctAnswered: 0,
      wrongPool: [],
      mode: "main"
    }
  };

  // ======================
  // DOM
  // ======================
  const pages = {
    Home: document.getElementById("pageHome"),
    Practice: document.getElementById("pagePractice"),
    Records: document.getElementById("pageRecords"),
    Settings: document.getElementById("pageSettings"),
  };

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const brandSub = document.getElementById("brandSub");
  const gradeBadge = document.getElementById("gradeBadge");
  const moduleBadge = document.getElementById("moduleBadge");
  const moduleGrid = document.getElementById("moduleGrid");

  // Practice
  const practiceTitle = document.getElementById("practiceTitle");
  const practiceBadge = document.getElementById("practiceBadge");
  const moduleIntro = document.getElementById("moduleIntro");
  const moduleIntroText = document.getElementById("moduleIntroText");
  const btnStartModule = document.getElementById("btnStartModule");
  const btnBackHome = document.getElementById("btnBackHome");

  const quizArea = document.getElementById("quizArea");
  const quizMeta = document.getElementById("quizMeta");
  const quizStat = document.getElementById("quizStat");
  const questionEl = document.getElementById("question");
  const dotsBox = document.getElementById("dotsBox");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("next");
  const btnQuit = document.getElementById("btnQuit");
  const statusEl = document.getElementById("status");
  const reportEl = document.getElementById("report");

  // Records
  const historyListEl = document.getElementById("historyList");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  // Parent / Settings
  const btnParent = document.getElementById("btnParent");
  const btnParentOpen = document.getElementById("btnParentOpen");

  // Modal
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalActions = document.getElementById("modalActions");
  const modalClose = document.getElementById("modalClose");

  // ======================
  // 模組定義（五大模組）
  // ======================
  const MODULES = {
    1: [
      { id: "g1_numqty",  title: "數與數量（0～20）", sub: "數數、對應數量", icon: "🔢", type: "quiz_numqty" },
      { id: "g1_rec100",  title: "認識 100（不要求計算）", sub: "比大小、找數字", icon: "🧭", type: "quiz_rec100" },
      { id: "g1_place",   title: "十與一（位值）", sub: "十個一＝一個十", icon: "🧩", type: "quiz_place" },
      { id: "g1_make10",  title: "湊 10（補到 10）", sub: "為進位做準備", icon: "🧮", type: "quiz_make10" },
      { id: "g1_addsub20",title: "20 以內加減（先理解）", sub: "不比快、先正確", icon: "➕", type: "quiz_addsub20" },
    ],
    2: [
      { id: "g2_addsub", title: "加減（100 內）", sub: "含進退位", icon: "➕", type: "quiz_addsub_100" },
      { id: "g2_mul",    title: "乘法（九九）", sub: "0～9", icon: "✖️", type: "quiz_mul" },
      { id: "g2_div",    title: "除法（整除）", sub: "配合乘法", icon: "➗", type: "quiz_div" },
      { id: "g2_place",  title: "位值（千百十個）", sub: "讀寫數", icon: "🏷️", type: "quiz_place_1000" },
      { id: "g2_word",   title: "應用題（基礎）", sub: "關鍵字理解", icon: "📝", type: "info_only" },
    ],
    3: [
      { id: "g3_muldiv", title: "乘除（12 內）", sub: "更熟練", icon: "🧠", type: "quiz_muldiv_12" },
      { id: "g3_place",  title: "位值與大數", sub: "到萬位", icon: "📌", type: "quiz_place_10000" },
      { id: "g3_frac",   title: "分數初步", sub: "等分概念", icon: "🍰", type: "info_only" },
      { id: "g3_measure",title: "量與測量", sub: "時間、長度、重量", icon: "⏱️", type: "info_only" },
      { id: "g3_word",   title: "應用題（進階）", sub: "步驟與檢查", icon: "🧾", type: "info_only" },
    ]
  };

  // ======================
  // 小工具
  // ======================
  function $(id){ return document.getElementById(id); }

  function showPage(name){
    Object.keys(pages).forEach(k => pages[k].classList.remove("active"));
    pages[name].classList.add("active");

    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));

    if (name === "Records") renderHistory();
  }

  function showModal({ title="提示", body="", actions=[] }){
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modalActions.innerHTML = "";
    actions.forEach(a=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = a.className || "pill2";
      btn.textContent = a.text;
      btn.onclick = () => {
        if (a.onClick) a.onClick();
      };
      modalActions.appendChild(btn);
    });
    modal.classList.add("show");
    modal.setAttribute("aria-hidden","false");
  }

  function closeModal(){
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
  }

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e)=>{
    if (e.target === modal) closeModal();
  });

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function pad2(n){ return String(n).padStart(2,"0"); }
  function formatDate(ts){
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  // ======================
  // 家長模式（密碼 + 復原碼）
  // ======================
  const LS_PARENT = "parent_config_v1"; // { passHash, recovery }
  async function sha256(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function getParentConfig(){
    try{
      return JSON.parse(localStorage.getItem(LS_PARENT) || "null");
    }catch{ return null; }
  }

  function hasParentPassword(){
    const cfg = getParentConfig();
    return !!(cfg && cfg.passHash);
  }

  async function ensureParentVerified(){
    // 沒設定 => 引導設定
    if (!hasParentPassword()){
      return await openParentSetup();
    }
    // 已設定 => 驗證密碼
    return await openParentVerify();
  }

  async function openParentSetup(){
    return new Promise(resolve=>{
      showModal({
        title: "設定家長密碼",
        body: `
          <div>首次使用請設定家長密碼（用於清除記錄與家長設定）。</div>
          <div style="margin-top:10px;font-size:13px;opacity:.85;">
            同時請設定「復原碼」（忘記密碼時用）。
          </div>
          <div style="margin-top:12px;">
            <div style="font-weight:900;margin-bottom:6px;">家長密碼</div>
            <input id="m_pass" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
            <div style="height:10px;"></div>
            <div style="font-weight:900;margin-bottom:6px;">復原碼（請記好）</div>
            <input id="m_reco" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
          </div>
        `,
        actions: [
          { text:"取消", className:"pill2", onClick: ()=>{ closeModal(); resolve(false); } },
          { text:"儲存", className:"primary", onClick: async ()=>{
              const pass = (document.getElementById("m_pass")?.value || "").trim();
              const reco = (document.getElementById("m_reco")?.value || "").trim();
              if (pass.length < 4 || reco.length < 4){
                showModal({
                  title:"格式不正確",
                  body:"密碼與復原碼建議至少 4 碼。",
                  actions:[{text:"知道了", className:"primary", onClick: closeModal}]
                });
                return;
              }
              const passHash = await sha256(pass);
              localStorage.setItem(LS_PARENT, JSON.stringify({ passHash, recovery: reco }));
              closeModal();
              resolve(true);
            }
          }
        ]
      });
    });
  }

  async function openParentVerify(){
    return new Promise(resolve=>{
      showModal({
        title: "家長驗證",
        body: `
          <div>請輸入家長密碼：</div>
          <div style="margin-top:12px;">
            <input id="m_verify" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
          </div>
          <div style="margin-top:10px;font-size:13px;">
            <button id="m_forget" type="button" style="border:0;background:transparent;color:#1e88e5;font-weight:900;padding:0;">忘記密碼？</button>
          </div>
        `,
        actions: [
          { text:"取消", className:"pill2", onClick: ()=>{ closeModal(); resolve(false); } },
          { text:"確認", className:"primary", onClick: async ()=>{
              const cfg = getParentConfig();
              const pass = (document.getElementById("m_verify")?.value || "").trim();
              const h = await sha256(pass);
              if (cfg && cfg.passHash === h){
                closeModal();
                resolve(true);
              } else {
                showModal({
                  title:"密碼錯誤",
                  body:"密碼不正確，請再試一次。",
                  actions:[{text:"再試一次", className:"primary", onClick: closeModal}]
                });
                resolve(false);
              }
            }
          }
        ]
      });

      const forgetBtn = document.getElementById("m_forget");
      if (forgetBtn){
        forgetBtn.addEventListener("click", ()=>{
          closeModal();
          openParentRecover().then(resolve);
        });
      }
    });
  }

  async function openParentRecover(){
    return new Promise(resolve=>{
      showModal({
        title:"忘記密碼",
        body: `
          <div>請輸入你先前設定的「復原碼」來重設家長密碼。</div>
          <div style="margin-top:12px;">
            <input id="m_recover_input" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
          </div>
        `,
        actions: [
          { text:"取消", className:"pill2", onClick: ()=>{ closeModal(); resolve(false);} },
          { text:"下一步", className:"primary", onClick: async ()=>{
              const cfg = getParentConfig();
              const inReco = (document.getElementById("m_recover_input")?.value || "").trim();
              if (!cfg || !cfg.recovery || inReco !== cfg.recovery){
                showModal({
                  title:"復原碼錯誤",
                  body:"復原碼不正確，無法重設。",
                  actions:[{text:"知道了", className:"primary", onClick: closeModal}]
                });
                resolve(false);
                return;
              }
              closeModal();
              // 重設密碼
              showModal({
                title:"重設家長密碼",
                body: `
                  <div>請輸入新家長密碼：</div>
                  <div style="margin-top:12px;">
                    <input id="m_newpass" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
                  </div>
                `,
                actions: [
                  { text:"取消", className:"pill2", onClick: ()=>{ closeModal(); resolve(false);} },
                  { text:"儲存", className:"primary", onClick: async ()=>{
                      const np = (document.getElementById("m_newpass")?.value || "").trim();
                      if (np.length < 4){
                        showModal({
                          title:"格式不正確",
                          body:"密碼建議至少 4 碼。",
                          actions:[{text:"知道了", className:"primary", onClick: closeModal}]
                        });
                        resolve(false);
                        return;
                      }
                      const passHash = await sha256(np);
                      localStorage.setItem(LS_PARENT, JSON.stringify({ passHash, recovery: cfg.recovery }));
                      closeModal();
                      resolve(true);
                    }
                  }
                ]
              });
            }
          }
        ]
      });
    });
  }

  async function openParentPanel(){
    const ok = await ensureParentVerified();
    if (!ok) return;

    const cfg = getParentConfig();
    showModal({
      title:"家長設定",
      body: `
        <div style="font-weight:1000;">你已進入家長設定。</div>
        <div style="margin-top:10px;opacity:.85;font-size:14px;">
          你可以變更密碼，或更新復原碼（請記好）。
        </div>
        <div style="margin-top:12px;">
          <div style="font-weight:900;margin-bottom:6px;">新密碼（不填則不改）</div>
          <input id="p_new" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
          <div style="height:10px;"></div>
          <div style="font-weight:900;margin-bottom:6px;">新復原碼（不填則不改）</div>
          <input id="p_reco" type="password" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;border:1px solid #ddd;font-size:16px;">
        </div>
      `,
      actions: [
        { text:"關閉", className:"pill2", onClick: closeModal },
        { text:"儲存變更", className:"primary", onClick: async ()=>{
            const np = (document.getElementById("p_new")?.value || "").trim();
            const nr = (document.getElementById("p_reco")?.value || "").trim();
            const next = { passHash: cfg?.passHash || "", recovery: cfg?.recovery || "" };

            if (np){
              if (np.length < 4){
                showModal({ title:"格式不正確", body:"新密碼至少 4 碼。", actions:[{text:"知道了", className:"primary", onClick: closeModal}] });
                return;
              }
              next.passHash = await sha256(np);
            }
            if (nr){
              if (nr.length < 4){
                showModal({ title:"格式不正確", body:"新復原碼至少 4 碼。", actions:[{text:"知道了", className:"primary", onClick: closeModal}] });
                return;
              }
              next.recovery = nr;
            }

            localStorage.setItem(LS_PARENT, JSON.stringify(next));
            closeModal();
            showModal({ title:"已儲存", body:"家長設定已更新。", actions:[{text:"知道了", className:"primary", onClick: closeModal}] });
          }
        }
      ]
    });
  }

  btnParent.addEventListener("click", openParentPanel);
  btnParentOpen.addEventListener("click", openParentPanel);

  // ======================
  // 年級選擇 & 模組渲染
  // ======================
  function setGrade(g){
    state.grade = g;
    gradeBadge.textContent = `已選：小${g}`;
    moduleBadge.textContent = `小${g} 模組`;
    brandSub.textContent = `已選小${g}，請選模組開始練習`;

    renderModules();
  }

  function renderModules(){
    const g = state.grade;
    moduleGrid.innerHTML = "";

    if (!g){
      moduleBadge.textContent = "請先選年級";
      return;
    }

    const list = MODULES[g] || [];
    list.forEach(m=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "module-btn";
      btn.dataset.mid = m.id;

      btn.innerHTML = `
        <div class="m-ico">${m.icon}</div>
        <div>
          <div class="m-title">${m.title}</div>
          <div class="m-sub">${m.sub}</div>
        </div>
      `;

      btn.addEventListener("click", ()=>{
        selectModule(m.id);
      });

      moduleGrid.appendChild(btn);
    });
  }

  document.querySelectorAll(".grade-card").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const g = Number(btn.dataset.grade || 1);
      setGrade(g);
    });
  });

  // ======================
  // 模組選擇 → 進入 Practice 頁
  // ======================
  function getModuleById(grade, id){
    return (MODULES[grade] || []).find(x=>x.id === id) || null;
  }

  function selectModule(mid){
    if (!state.grade){
      showModal({
        title:"請先選年級",
        body:"先到上方選擇年級，再選模組。",
        actions:[{text:"知道了", className:"primary", onClick: closeModal }]
      });
      return;
    }

    state.moduleId = mid;
    const m = getModuleById(state.grade, mid);

    // 進 Practice，顯示模組介紹（不要跳黑底提示）
    showPage("Practice");
    practiceTitle.textContent = "練習";
    practiceBadge.textContent = `小${state.grade}`;
    moduleIntro.style.display = "block";
    quizArea.style.display = "none";

    moduleIntroText.innerHTML = `
      <div style="font-size:18px;font-weight:1000;color:#1e88e5;">小${state.grade}｜${m?.title || "模組"}</div>
      <div style="margin-top:8px;">${m?.sub || ""}</div>
      <div style="margin-top:10px;opacity:.9;">
        這是練習模式（不比快，先理解、先做對）。按「開始」進入題目。
      </div>
    `;

    btnStartModule.disabled = false;
    btnStartModule.onclick = ()=> startModule(m);
  }

  btnBackHome.addEventListener("click", ()=> showPage("Home"));

  // ======================
  // 題目生成（五大模組：小一可用）
  // ======================
  const SETTINGS = {
    batchSize: 20,
    choiceCount: 4
  };

  function makeChoices(ans){
    const a = Number(ans);
    const set = new Set([String(a)]);
    while(set.size < SETTINGS.choiceCount){
      const delta = randInt(1, Math.max(3, Math.floor(a*0.2) || 3));
      let fake = Math.random()<0.5 ? a+delta : a-delta;
      if (fake < 0) fake = a+delta;
      set.add(String(fake));
    }
    const arr = shuffle([...set]);
    return { arr, correct: arr.indexOf(String(a)) };
  }

  function makeDots(n){
    // 用符號避免版權：● ○
    const dots = Array.from({length:n}, ()=> "●").join(" ");
    return dots || "（0）";
  }

  function q_numqty(){
    // 0~20，看點點選數字
    const n = randInt(0, 20);
    const c = makeChoices(n);
    return {
      q: "看點點有幾個？",
      dots: n,
      a: c.arr,
      correct: c.correct,
      meta: { type:"numqty", ans:n }
    };
  }

  function q_rec100(){
    // 認識 100：比大小（不做計算）
    const a = randInt(0, 100);
    const b = randInt(0, 100);
    const correct = a > b ? ">" : a < b ? "<" : "=";
    const options = shuffle(["<", ">", "="]);
    return {
      q: `${a}  □  ${b}（填入符號）`,
      a: options,
      correct: options.indexOf(correct),
      meta: { type:"rec100", ans:correct }
    };
  }

  function q_place(){
    // 十與一：34 = ? 個十 ? 個一
    const n = randInt(10, 99);
    const tens = Math.floor(n/10);
    const ones = n%10;
    const askTens = Math.random() < 0.5;
    const ans = askTens ? tens : ones;
    const c = makeChoices(ans);
    return {
      q: `${n} 由 ${tens} 個十與 ${ones} 個一組成。請選出「${askTens ? "十" : "一"}」的數量`,
      a: c.arr,
      correct: c.correct,
      meta: { type:"place", ans }
    };
  }

  function q_make10(){
    // 湊 10：? + a = 10
    const a = randInt(0, 10);
    const ans = 10 - a;
    const c = makeChoices(ans);
    return {
      q: `□ + ${a} = 10，□ 是多少？`,
      a: c.arr,
      correct: c.correct,
      meta: { type:"make10", ans }
    };
  }

  function q_addsub20(){
    // 20以內加減（先理解）：不進位、不退位，避免挫折
    const isAdd = Math.random() < 0.5;
    if (isAdd){
      const a = randInt(0, 20);
      const b = randInt(0, 20-a); // 保證 <=20
      const ans = a + b;
      const c = makeChoices(ans);
      return { q: `${a} + ${b} = ?`, a: c.arr, correct: c.correct, meta:{ type:"addsub20", ans } };
    }else{
      const a = randInt(0, 20);
      const b = randInt(0, a); // 不為負
      const ans = a - b;
      const c = makeChoices(ans);
      return { q: `${a} - ${b} = ?`, a: c.arr, correct: c.correct, meta:{ type:"addsub20", ans } };
    }
  }

  function buildBatchForModule(module){
    const qs = [];
    const type = module.type;

    for(let i=0;i<SETTINGS.batchSize;i++){
      if (type === "quiz_numqty") qs.push(q_numqty());
      else if (type === "quiz_rec100") qs.push(q_rec100());
      else if (type === "quiz_place") qs.push(q_place());
      else if (type === "quiz_make10") qs.push(q_make10());
      else if (type === "quiz_addsub20") qs.push(q_addsub20());
      else qs.push(q_addsub20());
    }
    return qs;
  }

  // ======================
  // Quiz 流程
  // ======================
  function startModule(module){
    if (!module){
      showModal({ title:"錯誤", body:"找不到模組資料。", actions:[{text:"關閉", className:"primary", onClick: closeModal}] });
      return;
    }

    // info_only 先做提示（你要後續再擴充）
    if (module.type === "info_only"){
      showModal({
        title:"此模組準備中",
        body:"這個模組目前先保留位置，下一步我們再逐步加題型。",
        actions:[{text:"知道了", className:"primary", onClick: closeModal}]
      });
      return;
    }

    // 初始化 quiz
    state.quiz.running = true;
    state.quiz.questions = buildBatchForModule(module);
    state.quiz.i = 0;
    state.quiz.locked = false;
    state.quiz.startTimeMs = Date.now();
    state.quiz.totalAnswered = 0;
    state.quiz.correctAnswered = 0;
    state.quiz.wrongPool = [];
    state.quiz.mode = "main";

    moduleIntro.style.display = "none";
    quizArea.style.display = "block";
    reportEl.style.display = "none";
    reportEl.textContent = "";
    statusEl.style.color = "";
    statusEl.textContent = "請選擇答案";
    practiceTitle.textContent = `小${state.grade}｜${module.title}`;
    practiceBadge.textContent = "進行中";

    quizMeta.textContent = `小${state.grade}｜${module.title}`;
    renderQuestion();
  }

  function renderQuestion(){
    const q = state.quiz.questions[state.quiz.i];
    state.quiz.locked = false;
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";

    // dots 題型顯示
    if (q.meta?.type === "numqty"){
      dotsBox.style.display = "block";
      dotsBox.textContent = makeDots(q.dots);
    } else {
      dotsBox.style.display = "none";
      dotsBox.textContent = "";
    }

    questionEl.textContent = `第 ${state.quiz.i+1} 題：${q.q}`;
    quizStat.textContent = `${state.quiz.i+1} / ${state.quiz.questions.length}`;

    q.a.forEach((t, idx)=>{
      const b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = t;
      b.onclick = ()=> choose(idx);
      choicesEl.appendChild(b);
    });
  }

  function choose(idx){
    if (state.quiz.locked) return;
    state.quiz.locked = true;

    state.quiz.totalAnswered++;
    const q = state.quiz.questions[state.quiz.i];
    const all = Array.from(document.querySelectorAll(".choice"));

    if (all[q.correct]) all[q.correct].classList.add("correct");
    const ok = idx === q.correct;

    if (ok){
      state.quiz.correctAnswered++;
      statusEl.textContent = "答對了 ✅";
      nextBtn.disabled = true;
      setTimeout(()=> nextQuestion(), 420);
    }else{
      if (all[idx]) all[idx].classList.add("wrong");
      statusEl.textContent = "答錯了 ❌（請點下一題）";
      nextBtn.disabled = false;
      // 收集錯題（用 q.q 當 key）
      const key = q.q;
      if (!state.quiz.wrongPool.some(it => it.q.q === key)) state.quiz.wrongPool.push({ q });
    }
  }

  function nextQuestion(){
    if (state.quiz.i < state.quiz.questions.length - 1){
      state.quiz.i++;
      renderQuestion();
    } else {
      finishRound();
    }
  }

  function finishRound(){
    // 有錯題 → 錯題重練
    if (state.quiz.wrongPool.length > 0){
      const wrongQs = state.quiz.wrongPool.map(it=>it.q);
      state.quiz.wrongPool = [];
      state.quiz.mode = "wrong";

      // 重做選項（同答案）
      state.quiz.questions = wrongQs.map(oldQ=>{
        const ans = oldQ.meta.ans;
        const c = makeChoices(ans);
        return { ...oldQ, a: c.arr, correct: c.correct };
      });

      state.quiz.i = 0;
      statusEl.textContent = "還有錯題，自動進入錯題重練…";
      renderQuestion();
      return;
    }

    finishSuccess();
  }

  function showConfetti() {
    const box = document.getElementById("confetti");
    if (!box) return;
    box.innerHTML = "";
    const emojis = ["🎉","🎊"];
    const cx = window.innerWidth/2;
    const sy = window.innerHeight*0.35;

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
        {duration:2600,easing:"ease-out"}
      );
      setTimeout(()=>s.remove(),2800);
    }
  }

  function finishSuccess(){
    statusEl.textContent = "🎉 已完成學習目標（全對）！";
    statusEl.style.color = "#2e7d32";
    showConfetti();

    const durationSec = Math.floor((Date.now()-state.quiz.startTimeMs)/1000);
    const percent = state.quiz.totalAnswered===0 ? 0 : Math.round((state.quiz.correctAnswered/state.quiz.totalAnswered)*100);

    const module = getModuleById(state.grade, state.moduleId);
    const reportText = `學習報告：用時 ${durationSec} 秒｜作答 ${state.quiz.totalAnswered} 題｜答對 ${state.quiz.correctAnswered} 題｜正確率 ${percent}%`;

    reportEl.style.display = "block";
    reportEl.textContent = reportText;

    // 存記錄（進 Records 頁看）
    const key = `report_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({
      time: Date.now(),
      durationSec,
      totalAnswered: state.quiz.totalAnswered,
      correctAnswered: state.quiz.correctAnswered,
      percent,
      grade: state.grade,
      moduleId: state.moduleId,
      moduleTitle: module?.title || "模組"
    }));

    practiceBadge.textContent = "已完成";

    setTimeout(()=>{
      // 結束後停留在 Practice，讓你可回首頁/再開始
      moduleIntro.style.display = "block";
      quizArea.style.display = "none";
      btnStartModule.disabled = false;
      moduleIntroText.innerHTML = `
        <div style="font-size:18px;font-weight:1000;color:#1e88e5;">完成：小${state.grade}｜${module?.title || "模組"}</div>
        <div style="margin-top:8px;">${reportText}</div>
        <div style="margin-top:10px;opacity:.9;">你可以按「開始」再練一次，或回首頁選其他模組。</div>
      `;
      // 重新開始同模組
      btnStartModule.onclick = ()=> startModule(module);
    }, 1200);
  }

  nextBtn.addEventListener("click", nextQuestion);
  btnQuit.addEventListener("click", ()=>{
    // 中途退出不寫記錄
    state.quiz.running = false;
    showPage("Home");
  });

  // ======================
  // Records：渲染/清除
  // ======================
  function getAllReports(){
    const items = [];
    for (let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      if (key && key.startsWith("report_")){
        try{
          const obj = JSON.parse(localStorage.getItem(key));
          items.push(obj);
        }catch{}
      }
    }
    items.sort((a,b)=>(b.time||0)-(a.time||0));
    return items;
  }

  function renderHistory(){
    if (!historyListEl) return;

    const list = getAllReports().slice(0, 20);
    historyListEl.innerHTML = "";

    if (list.length === 0){
      historyListEl.innerHTML = `<div class="item"><b>目前還沒有記錄。</b><div>完成任一模組練習後會出現在這裡。</div></div>`;
      return;
    }

    list.forEach(r=>{
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <b>${formatDate(r.time)}（小${r.grade}｜${r.moduleTitle || r.moduleId}）</b>
        <div>用時：${r.durationSec} 秒</div>
        <div>作答：${r.totalAnswered} 題｜答對：${r.correctAnswered} 題｜正確率：${r.percent}%</div>
      `;
      historyListEl.appendChild(div);
    });
  }

  refreshHistoryBtn.addEventListener("click", renderHistory);

  clearHistoryBtn.addEventListener("click", async ()=>{
    const ok = await ensureParentVerified();
    if (!ok) return;

    // 清除
    const keys = [];
    for (let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      if (key && key.startsWith("report_")) keys.push(key);
    }
    keys.forEach(k=>localStorage.removeItem(k));
    renderHistory();
    showModal({ title:"已清除", body:"學習記錄已清除 ✅", actions:[{text:"知道了", className:"primary", onClick: closeModal}] });
  });

  // ======================
  // 底部導覽
  // ======================
  tabs.forEach(t=>{
    t.addEventListener("click", ()=>{
      const name = t.dataset.tab;
      showPage(name);
    });
  });

  // ======================
  // 初始化
  // ======================
  renderModules();
  renderHistory();
  showPage("Home");

  // 允許：從首頁選完模組後直接進 Practice
  // 額外：如果你想一進來就停在 Home，這裡已是 Home。
});