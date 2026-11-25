"use strict";
const $ = id => document.getElementById(id);
const exam = new URLSearchParams(location.search).get("exam");
const originalExam = exam === "sql";
const fullExam = exam === "c";
const sqlNotes = [
  "先用 Booking 連到顧客和房間，再保留女性且房價大於 200 的訂房紀錄，最後按房價由高到低排。",
  "每間飯店先用全部房間算出最高價。外層再檢查該價格的房間是否有日本或台灣顧客預訂，並依房價升冪排列。",
  "EXISTS 會檢查每間飯店是否至少有一筆台灣顧客的訂房。符合的飯店各列一次。這題沒有 ORDER BY，列的先後都可以。",
  "從 C035 直接推薦的顧客算第 1 層，往下一層就加 1。LEFT JOIN 保留沒有訂房的顧客，COUNT(b.book_id) 會算出 0。先按層級、再按顧客編號排列。"
];
const tables = originalExam ? paper.tables : fullExam ? mixedExam.tables : algebraExam.tables;
const questions = originalExam
  ? answerKey.map((answer, i) => ({
      ...answer,
      expression: paper.queries[i],
      note: sqlNotes[i],
      format: "sql",
      points: [12, 12, 10, 16][i],
      ordered: i !== 2
    }))
  : fullExam ? mixedExam.questions
  : algebraExam.questions.map(question => ({...question, format: "algebra", points: 25, ordered: false}));
const totalPoints = questions.reduce((total, question) => total + question.points, 0);
const storageKey = originalExam ? "hotel-mock-first-four-v1"
  : fullExam ? "database-mock-c-v1" : "relational-algebra-mock-b-v1";
