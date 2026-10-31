/* SPDX-License-Identifier: AGPL-3.0-only */
'use strict';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
const names={physics:'物理',chemistry:'化学',biology:'生物'};
const subjectIcon={physics:'physics',chemistry:'lab',biology:'leaf'};
const terms=['7上','7下','8上','8下','9上','9下'];
const termNames={'7上':'初一上','7下':'初一下','8上':'初二上','8下':'初二下','9上':'九年级上','9下':'九年级下'};
const catalog=window.LAB_CATALOG||[],sources=window.LAB_SOURCES||[],modules=window.LAB_MODULES||{};
const byId=new Map(catalog.map(e=>[e.id,e])),sourceMap=new Map(sources.map(s=>[s.id,s]));
let subject='all',term='all',kind='all',query='',favorites=new Set(),records=[];
let selected=null,params={},result=null,ready=false,completed=false,playing=false,busy=false;
let progress=0,frameId=0,epoch=0,prepareTimer=0,calculationTimer=0,calculationFrame=0,toastTimer=0,lastFrame=0;
let engineError=false,manualRecorded=false;
try{favorites=new Set(JSON.parse(localStorage.getItem('science-lab-favorites')||'[]'));}catch{}
try{const saved=JSON.parse(localStorage.getItem('science-lab-records')||'[]');records=Array.isArray(saved)?saved.filter(r=>r&&typeof r.title==='string'&&Array.isArray(r.readings)).slice(-300):[];}catch{}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function saveLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('当前浏览器无法保存，请导出记录留存。');}}
function fmt(value){if(typeof value==='number'){if(!Number.isFinite(value))return '不适用';const a=Math.abs(value);if(a!==0&&(a>=1e7||a<.0001))return value.toExponential(3);return Number(value.toFixed(4)).toLocaleString('zh-CN',{maximumFractionDigits:4,useGrouping:false});}return String(value??'—');}
function matches(e){return(subject==='all'||e.subject===subject)&&(term==='all'||e.term===term||(e.relatedTerms||[]).includes(term))&&(kind==='all'||e.kind===kind)&&(!$('favoritesOnly').checked||favorites.has(e.id))&&(!query||[e.title,e.chapter,e.objective,...(e.tags||[]),...(e.examPoints||[])].join(' ').toLowerCase().includes(query));}
function filtered(){return catalog.filter(matches);}
function hasPartialScope(e){return e?.implementationReview?.status==='needs-implementation';}
function tagMarkup(e){return (hasPartialScope(e)?'<span class="tag scope-partial">部分实现</span>':'')+`<span class="tag subject-${e.subject}">${esc(names[e.subject])}</span><span class="tag">${esc(termNames[e.term]||e.term)}</span><span class="tag">${esc(e.kind)}</span>`+(e.tags||[]).slice(0,3).map(t=>`<span class="tag subtle">${esc(t)}</span>`).join('');}
function renderCatalog(){
 const list=filtered();$('filteredCount').textContent=list.length+' 项';$('totalCount').textContent=catalog.length;
 $('catalogHeading').textContent=(subject==='all'?'全部学科':names[subject])+(term==='all'?'':' · '+termNames[term])+'实验';
 const groups=new Map();for(const e of list){const key=e.subject+'|'+e.term+'|'+e.chapter;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
 $('catalogTree').innerHTML=[...groups].map(([key,entries],i)=>`<details class="chapter-group" ${i<2||entries.some(e=>e.id===selected?.id)?'open':''}><summary><span>${esc(names[entries[0].subject])} · ${esc(termNames[entries[0].term])}</span><b>${esc(entries[0].chapter)}</b><small>${entries.length}</small></summary><div>${entries.map(e=>`<button class="tree-entry ${e.id===selected?.id?'selected':''}" data-open="${esc(e.id)}" title="${esc(e.title)}"><span class="tree-dot"></span>${esc(e.title)}${favorites.has(e.id)?'<i class="favorite-dot" aria-label="已收藏"></i>':''}</button>`).join('')}</div></details>`).join('')||'<p class="sidebar-empty">没有符合条件的实验。</p>';
 $('experimentCards').innerHTML=list.map(e=>`<article class="experiment-card subject-${e.subject}"><button class="card-open" data-open="${esc(e.id)}"><div class="card-subject">${icon(subjectIcon[e.subject])}<span>${esc(names[e.subject])} · ${esc(termNames[e.term])}</span><small>${esc(e.kind)}${hasPartialScope(e)?' · 部分实现':''}</small></div><h3>${esc(e.title)}</h3><p>${esc(e.objective)}</p><div class="card-chapter">${esc(e.chapter)}</div></button><button class="card-favorite ${favorites.has(e.id)?'saved':''}" data-favorite="${esc(e.id)}" aria-label="${favorites.has(e.id)?'取消收藏':'收藏'}${esc(e.title)}">${icon('bookmark')}</button></article>`).join('');
 $('emptyCatalog').hidden=list.length>0;
 $('subjectSummary').innerHTML=Object.entries(names).map(([key,name])=>`<button class="subject-summary-card subject-${key}" data-filter-subject="${key}">${icon(subjectIcon[key])}<span><b>${name}实验</b><small>${key==='physics'?'力、热、声、光、电与磁':key==='chemistry'?'物质、反应与定量关系':'生命结构、功能与环境'}</small></span><strong>${catalog.filter(e=>e.subject===key).length}</strong></button>`).join('');
 $('termStrip').innerHTML=terms.map(t=>`<button class="${term===t?'active':''}" data-filter-term="${t}">${termNames[t]}<small>${catalog.filter(e=>e.term===t&&(subject==='all'||e.subject===subject)).length} 项</small></button>`).join('');
}
function setFilters(){document.querySelectorAll('[data-subject]').forEach(b=>{const active=b.dataset.subject===subject;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$('termSelect').value=term;renderCatalog();}
function openCatalog(){window.LabManualTimer?.dispose();cancelExperiment();selected=null;$('labView').hidden=true;$('catalogView').hidden=false;document.title='初中理化生实验室 · 水管同学';renderCatalog();}
function navigate(id){location.hash=id?'lab='+encodeURIComponent(id):'catalog';if(location.hash==='#catalog')openCatalog();}
function handleHash(){const hash=location.hash.slice(1);if(hash.startsWith('lab=')){const id=decodeURIComponent(hash.slice(4));if(byId.has(id)){selectExperiment(byId.get(id));return;}}openCatalog();}
function cancelCalculation(){clearTimeout(calculationTimer);cancelAnimationFrame(calculationFrame);busy=false;$('calcProgress').hidden=true;$('calculateBtn').hidden=false;$('progressFill').style.width='0%';$('progressTrack').setAttribute('aria-valuenow','0');}
function cancelExperiment(){epoch++;clearTimeout(prepareTimer);cancelAnimationFrame(frameId);cancelCalculation();playing=false;window.LabAudio?.stop();}
function isLive(){return selected?.interaction?.mode!=='playback';}
function isManualTimer(){return selected?.id==='phy-stopwatch-pulse-step';}
function mountManualTimer(){
 $('manualTimer').hidden=!isManualTimer();if(!isManualTimer())return;
 window.LabManualTimer.mount($('manualTimer'),{
  onTick(seconds){if(!isManualTimer())return;params.value=seconds;drawScene();},
  onStop(seconds){if(!isManualTimer())return;params.value=seconds;manualRecorded=true;prepareEvaluation();},
  onReset(){if(!isManualTimer())return;params.value=0;manualRecorded=false;completed=false;cancelExperiment();clearResults();drawScene();}
 });
}
function actionLabel(){return selected?.interaction?.actionLabel||'开始实验';}
function configureInteraction(){
 const live=isLive();$('runBtn').hidden=live;$('pauseBtn').hidden=live;$('playheadLabel').hidden=live;
 $('interactionHint').hidden=!live;$('interactionHint').textContent='调整条件即可观察';
 $('resetBtn').innerHTML=icon('reset')+(live?'恢复默认条件':'重置');
}
function syncAudio(){
 const sound=window.LabAudio?.profile(selected,params,result),state=window.LabAudio?.state;
 $('soundControls').hidden=!sound;if(!sound||!state)return;
 $('soundPreview').disabled=!ready||!sound.available||state.muted||state.volume===0;
 $('soundStop').disabled=!state.playing;$('soundMuted').checked=state.muted;
 $('soundHint').textContent=state.muted?'已静音':sound.reason;
}
function playSound(){const sound=window.LabAudio?.profile(selected,params,result);if(sound?.available)window.LabAudio.play(sound).catch(error=>toast(error.message));}
function defaults(e){return {...(e.modelParams||{}),...Object.fromEntries((e.controls||[]).map(c=>[c.key,c.value]))};}
function list(items,ordered=false){const tag=ordered?'ol':'ul';return `<${tag}>${(items||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</${tag}>`;}
function processMarkup(steps){return(steps||[]).map((step,i)=>`<div class="process-step"><span>${i+1}</span><div><h4>${esc(step.title||'第 '+(i+1)+' 步')}</h4><p>${esc(step.text||step.expression||'')}</p>${step.explanation?`<small>${esc(step.explanation)}</small>`:''}</div></div>`).join('');}
function sourceMarkup(source){return `<article class="source-item"><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a><p>${esc(source.publisher||'')}${source.edition?' · '+esc(source.edition):''}</p><small>${esc(source.scope||'')} ${source.checked?'核对：'+esc(source.checked):''}</small></article>`;}
function selectExperiment(e){
 window.LabManualTimer?.dispose();cancelExperiment();selected=e;manualRecorded=false;params=defaults(e);result=null;ready=false;completed=false;progress=isLive()?1:0;configureInteraction();syncAudio();
 $('catalogView').hidden=true;$('labView').hidden=false;
 $('labTitle').textContent=e.title;document.title=e.title+' · 初中理化生实验室';
 $('labBreadcrumb').textContent=names[e.subject]+' / '+termNames[e.term]+' / '+e.chapter;
 $('labObjective').textContent=e.objective;$('labTags').innerHTML=tagMarkup(e);
 $('favoriteBtn').innerHTML=icon('bookmark')+(favorites.has(e.id)?'已收藏':'收藏实验');$('favoriteBtn').setAttribute('aria-pressed',String(favorites.has(e.id)));
 $('labApparatus').textContent=(e.apparatus||[]).join('、');
 $('labSafety').hidden=!(e.safety||[]).length;$('labSafety').innerHTML=(e.safety||[]).map(s=>`<p>${esc(s)}</p>`).join('');
 $('modelNote').textContent=(e.modelNote||'模拟用于观察规律，真实实验需实际操作和测量。')+(isLive()?'':' 画面播放可暂停和拖动，播放进度不等同于实际经过的时间。');
 $('labScene').setAttribute('aria-label',e.title+'的实验装置与现象');
 $('stopwatch').hidden=e.model!=='incline';
 $('panel-method').innerHTML='<h3>按顺序操作</h3>'+list(e.steps,true);
 $('panel-principle').innerHTML='<h3>观察什么</h3>'+list(e.observations)+'<div class="conclusion-box"><h3>实验结论</h3><p>'+esc(e.conclusion)+'</p></div>';
 $('panel-exam').innerHTML='<div class="exam-columns"><div><h3>常见考点</h3>'+list(e.examPoints)+'</div><div><h3>容易失分的地方</h3>'+list(e.pitfalls)+'</div></div><h3>检查一下自己</h3>'+(e.questions||[]).map((qa,i)=>`<details class="question"><summary>${i+1}. ${esc(qa.q)}</summary><p>${esc(qa.a)}</p></details>`).join('');
 const worked=e.workedExample;
 $('panel-worked').innerHTML=worked?`<h3>${esc(worked.title||'规范作答')}</h3><div class="given-box">${esc(worked.given)}</div><div class="step-process">${processMarkup(worked.steps)}</div><div class="answer-box"><b>答：</b>${esc(worked.answer)}</div>`:'<p>本实验以观察和定性分析为主，请按“现象—比较—结论”的顺序作答。</p>';
 $('panel-sources').innerHTML='<p>本页操作、示意图与讲解为原创。以下资料用于核对实验与教材内容。</p>'+(e.sourceIds||[]).map(id=>sourceMap.has(id)?sourceMarkup(sourceMap.get(id)):'').join('');
 showTab('method');renderControls();mountManualTimer();clearResults();renderCatalog();prepareEvaluation();
 if(innerWidth<800)$('mainContent').scrollIntoView({block:'start'});
}
function renderControls(){
 const markup=c=>{
  if(c.options)return `<label class="control-row select-control"><span>${esc(c.label)}</span><select data-param="${esc(c.key)}">${c.options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(params[c.key])?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>`;
  return `<div class="control-row"><div><label for="control-${esc(c.key)}">${esc(c.label)}</label><span class="numeric-control"><input aria-label="${esc(c.label)}数值" data-param="${esc(c.key)}" type="number" min="${c.min}" max="${c.max}" step="${c.step||1}" value="${params[c.key]}"><small>${esc(c.unit||'')}</small></span></div><input id="control-${esc(c.key)}" data-param="${esc(c.key)}" type="range" min="${c.min}" max="${c.max}" step="${c.step||1}" value="${params[c.key]}"><div class="range-labels"><span>${esc(c.min)} ${esc(c.unit||'')}</span><span>${esc(c.max)} ${esc(c.unit||'')}</span></div>${c.note?`<p class="control-note">${esc(c.note)}</p>`:''}</div>`;
 };
 const controls=selected.controls||[],below=controls.filter(c=>c.placement==='scene');
 $('labControls').innerHTML=controls.filter(c=>c.placement!=='scene').map(markup).join('')||'<p class="fixed-condition">'+(below.length?'在装置下方调节条件。':'按照下方操作步骤，观察装置。')+'</p>';
 $('sceneControls').innerHTML=below.map(markup).join('');$('sceneControls').hidden=!below.length;
}
function changeParam(event){
 const input=event.target;if(!input.dataset.param||!selected)return;
 const c=selected.controls.find(c=>c.key===input.dataset.param);if(!c)return;
 let value=input.value;
 if(c.options){const option=c.options.find(o=>String(o.value)===value);if(!option)return;value=option.value;}
 else{if(value===''||!Number.isFinite(Number(value)))return;value=Math.min(c.max,Math.max(c.min,Number(value)));}
 params[c.key]=value;document.querySelectorAll('[data-param]').forEach(other=>{if(other.dataset.param===c.key&&other!==input)other.value=value;});
 cancelExperiment();completed=false;ready=false;result=null;progress=isLive()?1:0;clearResults();drawScene();syncAudio();
 $('simulationStatus').textContent='正在调整装置';prepareTimer=setTimeout(prepareEvaluation,250);
}
function waitForGodot(){
 if(window.GodotLab?.ready)return Promise.resolve();
 if(engineError)return Promise.reject(new Error('实验组件未能载入，请刷新后重试。'));
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>finish(new Error('实验组件载入较慢，请稍后刷新重试。')),60000);
  function finish(error){clearTimeout(timer);window.removeEventListener('godot-ready',success);window.removeEventListener('godot-error',failure);error?reject(error):resolve();}
  function success(){finish();}function failure(){finish(new Error('实验组件未能载入，请刷新后重试。'));}
  window.addEventListener('godot-ready',success,{once:true});window.addEventListener('godot-error',failure,{once:true});
 });
}
window.addEventListener('godot-error',()=>{engineError=true;});
window.addEventListener('godot-ready',()=>{engineError=false;});
async function prepareEvaluation(){
 if(!selected)return;
 const own=++epoch,e=selected,p={...params};ready=false;$('runBtn').disabled=true;$('pauseBtn').disabled=true;
 $('stageNotice').hidden=false;$('stageNotice').textContent='正在准备实验装置…';$('simulationStatus').textContent='正在准备';
 try{
  if(e.subject==='physics'||e.requiresPhysics)await waitForGodot();
  const mod=modules[e.subject];if(!mod?.simulate||!mod?.render)throw new Error('该实验模块尚未载入，请刷新重试。');
  const next=await mod.simulate(e,p,1);
  if(own!==epoch||selected?.id!==e.id)return;
  if(!next||!Array.isArray(next.readings))throw new Error('实验结果格式异常，请重新选择实验。');
  result=next;ready=true;$('stageNotice').hidden=true;$('runBtn').disabled=false;
  if(isLive()){progress=1;completed=!isManualTimer()||manualRecorded;$('simulationStatus').textContent=isManualTimer()?'手动计时':'可调整条件';$('calculateBtn').disabled=!completed;if(completed)showReadings();}
  else $('simulationStatus').textContent='准备就绪';
  drawScene();syncAudio();
 }catch(error){if(own!==epoch)return;ready=false;$('stageNotice').textContent=error.message||'实验未能载入。';$('stageNotice').hidden=false;$('simulationStatus').textContent='请重新载入';}
}
function drawScene(){
 if(!selected)return;
 try{
  const renderer=modules[selected.subject]?.render;
  const displayResult=isManualTimer()&&result?{...result,values:{...result.values,actual:params.value,indicated:params.value,corrected:params.value}}:result;
  $('labScene').innerHTML=renderer?renderer(selected,params,displayResult,progress):'';
 }catch(error){$('labScene').innerHTML=`<text x="450" y="215" text-anchor="middle" fill="#365c7c" font-size="18">正在准备装置</text>`;}
 $('playhead').value=Math.round(progress*1000);
 if(selected.model==='incline')$('stopwatchTime').textContent=(Number(result?.values?.total||0)*progress).toFixed(3);
}
function clearResults(){
 $('readings').innerHTML='<p class="readings-empty">'+(isManualTimer()?'手动计时并点击“记录并停止”，再分析本次记录。':isLive()?'调整装置条件，观察现象和读数。':'点击“'+esc(actionLabel())+'”，观察装置和数据变化。')+'</p>';
 $('observationText').innerHTML='';$('resultTable').innerHTML='';$('resultGraph').setAttribute('hidden','');
 $('currentProcess').innerHTML='';$('calculationIntro').textContent=isLive()?'根据当前条件下的观察结果，分步分析并记录。':'先完成实验，再根据测量数据进行分析。';
 $('calculateBtn').disabled=true;$('calculateBtn').textContent='分析数据并记录';$('resultLabel').textContent=isLive()?'当前条件下的测量与观察':'完成实验后查看';
 $('pauseBtn').disabled=true;$('runBtn').innerHTML=icon('play')+esc(actionLabel());$('playhead').value=Math.round(progress*1000);
}
function startExperiment(){
 if(isLive()||!ready||!result)return;
 cancelCalculation();if(completed)clearResults();completed=false;$('currentProcess').innerHTML='';$('calculateBtn').disabled=true;
 if(progress>=1)progress=0;if(progress===0)playSound();playing=true;lastFrame=performance.now();
 $('simulationStatus').textContent='实验进行中';$('runBtn').disabled=true;$('pauseBtn').disabled=false;
 $('pauseBtn').innerHTML=icon('pause')+'暂停';
 function tick(now){
  if(!playing)return;
  const seconds=selected.playSeconds||5;
  progress=Math.min(1,progress+(now-lastFrame)/1000/seconds);lastFrame=now;drawScene();
  if(progress>=1){finishExperiment();return;}frameId=requestAnimationFrame(tick);
 }
 frameId=requestAnimationFrame(tick);
}
function finishExperiment(){playing=false;completed=true;$('simulationStatus').textContent=hasPartialScope(selected)?'本段演示结束':'实验完成';$('runBtn').disabled=false;$('runBtn').innerHTML=icon('reset')+'再做一次';$('pauseBtn').disabled=true;$('calculateBtn').disabled=false;showReadings();}
function showReadings(includeCalculated=false){
 if(!result)return;
 $('resultLabel').textContent=includeCalculated?'测量与计算结果':'当前条件下的测量与观察';
 $('readings').innerHTML=result.readings.filter(r=>includeCalculated||!r.derived).map(r=>`<div class="reading"><span>${esc(r.label)}</span><strong>${esc(fmt(r.value))}<small>${esc(r.unit||'')}</small></strong></div>`).join('');
 $('observationText').innerHTML=`<p>${esc(result.observation||result.conclusion||'')}</p>`;
 const table=result.table;
 const columns=table?.headers?.map((_,i)=>i).filter(i=>includeCalculated||!(table.derivedColumns||[]).includes(i));
 $('resultTable').innerHTML=table?.headers&&table?.rows?`<div class="table-scroll"><table><thead><tr>${columns.map(i=>`<th>${esc(table.headers[i])}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr>${columns.map(i=>`<td>${esc(fmt(row[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
 renderGraph(result.graph);
}
function renderGraph(graph){
 const el=$('resultGraph');el.setAttribute('hidden','');if(!graph)return;
 const series=graph.series||[{name:'',points:graph.points||[]}];
 const valid=series.map(s=>({...s,points:(s.points||[]).filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1])))}));
 const all=valid.flatMap(s=>s.points);if(all.length<2)return;
 const xs=all.map(p=>Number(p[0])),ys=all.map(p=>Number(p[1]));let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(0,...ys),y1=Math.max(...ys);
 if(x1===x0)x1=x0+1;if(y1===y0)y1=y0+1;
 const x=v=>65+(v-x0)/(x1-x0)*495,y=v=>175-(v-y0)/(y1-y0)*135;
 let svg='<rect width="600" height="220" fill="#fff"/>';
 for(let i=0;i<=4;i++){const yy=y0+(y1-y0)*i/4,xx=x0+(x1-x0)*i/4;svg+=`<path d="M65 ${y(yy)}H560" stroke="#dde7ed"/><text x="57" y="${y(yy)+4}" text-anchor="end" fill="#547187" font-size="10">${esc(fmt(yy))}</text><text x="${x(xx)}" y="191" text-anchor="middle" fill="#547187" font-size="10">${esc(fmt(xx))}</text>`;}
 svg+='<path d="M65 35V175H565" fill="none" stroke="#55778f"/>';
 const colors=['#245d93','#d08a28','#588357'];valid.forEach((s,i)=>{svg+=`<polyline points="${s.points.map(p=>x(Number(p[0]))+','+y(Number(p[1]))).join(' ')}" fill="none" stroke="${colors[i%3]}" stroke-width="2"/>`;if(s.name)svg+=`<text x="${90+i*160}" y="18" fill="${colors[i%3]}" font-size="11">${esc(s.name)}</text>`;});
 svg+=`<text x="560" y="211" text-anchor="end" fill="#47657c" font-size="11">${esc(graph.xLabel||'')}</text><text x="12" y="25" fill="#47657c" font-size="11">${esc(graph.yLabel||'')}</text>`;
 el.innerHTML=svg;el.removeAttribute('hidden');
}
function showTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('panel-'+b.dataset.tab).hidden=!active;});}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);saveLocal('science-lab-favorites',[...favorites]);renderCatalog();if(selected?.id===id){$('favoriteBtn').innerHTML=icon('bookmark')+(favorites.has(id)?'已收藏':'收藏实验');$('favoriteBtn').setAttribute('aria-pressed',String(favorites.has(id)));}}
function calculate(){
 if(!completed||!result||busy)return;
 busy=true;const own=epoch,e=selected,p={...params},snapshot=result,start=performance.now();
 $('calculateBtn').hidden=true;$('calcProgress').hidden=false;$('currentProcess').innerHTML='';$('calculationIntro').textContent='';
 const animate=now=>{if(!busy||own!==epoch)return;const amount=Math.min(98,Math.floor((1-Math.pow(1-Math.min((now-start)/2000,1),1.35))*100));$('progressFill').style.width=amount+'%';$('progressTrack').setAttribute('aria-valuenow',String(amount));calculationFrame=requestAnimationFrame(animate);};
 calculationFrame=requestAnimationFrame(animate);
 const finish=()=>{
  const rest=2000-(performance.now()-start);if(rest>0){calculationTimer=setTimeout(finish,rest);return;}if(own!==epoch)return;
  busy=false;cancelAnimationFrame(calculationFrame);$('calcProgress').hidden=true;$('calculateBtn').hidden=false;$('calculateBtn').textContent='再次分析并记录';
  $('currentProcess').innerHTML=processMarkup(snapshot.process||[])+`<div class="answer-box"><b>结论：</b>${esc(snapshot.conclusion||e.conclusion)}</div>`;
  showReadings(true);
  records.push({id:e.id,title:e.title,subject:e.subject,term:e.term,time:new Date().toISOString(),params:p,readings:snapshot.readings,conclusion:snapshot.conclusion||e.conclusion});records=records.slice(-300);
  saveLocal('science-lab-records',records);renderRecords();
 };
 calculationTimer=setTimeout(finish,2000);
}
function renderRecords(){
 $('recordBadge').textContent=records.length;$('exportRecords').disabled=!records.length;$('clearRecords').disabled=!records.length;
 $('recordsTable').innerHTML=records.length?`<table><thead><tr><th>时间</th><th>实验</th><th>条件</th><th>结果</th></tr></thead><tbody>${[...records].reverse().map(r=>`<tr><td>${esc(new Date(r.time).toLocaleString('zh-CN'))}</td><td>${esc(r.title)}</td><td>${esc(Object.entries(r.params||{}).map(([k,v])=>{const c=byId.get(r.id)?.controls?.find(c=>c.key===k);return c?c.label+'：'+v+(c.unit||''):'';}).filter(Boolean).join('；'))}</td><td>${esc(r.readings.map(m=>m.label+'：'+fmt(m.value)+(m.unit||'')).join('；'))}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">完成实验并分析数据后，记录会保存在这里。</p>';
}
function exportRecords(){
 const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['时间','学科','学期','实验','参数','结果','结论'],...records.map(r=>[r.time,names[r.subject],r.term,r.title,JSON.stringify(r.params),r.readings.map(m=>m.label+'='+fmt(m.value)+(m.unit||'')).join('; '),r.conclusion])];
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='初中理化生实验记录.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderSources(){
 const unique=[...new Map(sources.map(s=>[s.url,s])).values()];$('sourceList').innerHTML=unique.map(sourceMarkup).join('');
 $('coverageSummary').innerHTML=`<div class="source-summary">${Object.entries(names).map(([key,label])=>`<span>${label} ${catalog.filter(e=>e.subject===key).length} 项</span>`).join('')}</div><p>生物覆盖七、八年级；物理主要对应八年级上下册和九年级全一册；化学对应九年级上下册。年级筛选反映网站归类，具体章节与版本见每个实验来源。</p>`;
}
$('catalogTree').addEventListener('click',event=>{const b=event.target.closest('[data-open]');if(b)navigate(b.dataset.open);});
$('experimentCards').addEventListener('click',event=>{const favorite=event.target.closest('[data-favorite]');if(favorite){toggleFavorite(favorite.dataset.favorite);return;}const b=event.target.closest('[data-open]');if(b)navigate(b.dataset.open);});
document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{subject=b.dataset.subject;setFilters();navigate(null);}));
$('subjectSummary').addEventListener('click',event=>{const b=event.target.closest('[data-filter-subject]');if(b){subject=b.dataset.filterSubject;setFilters();}});
$('termStrip').addEventListener('click',event=>{const b=event.target.closest('[data-filter-term]');if(b){term=term===b.dataset.filterTerm?'all':b.dataset.filterTerm;setFilters();}});
$('termSelect').addEventListener('change',()=>{term=$('termSelect').value;renderCatalog();navigate(null);});
$('kindSelect').addEventListener('change',()=>{kind=$('kindSelect').value;renderCatalog();});
$('catalogSearch').addEventListener('input',()=>{query=$('catalogSearch').value.trim().toLowerCase();renderCatalog();if(selected)navigate(null);});
$('favoritesOnly').addEventListener('change',()=>{renderCatalog();navigate(null);});
$('catalogHome').addEventListener('click',()=>navigate(null));$('backToCatalog').addEventListener('click',()=>navigate(null));
$('favoriteBtn').addEventListener('click',()=>{if(selected)toggleFavorite(selected.id);});
for(const id of ['labControls','sceneControls'])$(id).addEventListener('input',changeParam);
$('soundPreview').addEventListener('click',playSound);$('soundStop').addEventListener('click',()=>window.LabAudio?.stop());
$('soundMuted').addEventListener('change',()=>window.LabAudio?.setMuted($('soundMuted').checked));
$('soundVolume').addEventListener('input',()=>window.LabAudio?.setVolume(Number($('soundVolume').value)/100));
window.addEventListener('lab-audio-state',syncAudio);
$('runBtn').addEventListener('click',startExperiment);
$('pauseBtn').addEventListener('click',()=>{if(playing){playing=false;window.LabAudio?.stop();cancelAnimationFrame(frameId);$('pauseBtn').innerHTML=icon('play')+'继续';$('simulationStatus').textContent='已暂停';}else startExperiment();});
$('resetBtn').addEventListener('click',()=>{if(selected){if(isLive()){selectExperiment(selected);return;}cancelExperiment();progress=0;completed=false;clearResults();ready=!!result;$('runBtn').disabled=!ready;drawScene();$('simulationStatus').textContent=ready?'准备就绪':'正在准备';if(!ready)prepareEvaluation();syncAudio();}});
$('playhead').addEventListener('input',()=>{if(!ready||isLive())return;playing=false;window.LabAudio?.stop();cancelAnimationFrame(frameId);cancelCalculation();progress=Number($('playhead').value)/1000;if(progress<1&&completed){completed=false;clearResults();}drawScene();$('runBtn').disabled=false;$('pauseBtn').disabled=true;if(progress>=1)finishExperiment();else{$('simulationStatus').textContent='观察过程';}});
$('calculateBtn').addEventListener('click',calculate);
document.querySelectorAll('[data-tab]').forEach(button=>{button.addEventListener('click',()=>showTab(button.dataset.tab));button.addEventListener('keydown',event=>{const buttons=[...document.querySelectorAll('[data-tab]')];const index=buttons.indexOf(button);if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();const next=buttons[(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length];showTab(next.dataset.tab);next.focus();}});});
for(const [id,direction]of [['previousExperiment',-1],['nextExperiment',1]])$(id).addEventListener('click',()=>{const choices=filtered(),index=choices.findIndex(e=>e.id===selected?.id),next=choices[(Math.max(0,index)+direction+choices.length)%choices.length];if(next)navigate(next.id);});
$('sourcesBtn').addEventListener('click',()=>$('sourcesDialog').showModal());$('recordsBtn').addEventListener('click',()=>{$('recordsDialog').showModal();renderRecords();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('exportRecords').addEventListener('click',exportRecords);$('clearRecords').addEventListener('click',()=>{records=[];saveLocal('science-lab-records',records);renderRecords();});
$('fullscreenBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('请使用浏览器的全屏功能。');}catch{toast('请使用浏览器的全屏功能。');}});
window.addEventListener('hashchange',handleHash);
renderCatalog();renderRecords();renderSources();handleHash();
