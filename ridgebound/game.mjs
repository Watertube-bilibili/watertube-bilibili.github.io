import {routeX,checkpoints,emptyState,worldBounds,branches,branchX,repairStations,lakes,riverX,areaNameAt,formatDistance} from './world-data.mjs?v=7bd02ac574a3a9e1';
import {createUI} from './ui.mjs?v=43e5279a8f32c039';
import {bootEngine,bootStats} from './boot.mjs?v=f22f4cde6434d488';
import {createControllers} from './controllers.mjs';
import {createDeviceLayout} from './device-layout.mjs';
const STORAGE='watertube-ridgebound-v1';
const QUALITY_KEY = 'watertube-ridgebound-quality';
const VEHICLE_KEY = 'watertube-ridgebound-vehicle';
const BRAKE_FORCE_KEY = 'watertube-ridgebound-max-brake-force';
const VEHICLES = ['rover', 'yuchuan'];
let vehicleId = 'rover';
let maxBrakeForce = 1400;
function normalizedBrakeForce(value) {
 const number = String(value ?? '').trim() === '' ? NaN : Number(value);
 return Number.isFinite(number) ? Math.round(Math.min(2500, Math.max(300, number))) : 1400;
}
const MAP_TEMP_PATH = '/tmp/ridgebound-import.zip';
const MAX_MAP_BYTES = 128 * 1024 * 1024;
const qualityOptions = ['auto', 'quality', 'performance'];
let graphicsQuality = 'auto';
try {
 const savedQuality = localStorage.getItem(QUALITY_KEY);
 if (qualityOptions.includes(savedQuality)) graphicsQuality = savedQuality;
 const savedVehicle = localStorage.getItem(VEHICLE_KEY);
 if (VEHICLES.includes(savedVehicle)) vehicleId = savedVehicle;
 maxBrakeForce = normalizedBrakeForce(localStorage.getItem(BRAKE_FORCE_KEY));
} catch {}
let engine;
let activeImport = 0;
let importSequence = 0;
const defaults=()=>({coins:0,snowTires:false,snowUnlocked:false,awards:[],progress:{forest:0,snow:0},region:'forest'});
function readSave(){try{const p=JSON.parse(localStorage.getItem(STORAGE)||'null');if(!p||typeof p!=='object')return defaults();return{coins:Number.isFinite(p.coins)?Math.max(0,Math.floor(p.coins)):0,snowTires:p.snowTires===true,snowUnlocked:p.snowUnlocked===true,awards:Array.isArray(p.awards)?p.awards.filter(x=>typeof x==='string').slice(0,8):[],progress:{forest:Math.max(0,Math.min(4,Math.floor(Number(p.progress?.forest)||0))),snow:Math.max(0,Math.min(4,Math.floor(Number(p.progress?.snow)||0)))},region:p.region==='snow'&&p.snowUnlocked?'snow':'forest'};}catch{return defaults();}}
const save=readSave();let state=emptyState(save.region,save.snowTires),ui,controllers,playing=false,paused=false,selecting=false,won=false,ready=false,bootSync=true,resetPending=null,stuckHint=0,streamHint=0,lastEngineReport=0;
let audioEnabled=false,audioCtx,engineTone,engineGain;
let orbitDrag = null;
const canvas=document.createElement('canvas');canvas.id='game-canvas';canvas.tabIndex=-1;canvas.setAttribute('aria-label','山野之间 Godot 3D 场景');document.getElementById('viewport').append(canvas);
window.ridgeboundInput={active:false};window.ridgeboundCommands=[];
window.ridgeboundBootstrap={region:save.region,snowTires:save.snowTires,progress:save.progress[save.region]>0&&save.progress[save.region]<4?save.progress[save.region]:0,vehicleId,maxForceN:maxBrakeForce};
const send=(type,data={})=>window.ridgeboundCommands.push({type,...data});
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(save));}catch{ui?.toast('浏览器未允许保存，本次探索仍可继续');}}
function refreshGarage() {
 ui?.updateGarage({...save, region:state.region, customMapName:state.customMap?.name || ''});
 for (const id of VEHICLES) {
  const button = document.getElementById('vehicle-' + id);
  const selected = id === vehicleId;
  button.disabled = !ready;
  button.classList.toggle('selected', selected);
  button.setAttribute('aria-pressed', String(selected));
 }
 document.getElementById('garage-brake-fault').hidden = !state.brakePedalBroken;
}
function targetName(i){return(state.region==='snow'?['冰川前哨','蓝冰山口','风雪垭口','雪线营地']:checkpoints.map(x=>x.name))[Math.min(3,i)];}
function rewardCheckpoints(previous){for(let i=previous;i<state.checkpoint;i++){const key=state.region+':'+i;if(!save.awards.includes(key)){save.awards.push(key);save.coins+=60;ui.toast('抵达 '+targetName(i)+' · +60 游戏金币');}else ui.toast('抵达 '+targetName(i));}save.progress[state.region]=state.checkpoint;if(state.completed&&state.region==='forest')save.snowUnlocked=true;persist();refreshGarage();}
function clearInput(){cancelOrbitDrag();ui?.resetInput();window.ridgeboundInput={active:false};}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function pause(){if(!playing)return;paused=true;clearInput();ui.setPaused(true);}
function resume(){closeDialogs();paused=false;ui.setPaused(false);clearInput();}
function resetWorld(region,progress=0,begin=true){resetPending={region,checkpoint:progress>0&&progress<4?progress:0};state=emptyState(region,save.snowTires);state.checkpoint=resetPending.checkpoint;selecting=false;won=false;playing=begin;paused=false;send('reset',{region,snowTires:save.snowTires,progress:resetPending.checkpoint,playing:begin});ui.showWinchTargets(false);ui.setPlaying(begin);clearInput();refreshGarage();}
function switchMap(region){if(!ready)return;if(region==='snow'&&!save.snowUnlocked){ui.toast('先完成山林路线的四个检查点，发现隐藏雪线');return;}closeDialogs();if(region!=='custom'){save.region=region;persist();}resetWorld(region,0,true);ui.toast(region==='snow'?(save.snowTires?'进入珠峰雪线 · 雪地胎已装配':'普通胎进入珠峰 · 冰面易失控，碰撞会造成车损'):region==='custom'?'驶入自定义地图':'驶入松风谷 · 沿土路探索');}
function selectedEndpoint() {
 return document.getElementById('winch-endpoint')?.value === 'rear' ? 'rear' : 'front';
}
function candidates(){const sign=selectedEndpoint()==='rear'?-1:1;return(state.anchors||[]).map(a=>({...a,f:(a.x-state.x)*Math.sin(state.yaw)+(a.z-state.z)*Math.cos(state.yaw)})).sort((a,b)=>(a.d-(a.f*sign>0?10:0))-(b.d-(b.f*sign>0?10:0))).slice(0,8);}
function connect(anchor) {
 send('attach', {id:anchor.id, endpoint:selectedEndpoint()});
 selecting = false;
 ui.showWinchTargets(false);
}
function startAudio(){if(!audioEnabled)return;try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();engineTone=audioCtx.createOscillator();engineTone.type='sawtooth';const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;engineGain=audioCtx.createGain();engineGain.gain.value=.018;engineTone.connect(filter).connect(engineGain).connect(audioCtx.destination);engineTone.start();}audioCtx.resume();}catch{audioEnabled=false;ui.setAudio(false);}}
const actions={
 start(){if(!ready)return;playing=true;paused=false;send('vehicle',{id:vehicleId});send('start');ui.setPlaying(true);ui.setPaused(false);refreshGarage();startAudio();ui.toast(matchMedia('(pointer: coarse), (max-width: 900px)').matches ? '左手转方向盘，右手操作踏板' : 'W / 方向键驾驶 · C 切换车内视角 · 泥地用低速挡 L');},
 pause(){if(paused)resume();else pause();},resume,
 recover(){if(!ready)return;send('recover');selecting=false;ui.showWinchTargets(false);resume();ui.toast('已返回最近检查点');},
 toggleGear(){if(!ready)return;send('gear');ui.toast(state.lowGear?'高速挡 · 适合平缓路面':'低速挡 · 更强扭矩，适合泥地和陡坡');},
 toggleAWD(){if(!ready)return;send('awd');ui.toast(state.awd?'两轮驱动 · 抓地力降低':'四轮驱动已启用');},
 winch(){if(!ready)return;if(state.winch){ui.toast('按住收绳牵引，按 Q 或释放卸钩');return;}const list=candidates();if(!list.length){ui.toast('24 米内没有锚点，请靠近路边树木');return;}if(selecting){connect(list[0]);return;}selecting=true;ui.showWinchTargets(true);ui.toast('点击高亮锚点 · 再按 E 快速连接');},
 detach(){send('detach');selecting=false;ui.showWinchTargets(false);ui.toast('绞盘已释放');},
 camera(){cancelOrbitDrag();send('camera');ui.toast(['高位观察','车内驾驶 · 方向盘与仪表联动','跟随视角'][state.cameraMode||0]);},
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
const mapFileInput = document.getElementById('map-import-file');
const mapImportButton = document.getElementById('map-import-button');
const mapImportStatus = document.getElementById('map-import-status');
const graphicsSelect = document.getElementById('graphics-quality');
const brakeForceInput = document.getElementById('brake-force-calibration');
brakeForceInput.value = String(maxBrakeForce);
brakeForceInput.addEventListener('change', () => {
 maxBrakeForce = normalizedBrakeForce(brakeForceInput.value);
 brakeForceInput.value = String(maxBrakeForce);
 try { localStorage.setItem(BRAKE_FORCE_KEY, String(maxBrakeForce)); } catch {}
 if (ready) send('pedal_calibration', {maxForceN:maxBrakeForce});
});
for (const id of VEHICLES) {
 document.getElementById('vehicle-' + id).addEventListener('click', () => {
  if (!ready || id === vehicleId) return;
  clearInput();
  vehicleId = id;
  try { localStorage.setItem(VEHICLE_KEY, id); } catch {}
  send('vehicle', {id});
  refreshGarage();
 });
}
const brakeFault = document.getElementById('brake-fault');
const brakePressure = document.getElementById('brake-pressure-hud');

function reportImport(message) {
 if (mapImportStatus) mapImportStatus.textContent = message;
}

async function importMap(file) {
 if (!file || !ready || !engine || activeImport) return;
 if (!/\.zip$/i.test(file.name) || file.size === 0 || file.size > MAX_MAP_BYTES) {
  reportImport('请选择大小不超过 128 MB 的地图 ZIP。');
  return;
 }
 activeImport = ++importSequence;
 mapImportButton.disabled = true;
 clearInput();
 reportImport('正在读取地图…');
 try {
  const bytes = new Uint8Array(await file.arrayBuffer());
  engine.copyToFS(MAP_TEMP_PATH, bytes);
  send('import_map', {path:MAP_TEMP_PATH, requestId:activeImport});
 } catch (error) {
  reportImport('地图读取失败，请重新选择 ZIP。');
  activeImport = 0;
  mapImportButton.disabled = false;
  console.warn('地图文件不可用', error);
 }
}

function finishImport(result) {
 if (!activeImport || Number(result?.requestId) !== activeImport) return;
 activeImport = 0;
 mapImportButton.disabled = false;
 if (!result.ok) {
  reportImport(result.error || '无法读取这张地图。');
  return;
 }
 reportImport(result.summary?.warnings || '地图已就绪。');
 closeDialogs();
 playing = true;
 paused = false;
 selecting = false;
 won = false;
 ui.showWinchTargets(false);
 ui.setPlaying(true);
 ui.setPaused(false);
 refreshGarage();
 clearInput();
 ui.toast('驶入 ' + (state.customMap?.name || '自定义地图'));
}

mapImportButton?.addEventListener('click', () => mapFileInput?.click());
mapFileInput?.addEventListener('change', event => {
 const file = event.target.files?.[0];
 event.target.value = '';
 void importMap(file);
});
document.getElementById('customMap')?.addEventListener('click', () => {
 if (state.customMap?.name) switchMap('custom');
});
if (graphicsSelect) {
 graphicsSelect.value = graphicsQuality;
 graphicsSelect.addEventListener('change', () => {
  if (!qualityOptions.includes(graphicsSelect.value)) return;
  graphicsQuality = graphicsSelect.value;
  try { localStorage.setItem(QUALITY_KEY, graphicsQuality); } catch {}
  if (ready) send('quality', {profile:graphicsQuality});
 });
}

const start=document.getElementById('start');start.disabled=true;
const loading=document.getElementById('loading');let loadingText=loading.lastChild;loadingText.textContent=' 正在加载越野世界…';
const deviceLayout = createDeviceLayout();
const targets=document.createElement('div');targets.id='anchorTargets';targets.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:12';document.body.append(targets);
function drawAnchors(){if(!selecting){targets.replaceChildren();return;}const list=candidates(),ids=list.map(a=>a.id).join();if(targets.dataset.ids!==ids||!targets.children.length){targets.replaceChildren();targets.dataset.ids=ids;list.forEach((a,i)=>{const b=document.createElement('button');b.className='anchor-marker';b.style.cssText='position:absolute;pointer-events:auto;transform:translate(-50%,-50%);border:2px solid #ffe1a3;border-radius:50%;background:#254534ee;color:#ffe4ad;width:48px;height:48px;font:600 12px sans-serif;touch-action:manipulation';b.setAttribute('aria-label','连接锚点 '+(i+1));b.addEventListener('click',()=>connect(a));targets.append(b);});}list.forEach((a,i)=>{const b=targets.children[i];if(!b)return;const x=a.sx*innerWidth,y=a.sy*innerHeight;b.style.display=a.visible&&a.sx>.02&&a.sx<.98&&a.sy>.08&&a.sy<.85&&deviceLayout.contains(x,y,24)?'block':'none';b.style.left=x+'px';b.style.top=y+'px';b.textContent=Math.round(a.d)+'m';});}
const map=document.getElementById('minimap'),ctx=map.getContext('2d');map.width=320;map.height=320;
const mapButton=document.getElementById('map-toggle');let mapOverview=false;
const mapRoads = [
  {start:worldBounds.minZ,end:worldBounds.maxZ,xAt:routeX},
  ...branches.map((branch,index) => ({...branch,xAt:z=>branchX(index,z)})),
];
mapButton.addEventListener('click',()=>{mapOverview=!mapOverview;drawMap();});
function drawMap(){
 if(!ctx)return;const size=320,pad=22,center=size/2;
 const custom = state.region === 'custom';
 const imported = state.customMap?.bounds;
 const bounds = custom && imported && ['minX','maxX','minZ','maxZ'].every(key=>Number.isFinite(imported[key])) ? imported : worldBounds;
 const centerX=mapOverview?(bounds.minX+bounds.maxX)/2:state.x;
 const centerZ=mapOverview?(bounds.minZ+bounds.maxZ)/2:state.z;
 const span=mapOverview?Math.max(bounds.maxX-bounds.minX,bounds.maxZ-bounds.minZ):640;
 const scale=(size-pad*2)/span,xy=(x,z)=>[center-(x-centerX)*scale,center-(z-centerZ)*scale];
 const within=([x,y],margin=14)=>x>=margin&&x<=size-margin&&y>=margin&&y<=size-margin;
 ctx.clearRect(0,0,size,size);ctx.fillStyle=state.region==='snow'?'#344452':'#344838';ctx.fillRect(0,0,size,size);
 ctx.save();ctx.beginPath();ctx.rect(8,8,size-16,size-16);ctx.clip();
 // A metric grid gives both modes the same orientation and scale.
 const grid=mapOverview?Math.max(25, Math.round(span/600)*100):100;ctx.strokeStyle=state.region==='snow'?'#546474':'#50604b';ctx.lineWidth=1;
 const minX=mapOverview?bounds.minX:centerX-span/2-50,maxX=mapOverview?bounds.maxX:centerX+span/2+50;
 const minZ=mapOverview?bounds.minZ:centerZ-span/2-50,maxZ=mapOverview?bounds.maxZ:centerZ+span/2+50;
 for(let x=Math.ceil(minX/grid)*grid;x<=maxX;x+=grid){const a=xy(x,minZ),b=xy(x,maxZ);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 for(let z=Math.ceil(minZ/grid)*grid;z<=maxZ;z+=grid){const a=xy(minX,z),b=xy(maxX,z);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 if(mapOverview||custom){const a=xy(bounds.maxX,bounds.maxZ),b=xy(bounds.minX,bounds.minZ);ctx.strokeStyle='#8e9b7c';ctx.lineWidth=1.5;ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}
 ctx.fillStyle=state.region==='snow'?'#7799aa':'#729d99';
 for(const lake of custom ? [] : lakes){
  if(lake.z+lake.radius<minZ||lake.z-lake.radius>maxZ||lake.x+lake.radius<minX||lake.x-lake.radius>maxX)continue;
  ctx.beginPath();
  ctx.arc(...xy(lake.x,lake.z),lake.radius*scale,0,Math.PI*2);
  ctx.fill();
 }
 function drawRoad({start,end,xAt},color,width,dash=[]){
  const from=Math.max(start,minZ),to=Math.min(end,maxZ);
  if(from>=to)return;
  const step=mapOverview?100:12;
  ctx.strokeStyle=color;
  ctx.lineWidth=width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(...xy(xAt(from),from));
  for(let z=from+step;z<to;z+=step)ctx.lineTo(...xy(xAt(z),z));
  ctx.lineTo(...xy(xAt(to),to));
  ctx.stroke();
  ctx.setLineDash([]);
 }
 if (!custom) {
  drawRoad({start:7300,end:10400,xAt:riverX},state.region==='snow'?'#66899b':'#6f8c75',Math.max(1.5,26*scale));
  mapRoads.slice(1).forEach(road=>drawRoad(road,'#c5cea8',mapOverview?1.8:3.2,mapOverview?[]:[5,4]));
  drawRoad(mapRoads[0],'#e2bd7d',mapOverview?2.4:4.4);
 }
 // Houses are service points; offset overlapping checkpoint symbols with a short leader.
 for(const station of custom ? [] : repairStations){const actual=xy(station.x,station.z);if(!within(actual,7))continue;let [x,y]=actual;
  if(checkpoints.some(cp=>Math.hypot(...xy(cp.x,cp.z).map((v,i)=>v-actual[i]))<17)){x+=18;y+=7;ctx.strokeStyle='#d4e1c6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(...actual);ctx.lineTo(x,y);ctx.stroke();}
  ctx.fillStyle='#cde4bd';ctx.strokeStyle='#24362a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x+5,y);ctx.lineTo(x+5,y+7);ctx.lineTo(x-5,y+7);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#344838';ctx.fillRect(x-1,y+2,3,5);
 }
 (custom ? [] : checkpoints).forEach((cp,index)=>{const point=xy(cp.x,cp.z);if(!within(point,7))return;ctx.fillStyle=index<state.checkpoint?'#a9ce91':index===state.checkpoint?'#f4c784':'#869376';ctx.strokeStyle='#24372b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...point,index===state.checkpoint?8:6,0,Math.PI*2);ctx.fill();ctx.stroke();});
 const vehicle=xy(state.x,state.z);ctx.save();ctx.translate(...vehicle);ctx.rotate(-state.yaw);ctx.fillStyle='#fff8df';ctx.strokeStyle='#344838';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-7,8);ctx.lineTo(0,4);ctx.lineTo(7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 const target=checkpoints[Math.min(state.checkpoint,checkpoints.length-1)],targetPoint=xy(target.x,target.z),offscreen=!custom&&!mapOverview&&!state.completed&&!within(targetPoint,26);
 if(offscreen){const dx=targetPoint[0]-center,dy=targetPoint[1]-center,t=(center-22)/Math.max(Math.abs(dx),Math.abs(dy));ctx.save();ctx.translate(center+dx*t,center+dy*t);ctx.rotate(Math.atan2(dx,-dy));ctx.fillStyle='#ffd28d';ctx.strokeStyle='#2a3f31';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-7,6);ctx.lineTo(0,2);ctx.lineTo(7,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 ctx.restore();
 // The line length is derived from meters per pixel, rather than a decorative fixed label.
 const scaleMeters=mapOverview?Math.max(10,Math.round(span/500)*100):100,scalePixels=scaleMeters*scale;ctx.strokeStyle='#edf1df';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,size-18);ctx.lineTo(18+scalePixels,size-18);ctx.moveTo(18,size-23);ctx.lineTo(18,size-14);ctx.moveTo(18+scalePixels,size-23);ctx.lineTo(18+scalePixels,size-14);ctx.stroke();
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
 if (next.importResult) finishImport(next.importResult);
 if (next.region !== previous.region || next.vehicleId !== previous.vehicleId || next.brakePedalBroken !== previous.brakePedalBroken) refreshGarage();
 brakeFault.hidden = !next.brakePedalBroken;
 const pedalForce = Number.isFinite(next.pedalForceN) ? Math.max(0, Math.round(next.pedalForceN)) : 0;
 brakePressure.hidden = !pedalForce;
 if (pedalForce) brakePressure.textContent = '制动 ' + pedalForce + ' N';
 if(resetPending){if(next.region===resetPending.region&&next.checkpoint===resetPending.checkpoint){resetPending=null;bootSync=false;}else return;}
 if(ready&&!bootSync&&next.region!=='custom'&&next.region===previous.region&&next.checkpoint>previous.checkpoint)rewardCheckpoints(previous.checkpoint);
 if(playing&&next.region!=='custom'&&next.completed&&!won){won=true;paused=true;clearInput();refreshGarage();ui.showVictory(state);}
 const cp=checkpoints[Math.min(state.checkpoint,3)];ui.update(state,{targetName:state.region==='custom'?'自由探索':targetName(state.checkpoint),targetDistance:state.region==='custom'?0:Math.hypot(state.x-cp.x,state.z-cp.z),heading:-state.yaw,altitude:Math.round((state.region==='snow'?5200:1240)+state.y),elapsed:state.time,areaName:state.areaName||state.segmentName||areaNameAt(state.z,state.region)});drawMap();drawAnchors();
 if(playing&&!paused&&state.stuck>4&&state.time-stuckHint>15){stuckHint=state.time;ui.toast(state.region==='snow'&&!state.snowTires?'冰面抓地不足 · 可在车库用金币换雪地胎':'试试低速挡 L，或 E 连接锚点、F 收绳脱困');}
 if(state.blocked&&performance.now()-streamHint>6000){streamHint=performance.now();ui.toast('正在准备前方路段 · 已为你停稳');}
};
window.onRidgePhoto=data=>{const a=document.createElement('a');a.download='山野之间-'+(state.region==='snow'?'珠峰雪线':'松风谷')+'.png';a.href=data;a.click();ui.toast('风景照片已保存');};
window.onRidgeReady=()=>{ready=true;bootSync=false;resetPending=null;bootStats.readyMs=performance.now()-bootStats.startedAt;start.disabled=false;ui.setReady?.(true);loading.hidden=true;refreshGarage();send('quality',{profile:graphicsQuality});send('vehicle',{id:vehicleId});send('pedal_calibration',{maxForceN:maxBrakeForce});};
const orbitSensitivity = 0.006;
function canOrbit() {
 const mode = state.cameraMode ?? 0;
 return ready && playing && !paused && !selecting && !resetPending
   && (mode === 0 || mode === 1) && !document.hidden && !document.querySelector('dialog[open]');
}
function cancelOrbitDrag(pointerId = orbitDrag?.id) {
 if (!orbitDrag || orbitDrag.id !== pointerId) return;
 orbitDrag = null;
 if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
}
canvas.addEventListener('pointerdown', event => {
 if (event.button !== 0 || orbitDrag || !canOrbit()) return;
 orbitDrag = {id:event.pointerId, x:event.clientX, y:event.clientY};
 try { canvas.setPointerCapture(event.pointerId); } catch {}
 event.preventDefault();
});
window.addEventListener('pointermove', event => {
 if (orbitDrag?.id !== event.pointerId) return;
 if (!canOrbit() || (event.pointerType === 'mouse' && !(event.buttons & 1))) {
  cancelOrbitDrag(event.pointerId);
  return;
 }
 const delta = (orbitDrag.x - event.clientX) * orbitSensitivity;
 const pitchDelta = (event.clientY - orbitDrag.y) * orbitSensitivity;
 orbitDrag.x = event.clientX;
 orbitDrag.y = event.clientY;
 if (delta || pitchDelta) send('orbit', {delta, pitchDelta});
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
 window.addEventListener(name, event => cancelOrbitDrag(event.pointerId), true);
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',()=>{cancelOrbitDrag();if(playing&&!paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(playing&&!paused)pause();}});
let fpsFrames=0,fpsTime=0,frameLast=0;
function frame(now){requestAnimationFrame(frame);const dt=frameLast?Math.min((now-frameLast)/1000,.2):1/60;frameLast=now;fpsFrames++;fpsTime+=dt;const pad=controllers.sample(),keys=ui.input;const active=ready&&playing&&!paused&&!document.querySelector('dialog[open]')&&!resetPending&&!document.hidden;
 window.ridgeboundInput=active?{active:true,throttle:Math.max(keys.throttle,pad.throttle||0),reverse:Math.max(keys.reverse,pad.reverse||0),steer:Math.abs(keys.steer)>.01?keys.steer:(pad.steer||0),brake:keys.brake,brakeValue:keys.brake?1:(pad.brakeValue||(pad.brake?1:0)),reel:keys.reel||pad.reel,payout:keys.payout||false,clutch:pad.clutch||0}:{active:false};
 controllers.updateFeedback({...state,steer:state.steering||0,paused:!active});
 if(engineTone&&audioEnabled){engineTone.frequency.setTargetAtTime(32+Math.abs(state.speed)*9+(window.ridgeboundInput.throttle?12:0),audioCtx.currentTime,.1);engineGain.gain.setTargetAtTime(active?.018:.003,audioCtx.currentTime,.1);}
}
requestAnimationFrame(frame);
window.ridgebound={get state(){return structuredClone(state);},get save(){return structuredClone(save);},get status(){return{engine:'Godot 4.6',ready,playing,paused,selecting,resetPending,averageFps:fpsFrames/fpsTime,lastEngineReport,boot:structuredClone(bootStats)};}};
function fail(error){console.error(error);ready=false;clearInput();loading.hidden=true;const panel=document.getElementById('error');panel.hidden=false;panel.innerHTML='<h2>山野暂时没有打开</h2><p>请使用支持 WebGL 2 的新版 Chrome、Safari 或 Edge。首次加载需要下载游戏文件，请检查网络后重试。</p><button id="retry-engine">重新载入</button><a href="../projects.html">返回项目</a>';document.getElementById('retry-engine').onclick=()=>location.reload();}
try{
 engine=await bootEngine({canvas,report:message=>{if(!ready)loadingText.textContent=' '+message;},onError:message=>console.error('[Godot]',message)});
}catch(error){fail(error);}