const blank = i => questions[i].cols.map(() => "");
const fresh = () => ({
  q: 0,
  table: Object.keys(tables)[0],
  submitted: false,
  zero: questions.map(() => false),
  answers: questions.map((_, i) => Array.from({length: originalExam ? 3 : 1}, () => blank(i)))
});
let state = fresh();
try {
  const draft = JSON.parse(localStorage.getItem(storageKey));
  if(draft && Number.isInteger(draft.q) && draft.q>=0 && draft.q<questions.length && Object.hasOwn(tables,draft.table) &&
     typeof draft.submitted==="boolean" && draft.zero?.length===questions.length && draft.zero.every(v=>typeof v==="boolean") &&
     draft.answers?.length===questions.length && draft.answers.every((rows,i)=>Array.isArray(rows) && rows.every(row=>Array.isArray(row) && row.length===questions[i].cols.length && row.every(v=>typeof v==="string")))) state=draft;
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
  const a=(state.zero[i]?[]:cellRows(i)).map(norm), b=questions[i].rows.map(norm);
  if(!questions[i].ordered){a.sort();b.sort();}
  return a.length===b.length && a.every((v,j)=>v===b[j]);
}
function staticTable(cols,rows){
  const t=el("table"),head=t.createTHead().insertRow();
  cols.forEach(c=>head.append(el("th",c)));const body=t.createTBody();
  rows.forEach(row=>{const tr=body.insertRow();row.forEach(v=>tr.insertCell().textContent=v);});
  return t;
}
function reference(){
  const name=state.table, t=tables[name];
  $("tables").replaceChildren(...Object.keys(tables).map(k=>{
    const b=makeButton(k,()=>{state.table=k;save();reference();});
    b.setAttribute("aria-pressed",k===name);return b;
  }));
  $("tableName").textContent=name;$("numRows").textContent=t.rows.length+" 筆";
  $("reference").replaceChildren(staticTable(t.cols,t.rows));$("reference").scrollTop=0;$("reference").scrollLeft=0;
}
function showExpression(i){
  const expression=questions[i].expression, node=$("prompt");
  const isSql = questions[i].format === "sql";
  $("promptLabel").textContent = isSql ? "SQL 題目" : "關聯代數題目";
  node.replaceChildren();
  const tokens = isSql
    ? /'[^']*'|\b(?:SELECT|FROM|AS|JOIN|ON|WHERE|AND|OR|NOT|ORDER|BY|DESC|ASC|MAX|IN|EXISTS|WITH|RECURSIVE|UNION|ALL|LEFT|COUNT|GROUP)\b/g
    : /_\{([^}]+)\}/g;
  let pos = 0;
  for(const match of expression.matchAll(tokens)){
    node.append(expression.slice(pos, match.index));
    const token = isSql ? el("span", match[0]) : el("sub", match[1]);
    if(isSql) token.className = match[0][0] === "'" ? "str" : "kw";
    node.append(token);
    pos = match.index + match[0].length;
  }
  node.append(expression.slice(pos));
}
function updateProgress(){
  const count=questions.filter((_,i)=>started(i)).length;
  $("count").textContent="已填 "+count+" / "+questions.length+" 題";$("progress").value=count;
}
function drawGrid(){
  const i=state.q, cols=questions[i].cols;
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
  $("questions").replaceChildren(...questions.map((_,n)=>{
    const b=makeButton("Q"+(n+1),()=>selectQuestion(n));b.setAttribute("aria-pressed",n===i);return b;
  }));
  const question=questions[i];
  $("title").textContent="第 "+(i+1)+" 題";$("points").textContent=question.points+" 分";
  $("prev").disabled=i===0;$("next").hidden=i===questions.length-1;
  showExpression(i);drawGrid();updateProgress();$("guide").hidden=state.submitted;
  $("feedback").hidden=!state.submitted;
  if(state.submitted){
    const ok=correct(i), label=el("h3",(ok?"答對":"待訂正")+"　"+(ok?question.points:0)+" / "+question.points+" 分");
    label.className=ok?"pass":"miss";const wrap=el("div");wrap.className="scroll";wrap.append(staticTable(question.cols,question.rows));
    $("feedback").replaceChildren(label,el("p",question.note),el("h3","參考結果"),wrap);
    const score=questions.reduce((total,item,k)=>total+(correct(k)?item.points:0),0);
    $("resultTitle").textContent="總成績　"+score+" / "+totalPoints+" 分";$("rule").textContent="切換題號可查看各題的答案、查詢結果與解析。";$("submit").textContent="重新作答";
  }else{
    $("resultTitle").textContent="整份交卷";$("rule").textContent="全卷一起批改，每題完整答對才給分。";$("submit").textContent="交卷批改";
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
    const missing=questions.findIndex((_,i)=>!started(i));
    if(missing>=0){selectQuestion(missing);$("message").textContent="第 "+(missing+1)+" 題尚未作答。請填入資料，或勾選空結果。";$("grid").querySelector("input")?.focus();return;}
    if(!confirm("確定交卷？全卷將一起批改並顯示參考結果。"))return;
    state.submitted=true;$("message").textContent="";
  }
  save();render();(state.submitted?$("resultTitle"):$("title")).scrollIntoView({block:"center"});
};
if(originalExam){
  document.title="資料庫期中模擬卷｜前四題答卷";
  $("examName").textContent="期中模擬卷・前四題";
  $("instructions").textContent="閱讀原卷 SQL，查閱資料表，逐列填入查詢結果。";
  $("otherExam").textContent="切換到關聯代數 B 卷";
  $("otherExam").href="index.html";
  $("sqlRelations").hidden=false;
}
if(fullExam){
  document.title="資料庫模擬考｜C 卷";
  $("examName").textContent="資料庫模擬考・C 卷";
  $("instructions").textContent="第 1～4 題讀 SQL，第 5～8 題讀關聯代數。逐列填入查詢結果，有 ORDER BY 的題目依指定順序填寫。";
  $("otherExam").textContent="切換到關聯代數 B 卷";
  $("otherExam").href="index.html";
  $("questions").classList.add("full-exam");
}
$("totalPoints").textContent="共 "+totalPoints+" 分";
$("progress").max=questions.length;
save();reference();render();
