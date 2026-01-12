function toRubyHTML(text, zhuyinArr){
  const chars = Array.from(text);
  const zys = Array.isArray(zhuyinArr) ? zhuyinArr : [];

  // 長度不符就補空，避免壞版
  const fixed = chars.map((_, i) => zys[i] || "");

  // 標點/空白不加注音，直接輸出
  const isPunct = (ch) => /[，。、！？；：「」『』（）()【】《》…·\s]/.test(ch);

  let html = "";
  for (let i=0; i<chars.length; i++){
    const ch = chars[i];
    const zy = fixed[i];

    if (isPunct(ch) || !zy){
      html += ch;
      continue;
    }

    // ✅ 課本式：<ruby>字<rt>注音</rt></ruby>
    html += `<ruby>${escapeHtml(ch)}<rt>${escapeHtml(zy)}</rt></ruby>`;
  }
  return html;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ====== 範例內容：你之後要加模組，就照這個格式新增 ======

// 標題（你可以自己改）
const titleText = "數與數量（0～20）";
const titleZy = [
  "ㄕㄨˋ","ㄩˇ","ㄕㄨˋ","ㄌㄧㄤˋ",
  "","","","","",""
];

// 內文
const bodyText = "認識數字，一個一個數出來，建立數量概念。";
const bodyZy = [
  "ㄖㄣˋ","ㄕˋ","ㄕㄨˋ","ㄗˋ","",
  "ㄧ","ㄍㄜˋ","ㄧ","ㄍㄜˋ","ㄕㄨˇ","ㄔㄨ","ㄌㄞˊ","",
  "ㄐㄧㄢˋ","ㄌㄧˋ","ㄕㄨˋ","ㄌㄧㄤˋ","ㄍㄞˋ","ㄋㄧㄢˋ",""
];

// 渲染
document.getElementById("tbTitle").innerHTML = toRubyHTML(titleText, titleZy);
document.getElementById("tbBody").innerHTML  = toRubyHTML(bodyText, bodyZy);
