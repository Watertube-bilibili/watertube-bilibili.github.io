import {getVehicleCollider} from './vehicle-dynamics.js';

/** Install once. Physics runs only in the game's existing fixed updatePlayer
 * path, never from UI/render callbacks. E and the elevator/car entry UI stay free. */
export function installFurnitureInteraction(game,{document:doc=globalThis.document,window:win=globalThis.window}={}){
 const scene=game.world?.cityArchitecture?.furniture;if(!scene)return null;if(game.furnitureInteraction)return game.furnitureInteraction;
 const commands=[],byId=new Map(scene.bodies.map(b=>[b.id,b]));let target=null,roomId=null,lastLabel='',pendingRestore=null,pendingRestoreReady=false,loadDepth=0,restoreApplied=false,disposed=false;
 const panel=doc.createElement('div');panel.id='furniture-interaction';panel.hidden=true;panel.setAttribute('aria-label','附近家具互动');
 panel.innerHTML='<span data-furniture-label></span><div><button type="button" data-action="kick">踢 · K</button><button type="button" data-action="push">推 · L</button></div><button type="button" data-action="reset">整理附近家具</button>';
 const style=doc.createElement('style');style.textContent='#furniture-interaction{position:fixed;z-index:35;right:max(14px,env(safe-area-inset-right));bottom:calc(180px + env(safe-area-inset-bottom));padding:9px;background:#18383eea;border:1px solid #f1d79a80;border-radius:12px;color:#f5eddc;font:12px system-ui;max-width:210px;box-shadow:0 4px 16px #0004}#furniture-interaction[hidden]{display:none}#furniture-interaction span{display:block;margin:0 2px 7px}#furniture-interaction div{display:flex;gap:7px}#furniture-interaction button{min-height:48px;min-width:74px;padding:10px 14px;background:#f2ddaf;color:#203d3f;border:0;border-radius:8px;font:600 14px system-ui;touch-action:manipulation}#furniture-interaction button[data-action=reset]{margin-top:6px;width:100%;min-height:44px;background:#ffffff1c;color:#eef0df;font-size:12px}@media(orientation:landscape) and (max-height:480px){#furniture-interaction{bottom:calc(86px + env(safe-area-inset-bottom));padding:7px}#furniture-interaction button[data-action=reset]{min-height:44px;padding:6px}}';
 doc.head.append(style);doc.body.append(panel);
 const blocked=()=>disposed||game.paused||game.photoMode?.active||game.inCar||game.transition||game.flight?.active||game.aircraft?.active||game.robotaxi?.passenger||game.landmarks?.inside||game.ui?.isPhoneOpen?.()||!!doc.getElementById('modal')?.open;
 const actor=()=>({x:game.playerPos.x,y:game.playerPos.y,z:game.playerPos.z,radius:game.character==='mochi'?.24:.31});
 const forward=()=>({x:-Math.sin(game.playerYaw??0),z:-Math.cos(game.playerYaw??0)});
 function choose(){if(blocked())return null;return scene.targetFrom(actor(),forward());}
 function request(mode){if(blocked())return false;const near=choose();if(mode==='reset'){if(!near)return false;commands.push({mode,roomId:near.roomId});return true;}if(!near)return false;commands.push({mode,id:near.id});return true;}
 const click=e=>{const mode=e.target.closest?.('[data-action]')?.dataset.action;if(!mode)return;e.preventDefault();e.stopPropagation();request(mode);};panel.addEventListener('click',click);panel.addEventListener('pointerdown',e=>e.stopPropagation());
 const key=e=>{if(!['KeyK','KeyL'].includes(e.code)||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable||blocked())return;if(request(e.code==='KeyK'?'kick':'push')){e.preventDefault();e.stopPropagation();}};win?.addEventListener('keydown',key);
 function refresh(){target=choose();roomId=target?.roomId??null;panel.hidden=!target;if(target){const label=(target.type==='chair'?'椅子':'小桌')+' · 靠近后踢 / 推';if(label!==lastLabel){panel.querySelector('[data-furniture-label]').textContent=label;lastLabel=label;}}}
 function blockers(){const p=game.position,result=[];for(const v of game.allVehicles?.()??[]){if(v?.populationDormant||!v?.pos||Math.hypot(v.pos.x-p.x,v.pos.z-p.z)>12)continue;const c=getVehicleCollider(v);result.push({x:c.x,z:c.z,w:c.halfWidth,d:c.halfLength,yaw:c.yaw});if(result.length===8)break;}return result;}
 function tick(dt){
  if(disposed)return;if(game.paused||game.photoMode?.active){commands.length=0;panel.hidden=true;return;}
  const p=actor();for(const action of commands.splice(0,8)){if(blocked())break;if(action.mode==='reset'){if(!choose()||choose().roomId!==action.roomId)continue;const result=scene.reset(action.roomId,{actor:p});game.ui?.toast?.(result.ok?'附近家具已整理归位':result.reason);continue;}
   const result=scene.act(action.id,p,{mode:action.mode,forward:forward()});if(result.ok)game.ui?.toast?.(action.mode==='kick'?'踢开了'+(byId.get(action.id)?.type==='chair'?'椅子':'小桌'):'轻推家具');
  }
  scene.step(dt,{position:game.position,actor:!game.inCar&&!game.aircraft?.active&&!game.landmarks?.inside?p:null,blockers:blockers()});
  if(game.physics?.queueCommand)for(const command of scene.nativeCommands(dt))game.physics.queueCommand(command);refresh();
 }
 // The same hook is invoked from native Godot's fixed callback and legacy fixed
 // harness; do not run this again from world.update or render.
 const updatePlayer=game.updatePlayer;game.updatePlayer=function(dt){const result=updatePlayer.call(this,dt);tick(dt);return result;};
 const loop=game.loop;if(loop)game.loop=function(...args){const result=loop.apply(this,args);refresh();return result;};
 function applyPendingRestore(){
  if(!pendingRestoreReady||restoreApplied)return false;
  scene.restore(pendingRestore,{actor:!game.inCar?actor():null});restoreApplied=true;pendingRestore=null;pendingRestoreReady=false;commands.length=0;
  if(game.physics?.queueCommand)for(const command of scene.nativeCommands(0,{force:true}))game.physics.queueCommand(command);refresh();return true;
 }
 const snapshot=game.snapshot;game.snapshot=function(...args){
  // Game.load(persist=true) calls save() before returning. Commit the validated
  // layout at that snapshot boundary, after core actor/vehicle state is loaded,
  // so persisted data and the visible layout cannot disagree. No second save.
  if(loadDepth>0)applyPendingRestore();return{...snapshot.apply(this,args),furniture:scene.snapshot()};
 };
 const validateSave=game.validateSave;game.validateSave=function(data){const result=validateSave.call(this,data);pendingRestore=result.furniture;pendingRestoreReady=true;return result;};
 const load=game.load;game.load=function(...args){
  const outer=loadDepth===0;if(outer){pendingRestore=null;pendingRestoreReady=false;restoreApplied=false;}loadDepth++;
  try{const result=load.apply(this,args);if(result===true)applyPendingRestore();return result;}
  finally{loadDepth--;if(outer){pendingRestore=null;pendingRestoreReady=false;}}
 };
 const resetControls=game.resetControls;game.resetControls=function(...args){commands.length=0;return resetControls.apply(this,args);};
 const api={scene,panel,request,tick,refresh,get target(){return target;},dispose(){disposed=true;commands.length=0;win?.removeEventListener('keydown',key);panel.removeEventListener('click',click);panel.remove();style.remove();}};
 game.furnitureInteraction=api;refresh();return api;
}
