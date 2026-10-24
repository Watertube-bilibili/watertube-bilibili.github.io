import * as THREE from './vendor/three.module.js';
import {getVehicleCollider} from './vehicle-dynamics.js';
import {installControlSelectionGuard} from './touch-selection.js';

// Fictional, stylized game prop; all coordinates are render-space units.
// Grip is the model origin and the muzzle always points along local -Z.
const FORWARD=new THREE.Vector3(0,0,-1),UP=new THREE.Vector3(0,1,0),RANGE=70;
export const CROSSHAIRS=Object.freeze([
 {id:'cross',name:'细十字',svg:'<path d="M20 5v8m0 14v8M5 20h8m14 0h8"/><circle cx="20" cy="20" r="1"/>'},
 {id:'dot',name:'圆点',svg:'<circle cx="20" cy="20" r="2.5" fill="currentColor"/>'},
 {id:'ring',name:'圆环',svg:'<circle cx="20" cy="20" r="10"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/>'},
 {id:'chevron',name:'箭尖',svg:'<path d="m10 25 10-10 10 10"/>'},
 {id:'bracket',name:'四角',svg:'<path d="M13 8H8v5m19-5h5v5M8 27v5h5m19-5v5h-5"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/>'}
]);
export function weaponContext(g){return !!g.weapon&&g.character!=='mochi'&&!g.inCar&&!g.transition&&!g.aircraft?.active&&!g.flight?.active&&!g.robotaxi?.passenger&&!g.landmarks?.visit;}
export function canUseWeapon(g){return weaponContext(g)&&!g.paused&&!g.photoMode?.active&&!g.ui?.isPhoneOpen?.()&&g.physics?.ready!==false&&!g.physics?.failed;}
export function createCoastSidearm(){
 const root=new THREE.Group();root.name='COAST-C1-fictional-sidearm';root.userData.forwardAxis='-Z';
 const materials={body:new THREE.MeshStandardMaterial({color:0x354b56,metalness:.7,roughness:.28}),edge:new THREE.MeshStandardMaterial({color:0x899c9f,metalness:.8,roughness:.3}),grip:new THREE.MeshStandardMaterial({color:0x15252c,roughness:.82}),accent:new THREE.MeshStandardMaterial({color:0xe5a35d,metalness:.5,roughness:.35}),dark:new THREE.MeshStandardMaterial({color:0x091218,roughness:.9}),glow:new THREE.MeshStandardMaterial({color:0x8ff1d7,emissive:0x4adbc0,emissiveIntensity:.4})};
 const add=(geometry,material,name,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,materials[material]);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.userData.semantic=4;root.add(m);return m;};
 const box=(w,h,d,material,name,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),material,name,x,y,z);
 const silhouette=(points,width,material,name)=>{const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.008,bevelThickness:.006});geo.rotateY(Math.PI/2);geo.translate(-width/2,0,0);return add(geo,material,name);};
 silhouette([[-.13,.07],[-.1,.18],[.26,.18],[.34,.13],[.34,.065]],.105,'body','chamfered-upper');
 silhouette([[-.08,.075],[.09,.075],[.04,-.21],[-.065,-.21],[-.11,-.17]],.09,'grip','hand-grip');
 box(.112,.025,.32,'edge','lower-trim',0,.06,-.15);
 box(.115,.028,.21,'accent','coast-accent',0,.115,-.06);
 box(.06,.025,.045,'glow','front-marker',0,.195,-.275);
 box(.09,.033,.03,'dark','rear-sight',0,.19,.09);
 for(const x of [-.031,.031])box(.016,.015,.014,'glow','rear-marker',x,.21,.095);
 for(let i=0;i<4;i++)box(.118,.042,.014,'dark','slide-relief',0,.13,.04+i*.02);
 for(let i=0;i<4;i++){const r=box(.098,.014,.105,'edge','grip-ridge',0,-.075-i*.035,.015);r.rotation.x=-.12;}
 // Clearly visible dark opening, not an ambiguous reversed handle.
 const outer=add(new THREE.CylinderGeometry(.039,.039,.026,12),'edge','muzzle-ring',0,.115,-.355);outer.rotation.x=Math.PI/2;
 const bore=add(new THREE.CircleGeometry(.026,12),'dark','muzzle-opening',0,.115,-.369);bore.rotation.y=Math.PI;
 const guard=new THREE.Shape();guard.moveTo(.065,.055);guard.lineTo(.19,.055);guard.lineTo(.17,-.075);guard.lineTo(.045,-.075);guard.closePath();const hole=new THREE.Path();hole.moveTo(.077,.027);hole.lineTo(.073,-.05);hole.lineTo(.147,-.05);hole.lineTo(.16,.027);hole.closePath();guard.holes.push(hole);const geo=new THREE.ExtrudeGeometry(guard,{depth:.035,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-.0175,0,0);add(geo,'body','open-guard');
 const hands=new THREE.Group();hands.name='first-person-gloves';hands.visible=false;root.add(hands);
 const glove=box(.115,.12,.125,'grip','gloved-hand',0,-.045,.015);hands.attach(glove);const cuff=box(.13,.12,.26,'body','sleeve-cuff',.045,-.1,.18);cuff.rotation.y=-.15;hands.attach(cuff);root.userData.viewHands=hands;
 const muzzle=new THREE.Object3D();muzzle.name='muzzle';muzzle.position.set(0,.115,-.38);root.add(muzzle);root.userData.muzzle=muzzle;
 const flash=add(new THREE.SphereGeometry(.047,6,4),'glow','shot-flash',0,.115,-.4);flash.scale.set(.75,.75,1.8);flash.visible=false;root.userData.flash=flash;
 return root;
}

