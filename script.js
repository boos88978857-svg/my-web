// =============================
// 我的學習機 - 主控制程式
// =============================

// 確認 JS 已載入（你已經看到這個了，代表成功）
alert("✅ script.js 已載入");

// ===== 狀態 =====
let currentGrade = null;

// ===== 工具函式 =====
function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

// ===== 年級選擇 =====
$all("[data-grade]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentGrade = btn.dataset.grade;

    alert(`你選擇了：${btn.innerText}`);

    // 顯示章節區（如果有）
    const chapterArea = document.getElementById("chapterArea");
    if (chapterArea) {
      chapterArea.style.display = "block";
    }

    // 根據年級鎖定乘除
    toggleMathByGrade(currentGrade);
  });
});

// ===== 章節按鈕 =====
$all("[data-chapter]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!currentGrade) {
      alert("請先選擇年級");
      return;
    }

    alert(`開始練習：${btn.innerText}（${currentGrade}）`);
  });
});

// ===== 家長模式 =====
const parentBtn = document.getElementById("parentBtn");
if (parentBtn) {
  parentBtn.addEventListener("click", () => {
    alert("家長模式（之後可加密碼設定）");
  });
}

// ===== 年級控制乘除 =====
function toggleMathByGrade(grade) {
  const mul = document.querySelector('[data-chapter="mul"]');
  const div = document.querySelector('[data-chapter="div"]');

  if (!mul || !div) return;

  if (grade === "1") {
    mul.classList.add("disabled");
    div.classList.add("disabled");
  } else {
    mul.classList.remove("disabled");
    div.classList.remove("disabled");
  }
}
