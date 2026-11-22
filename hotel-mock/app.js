"use strict";
const $ = id => document.getElementById(id);
const weights = [12,12,10,16];
const notes = [
  "先用 Booking 連到顧客和房間，再保留女性且房價大於 200 的訂房紀錄，最後按房價由高到低排。",
  "每間飯店先用全部房間算出最高價。外層再檢查該價格的房間是否有日本或台灣顧客預訂，並依房價升冪排列。",
  "EXISTS 會檢查每間飯店是否至少有一筆台灣顧客的訂房。符合的飯店各列一次。這題沒有 ORDER BY，列的先後都可以。",
  "從 C035 直接推薦的顧客算第 1 層，往下一層就加 1。LEFT JOIN 保留沒有訂房的顧客，COUNT(b.book_id) 會算出 0。先按層級、再按顧客編號排列。"
];
const storageKey = "hotel-mock-first-four-v1";
const blank = i => answerKey[i].cols.map(() => "");
const fresh = () => ({q:0,table:"Customer",submitted:false,zero:weights.map(()=>false),answers:weights.map((_,i)=>[blank(i),blank(i),blank(i)])});
let state = fresh();
try {
  const draft = JSON.parse(localStorage.getItem(storageKey));
  if(draft && Number.isInteger(draft.q) && draft.q>=0 && draft.q<4 && Object.hasOwn(paper.tables,draft.table) &&
     typeof draft.submitted==="boolean" && draft.zero?.length===4 && draft.zero.every(v=>typeof v==="boolean") &&
     draft.answers?.length===4 && draft.answers.every((rows,i)=>Array.isArray(rows) && rows.every(row=>Array.isArray(row) && row.length===answerKey[i].cols.length && row.every(v=>typeof v==="string")))) state=draft;
} catch {}
function save(){
  try{localStorage.setItem(storageKey,JSON.stringify(state));$("saveStatus").textContent="已儲存在此瀏覽器";}
  catch{$("saveStatus").textContent="目前無法儲存草稿";}
}
function el(tag,value){const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;}
function makeButton(text,fn){const b=el("button",text);b.type="button";b.onclick=fn;return b;}
function cellRows(i){return state.answers[i].filter(row=>row.some(v=>v.trim()!==""));}
function started(i){return state.zero[i] || cellRows(i).length>0;}
function norm(row){return JSON.stringify(row.map(v=>String(v).trim().replace(/\s+/g," ").toLowerCase()));}
function correct(i){
  const a=(state.zero[i]?[]:cellRows(i)).map(norm), b=answerKey[i].rows.map(norm);
  if(i===2){a.sort();b.sort();}
  return a.length===b.length && a.every((v,j)=>v===b[j]);
}
function staticTable(cols,rows){
  const t=el("table"),head=t.createTHead().insertRow();
  cols.forEach(c=>head.append(el("th",c)));const body=t.createTBody();
  rows.forEach(row=>{const tr=body.insertRow();row.forEach(v=>tr.insertCell().textContent=v);});
  return t;
}
function reference(){
  const name=state.table, t=paper.tables[name];
  $("tables").replaceChildren(...Object.keys(paper.tables).map(k=>{
    const b=makeButton(k,()=>{state.table=k;save();reference();});
    b.setAttribute("aria-pressed",k===name);return b;
  }));
  $("tableName").textContent=name;$("numRows").textContent=t.rows.length+" 筆";
  $("reference").replaceChildren(staticTable(t.cols,t.rows));$("reference").scrollTop=0;$("reference").scrollLeft=0;
}
function showSQL(i){
  const sql=paper.queries[i], node=$("sql");
  node.replaceChildren();
  const re=/'[^']*'|\b(?:SELECT|FROM|AS|JOIN|ON|WHERE|AND|ORDER|BY|DESC|ASC|MAX|IN|EXISTS|WITH|RECURSIVE|UNION|ALL|LEFT|COUNT|GROUP)\b/g;
  let pos=0;
  for(const m of sql.matchAll(re)){node.append(sql.slice(pos,m.index));const s=el("span",m[0]);s.className=m[0][0]==="'"?"str":"kw";node.append(s);pos=m.index+m[0].length;}
  node.append(sql.slice(pos));
}
function updateProgress(){
  const count=weights.filter((_,i)=>started(i)).length;
  $("count").textContent="已填 "+count+" / 4 題";$("progress").value=count;
}
function drawGrid(){
  const i=state.q, cols=answerKey[i].cols;
  const grid=el("table");grid.className="entry";const h=grid.createTHead().insertRow();
  ["列",...cols,...(state.submitted?[]:["操作"])].forEach(c=>h.append(el("th",c)));
  const body=grid.createTBody();
  state.answers[i].forEach((row,r)=>{
    const tr=body.insertRow();tr.insertCell().textContent=r+1;
    row.forEach((v,c)=>{
      const input=el("input");input.value=v;input.readOnly=state.submitted;input.disabled=state.zero[i];input.spellcheck=false;input.autocomplete="off";
      input.setAttribute("aria-label","第 "+(r+1)+" 列 "+cols[c]);input.oninput=()=>{
        row[c]=input.value;save();updateProgress();$("message").textContent="";
      };tr.insertCell().append(input);
    });
    if(!state.submitted){const b=makeButton("×",()=>{state.answers[i].splice(r,1);save();drawGrid();updateProgress();});b.className="rm";b.disabled=state.zero[i];b.setAttribute("aria-label","移除第 "+(r+1)+" 列");tr.insertCell().append(b);}
  });
  $("grid").replaceChildren(grid);$("add").hidden=state.submitted;$("add").disabled=state.zero[i];
  $("empty").checked=state.zero[i];$("empty").disabled=state.submitted;
}
function selectQuestion(i){state.q=i;save();render();$("title").scrollIntoView({block:"nearest"});}
function render(){
  const i=state.q;
  $("questions").replaceChildren(...weights.map((_,n)=>{
    const b=makeButton("Q"+(n+1),()=>selectQuestion(n));b.setAttribute("aria-pressed",n===i);return b;
  }));
  $("title").textContent="第 "+(i+1)+" 題";$("points").textContent=weights[i]+" 分";
  $("prev").disabled=i===0;$("next").hidden=i===3;
  showSQL(i);drawGrid();updateProgress();$("guide").hidden=state.submitted;
  $("feedback").hidden=!state.submitted;
  if(state.submitted){
    const ok=correct(i), label=el("h3",(ok?"答對":"待訂正")+"　"+(ok?weights[i]:0)+" / "+weights[i]+" 分");
    label.className=ok?"pass":"miss";const wrap=el("div");wrap.className="scroll";wrap.append(staticTable(answerKey[i].cols,answerKey[i].rows));
    $("feedback").replaceChildren(label,el("p",notes[i]),el("h3","參考結果"),wrap);
    const score=weights.reduce((t,w,k)=>t+(correct(k)?w:0),0);
    $("resultTitle").textContent="總成績　"+score+" / 50 分";$("rule").textContent="切換題號可查看各題的答案、查詢結果與解析。";$("submit").textContent="重新作答";
  }else{
    $("resultTitle").textContent="整份交卷";$("rule").textContent="四題一起批改。練習計分採整題答對給分，依原卷配分。";$("submit").textContent="交卷批改";
  }
}
$("add").onclick=()=>{state.answers[state.q].push(blank(state.q));save();drawGrid();$("grid").querySelector("tbody tr:last-child input")?.focus();};
$("empty").onchange=()=>{state.zero[state.q]=$("empty").checked;save();drawGrid();updateProgress();$("message").textContent="";};
$("prev").onclick=()=>selectQuestion(state.q-1);$("next").onclick=()=>selectQuestion(state.q+1);
$("submit").onclick=()=>{
  if(state.submitted){
    if(!confirm("要清除本次成績與答案，開始一份空白答卷嗎？"))return;
    state=fresh();$("message").textContent="";reference();
  }else{
    const missing=weights.findIndex((_,i)=>!started(i));
    if(missing>=0){selectQuestion(missing);$("message").textContent="第 "+(missing+1)+" 題尚未作答。請填入資料，或勾選空結果。";$("grid").querySelector("input")?.focus();return;}
    if(!confirm("確定交卷？四題將一起批改並顯示參考結果。"))return;
    state.submitted=true;$("message").textContent="";
  }
  save();render();(state.submitted?$("resultTitle"):$("title")).scrollIntoView({block:"center"});
};
save();reference();render();
