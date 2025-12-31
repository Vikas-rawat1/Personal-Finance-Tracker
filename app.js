let data = JSON.parse(localStorage.getItem("data")||"[]");
let type="income";
let month=new Date().toISOString().slice(0,7);
let chart=null;
let deleteId=null;

// Logout function
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login/login.html';
}

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

// --- Non-invasive month/overall view extension ---
(function(){
  const monthPickerEl = document.getElementById('monthPicker');
  const viewModeEl = document.getElementById('viewMode');
  if(!monthPickerEl || !viewModeEl) return; // nothing to do

  // default view: show current month on dashboard
  viewModeEl.value = 'current';

  function currentMonth(){ return new Date().toISOString().slice(0,7); }

  function getFilterMonth(){
    const mode = viewModeEl.value;
    if(mode==='all') return null;
    if(mode==='current') return currentMonth();
    // mode === 'month'
    return monthPickerEl.value || currentMonth();
  }

  function getFilteredData(){
    const fm = getFilterMonth();
    if(!fm) return data;
    return data.filter(d=>d.date && d.date.slice(0,7)===fm);
  }

  // monkey-patch sum, drawList, renderChart to use filtered data
  const _origSum = window.sum;
  window.sum = function(t){
    return getFilteredData().filter(d=>d.type===t).reduce((a,b)=>a+b.amt,0);
  };

  const _origDrawList = window.drawList;
  window.drawList = function(){
    if(typeof list==='undefined') return _origDrawList && _origDrawList();
    list.innerHTML = '';
    const rows = [...getFilteredData()].sort((a,b)=>b.id-a.id);
    if(rows.length===0){
      const empty = document.createElement('div');
      empty.className='tx';
      empty.style.justifyContent='center';
      empty.style.color='#9ca3af';
      empty.textContent = viewModeEl.value==='all' ? 'No transactions yet.' : 'No transactions for selected month.';
      list.appendChild(empty);
      return;
    }
    rows.forEach(d=>{
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
  };

  const _origRenderChart = window.renderChart;
  window.renderChart = function(type){
    // reuse existing chart logic but with filtered sums
    const ctx=document.getElementById("financeChart").getContext("2d");
    if(chart) chart.destroy();
    const labels=["Income","Expense","Saving","Investment"];
    const values=[sum("income"),sum("expense"),sum("saving"),sum("investment")];
    chart=new Chart(ctx,{
     type,
     data:{labels,datasets:[{data:values,backgroundColor:["#43d39e","#ff6b6b","#60a5fa","#a7f3d0"]}]},
     options:{
       responsive:true,maintainAspectRatio:false,
       scales:type==="bar"?{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"},beginAtZero:true}}:{},
       plugins:{legend:{labels:{color:"#fff"}}}
     }
    });
  };

  // change handlers
  function setViewMode(mode){
    // update the select value and apply a visual cue when a specific month is active
    viewModeEl.value = mode;
    if(mode === 'month') monthPickerEl.classList.add('active-filter');
    else monthPickerEl.classList.remove('active-filter');

    // keep the month picker synced with 'current' when necessary
    if(mode === 'current') monthPickerEl.value = currentMonth();

    render();
  }

  // wire up events
  viewModeEl.addEventListener('change', ()=> setViewMode(viewModeEl.value));
  monthPickerEl.addEventListener('focus', ()=> setViewMode('month'));
  monthPickerEl.addEventListener('click', ()=> setViewMode('month'));
  monthPickerEl.addEventListener('change', ()=> setViewMode('month'));

  // initialize: set to current month view
  setViewMode('current');
  monthPickerEl.value = currentMonth();
  render();

})();