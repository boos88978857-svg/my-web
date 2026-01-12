document.addEventListener("DOMContentLoaded", () => {
  console.log("JS 已加载");

  const question = document.getElementById("question");
  const nextBtn = document.getElementById("next");
  const status = document.getElementById("status");

  if (!question || !nextBtn || !status) {
    alert("元素没找到，ID 不匹配");
    return;
  }

  question.textContent = "1 + 1 等于几？";
  status.textContent = "点击【下一题】测试";

  nextBtn.disabled = false;

  nextBtn.onclick = () => {
    question.textContent = "2 + 2 等于几？";
    status.textContent = "按钮已生效 ✅";
    alert("你点到按钮了！");
  };
});
