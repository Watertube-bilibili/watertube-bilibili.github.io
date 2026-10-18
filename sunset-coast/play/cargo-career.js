import {semiDriveScale} from './semi-powertrain.js';
// 2.0 Beta: cargo contracts with a render-only box trailer, NOT a physical articulated trailer simulation.
// Payload changes bounded drive/service-brake commands only; the WASM rigid
// body's mass, collision shape and handbrake remain unchanged.
export const CARGO_CONTRACTS=Object.freeze({
 'freight-light':Object.freeze({title:'Semi · 精密设备运输',cargoLabel:'精密设备',massKg:8000,baseReward:2600,from:'port',to:'tech'}),
 'freight-standard':Object.freeze({title:'Semi · 工业港干线',cargoLabel:'工业物资',massKg:18000,baseReward:4800,from:'port',to:'east'}),
 'freight-overload':Object.freeze({title:'Semi · 超载挑战',cargoLabel:'超额建材',massKg:26000,baseReward:5400,from:'port',to:'station'})
});
export const CARGO_RATED_KG=18000;
export const isCargoJob=j=>!!j&&Object.hasOwn(CARGO_CONTRACTS,typeof j==='string'?j:j.type);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cargoEffects(v){
 const kg=v?.model?.id==='semi'&&Number.isFinite(v.cargoPayloadKg)?clamp(v.cargoPayloadKg,0,26000):0;
 return {massKg:kg,overloaded:kg>CARGO_RATED_KG,driveScale:semiDriveScale(v,kg),brakeScale:1/(1+kg/30000)};
}
export function cargoGodotControls(v,controls){const e=cargoEffects(v);return {...controls,throttle:controls.throttle*e.driveScale,manualBrake:controls.manualBrake*e.brakeScale,electronicBrake:controls.electronicBrake*e.brakeScale};}
export function cargoPayout(type,integrity=100){const c=CARGO_CONTRACTS[type];if(!c)return 0;const condition=clamp(Number.isFinite(integrity)?integrity:0,0,100);const overweightFee=c.massKg>CARGO_RATED_KG?1200:0;return Math.max(0,Math.round(c.baseReward*condition/100)-overweightFee);}
export function validCargoSave(job){return isCargoJob(job)&&Number.isInteger(job.stage)&&job.stage>=0&&job.stage<=1&&(job.cargoIntegrity===undefined||Number.isFinite(job.cargoIntegrity)&&job.cargoIntegrity>=0&&job.cargoIntegrity<=100);}
export function makeCargoJob(type,places,time=0){const c=CARGO_CONTRACTS[type];if(!c)return null;const from=places.find(p=>p.id===c.from),to=places.find(p=>p.id===c.to);if(!from||!to)throw Error('货运站点缺失');return {...c,type,stage:0,started:time,hold:0,cargoIntegrity:100,reward:cargoPayout(type),stages:[{...from,name:'装货 · '+from.name},{...to,name:'卸货 · '+to.name}]};}
export function cargoStatus(game){const j=game.job;if(!isCargoJob(j))return {active:false,phase:'待接单',massKg:0,integrity:100,reward:0};return {active:true,phase:j.stage===0?'前往装货':'运输中',cargoLabel:j.cargoLabel,massKg:j.stage===1?j.massKg:0,selectedMassKg:j.massKg,overloaded:j.massKg>CARGO_RATED_KG,integrity:j.cargoIntegrity,reward:cargoPayout(j.type,j.cargoIntegrity),destination:j.stages[j.stage]?.name};}
export function installCargoCareer(game,places){
 if(game.cargoCareerInstalled)return;game.cargoCareerInstalled=true;
 Object.defineProperty(game,'cargoStatus',{get:()=>cargoStatus(game)});
 const base={};for(const k of ['acceptJob','checkJob','cancelJob','snapshot','load','spawnCar','respawn','repair','teleportTo','toggleEntry'])base[k]=game[k].bind(game);
 const clear=()=>{for(const v of game.allVehicles?.()??[game.vehicle])delete v.cargoPayloadKg;};
 const sync=()=>{clear();if(isCargoJob(game.job)&&game.job.stage===1&&game.vehicle.model.id==='semi')game.vehicle.cargoPayloadKg=game.job.massKg;};
 const feedback=()=>{game.ui.updateMission();game.ui.updateAll?.();};
 game.acceptJob=(type,showPrompt=true)=>{
  if(!isCargoJob(type))return base.acceptJob(type,showPrompt);
  if(game.job||game.autonomyTest?.active||game.robotaxi?.active||game.aircraft?.active||game.flight?.active)return game.ui.toast('请先结束当前工作或行程');
  if(game.vehicle.model.id!=='semi'||game.vehicle.isGarageVehicle===false||!game.owned.includes('semi')||(showPrompt&&!game.inCar))return game.ui.toast('请先进入 Semi 再接货运单');
  game.job=makeCargoJob(type,places,game.time);game.job.lastCondition=game.vehicle.condition;sync();
  game.setDestination(game.job.stages[0],false);game.arrivalShown=false;if(showPrompt)game.ui.showMission(false);game.ui.closePhone();game.ui.closeModal();game.ui.toast('货运已接单 · '+(game.job.massKg/1000)+' 吨');feedback();
 };
 game.checkJob=()=>{
  const j=game.job;if(!isCargoJob(j))return base.checkJob();sync();
  if(!game.inCar||game.vehicle.model.id!=='semi'){j.hold=0;return;}
  // Damage only decreases. Repairs cannot replenish cargo or increase payout.
  if(j.stage===1){j.cargoIntegrity=clamp(j.cargoIntegrity-Math.max(0,(j.lastCondition??game.vehicle.condition)-game.vehicle.condition)*1.5,0,100);j.reward=cargoPayout(j.type,j.cargoIntegrity);if(j.cargoIntegrity!==j.lastDisplayedIntegrity){game.ui.updateMission();j.lastDisplayedIntegrity=j.cargoIntegrity;}}
  j.lastCondition=game.vehicle.condition;
  const target=j.stages[j.stage],now=game.time,elapsed=clamp(now-(j.lastCheck??now),0,.1);j.lastCheck=now;
  if(Math.hypot(game.position.x-target.x,game.position.z-target.z)>=10||Math.abs(game.vehicle.speed)>.5){j.hold=0;return;}
  j.hold+=elapsed;if(j.hold<2)return;j.hold=0;
  if(j.stage===0){j.stage=1;sync();game.setDestination(j.stages[1],false);game.ui.toast('装货完成 · '+(j.massKg/1000)+' 吨'+(j.massKg>CARGO_RATED_KG?' · 超载扣款 $1,200，制动距离增加':''));game.save(false);feedback();return;}
  const payout=cargoPayout(j.type,j.cargoIntegrity);game.addMoney(payout,j.title+' · 完好率 '+Math.round(j.cargoIntegrity)+'%');game.jobsCompleted++;game.job=null;clear();game.clearDestination();game.autopilot=false;game.ui.updatePilot();game.save(false);game.ui.toast('卸货完成 · +$'+payout.toLocaleString(),'reward-toast');feedback();
 };
 game.cancelJob=()=>{const cargo=isCargoJob(game.job);base.cancelJob();if(cargo){clear();game.save(false);}};
 game.snapshot=()=>{const s=base.snapshot();if(isCargoJob(game.job)&&s.job)s.job.cargoIntegrity=game.job.cargoIntegrity;return s;};
 game.restoreCargoState=s=>{if(isCargoJob(game.job)){game.job.cargoIntegrity=s.job?.cargoIntegrity??100;game.job.reward=cargoPayout(game.job.type,game.job.cargoIntegrity);game.job.lastCondition=game.vehicle.condition;}sync();};
 game.teleportTo=(...args)=>isCargoJob(game.job)?(game.ui.toast('货运期间不能快速传送；可先取消订单'),{ok:false,reason:'货运进行中'}):base.teleportTo(...args);
 game.toggleEntry=(...args)=>isCargoJob(game.job)&&!game.inCar&&game.nearestCar!==game.vehicle?(game.ui.toast('货运期间请返回当前 Semi'),false):base.toggleEntry(...args);
 for(const service of [game.flight,game.aircraft,game.robotaxi])for(const method of ['start','board','request','requestRide'])if(typeof service?.[method]==='function'){const original=service[method].bind(service);service[method]=(...args)=>isCargoJob(game.job)?{ok:false,reason:'请先完成或取消货运'}:original(...args);}
 game.spawnCar=(...args)=>isCargoJob(game.job)?(game.ui.toast('请先完成或取消货运，再更换车辆'),false):base.spawnCar(...args);
 game.respawn=(...args)=>{if(isCargoJob(game.job))game.cancelJob();return base.respawn(...args);};
 game.repair=(...args)=>{const r=base.repair(...args);if(isCargoJob(game.job))game.job.lastCondition=game.vehicle.condition;return r;};
 installCargoUI(game);
}
function installCargoUI(g){
 const ui=g.ui,render=ui.renderPhone.bind(ui),update=ui.updateMission.bind(ui);
 ui.updateMission=()=>{update();if(!isCargoJob(g.job))return;const s=g.cargoStatus;document.getElementById('mission-kind').textContent='Semi 货运生涯';document.getElementById('mission-desc').textContent=s.destination+' · 停稳 2 秒 · '+(s.selectedMassKg/1000)+' 吨 · 货物 '+Math.round(s.integrity)+'%';document.getElementById('mission-reward').textContent='预计 +$ '+s.reward.toLocaleString();};
 ui.renderPhone=page=>{render(page);if(page!=='jobs')return;const first=document.querySelector('[data-job]');if(!first)return;const panel=document.createElement('section');panel.dataset.cargoJobs='';const p=document.createElement('p');p.className='phone-note';p.textContent='2.0 Beta 货运：需自有 Semi；已配可见货箱、装卸货物与转弯随动。挂车暂为视觉模型，无独立碰撞/铰接物理。载重降低动力和常用制动，手刹不变。超载固定扣款 $1,200；碰撞降低完好率和报酬。';panel.append(p);for(const [type,c]of Object.entries(CARGO_CONTRACTS)){const b=document.createElement('button');b.className='phone-row';b.disabled=!!g.job;b.textContent=c.title+' · '+c.massKg/1000+' 吨 · 完好交付 $'+cargoPayout(type).toLocaleString();b.onclick=()=>g.acceptJob(type);panel.append(b);}first.before(panel);};
}
