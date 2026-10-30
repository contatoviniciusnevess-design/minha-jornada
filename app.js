const STORAGE_KEY = "minhaJornada.v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"smoke":null,"drink":null}');
const $ = (id) => document.getElementById(id);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const milestones = [1, 7, 30, 100, 365];
const quotes = [
  "Pequenas escolhas, repetidas todos os dias, constroem grandes mudanças.",
  "Você não precisa resolver tudo hoje. Apenas cuide do próximo passo.",
  "Cada dia de dedicação é uma conquista que merece reconhecimento.",
  "Seu progresso não precisa ser perfeito para ser importante.",
  "Continue no seu ritmo. Um dia de cada vez."
];
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function elapsedDays(date){
  if(!date) return null;
  const [y,m,d] = date.split("-").map(Number);
  const start = Date.UTC(y,m-1,d);
  const now = new Date();
  const current = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.max(0, Math.floor((current-start)/86400000));
}
function formatDate(date){
  if(!date) return "Início não definido";
  const [y,m,d] = date.split("-");
  return `Desde ${d}/${m}/${y}`;
}
function nextMilestone(days){
  const next = milestones.find(n => n > days);
  if(!next) return "Você passou de 365 dias. Que conquista!";
  return `Próximo marco: ${next} ${next===1?"dia":"dias"}`;
}
function renderCounter(type, prefix){
  const days = elapsedDays(state[type]);
  $(`${prefix}Days`).textContent = days === null ? "—" : days;
  $(`${prefix}Since`).textContent = formatDate(state[type]);
  const progress = days === null ? 0 : Math.min(100, (days / (milestones.find(n=>n>days) || 365))*100);
  $(`${prefix}Progress`).style.width = `${progress}%`;
  $(`${prefix}Milestone`).textContent = days === null ? "Defina uma data para começar a acompanhar." : nextMilestone(days);
}
function render(){
  renderCounter("smoke","smoke");
  renderCounter("drink","drink");
  const maxDays = Math.max(elapsedDays(state.smoke) ?? 0, elapsedDays(state.drink) ?? 0);
  document.querySelectorAll(".milestone-row").forEach((row,i)=>{
    const threshold = [1,7,30,100][i];
    const achieved = (state.smoke && elapsedDays(state.smoke)>=threshold) || (state.drink && elapsedDays(state.drink)>=threshold);
    row.classList.toggle("done", !!achieved);
  });
  $("dailyQuote").textContent = quotes[new Date().getDate()%quotes.length];
}
let editing = "smoke";
function openDateEditor(type){
  editing = type;
  $("dialogSymbol").textContent = type==="smoke" ? "🚭" : "🥤";
  $("dialogTitle").textContent = type==="smoke" ? "Sem fumar" : "Sem beber";
  $("startDate").value = state[type] || today();
  $("startDate").max = today();
  $("dateDialog").showModal();
}
document.querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>openDateEditor(btn.dataset.edit)));
$("dateForm").addEventListener("submit",e=>{
  e.preventDefault();
  const value = $("startDate").value;
  if(!value || value>today()){ toast("Escolha uma data válida."); return; }
  state[editing]=value; save(); render(); $("dateDialog").close();
  toast("Data atualizada. Continue no seu ritmo!");
});
$("clearDate").addEventListener("click",()=>{
  state[editing]=null; save(); render(); $("dateDialog").close(); toast("Data removida.");
});
$("settingsBtn").addEventListener("click",()=>$("settingsDialog").showModal());
$("exportBtn").addEventListener("click",()=>{
  const blob = new Blob([JSON.stringify({dados:state,exportadoEm:new Date().toISOString()},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download="minha-jornada-dados.json"; a.click(); URL.revokeObjectURL(url);
  toast("Arquivo de dados exportado.");
});
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e; $("installBtn").hidden=false;
});
$("installBtn").addEventListener("click",async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("installBtn").hidden=true;
});
let toastTimer;
function toast(message){
  const el=$("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}
if("serviceWorker" in navigator && location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
render();
