import {routeX,checkpoints,emptyState,worldBounds,branches,branchX,repairStations,lake,riverX,areaNameAt,formatDistance} from './world-data.mjs?v=7e701208d4f3ba05';
import {createUI} from './ui.mjs?v=f114600f86cffde3';
import {bootEngine,bootStats} from './boot.mjs?v=ac95ed60b19461bb';
import {createControllers} from './controllers.mjs';
const STORAGE='watertube-ridgebound-v1';
const defaults=()=>({coins:0,snowTires:false,snowUnlocked:false,awards:[],progress:{forest:0,snow:0},region:'forest'});
function readSave(){try{const p=JSON.parse(localStorage.getItem(STORAGE)||'null');if(!p||typeof p!=='object')return defaults();return{coins:Number.isFinite(p.coins)?Math.max(0,Math.floor(p.coins)):0,snowTires:p.snowTires===true,snowUnlocked:p.snowUnlocked===true,awards:Array.isArray(p.awards)?p.awards.filter(x=>typeof x==='string').slice(0,8):[],progress:{forest:Math.max(0,Math.min(4,Math.floor(Number(p.progress?.forest)||0))),snow:Math.max(0,Math.min(4,Math.floor(Number(p.progress?.snow)||0)))},region:p.region==='snow'&&p.snowUnlocked?'snow':'forest'};}catch{return defaults();}}
const save=readSave();let state=emptyState(save.region,save.snowTires),ui,controllers,playing=false,paused=false,selecting=false,won=false,ready=false,bootSync=true,resetPending=null,stuckHint=0,streamHint=0,lastEngineReport=0;
let audioEnabled=false,audioCtx,engineTone,engineGain;
const canvas=document.createElement('canvas');canvas.id='game-canvas';canvas.tabIndex=-1;canvas.setAttribute('aria-label','山野之间 Godot 3D 场景');document.getElementById('viewport').append(canvas);
window.ridgeboundInput={active:false};window.ridgeboundCommands=[];
window.ridgeboundBootstrap={region:save.region,snowTires:save.snowTires,progress:save.progress[save.region]>0&&save.progress[save.region]<4?save.progress[save.region]:0};
const send=(type,data={})=>window.ridgeboundCommands.push({type,...data});
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(save));}catch{ui?.toast('浏览器未允许保存，本次探索仍可继续');}}
function refreshGarage(){ui?.updateGarage({...save,region:state.region});}
function targetName(i){return(state.region==='snow'?['冰川前哨','蓝冰山口','风雪垭口','雪线营地']:checkpoints.map(x=>x.name))[Math.min(3,i)];}
function rewardCheckpoints(previous){for(let i=previous;i<state.checkpoint;i++){const key=state.region+':'+i;if(!save.awards.includes(key)){save.awards.push(key);save.coins+=60;ui.toast('抵达 '+targetName(i)+' · +60 游戏金币');}else ui.toast('抵达 '+targetName(i));}save.progress[state.region]=state.checkpoint;if(state.completed&&state.region==='forest')save.snowUnlocked=true;persist();refreshGarage();}
function clearInput(){ui?.resetInput();window.ridgeboundInput={active:false};}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function pause(){if(!playing)return;paused=true;clearInput();ui.setPaused(true);}
function resume(){closeDialogs();paused=false;ui.setPaused(false);clearInput();}
function resetWorld(region,progress=0,begin=true){resetPending={region,checkpoint:progress>0&&progress<4?progress:0};state=emptyState(region,save.snowTires);state.checkpoint=resetPending.checkpoint;selecting=false;won=false;playing=begin;paused=false;send('reset',{region,snowTires:save.snowTires,progress:resetPending.checkpoint,playing:begin});ui.showWinchTargets(false);ui.setPlaying(begin);clearInput();refreshGarage();}
function switchMap(region){if(!ready)return;if(region==='snow'&&!save.snowUnlocked){ui.toast('先完成山林路线的四个检查点，发现隐藏雪线');return;}closeDialogs();save.region=region;resetWorld(region,0,true);persist();ui.toast(region==='snow'?(save.snowTires?'进入珠峰雪线 · 雪地胎已装配':'普通胎进入珠峰 · 冰面易失控，碰撞会造成车损'):'驶入松风谷 · 沿土路探索');}
function candidates(){return(state.anchors||[]).map(a=>({...a,f:(a.x-state.x)*Math.sin(state.yaw)+(a.z-state.z)*Math.cos(state.yaw)})).sort((a,b)=>(a.d-(a.f>0?10:0))-(b.d-(b.f>0?10:0))).slice(0,8);}
function connect(anchor){send('attach',{id:anchor.id});selecting=false;ui.showWinchTargets(false);ui.toast('绞盘挂钩 · 按住 F 或「收绳」牵引，Q 释放');}
function startAudio(){if(!audioEnabled)return;try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();engineTone=audioCtx.createOscillator();engineTone.type='sawtooth';const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;engineGain=audioCtx.createGain();engineGain.gain.value=.018;engineTone.connect(filter).connect(engineGain).connect(audioCtx.destination);engineTone.start();}audioCtx.resume();}catch{audioEnabled=false;ui.setAudio(false);}}
const actions={
 start(){if(!ready)return;playing=true;paused=false;send('start');ui.setPlaying(true);ui.setPaused(false);refreshGarage();startAudio();ui.toast('W / 方向键驾驶 · C 切换车内视角 · 泥地用低速挡 L');},
 pause(){if(paused)resume();else pause();},resume,
 recover(){if(!ready)return;send('recover');selecting=false;ui.showWinchTargets(false);resume();ui.toast('已返回最近检查点');},
 toggleGear(){if(!ready)return;send('gear');ui.toast(state.lowGear?'高速挡 · 适合平缓路面':'低速挡 · 更强扭矩，适合泥地和陡坡');},
 toggleAWD(){if(!ready)return;send('awd');ui.toast(state.awd?'两轮驱动 · 抓地力降低':'四轮驱动已启用');},
 winch(){if(!ready)return;if(state.winch){ui.toast('按住收绳牵引，按 Q 或释放卸钩');return;}const list=candidates();if(!list.length){ui.toast('24 米内没有锚点，请靠近路边树木');return;}if(selecting){connect(list[0]);return;}selecting=true;ui.showWinchTargets(true);ui.toast('点击高亮锚点 · 再按 E 快速连接前方锚点');},
 detach(){send('detach');selecting=false;ui.showWinchTargets(false);ui.toast('绞盘已释放');},
 camera(){send('camera');ui.toast(['高位观察','车内驾驶 · 方向盘与仪表联动','跟随视角'][state.cameraMode||0]);},
 audio(){audioEnabled=!audioEnabled;ui.setAudio(audioEnabled);if(audioEnabled)startAudio();else audioCtx?.suspend();},
 photo(){if(!ready)return;send('photo');ui.toast('正在保存这片风景…');},
 restart(){if(!ready)return;closeDialogs();resetWorld(state.region,0,true);ui.toast('重新出发 · 金币与雪地胎已保留');},
 garage(){paused=playing;clearInput();refreshGarage();ui.showGarage();},
 buyTires(){if(save.snowTires){ui.toast('雪地胎已装配');return;}if(save.coins<180){ui.toast('还差 '+(180-save.coins)+' 金币 · 首次检查点奖励 60');return;}save.coins-=180;save.snowTires=true;send('tires');persist();refreshGarage();ui.toast('雪地胎已装配 · 冰雪抓地力提升');},
 forestMap(){switchMap('forest');},snowMap(){switchMap('snow');},
 controllerSettings(){paused=playing;clearInput();document.querySelector('#pauseDialog')?.close();controllers.openSettings();},
 repair(){if(!state.repairAvailable){ui.toast('驶近路标旁的小屋，即可免费维修');return;}send('repair');ui.toast('小屋维修完成 · 车身、轮胎与悬挂已恢复');},
};
ui=createUI(actions);controllers=createControllers({toast:ui.toast,onAction(name){if(name==='resume'){resume();return;}actions[name]?.();}});refreshGarage();
const start=document.getElementById('start');start.disabled=true;
const loading=document.getElementById('loading');let loadingText=loading.lastChild;loadingText.textContent=' 正在加载越野世界…';
const targets=document.createElement('div');targets.id='anchorTargets';targets.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:12';document.body.append(targets);
function drawAnchors(){if(!selecting){targets.replaceChildren();return;}const list=candidates(),ids=list.map(a=>a.id).join();if(targets.dataset.ids!==ids||!targets.children.length){targets.replaceChildren();targets.dataset.ids=ids;list.forEach((a,i)=>{const b=document.createElement('button');b.className='anchor-marker';b.style.cssText='position:absolute;pointer-events:auto;transform:translate(-50%,-50%);border:2px solid #ffe1a3;border-radius:50%;background:#254534ee;color:#ffe4ad;width:48px;height:48px;font:600 12px sans-serif;touch-action:manipulation';b.setAttribute('aria-label','连接锚点 '+(i+1));b.addEventListener('click',()=>connect(a));targets.append(b);});}list.forEach((a,i)=>{const b=targets.children[i];if(!b)return;b.style.display=a.visible&&a.sx>.02&&a.sx<.98&&a.sy>.08&&a.sy<.85?'block':'none';b.style.left=a.sx*innerWidth+'px';b.style.top=a.sy*innerHeight+'px';b.textContent=Math.round(a.d)+'m';});}
const map=document.getElementById('minimap'),ctx=map.getContext('2d');map.width=320;map.height=320;
const mapButton=document.getElementById('map-toggle');let mapOverview=false;
const mainRoute=[];for(let z=0;z<=3300;z+=10)mainRoute.push({x:routeX(z),z});
const branchRoutes=branches.map((branch,index)=>{const points=[];for(let z=branch.start;z<branch.end;z+=10)points.push({x:branchX(index,z),z});points.push({x:routeX(branch.end),z:branch.end});return points;});
mapButton.addEventListener('click',()=>{mapOverview=!mapOverview;drawMap();});
function drawMap(){
 if(!ctx)return;const size=320,pad=22,center=size/2;
 const centerX=mapOverview?(worldBounds.minX+worldBounds.maxX)/2:state.x;
 const centerZ=mapOverview?(worldBounds.minZ+worldBounds.maxZ)/2:state.z;
 const span=mapOverview?Math.max(worldBounds.maxX-worldBounds.minX,worldBounds.maxZ-worldBounds.minZ):640;
 const scale=(size-pad*2)/span,xy=(x,z)=>[center-(x-centerX)*scale,center-(z-centerZ)*scale];
 const within=([x,y],margin=14)=>x>=margin&&x<=size-margin&&y>=margin&&y<=size-margin;
 ctx.clearRect(0,0,size,size);ctx.fillStyle=state.region==='snow'?'#344452':'#344838';ctx.fillRect(0,0,size,size);
 ctx.save();ctx.beginPath();ctx.rect(8,8,size-16,size-16);ctx.clip();
 // A metric grid gives both modes the same orientation and scale.
 const grid=mapOverview?500:100;ctx.strokeStyle=state.region==='snow'?'#546474':'#50604b';ctx.lineWidth=1;
 const minX=mapOverview?worldBounds.minX:centerX-span/2-50,maxX=mapOverview?worldBounds.maxX:centerX+span/2+50;
 const minZ=mapOverview?worldBounds.minZ:centerZ-span/2-50,maxZ=mapOverview?worldBounds.maxZ:centerZ+span/2+50;
 for(let x=Math.ceil(minX/grid)*grid;x<=maxX;x+=grid){const a=xy(x,minZ),b=xy(x,maxZ);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 for(let z=Math.ceil(minZ/grid)*grid;z<=maxZ;z+=grid){const a=xy(minX,z),b=xy(maxX,z);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 if(mapOverview){const a=xy(worldBounds.maxX,worldBounds.maxZ),b=xy(worldBounds.minX,worldBounds.minZ);ctx.strokeStyle='#8e9b7c';ctx.lineWidth=1.5;ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}
 const lakePoint=xy(lake.x,lake.z);ctx.fillStyle=state.region==='snow'?'#7799aa':'#729d99';ctx.beginPath();ctx.arc(...lakePoint,lake.radius*scale,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=state.region==='snow'?'#7899ab':'#729d99';ctx.lineWidth=Math.max(3,18*scale);ctx.beginPath();for(let z=1700;z<=2200;z+=10){const p=xy(riverX(z),z);z===1700?ctx.moveTo(...p):ctx.lineTo(...p);}ctx.stroke();
 function pathLine(points,color,width,dash=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((point,index)=>{const p=xy(point.x,point.z);index?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.stroke();ctx.setLineDash([]);}
 branchRoutes.forEach(points=>pathLine(points,'#c5cea8',mapOverview?2.7:3.2,[5,4]));
 pathLine(mainRoute,'#e2bd7d',mapOverview?3.5:4.4);
 // Houses are service points; offset overlapping checkpoint symbols with a short leader.
 for(const station of repairStations){const actual=xy(station.x,station.z);if(!within(actual,7))continue;let [x,y]=actual;
  if(checkpoints.some(cp=>Math.hypot(...xy(cp.x,cp.z).map((v,i)=>v-actual[i]))<17)){x+=18;y+=7;ctx.strokeStyle='#d4e1c6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(...actual);ctx.lineTo(x,y);ctx.stroke();}
  ctx.fillStyle='#cde4bd';ctx.strokeStyle='#24362a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x+5,y);ctx.lineTo(x+5,y+7);ctx.lineTo(x-5,y+7);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#344838';ctx.fillRect(x-1,y+2,3,5);
 }
 checkpoints.forEach((cp,index)=>{const point=xy(cp.x,cp.z);if(!within(point,7))return;ctx.fillStyle=index<state.checkpoint?'#a9ce91':index===state.checkpoint?'#f4c784':'#869376';ctx.strokeStyle='#24372b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...point,index===state.checkpoint?8:6,0,Math.PI*2);ctx.fill();ctx.stroke();});
 const vehicle=xy(state.x,state.z);ctx.save();ctx.translate(...vehicle);ctx.rotate(-state.yaw);ctx.fillStyle='#fff8df';ctx.strokeStyle='#344838';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-7,8);ctx.lineTo(0,4);ctx.lineTo(7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 const target=checkpoints[Math.min(state.checkpoint,checkpoints.length-1)],targetPoint=xy(target.x,target.z),offscreen=!mapOverview&&!state.completed&&!within(targetPoint,26);
 if(offscreen){const dx=targetPoint[0]-center,dy=targetPoint[1]-center,t=(center-22)/Math.max(Math.abs(dx),Math.abs(dy));ctx.save();ctx.translate(center+dx*t,center+dy*t);ctx.rotate(Math.atan2(dx,-dy));ctx.fillStyle='#ffd28d';ctx.strokeStyle='#2a3f31';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-7,6);ctx.lineTo(0,2);ctx.lineTo(7,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 ctx.restore();
 // The line length is derived from meters per pixel, rather than a decorative fixed label.
 const scaleMeters=mapOverview?1000:100,scalePixels=scaleMeters*scale;ctx.strokeStyle='#edf1df';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,size-18);ctx.lineTo(18+scalePixels,size-18);ctx.moveTo(18,size-23);ctx.lineTo(18,size-14);ctx.moveTo(18+scalePixels,size-23);ctx.lineTo(18+scalePixels,size-14);ctx.stroke();
 document.getElementById('map-scale').textContent=formatDistance(scaleMeters);
 document.getElementById('map-mode').textContent=mapOverview?'全图 · 跟随车':'局部 · 看全图';
 mapButton.setAttribute('aria-pressed',String(mapOverview));mapButton.setAttribute('aria-label',mapOverview?'当前为全图，点按切换跟车局部图':'当前为跟车局部图，点按查看全图');
 const direction=document.getElementById('map-target-direction');direction.hidden=!offscreen;
 if(offscreen){const angle=(Math.atan2(-(target.x-state.x),target.z-state.z)*180/Math.PI+360)%360;const bearing=['北','东北','东','东南','南','西南','西','西北'][Math.round(angle/45)%8];direction.textContent='路标在'+bearing;direction.title=targetName(state.checkpoint)+' · '+formatDistance(Math.hypot(target.x-state.x,target.z-state.z));}
 map.dataset.mode=mapOverview?'overview':'local';map.dataset.metersPerPixel=String(1/scale);map.dataset.centerX=String(centerX);map.dataset.centerZ=String(centerZ);
}
window.onRidgeState=next=>{
 lastEngineReport=performance.now();const previous=state;
 state=next;
 if(resetPending){if(next.region===resetPending.region&&next.checkpoint===resetPending.checkpoint){resetPending=null;bootSync=false;}else return;}
 if(ready&&!bootSync&&next.region===previous.region&&next.checkpoint>previous.checkpoint)rewardCheckpoints(previous.checkpoint);
 if(playing&&next.completed&&!won){won=true;paused=true;clearInput();refreshGarage();ui.showVictory(state);}
 const cp=checkpoints[Math.min(state.checkpoint,3)];ui.update(state,{targetName:targetName(state.checkpoint),targetDistance:Math.hypot(state.x-cp.x,state.z-cp.z),heading:-state.yaw,altitude:Math.round((state.region==='snow'?5200:1240)+state.y*(state.region==='snow'?35:8)),elapsed:state.time,areaName:state.areaName||state.segmentName||areaNameAt(state.z)});drawMap();drawAnchors();
 if(playing&&!paused&&state.stuck>4&&state.time-stuckHint>15){stuckHint=state.time;ui.toast(state.region==='snow'&&!state.snowTires?'冰面抓地不足 · 可在车库用金币换雪地胎':'试试低速挡 L，或 E 连接锚点、F 收绳脱困');}
 if(state.blocked&&performance.now()-streamHint>6000){streamHint=performance.now();ui.toast('正在准备前方路段 · 已为你停稳');}
};
window.onRidgePhoto=data=>{const a=document.createElement('a');a.download='山野之间-'+(state.region==='snow'?'珠峰雪线':'松风谷')+'.png';a.href=data;a.click();ui.toast('风景照片已保存');};
window.onRidgeReady=()=>{ready=true;bootSync=false;resetPending=null;bootStats.readyMs=performance.now()-bootStats.startedAt;start.disabled=false;ui.setReady?.(true);loading.hidden=true;refreshGarage();};
let drag=null;canvas.addEventListener('pointerdown',e=>{if(e.button===0){drag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId&&playing&&!paused){send('orbit',{delta:(drag.x-e.clientX)*.006});drag.x=e.clientX;}});for(const name of['pointerup','pointercancel'])canvas.addEventListener(name,()=>drag=null);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',()=>{if(playing&&!paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(playing&&!paused)pause();}});
let fpsFrames=0,fpsTime=0,frameLast=0;
function frame(now){requestAnimationFrame(frame);const dt=frameLast?Math.min((now-frameLast)/1000,.2):1/60;frameLast=now;fpsFrames++;fpsTime+=dt;const pad=controllers.sample(),keys=ui.input;const active=ready&&playing&&!paused&&!document.querySelector('dialog[open]')&&!resetPending&&!document.hidden;
 window.ridgeboundInput=active?{active:true,throttle:Math.max(keys.throttle,pad.throttle||0),reverse:Math.max(keys.reverse,pad.reverse||0),steer:Math.abs(keys.steer)>.01?keys.steer:(pad.steer||0),brake:keys.brake,brakeValue:keys.brake?1:(pad.brakeValue||(pad.brake?1:0)),reel:keys.reel||pad.reel,clutch:pad.clutch||0}:{active:false};
 controllers.updateFeedback({...state,steer:state.steering||0,paused:!active});
 if(engineTone&&audioEnabled){engineTone.frequency.setTargetAtTime(32+Math.abs(state.speed)*9+(window.ridgeboundInput.throttle?12:0),audioCtx.currentTime,.1);engineGain.gain.setTargetAtTime(active?.018:.003,audioCtx.currentTime,.1);}
}
requestAnimationFrame(frame);
window.ridgebound={get state(){return structuredClone(state);},get save(){return structuredClone(save);},get status(){return{engine:'Godot 4.6',ready,playing,paused,selecting,resetPending,averageFps:fpsFrames/fpsTime,lastEngineReport,boot:structuredClone(bootStats)};}};
function fail(error){console.error(error);ready=false;clearInput();loading.hidden=true;const panel=document.getElementById('error');panel.hidden=false;panel.innerHTML='<h2>山野暂时没有打开</h2><p>请使用支持 WebGL 2 的新版 Chrome、Safari 或 Edge。首次加载需要下载游戏文件，请检查网络后重试。</p><button id="retry-engine">重新载入</button><a href="../projects.html">返回项目</a>';document.getElementById('retry-engine').onclick=()=>location.reload();}
try{
 await bootEngine({canvas,report:message=>{if(!ready)loadingText.textContent=' '+message;},onError:message=>console.error('[Godot]',message)});
}catch(error){fail(error);}
