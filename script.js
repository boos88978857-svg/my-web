(() => {
  // ====== State ======
  const state = {
    page: 'home',
    grade: null,          // P1 / P2 / P3
    moduleId: null,
    qCount: 20,
    // practice runtime
    idx: 0,
    correct: 0,
    answered: 0,
    currentAnswer: null,
    locked: false,
  };

  // ====== DOM helpers ======
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function showPage(page) {
    state.page = page;
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${page}`).classList.add('active');

    $$('.navBtn').forEach(b => b.classList.toggle('active', b.dataset.page === page));

    // 每次进页面刷新需要的东西
    if (page === 'records') renderRecords();
    if (page === 'settings') renderQCount();
  }

  // ====== Data ======
  // 模组标题规则：主标题 + (范围/说明) 要显示在下一行更小
  const MODULES = {
    P1: [
      { id:'p1-qty', icon:'🔢', title:'數對應數量', range:'(0～20)', desc:'數數、對應數量', enabled:true },
      { id:'p1-100', icon:'🧭', title:'認識 100', range:'(不要求計算)', desc:'比大小、找數字', enabled:true },
      { id:'p1-place', icon:'🧩', title:'十與一', range:'(位值)', desc:'十個＝一個十', enabled:true },
      { id:'p1-ten', icon:'🧮', title:'湊 10', range:'(補到 10)', desc:'為進位做準備', enabled:true },
      { id:'p1-add', icon:'➕', title:'20 以內加減', range:'(先理解)', desc:'不比快、先正確', enabled:true },
    ],
    P2: [
      { id:'p2-add', icon:'➕', title:'加減', range:'(100 內)', desc:'含進退位', enabled:true },
      { id:'p2-mul', icon:'✖️', title:'乘法', range:'(九九)', desc:'0～9', enabled:true },
      { id:'p2-div', icon:'➗', title:'除法', range:'(整除)', desc:'配合乘法', enabled:true },
      { id:'p2-place', icon:'🏷️', title:'位值', range:'(千百十個)', desc:'讀寫數', enabled:true },
      { id:'p2-app', icon:'📝', title:'應用題', range:'(基礎)', desc:'關鍵字理解', enabled:true },
    ],
    P3: [
      { id:'p3-mul', icon:'🧠', title:'乘除', range:'(12 內)', desc:'更熟練', enabled:true },
      { id:'p3-big', icon:'📌', title:'位值與大數', range:'(到萬位)', desc:'讀寫比較', enabled:true },
      { id:'p3-frac', icon:'🍰', title:'分數初步', range:'(等分)', desc:'概念建立', enabled:true },
      { id:'p3-measure', icon:'⏱️', title:'量與測量', range:'(時間長度重量)', desc:'單位認識', enabled:true },
      { id:'p3-app', icon:'🧾', title:'應用題', range:'(進階)', desc:'步驟與檢查', enabled:true },
    ]
  };

  // ====== Render grade + modules ======
  function renderGradeUI() {
    const badge = $('#gradeBadge');
    if (!state.grade) {
      badge.textContent = '未選年級';
      $('#moduleBadge').textContent = '請先選年級';
      $('#gradeNote').style.display = '';
      $$('.gradeCard').forEach(b => b.classList.remove('selected'));
      $('#moduleGrid').innerHTML = '';
      return;
    }

    const gradeText = state.grade === 'P1' ? '小1' : state.grade === 'P2' ? '小2' : '小3';
    badge.textContent = `已選年級：${gradeText}`;
    $('#moduleBadge').textContent = `${gradeText} 模組`;

    $$('.gradeCard').forEach(b => b.classList.toggle('selected', b.dataset.grade === state.grade));
  }

  function renderModules() {
    renderGradeUI();

    if (!state.grade) return;

    const list = MODULES[state.grade] || [];
    const grid = $('#moduleGrid');
    grid.innerHTML = list.map(m => {
      const dis = m.enabled ? '' : 'disabled';
      return `
        <button class="moduleCard" data-module="${m.id}" ${dis} type="button">
          <div class="iconBubble">${m.icon}</div>
          <div class="moduleText">
            <div class="moduleTitle">${m.title}</div>
            <div class="moduleRange">${m.range}</div>
            <div class="moduleDesc">${m.desc}</div>
          </div>
        </button>
      `;
    }).join('');

    $('#gradeNote').style.display = '';
  }

  // ====== Practice engine ======
  function startPractice(moduleId) {
    state.moduleId = moduleId;
    state.idx = 0;
    state.correct = 0;
    state.answered = 0;
    state.locked = false;

    // 标题
    const gradeText = state.grade === 'P1' ? '小1' : state.grade === 'P2' ? '小2' : '小3';
    const mod = (MODULES[state.grade] || []).find(x => x.id === moduleId);
    const modTitle = mod ? mod.title : '模組';
    const modRange = mod ? mod.range : '( )';

    $('#practiceHeader').textContent = `${gradeText}｜${modTitle}`;
    $('#practiceRange').textContent = modRange;

    showPage('practice');
    nextQuestion(true);
  }

  // 产生题目：小一「数对应数量」一定要给数量图点，不把答案写在文字里
  function makeQuestion() {
    const moduleId = state.moduleId;

    // 默认：都做简单选择题（可后续扩充）
    let answer = 10;
    let min = 0, max = 20;
    let prompt = '請選出正確數字。';
    let items = 0;

    if (moduleId === 'p1-qty') {
      min = 0; max = 20;
      answer = randInt(min, max);
      items = answer;
      prompt = '請數一數下面有幾個，並選正確數字。';
    } else {
      // 其他模组先用随机数题
      min = 0; max = 20;
      answer = randInt(min, max);
      items = 0;
      prompt = `請選出：${answer}`;
    }

    const options = makeOptions(answer, 4, min, max);
    return { answer, options, prompt, items };
  }

  function nextQuestion(isFirst=false) {
    if (!state.grade || !state.moduleId) return;

    state.locked = false;
    const q = makeQuestion();
    state.currentAnswer = q.answer;

    $('#progressText').textContent = `第 ${state.idx + 1} 題 / ${state.qCount} 題`;
    $('#scoreText').textContent = `正確 ${state.correct} / 作答 ${state.answered}`;
    $('#qText').textContent = q.prompt;

    // items
    const box = $('#qItems');
    box.innerHTML = '';
    if (q.items > 0) {
      const cap = Math.min(q.items, 60); // 防爆
      for (let i=0;i<cap;i++){
        const d = document.createElement('div');
        d.className = 'itemDot';
        box.appendChild(d);
      }
      if (q.items > 60) {
        const more = document.createElement('div');
        more.className = 'muted';
        more.textContent = `（共 ${q.items} 個）`;
        box.appendChild(more);
      }
    }

    // options
    const optWrap = $('#options');
    optWrap.innerHTML = q.options.map(n => `<button class="optBtn" data-opt="${n}" type="button">${n}</button>`).join('');

    // tip
    $('#practiceTip').textContent = '請選擇答案';
    if (!isFirst) state.idx++;
  }

  function finishPractice() {
    // 保存记录
    const gradeText = state.grade === 'P1' ? '小1' : state.grade === 'P2' ? '小2' : '小3';
    const mod = (MODULES[state.grade] || []).find(x => x.id === state.moduleId);
    const modTitle = mod ? mod.title : '模組';

    const rec = {
      ts: Date.now(),
      grade: gradeText,
      module: modTitle,
      answered: state.answered,
      correct: state.correct,
      accuracy: state.answered ? Math.round((state.correct/state.answered)*100) : 0
    };
    const list = loadRecords();
    list.unshift(rec);
    saveRecords(list);

    showPage('records');
  }

  // ====== Records ======
  const REC_KEY = 'learn_records_v1';
  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(REC_KEY) || '[]'); } catch(e){ return []; }
  }
  function saveRecords(list) {
    localStorage.setItem(REC_KEY, JSON.stringify(list));
  }
  function renderRecords() {
    const list = loadRecords();
    const wrap = $('#recordList');
    const empty = $('#recordEmpty');

    wrap.innerHTML = '';
    if (!list.length) {
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    wrap.innerHTML = list.map(r => {
      const d = new Date(r.ts);
      const dt = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
      return `
        <div class="recordItem">
          <div>${dt}（${r.grade}｜${escapeHtml(r.module)}）</div>
          <div>題數：${r.answered}｜答對：${r.correct}｜正確率：${r.accuracy}%</div>
        </div>
      `;
    }).join('');
  }

  // ====== Settings ======
  const QCOUNT_KEY = 'qcount_v1';
  function loadQCount() {
    const v = parseInt(localStorage.getItem(QCOUNT_KEY) || '20', 10);
    return [10,20,30].includes(v) ? v : 20;
  }
  function saveQCount(v) {
    localStorage.setItem(QCOUNT_KEY, String(v));
  }
  function renderQCount() {
    state.qCount = loadQCount();
    $('#qCountNow').textContent = `目前題數：${state.qCount} 題`;
    $$('#qCountChips .chip').forEach(c => c.classList.toggle('active', parseInt(c.dataset.qcount,10) === state.qCount));
  }

  // ====== Utils ======
  function randInt(min, max) {
    return Math.floor(Math.random()*(max-min+1))+min;
  }
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }
  function makeOptions(answer, count=4, min=0, max=20){
    const s = new Set([answer]);
    while(s.size < count){
      s.add(randInt(min,max));
    }
    return shuffle(Array.from(s));
  }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  // ====== One click handler (事件委派，保证动态按钮也能点) ======
  document.addEventListener('click', (e) => {

    // bottom nav
    const nav = e.target.closest('.navBtn');
    if (nav) {
      showPage(nav.dataset.page);
      return;
    }

    // grade select
    const g = e.target.closest('.gradeCard');
    if (g) {
      state.grade = g.dataset.grade;
      renderModules();
      return;
    }

    // module select
    const m = e.target.closest('.moduleCard');
    if (m) {
      if (m.hasAttribute('disabled')) return;
      if (!state.grade) return;
      startPractice(m.dataset.module);
      return;
    }

    // option click
    const opt = e.target.closest('.optBtn');
    if (opt) {
      if (state.locked) return;
      state.locked = true;

      const v = parseInt(opt.dataset.opt, 10);
      state.answered++;
      const ok = v === state.currentAnswer;
      if (ok) state.correct++;

      // UI feedback
      $$('.optBtn').forEach(b => {
        const bv = parseInt(b.dataset.opt,10);
        if (bv === state.currentAnswer) b.classList.add('correct');
        if (b === opt && !ok) b.classList.add('wrong');
        b.disabled = true;
      });

      $('#scoreText').textContent = `正確 ${state.correct} / 作答 ${state.answered}`;
      $('#practiceTip').textContent = ok ? '✅ 答對了！' : `❌ 答錯了，正確是 ${state.currentAnswer}`;

      // auto next / finish
      setTimeout(() => {
        if (state.idx + 1 >= state.qCount) {
          finishPractice();
        } else {
          state.idx++;
          nextQuestion(true);
        }
      }, 450);

      return;
    }

    // buttons
    if (e.target.closest('#exitBtn')) {
      finishPractice();
      return;
    }
    if (e.target.closest('#nextBtn')) {
      // 手动下一题（不建议一直用，保留）
      if (state.idx + 1 >= state.qCount) finishPractice();
      else { state.idx++; nextQuestion(true); }
      return;
    }

    if (e.target.closest('#refreshRecordBtn')) {
      renderRecords();
      return;
    }
    if (e.target.closest('#clearRecordBtn')) {
      // 简化：直接清（你要密码再加）
      saveRecords([]);
      renderRecords();
      return;
    }

    // qcount chips
    const chip = e.target.closest('#qCountChips .chip');
    if (chip) {
      const v = parseInt(chip.dataset.qcount, 10);
      saveQCount(v);
      renderQCount();
      return;
    }
  });

  // ====== Boot ======
  function boot(){
    state.qCount = loadQCount();
    renderModules();
    renderRecords();
    renderQCount();
    showPage('home');
    // 可选：确认 js 真的载入
    // alert('JS 已啟動 ✅');
  }

  boot();
})();