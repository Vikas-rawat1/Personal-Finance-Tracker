let data = JSON.parse(localStorage.getItem("data")||"[]");
let type="income";
let month=new Date().toISOString().slice(0,7);
let chart=null;
let deleteId=null;

monthPicker.value=month;
date.value=new Date().toISOString().slice(0,10);

document.querySelectorAll(".type").forEach(t=>{
 t.onclick=()=>{
  document.querySelectorAll(".type").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  type=t.textContent.toLowerCase();
 };
});

document.addEventListener("keydown",e=>{
 if(e.key==="Enter") addTx();
});

function addTx(){
 if(!desc.value||!amt.value) return;
 data.push({
  id:Date.now(),
  date:date.value,
  desc:desc.value,
  type,
  amt:+amt.value
 });
 localStorage.setItem("data",JSON.stringify(data));
 desc.value=""; amt.value="";
 render();
}

function sum(t){
 return data.filter(d=>d.type===t).reduce((a,b)=>a+b.amt,0);
}

function animate(el,val){
 gsap.fromTo(el,{innerText:0},{
  innerText:val,
  duration:1.5,
  snap:{innerText:1},
  onUpdate:()=>el.innerText="₹"+Math.round(el.innerText)
 });
}

function render(){
 animate(income,sum("income"));
 animate(expense,sum("expense"));
 animate(saving,sum("saving"));
 animate(investment,sum("investment"));
 animate(balance,sum("income")-sum("expense")-sum("saving")-sum("investment"));
 drawList();
 renderChart(chartType.value);
}

function drawList(){
 list.innerHTML="";
 [...data].sort((a,b)=>b.id-a.id).forEach(d=>{
  let div=document.createElement("div");
  div.className=`tx ${d.type}`;
  div.innerHTML=`
   <div class="tx-left">
     <strong>${d.desc}</strong><br>
     <small>${d.type} • ${d.date}</small>
   </div>
   <div class="tx-right">
     <strong>₹${d.amt}</strong>
     <div class="delete-btn" onclick="openModal(${d.id})">
       <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M3 6h18"/>
         <path d="M8 6V4h8v2"/>
         <path d="M19 6l-1 14H6L5 6"/>
         <path d="M10 11v6"/>
         <path d="M14 11v6"/>
       </svg>
     </div>
   </div>`;
  list.appendChild(div);
 });
}

function openModal(id){
 deleteId=id;
 modal.style.pointerEvents="auto";
 gsap.to(modal,{opacity:1});
}
function closeModal(){
 modal.style.pointerEvents="none";
 gsap.to(modal,{opacity:0});
}
function confirmDelete(){
 data=data.filter(d=>d.id!==deleteId);
 localStorage.setItem("data",JSON.stringify(data));
 closeModal();
 render();
}

function renderChart(type){
 const ctx=document.getElementById("financeChart").getContext("2d");
 if(chart) chart.destroy();

 const labels=["Income","Expense","Saving","Investment"];
 const values=[sum("income"),sum("expense"),sum("saving"),sum("investment")];

 chart=new Chart(ctx,{
  type,
  data:{labels,datasets:[{
    data:values,
    backgroundColor:["#43d39e","#ff6b6b","#60a5fa","#a7f3d0"]
  }]},
  options:{
    responsive:true,
    maintainAspectRatio:false,
    scales:type==="bar"?{
      x:{ticks:{color:"#fff"}},
      y:{ticks:{color:"#fff"},beginAtZero:true}
    }:{},
    plugins:{legend:{labels:{color:"#fff"}}}
  }
 });
}

chartType.onchange=e=>renderChart(e.target.value);
render();