import {createExplorationSlot} from './crescent-exploration-slot.js';
export async function startCrescentExperiment(){
 const q=new URLSearchParams(location.search);if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||q.get('physics')!=='browser'||q.has('world')||q.has('slot')||q.has('delivery'))throw Error('弧湾仅限本机独立浏览器实验入口');
 document.querySelector('.wordmark small').textContent='CRESCENT 本机实验';
 const slot=createExplorationSlot(localStorage),saved=slot.read();
 await import('./mobile-ui.js');const g=window.game;if(!g)throw Error('真实Game未创建');
 g.acceptJob=()=>{g.ui.toast('弧湾当前为地图探索实验；职业坐标和完整玩家档尚未适配');return false;};
 const bar=document.createElement('div');bar.id='crescent-experiment-status';bar.style.cssText='position:fixed;top:5px;left:5px;z-index:99999;background:#153b35;color:white;padding:8px;font:12px sans-serif;max-width:90vw';
 const status=document.createElement('span');status.textContent='弧湾本机实验 · 真实Game · 仅保存步行位置；游乐消费/外卖未接入，车辆不能上屋顶';bar.append(status);
 const button=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;bar.append(b);};
 const save=()=>{if(g.inCar||g.transition)throw Error('请先下车，再保存步行探索位置');slot.write({x:g.playerPos.x,y:g.playerPos.y,z:g.playerPos.z,yaw:g.playerYaw});status.textContent='弧湾步行位置已保存（不是完整游戏存档）';return true;};
 g.save=(notify=true)=>{try{return save();}catch(e){if(notify)g.ui.toast(e.message);return false;}};
 if(saved){const p=saved.player;g.world.update(p,true);if(g.world.blocked(p.x,p.z,p.y))throw Error('探索档位置被几何阻挡；原档保留');g.playerPos.set(p.x,p.y,p.z);g.playerYaw=p.yaw;g.cameraYaw=p.yaw;g.inCar=false;g.animateWalkingPerson(0);g.updateCamera(10);}
 button('保存步行位置',()=>g.save());
 const locate=(x,z)=>{if(g.inCar||g.transition){g.ui.toast('请先下车');return;}g.world.update({x,z},true);g.playerPos.set(x,g.world.groundHeight(x,z),z);g.playerYaw=Math.PI;g.cameraYaw=Math.PI;g.cameraAnchor=null;g.animateWalkingPerson(0);g.updateCamera(10);};
 button('QA 馆外',()=>locate(-400,121));button('QA 坡道起点',()=>locate(-343,126));
 const probe=document.createElement('pre');probe.style.cssText='position:fixed;top:145px;right:8px;z-index:9999;background:#10232de6;color:white;font:11px monospace;padding:6px;pointer-events:none';document.body.append(probe);const timer=setInterval(()=>{probe.textContent='LOCAL CRESCENT / NOT RELEASE\n'+JSON.stringify({map:g.world.mapId,backend:g.physics.backend,mode:g.inCar?'car':'walk',pos:[g.position.x,g.position.y,g.position.z].map(x=>+x.toFixed(2)),tick:g.physics.lastTick,paused:g.paused,godotRequests:performance.getEntriesByType('resource').filter(r=>/godot|\.wasm|\.pck/i.test(r.name)).length,slot:'walking only, not full save'},null,1);},500);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});

 button('切回ESTUARY（保留弧湾位置）',()=>{if(g.save())location.search='?map=estuary&preview=1&physics=browser&delivery=1';});
 button('旧城入口（不读取弧湾档）',()=>{if(g.save())location.search='';});
 document.body.append(bar);document.documentElement.dataset.betaUiReady='2';
 g.crescentExperiment={mapId:g.world.mapId,saveKind:'walking-exploration',slotKey:'sunrise-coast:crescent:exploration:v1'};
}