export function rayBoxHit(origin,direction,b,maxDistance=RANGE){
 const c=Math.cos(b.yaw??0),s=Math.sin(b.yaw??0),dx=origin.x-b.x,dz=origin.z-b.z;
 const o=[c*dx-s*dz,origin.y,c*dz+s*dx],d=[c*direction.x-s*direction.z,direction.y,c*direction.z+s*direction.x];
 const min=[-b.w,b.baseY??0,-b.d],max=[b.w,(b.baseY??0)+(b.height??8),b.d];let near=0,far=maxDistance;
 for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-10){if(o[i]<min[i]||o[i]>max[i])return null;continue;}let a=(min[i]-o[i])/d[i],z=(max[i]-o[i])/d[i];if(a>z)[a,z]=[z,a];near=Math.max(near,a);far=Math.min(far,z);if(near>far)return null;}
 return near<=maxDistance?near:null;
}
function visibleMeshes(root){const list=[];root?.traverseVisible(o=>{if(o.isMesh){if(o.isSkinnedMesh)o.skeleton.update();list.push(o);}});return list;}
export function castWeaponRay(g,origin,direction,maxDistance=RANGE,{targets=true}={}){
 let hit=null,best=maxDistance;const accept=(distance,kind,object=null)=>{if(distance!==null&&distance<=best){best=distance;hit={distance,kind,object,point:origin.clone().addScaledVector(direction,distance)};}};
 for(const b of g.world?.colliders??[]){if(Math.hypot(origin.x-b.x,origin.z-b.z)>maxDistance+Math.hypot(b.w,b.d))continue;accept(rayBoxHit(origin,direction,b,best),'world',b);}
 for(const v of g.allVehicles?.()??[]){if(!v.root?.visible||v.populationDormant)continue;const b=getVehicleCollider(v);accept(rayBoxHit(origin,direction,{x:b.x,z:b.z,yaw:b.yaw,w:b.halfWidth,d:b.halfLength,baseY:v.pos.y,height:v.height??1.6},best),'vehicle',v);}
 // Ground is a height field, not a horizontal infinite plane. Bisection keeps
 // downhill aim and ridge cover consistent without scanning the scene graph.
 if(g.world?.groundHeight){for(let t=0;t<=best;t+=.5){const p=origin.clone().addScaledVector(direction,t);if(p.y<=g.world.groundHeight(p.x,p.z)+.015){let lo=Math.max(0,t-.5),hi=t;for(let i=0;i<9;i++){const mid=(lo+hi)/2,q=origin.clone().addScaledVector(direction,mid);if(q.y<=g.world.groundHeight(q.x,q.z)+.015)hi=mid;else lo=mid;}accept(hi,'ground');break;}}}
 if(targets){const ray=new THREE.Raycaster(origin,direction,0,best);for(const ped of g.pedestrians??[]){if(ped.knocked||ped.populationDormant||!ped.root?.visible||ped.root.position.distanceTo(origin)>maxDistance+3)continue;ped.root.updateWorldMatrix(true,true);const item=ray.intersectObjects(visibleMeshes(ped.root),false)[0];if(item&&item.distance<best){accept(item.distance,'pedestrian',ped);ray.far=best;}}}
 return hit;
}
export function cameraAim(g){g.camera.updateMatrixWorld(true);const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),g.camera);const hit=castWeaponRay(g,ray.ray.origin,ray.ray.direction);return{origin:ray.ray.origin.clone(),direction:ray.ray.direction.clone(),point:hit?.point??ray.ray.origin.clone().addScaledVector(ray.ray.direction,RANGE),hit};}
export function solveWeaponShot(g,muzzle,aim=cameraAim(g)){
 const delta=aim.point.clone().sub(muzzle),distance=delta.length(),direction=distance>1e-6?delta.divideScalar(distance):aim.direction.clone();
 // A muzzle that has crossed a thin wall must not begin a ray on its far side.
 const eye=g.person?.head?.getWorldPosition(new THREE.Vector3())??g.playerPos?.clone().add(new THREE.Vector3(0,1.55,0))??muzzle;
 const toMuzzle=muzzle.clone().sub(eye),length=toMuzzle.length();const cover=length>1e-5?castWeaponRay(g,eye,toMuzzle.divideScalar(length),length,{targets:false}):null;
 const hit=cover??castWeaponRay(g,muzzle,direction,Math.min(RANGE,distance+.025));
 return{origin:cover?eye:muzzle.clone(),direction,point:hit?.point??aim.point.clone(),hit,blocked:!!cover||!!hit&&hit.kind!=='pedestrian'&&hit.point.distanceTo(aim.point)>.12,aim};
}
// Fit the *whole* view model (including its cuff) in the actual perspective
// frustum. World-space muzzle/cover queries use this same transformed model.
export function firstPersonWeaponPose(camera){
 const depth=.78,tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),aspect=Math.max(.25,camera.aspect||1);
 return {position:new THREE.Vector3(depth*tan*aspect*.30,-depth*tan*.36,-depth),scale:Math.min(.72,aspect*1.1)};
}
export function applyWeaponCamera(g,firstPerson=false){
 if(!weaponContext(g)||g.photoMode?.active)return false;
 const pitch=THREE.MathUtils.clamp(g.cameraPitch??0,-.9,.9),yaw=g.cameraYaw??0;
 const direction=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
 const base=g.playerPos.clone(),offset=new THREE.Vector3(firstPerson?0:.62,firstPerson?1.66:1.64,firstPerson?-.08:3.3).applyAxisAngle(UP,yaw);
 const desired=base.clone().add(offset),eye=base.clone().add(new THREE.Vector3(0,1.66,0)),toCamera=desired.clone().sub(eye),length=toCamera.length();
 const wall=length>1e-5?castWeaponRay(g,eye,toCamera.clone().divideScalar(length),length,{targets:false}):null;
 if(wall)desired.copy(eye).addScaledVector(toCamera.normalize(),Math.max(0,wall.distance-.12));
 g.camera.position.copy(desired);g.camera.lookAt(desired.clone().addScaledVector(direction,50));g.camera.clearViewOffset();g.camera.updateMatrixWorld(true);g.cameraLook=desired.clone().addScaledVector(direction,50);return true;
}
const aimRigs=new WeakMap();
export function weaponGrip(actor,target=new THREE.Vector3()){
 actor.root.updateMatrixWorld(true);const wrist=actor.root.getObjectByName('WristR');
 if(wrist)return wrist.getWorldPosition(target);
 if(actor.arms?.[1])return actor.arms[1].localToWorld(target.set(0,-.52,0));
 return actor.root.localToWorld(target.set(.3,1.28,-.42));
}
export function aimCharacterWeapon(actor,direction){
 const pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-.8,.8));
 const upper=actor.root.getObjectByName('UpperArmR');
 if(!upper){if(actor.arms?.[1])actor.arms[1].rotation.x=1.45+pitch;return false;}
 let rig=aimRigs.get(actor);if(!rig){rig={pitch:0,sample:-1};aimRigs.set(actor,rig);}
 const sample=actor.root.userData.characterAnimationSamples??0;if(rig.sample!==sample){rig.pitch=0;rig.sample=sample;}
 if(Math.abs(pitch-rig.pitch)<1e-9)return true;
 actor.root.updateMatrixWorld(true);const right=new THREE.Vector3(1,0,0).applyQuaternion(actor.root.getWorldQuaternion(new THREE.Quaternion()));
 const delta=new THREE.Quaternion().setFromAxisAngle(right,pitch-rig.pitch);
 for(const side of ['R','L']){const arm=actor.root.getObjectByName('UpperArm'+side);if(!arm)continue;const world=delta.clone().multiply(arm.getWorldQuaternion(new THREE.Quaternion()));arm.quaternion.copy(arm.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));arm.updateMatrixWorld(true);}
 rig.pitch=pitch;actor.root.updateMatrixWorld(true);return true;
}
function disposeProp(root){root?.removeFromParent();const mats=new Set();root?.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material);});for(const m of mats)m.dispose();}

