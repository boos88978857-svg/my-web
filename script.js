document.addEventListener("DOMContentLoaded", () => {

  let currentGen = null;

  const generators = {
    count_to_number: () => {
      const n = rand(1,9);
      return {
        q: "請選擇正確的數字",
        bpmf: "ㄑㄧㄥˇ ㄒㄩㄢˇ ㄗㄜˊ ㄓㄥˋ ㄑㄩㄝˋ ㄉㄜ˙ ㄕㄨˋ ㄗˋ",
        visual: "● ".repeat(n),
        choices: [n-1,n,n+1].map(String),
        correct: 1
      };
    },

    number_to_count: () => {
      const n = rand(1,9);
      return {
        q: `數字：${n}`,
        bpmf: "ㄕㄨˋ ㄗˋ",
        visual: "",
        choices: [
          "● ".repeat(n-1),
          "● ".repeat(n),
          "● ".repeat(n+1)
        ],
        correct: 1
      };
    },

    sequence: () => {
      const a = rand(1,7);
      return {
        q: "請選出正確的順序",
        bpmf: "ㄑㄧㄥˇ ㄒㄩㄢˇ ㄔㄨ ㄓㄥˋ ㄑㄩㄝˋ ㄉㄜ˙ ㄕㄨㄣˋ ㄒㄩˋ",
        visual: "",
        choices: [
          `${a} → ${a+1} → ${a+2}`,
          `${a} → ${a+2} → ${a+1}`
        ],
        correct: 0
      };
    }
  };

  document.querySelectorAll(".moduleBtn").forEach(btn=>{
    btn.onclick = ()=>{
      document.getElementById("modulePage").style.display="none";
      document.getElementById("itemPage").style.display="block";
    };
  });

  document.querySelectorAll(".itemBtn").forEach(btn=>{
    btn.onclick = ()=>{
      currentGen = generators[btn.dataset.item];
      showPractice();
      nextQ();
    };
  });

  document.getElementById("backToModule").onclick = ()=>{
    document.getElementById("itemPage").style.display="none";
    document.getElementById("modulePage").style.display="block";
  };

  document.getElementById("next").onclick = nextQ;

  function nextQ(){
    if(!currentGen) return;
    const q = currentGen();

    document.getElementById("question").textContent =
      q.visual ? q.visual + "\n" + q.q : q.q;

    document.getElementById("questionBpmf").textContent = q.bpmf;

    const cEl = document.getElementById("choices");
    const sEl = document.getElementById("status");

    cEl.innerHTML="";
    sEl.textContent="";

    q.choices.forEach((t,i)=>{
      const b=document.createElement("button");
      b.className="choice";
      b.textContent=t;
      b.onclick=()=>{
        if(i===q.correct){
          b.classList.add("correct");
          sEl.textContent="答對了 ✅";
        }else{
          b.classList.add("wrong");
          sEl.textContent="再試試看";
        }
      };
      cEl.appendChild(b);
    });
  }

  function showPractice(){
    document.getElementById("itemPage").style.display="none";
    document.getElementById("practicePage").style.display="block";
  }

  function rand(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
  }

});
