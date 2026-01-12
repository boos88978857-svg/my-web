// ====== 你只要改這兩段內容與注音對照就好 ======
const content = {
  title: "數與數量（0～20）",
  body: "認識數字，一個一個數出來，建立數量概念。"
};

// ✅ 右側注音欄：用「詞/字 → 注音」清單（更穩、不會排版炸）
const zhuyinItems = [
  { zh: "數", zy: "ㄕㄨˋ" },
  { zh: "與", zy: "ㄩˇ" },
  { zh: "數量", zy: "ㄕㄨˋ ㄌㄧㄤˋ" },
  { zh: "認識", zy: "ㄖㄣˋ ㄕˋ" },
  { zh: "數字", zy: "ㄕㄨˋ ㄗˋ" },
  { zh: "一個", zy: "ㄧ ㄍㄜˋ" },
  { zh: "數出來", zy: "ㄕㄨˇ ㄔㄨ ㄌㄞˊ" },
  { zh: "建立", zy: "ㄐㄧㄢˋ ㄌㄧˋ" },
  { zh: "概念", zy: "ㄍㄞˋ ㄋㄧㄢˋ" }
];

// 渲染主內容
document.getElementById("mainTitle").textContent = content.title;
document.getElementById("mainBody").textContent  = content.body;

// 渲染右側注音欄
const list = document.getElementById("zhuyinList");
list.innerHTML = "";
zhuyinItems.forEach(item => {
  const div = document.createElement("div");
  div.className = "zy-item";
  div.innerHTML = `
    <div class="zy-zh">${escapeHtml(item.zh)}</div>
    <div class="zy-zy">${escapeHtml(item.zy)}</div>
  `;
  list.appendChild(div);
});

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