export class WeaponSystem{
 constructor(game,{document=globalThis.document,window=globalThis.window}={}){this.game=game;this.document=document;this.window=window;this.style='cross';this.firstPerson=false;this.lastShot=-Infinity;this.hitUntil=0;this.flashUntil=0;this.actor=null;this.gun=null;this.hiddenActor=null;this.trace=null;this.traceUntil=0;this.mountUI();}
 ensureWeapon(){const g=this.game;if(g.character==='mochi')return null;if(this.actor!==g.person){disposeProp(this.gun);this.actor=g.person;this.gun=createCoastSidearm();g.scene.add(this.gun);}g.gun=this.gun;return this.gun;}
 mountUI(){const doc=this.document;if(!doc?.body)return;
 this.reticle=doc.createElement('div');this.reticle.id='weapon-crosshair';this.reticle.setAttribute('aria-hidden','true');this.reticle.hidden=true;doc.body.append(this.reticle);
 this.info=doc.createElement('div');this.info.id='weapon-status';this.info.hidden=true;this.info.innerHTML='<span class="weapon-label">COAST / C1</span><strong class="weapon-ammo"></strong><span class="weapon-cover"></span><button type="button" class="weapon-style">准心 · 细十字</button>';doc.body.append(this.info);this.info.querySelector('button').onclick=()=>this.cycleStyle();this.setStyle(this.style);
 const actions=doc.querySelector('.touch-actions');if(actions){this.aimButton=doc.createElement('button');this.aimButton.id='touch-aim';this.aimButton.textContent='瞄准';this.aimButton.setAttribute('aria-label','切换第一人称瞄准');this.aimButton.hidden=true;actions.append(this.aimButton);installControlSelectionGuard(this.aimButton);this.aimButton.onclick=()=>{if(canUseWeapon(this.game))this.toggleView();};}
 this.window?.addEventListener('keydown',e=>{if(e.code==='KeyN'&&!e.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)&&!e.target?.isContentEditable&&canUseWeapon(this.game)){e.preventDefault();this.cycleStyle();}});
 }
 setStyle(id){const item=CROSSHAIRS.find(s=>s.id===id)??CROSSHAIRS[0];this.style=item.id;if(this.reticle)this.reticle.innerHTML=`<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${item.svg}</svg>`;if(this.info)this.info.querySelector('button').textContent='准心 · '+item.name;return item;}
 cycleStyle(){const next=CROSSHAIRS[(CROSSHAIRS.findIndex(s=>s.id===this.style)+1)%CROSSHAIRS.length];this.setStyle(next.id);this.game.ui?.toast?.('准心：'+next.name+' · N 切换');}
 toggleView(){if(!canUseWeapon(this.game))return false;this.firstPerson=!this.firstPerson;this.game.cameraRecentering=false;this.game.ui?.toast?.(this.firstPerson?'第一人称瞄准 · C 返回肩后':'第三人称肩后 · C 精确瞄准');return true;}
 poseGun(aim){const g=this.game,gun=this.ensureWeapon();if(!gun)return;g.playerYaw=g.cameraYaw;g.person.root.rotation.y=g.playerYaw;g.person.root.updateMatrixWorld(true);
 if(this.firstPerson){const view=firstPersonWeaponPose(g.camera);gun.scale.setScalar(view.scale);gun.position.copy(view.position).applyQuaternion(g.camera.quaternion).add(g.camera.position);}
 else {gun.scale.setScalar(1);aimCharacterWeapon(g.person,aim.direction);const grip=weaponGrip(g.person,new THREE.Vector3());gun.position.copy(grip??new THREE.Vector3(.27,1.25,-.39).applyAxisAngle(UP,g.playerYaw).add(g.person.root.position));}
 // A shortest-arc -Z rotation alone flips the prop at rearward headings.
 // lookAt preserves the world/camera up vector at every yaw and pitch.
 const visualTarget=aim.point.clone();
 // A wall closer than the held prop must not turn the model back at its
 // owner. This only stabilizes presentation; solveWeaponShot still uses the
 // original camera hit and the actual transformed muzzle, including cover.
 if(visualTarget.clone().sub(gun.position).dot(aim.direction)<.1)visualTarget.copy(gun.position).addScaledVector(aim.direction,2);
 gun.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(gun.position,visualTarget,g.camera.up));gun.updateMatrixWorld(true);
 }
 update(delta=0){const g=this.game,active=canUseWeapon(g);if(this.hiddenActor&&(!weaponContext(g)||g.photoMode?.active||!this.firstPerson||this.hiddenActor!==g.person)){this.hiddenActor.root.visible=(!g.inCar||!!g.transition)&&!g.landmarks?.visit;this.hiddenActor=null;}
 if(!weaponContext(g)){this.firstPerson=false;}
 this.reticle&&(this.reticle.hidden=!active);this.info&&(this.info.hidden=!active);if(this.aimButton){this.aimButton.hidden=!active||g.effectiveInputMode!=='touch';this.aimButton.setAttribute('aria-pressed',String(this.firstPerson));}
 const fire=this.document?.getElementById('touch-fire');if(fire)fire.hidden=!active;
 this.document?.body?.classList.toggle('weapon-active',active);
 if(this.gun)this.gun.visible=active;
 const now=this.window?.performance?.now?.()??Date.now();if(this.trace&&(!active||now>=this.traceUntil)){disposeProp(this.trace);this.trace=null;}
 if(weaponContext(g)&&this.firstPerson&&!g.photoMode?.active){g.person.root.visible=false;this.hiddenActor=g.person;}
 if(!active)return;const aim=cameraAim(g);this.poseGun(aim);this.gun.visible=true;
 if(this.firstPerson){g.person.root.visible=false;this.hiddenActor=g.person;}
 this.gun.userData.viewHands.visible=this.firstPerson;this.gun.userData.flash.visible=now<this.flashUntil;const muzzle=this.gun.userData.muzzle.getWorldPosition(new THREE.Vector3());this.solution=solveWeaponShot(g,muzzle,aim);
 if(this.reticle){this.reticle.dataset.blocked=String(this.solution.blocked);this.reticle.dataset.hit=String(now<this.hitUntil);}
 if(this.info){this.info.querySelector('.weapon-ammo').textContent=String(g.ammo).padStart(2,'0');this.info.querySelector('.weapon-cover').textContent=this.solution.blocked?'枪口受阻':this.firstPerson?'第一人称 · C 返回':'肩后 · C 瞄准';}
 }
 shoot(){const g=this.game;if(!canUseWeapon(g))return false;const now=this.window?.performance?.now?.()??Date.now();if(now-this.lastShot<190)return false;if(g.ammo<=0){g.ui?.toast?.('弹药不足 · 手机输入 AMMO 补充');return false;}
 this.update(0);const shot=this.solution;if(!shot)return false;this.lastShot=now;g.ammo--;g.addWanted?.(.65);if(shot.hit?.kind==='pedestrian'){shot.hit.object.knocked=10;g.addWanted?.(.7);this.hitUntil=now+180;}
 disposeProp(this.trace);this.trace=new THREE.Line(new THREE.BufferGeometry().setFromPoints([shot.origin,shot.point]),new THREE.LineBasicMaterial({color:shot.blocked?0xffac76:0xffe2a1,transparent:true,opacity:.9}));g.scene.add(this.trace);this.traceUntil=now+65;this.flashUntil=now+45;g.audio?.impact?.();this.update(0);return true;
 }
}
export function installWeaponSystem(game,options){const system=new WeaponSystem(game,options);game.weaponSystem=system;
 const camera=game.updateCamera.bind(game);game.updateCamera=(...args)=>{camera(...args);applyWeaponCamera(game,system.firstPerson);};
 const cycle=game.cycleCamera.bind(game);game.cycleCamera=(...args)=>canUseWeapon(game)?system.toggleView():cycle(...args);
 const photoEnter=game.photoMode?.enter.bind(game.photoMode);if(photoEnter)game.photoMode.enter=(...args)=>{const result=photoEnter(...args);system.update(0);return result;};
 return system;
}
