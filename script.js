const question = document.getElementById("question");
const nextBtn = document.getElementById("next");
const status = document.getElementById("status");

question.textContent = "1 + 1 等于几？";

nextBtn.disabled = false;

nextBtn.onclick = () => {
  question.textContent = "2 + 2 等于几？";
  status.textContent = "题目已切换";
};
