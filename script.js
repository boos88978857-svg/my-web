document.addEventListener("DOMContentLoaded", () => {
  const questionEl = document.getElementById("question");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("next");
  const statusEl = document.getElementById("status");

  // 题库：你可以继续往下加题
  const questions = [
    { q: "1 + 1 等于几？", choices: ["1", "2", "3", "4"], answer: 1 },
    { q: "2 + 2 等于几？", choices: ["2", "3", "4", "5"], answer: 2 },
    { q: "3 + 1 等于几？", choices: ["2", "3", "4", "5"], answer: 2 },
  ];

  let idx = 0;
  let score = 0;
  let selected = null;
  let locked = false;

  function render() {
    const item = questions[idx];
    selected = null;
    locked = false;

    questionEl.textContent = `第 ${idx + 1} 题：${item.q}`;
    statusEl.textContent = `请选择答案（得分：${score}/${questions.length}）`;
    nextBtn.disabled = true;

    // 清空旧选项
    choicesEl.innerHTML = "";

    // 生成按钮选项
    item.choices.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.display = "block";
      btn.style.margin = "8px 0";
      btn.style.padding = "10px 12px";
      btn.style.fontSize = "16px";
      btn.style.width = "160px";

      btn.addEventListener("click", () => {
        if (locked) return;

        selected = i;
        locked = true;
        nextBtn.disabled = false;

        const correct = i === item.answer;
        if (correct) score += 1;

        statusEl.textContent = correct ? "✅ 答对了！点【下一题】" : `❌ 答错了。正确答案：${item.choices[item.answer]}（点【下一题】）`;

        // 标记正确/错误
        Array.from(choicesEl.children).forEach((b, bi) => {
          b.disabled = true;
          if (bi === item.answer) b.style.border = "2px solid green";
          if (bi === i && !correct) b.style.border = "2px solid red";
        });
      });

      choicesEl.appendChild(btn);
    });

    // 最后一题时按钮文字变化
    nextBtn.textContent = idx === questions.length - 1 ? "查看结果" : "下一题";
  }

  nextBtn.addEventListener("click", () => {
    if (idx < questions.length - 1) {
      idx += 1;
      render();
    } else {
      // 结束页面
      choicesEl.innerHTML = "";
      questionEl.textContent = "🎉 已完成！";
      statusEl.textContent = `你的得分：${score}/${questions.length}`;
      nextBtn.textContent = "重新开始";
      nextBtn.disabled = false;

      // 重新开始
      nextBtn.onclick = () => {
        idx = 0;
        score = 0;
        nextBtn.onclick = null; // 清掉这个临时处理
        render();
      };
    }
  });

  render();
});
