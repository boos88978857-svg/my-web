const modules = {
  count: () => {
    const n = rand(1,10);
    return makeQ(
      "● ".repeat(n),
      [n-1,n,n+1].map(x=>x.toString()),
      1
    );
  },

  number100: () => {
    const a = rand(10,99);
    const b = a + rand(1,5);
    return makeQ(
      `哪一個比較大？`,
      [a,b].map(String),
      1
    );
  },

  place: () => {
    const t = rand(1,9);
    const o = rand(1,9);
    return makeQ(
      `🟦`.repeat(t)+" "+"●".repeat(o),
      [`${t}${o}`,`${o}${t}`,`${t+o}`],
      0
    );
  },

  make10: () => {
    const a = rand(1,9);
    return makeQ(
      `${a} 還差多少到 10？`,
      [10-a-1,10-a,10-a+1].map(String),
      1
    );
  },

  addsub: () => {
    const a = rand(1,15);
    const b = rand(1,20-a);
    return makeQ(
      `${a} + ${b} = ?`,
      [a+b-1,a+b,a+b+1].map(String),
      1
    );
  }
};

let currentGen = null;

document.querySelectorAll(".module").forEach(btn=>{
  btn.onclick = ()=>{
    currentGen = modules[btn.dataset.module];
    nextQ();
    showPractice();
  };
});

function makeQ(q, choices, correct){
  return {q,choices,correct};
}

function nextQ(){
  const q = currentGen();
  const qEl = document.getElementById("question");
  const cEl = document.getElementById("choices");
  const sEl = document.getElementById("status");
  qEl.textContent = q.q;
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

document.getElementById("next").onclick = nextQ;

function showPractice(){
  document.getElementById("modules").style.display="none";
  document.getElementById("practice").style.display="block";
}

function rand(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}
