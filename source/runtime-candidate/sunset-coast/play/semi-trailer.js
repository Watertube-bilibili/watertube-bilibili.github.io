import * as THREE from './vendor/three.module.js';
import {isCargoJob} from './cargo-career.js';

// This is a render-only trailer. It deliberately does not change the tractor's
// Godot rigid body, wheel/contact count, collider, save schema or cargo payout.
export const SEMI_TRAILER_SPEC=Object.freeze({front:-.30,rear:11.25,width:2.55,height:2.72,axleDistance:9.45,axles:Object.freeze([8.8,10.1]),wheelRadius:.55,wheelY:-.65,maxArticulation:.60});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
const finite=(n,f=0)=>Number.isFinite(n)?n:f;

// Use both forward and native sideways motion; a sliding truck is not parked.
export function semiTrailerStationary(car){
 const speed=car?.speed??0,lateral=car?.lateralSpeed??0,sx=car?.slipVelocityX??0,sz=car?.slipVelocityZ??0,yaw=car?.yaw??0;
 return [speed,lateral,sx,sz,yaw].every(Number.isFinite)&&Math.max(Math.hypot(speed,lateral),Math.hypot(sx-Math.sin(yaw)*speed,sz-Math.cos(yaw)*speed))<.3;
}

/** Displacement-based no-side-slip visual follower. Substeps and a bounded
 * articulation angle prevent reverse direction flips/jackknifing into the cab.
 * It is not a physical joint or a collision solver. */
export function followSemiTrailer(previous,hitch,tractorYaw){
 const yaw=finite(tractorYaw),x=finite(hitch.x),z=finite(hitch.z),dx=x-(previous?.x??x),dz=z-(previous?.z??z),distance=Math.hypot(dx,dz);
 if(!previous||distance>20||Math.abs(wrap(yaw-(previous.tractorYaw??yaw)))>1.2)return{x,z,yaw,tractorYaw:yaw,distance:0,reset:true};
 let angle=previous.yaw;const steps=Math.max(1,Math.ceil(distance/.2));
 for(let i=0;i<steps;i++)angle-=(dx*Math.cos(angle)-dz*Math.sin(angle))/(steps*SEMI_TRAILER_SPEC.axleDistance);
 angle=yaw+clamp(wrap(angle-yaw),-SEMI_TRAILER_SPEC.maxArticulation,SEMI_TRAILER_SPEC.maxArticulation);
 return{x,z,yaw:angle,tractorYaw:yaw,distance,reset:false};
}

export function semiTrailerLoadState(car,game={}){
 const job=game.vehicle===car&&isCargoJob(game.job)?game.job:null,loaded=!!job&&job.stage===1;
 const payloadKg=loaded?Math.max(0,finite(job.massKg)):0;
 const attached=loaded||car.semiTrailerAttached===true;
 return{attached,loaded,payloadKg,active:!!job,cargoLabel:loaded?job.cargoLabel:'空载',overloaded:payloadKg>18000,
  crateCount:loaded?(payloadKg<=8000?4:payloadKg<=18000?10:14):0,
  doorsOpen:attached&&car.semiTrailerDoorsOpen===true,phase:job?(loaded?'运输中':'待装货'):'空载'};
}

export function createSemiTrailer({makeCanvas=()=>globalThis.document?.createElement?.('canvas')}={}){
 const spec=SEMI_TRAILER_SPEC,root=new THREE.Group();root.name='SemiCargoTrailer';
 root.userData={semantic:3,visualOnly:true,physics:'visual-kinematic-only',hasCollision:false};
 const resources=new Set(),materials=new Set(),cube=new THREE.BoxGeometry(1,1,1);resources.add(cube);
 const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.64,metalness:.18,...extra});materials.add(m);return m;};
 const white=material(0xe5e7e7),frame=material(0x283640,{metalness:.65}),silver=material(0x9eabb3,{metalness:.8,roughness:.34}),navy=material(0x183746),rubber=material(0x131a1e,{metalness:0,roughness:.93}),wood=material(0x9d724b,{metalness:0}),loadMaterial=material(0xaca092,{metalness:.05}),strap=material(0x4c6b76),amber=material(0xf2a84e,{emissive:0xf2a84e,emissiveIntensity:.22}),red=material(0xa52f2b,{emissive:0xff3028,emissiveIntensity:.4});
 const box=(name,size,position,m=white,parent=root)=>{const mesh=new THREE.Mesh(cube,m);mesh.name=name;mesh.scale.set(...size);mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.semantic=3;parent.add(mesh);return mesh;};
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),scale=new THREE.Vector3();
 const instances=(name,m,items,parent=root,geometry=cube)=>{const mesh=new THREE.InstancedMesh(geometry,m,items.length);mesh.name=name;for(let i=0;i<items.length;i++){const item=items[i];matrix.compose(v.set(...item.position),q.setFromEuler(new THREE.Euler(...(item.rotation??[0,0,0]))),scale.set(...item.size));mesh.setMatrixAt(i,matrix);}mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.semantic=3;parent.add(mesh);return mesh;};
 const center=(spec.front+spec.rear)/2,length=spec.rear-spec.front;
 box('LoadFloor',[2.48,.18,length],[0,.13,center],frame);
 box('CargoFrontWall',[2.55,2.68,.10],[0,1.58,spec.front],white);
 box('CargoRoof',[2.55,.10,length],[0,2.92,center],white);
 for(const side of [-1,1]){
  box('CargoSideWall',[.07,2.69,length],[side*1.24,1.56,center],white);
  box('LowerSideRail',[.09,.22,length],[side*1.28,.29,center],navy);
  box('UpperSideRail',[.09,.08,length],[side*1.28,2.87,center],silver);
  box('SideUnderrunGuard',[.10,.23,4.5],[side*1.1,-.49,4.9],silver);
 }
 const ribs=[];for(const side of [-1,1])for(let z=spec.front+.28;z<spec.rear;z+=.8)ribs.push({position:[side*1.286,1.55,z],size:[.023,2.52,.035]});instances('BoxWallRibs',silver,ribs);
 const chassis=[];for(const x of [-.68,.68])chassis.push({position:[x,-.04,center],size:[.15,.2,length]});for(let z=.5;z<11;z+=1.4)chassis.push({position:[0,-.07,z],size:[2.25,.12,.08]});instances('TrailerFrame',frame,chassis);
 // Raised landing legs remain well above the road while coupled.
 for(const side of [-1,1]){box('LandingLeg',[.14,.54,.15],[side*.82,-.25,2.25],silver);box('LandingFoot',[.35,.07,.34],[side*.82,-.56,2.25],frame);}
 const pinGeometry=new THREE.CylinderGeometry(.07,.07,.22,10);resources.add(pinGeometry);const pin=new THREE.Mesh(pinGeometry,silver);pin.name='TrailerKingpin';pin.position.y=-.02;root.add(pin);
 box('RearBumper',[2.4,.16,.16],[0,-.73,spec.rear+.08],silver);
 for(const side of [-1,1])box('RearBumperSupport',[.10,.6,.10],[side*.83,-.39,spec.rear-.03],frame);
 const markers=[];for(const side of [-1,1])for(const z of [.1,2.6,5.1,7.6,10.9])markers.push({position:[side*1.33,.37,z],size:[.035,.08,.19]});instances('AmberSideMarkers',amber,markers);
 const rearLamps=instances('RearBrakeLights',red,[-1,1].map(side=>({position:[side*.91,-.11,spec.rear+.065],size:[.42,.13,.045]})));
 const mudflaps=[];for(const side of [-1,1])mudflaps.push({position:[side*1.0,-.60,10.78],size:[.58,.58,.045]});instances('Mudflaps',rubber,mudflaps);
 const tireGeometry=new THREE.CylinderGeometry(spec.wheelRadius,spec.wheelRadius,.24,16),rimGeometry=new THREE.CylinderGeometry(.30,.30,.255,12);resources.add(tireGeometry);resources.add(rimGeometry);
 const wheelItems=[];for(const z of spec.axles)for(const side of [-1,1])for(const x of [.88,1.16])wheelItems.push({position:[side*x,spec.wheelY,z],size:[1,1,1],rotation:[0,0,Math.PI/2]});
 const tires=instances('TrailerDualTires',rubber,wheelItems,root,tireGeometry);instances('TrailerWheelRims',silver,wheelItems,root,rimGeometry);
 const hubs=[];for(const z of spec.axles)for(const side of [-1,1])hubs.push({position:[side*1.293,spec.wheelY,z],size:[.035,.23,.23]});const wheelHubs=instances('TrailerWheelHubMarks',frame,hubs);
 const axleBars=spec.axles.map(z=>({position:[0,spec.wheelY,z],size:[2.30,.13,.13]}));instances('TandemAxles',frame,axleBars);
 const doors=[];for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.name=side<0?'TrailerDoorLeft':'TrailerDoorRight';pivot.position.set(side*1.235,.23,spec.rear+.025);root.add(pivot);
  box('RearDoor',[1.225,2.61,.085],[-side*.615,1.305,0],white,pivot);
  box('DoorLockBar',[.035,2.32,.05],[-side*.52,1.30,.073],silver,pivot);
  box('DoorHandle',[.22,.045,.06],[-side*.52,.87,.11],frame,pivot);
  box('RearReflector',[.78,.075,.014],[-side*.615,.20,.052],red,pivot);
  doors.push({pivot,side});
 }
 const cargo=new THREE.Group();cargo.name='FreightLoad';root.add(cargo);
 const crates=[],pallets=[],straps=[];for(let i=0;i<14;i++){
  const x=i%2? .57:-.57,z=1.0+Math.floor(i/2)*1.4;
  crates.push({position:[x,1.12,z],size:[1.04,1.56,1.22]});pallets.push({position:[x,.29,z],size:[1.10,.14,1.29]});
  straps.push({position:[x,1.12,z],size:[1.052,1.578,.09]});
 }
 const crateMesh=instances('FreightCrates',loadMaterial,crates,cargo),palletMesh=instances('FreightPallets',wood,pallets,cargo),strapMesh=instances('FreightStraps',strap,straps,cargo);
 const canvas=makeCanvas?.(),ctx=canvas?.getContext?.('2d'),rearCanvas=makeCanvas?.(),rearCtx=rearCanvas?.getContext?.('2d');let texture=null,rearTexture=null,labelMaterial=null,logo=null,latestState=null;
 if(ctx){canvas.width=1024;canvas.height=256;texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;labelMaterial=new THREE.MeshBasicMaterial({map:texture});materials.add(labelMaterial);const plane=new THREE.PlaneGeometry(4.8,1.2);resources.add(plane);for(const side of [-1,1]){const label=new THREE.Mesh(plane,labelMaterial);label.name='TrailerPayloadLabel';label.position.set(side*1.311,1.67,5.6);label.rotation.y=side*Math.PI/2;label.userData.semantic=3;root.add(label);}}
 if(rearCtx){rearCanvas.width=512;rearCanvas.height=512;rearTexture=new THREE.CanvasTexture(rearCanvas);rearTexture.colorSpace=THREE.SRGBColorSpace;const rearMaterial=new THREE.MeshBasicMaterial({map:rearTexture}),plane=new THREE.PlaneGeometry(.96,.96);materials.add(rearMaterial);resources.add(plane);for(const door of doors){const label=new THREE.Mesh(plane,rearMaterial);label.name='RearSunsetCoastBrand';label.position.set(-door.side*.615,1.69,.048);label.userData.semantic=3;door.pivot.add(label);}}
 let signature='';
 function updateLoad(state){
  latestState=state;const next=[state.payloadKg,state.phase,state.cargoLabel].join('|');if(next===signature)return;signature=next;
  cargo.visible=state.loaded;for(const mesh of [crateMesh,palletMesh,strapMesh]){mesh.count=state.crateCount;mesh.computeBoundingSphere();}
  loadMaterial.color.setHex(state.payloadKg<=8000?0xa5b6c0:state.overloaded?0xb68364:0xb79a72);strap.color.setHex(state.overloaded?0xe7a348:0x426977);
  if(ctx){ctx.fillStyle='#183746';ctx.fillRect(0,0,1024,256);ctx.fillStyle=state.overloaded?'#f3b057':state.loaded?'#83d8b7':'#cbd5dc';ctx.fillRect(0,0,12,256);if(logo)ctx.drawImage(logo,28,46,164,164);ctx.fillStyle='#f3f4f1';ctx.font='600 52px sans-serif';ctx.fillText('SUNRISE COAST',220,82);ctx.fillStyle='#f5d5ad';ctx.font='34px sans-serif';ctx.fillText('日出海岸',220,136);ctx.fillStyle=state.overloaded?'#f3b057':'#bdd3dc';ctx.font='30px sans-serif';ctx.fillText(state.loaded?`${state.cargoLabel}  /  ${state.payloadKg/1000} t`:`FREIGHT  /  ${state.phase}`,220,190);ctx.fillStyle='#8eaab7';ctx.font='19px sans-serif';ctx.fillText(state.overloaded?'OVERWEIGHT LOAD':'CARGO TRANSPORT',220,226);texture.needsUpdate=true;}
  if(rearCtx){rearCtx.fillStyle='#183746';rearCtx.fillRect(0,0,512,512);if(logo)rearCtx.drawImage(logo,160,32,192,192);rearCtx.textAlign='center';rearCtx.fillStyle='#f3f4f1';rearCtx.font='600 43px sans-serif';rearCtx.fillText('SUNRISE COAST',256,292);rearCtx.fillStyle='#f5d5ad';rearCtx.font='36px sans-serif';rearCtx.fillText('日出海岸',256,352);rearCtx.fillStyle=state.overloaded?'#f3b057':'#bdd3dc';rearCtx.font='31px sans-serif';rearCtx.fillText(state.loaded?`${state.payloadKg/1000} t  /  LOADED`:'EMPTY',256,434);rearTexture.needsUpdate=true;}

 }
 // Reuse the project's exact sun/horizon SVG, not a newly drawn substitute.
 let logoImage=null;if((ctx||rearCtx)&&typeof globalThis.Image==='function'){logoImage=new Image();logoImage.onload=()=>{logo=logoImage;signature='';if(latestState)updateLoad(latestState);};logoImage.src=new URL('./neon-2-0-icon.svg',import.meta.url).href;}
 updateLoad({loaded:false,payloadKg:0,crateCount:0,phase:'空载',cargoLabel:'空载'});
 return{root,doors,cargo,crateMesh,palletMesh,strapMesh,tires,wheelHubs,rearLamps,visualOnly:true,hasCollision:false,rearCameraMount:[0,2.96,11.38],cameraBounds:{minX:-1.55,maxX:1.55,minZ:-.60,maxZ:12.55,minY:-1.22,maxY:2.98},payloadKg:0,loaded:false,doorAmount:0,state:null,
  updateLoad,updateLights(car){red.emissiveIntensity=car.lightState?.brake>0?2:.45;},
  dispose(){root.removeFromParent();if(logoImage)logoImage.onload=null;root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const g of resources)g.dispose();for(const m of materials)m.dispose();texture?.dispose();rearTexture?.dispose();}
 };
}

/** Keep the kingpin fixed at the actual rendered hitch. Terrain sampling at the
 * trailer bogie, not the tractor, prevents floating rear wheels on road grades. */
export function alignSemiTrailer(trailer,hitch,yaw,groundHeight=()=>0){
 const {axleDistance:L,wheelY,wheelRadius}=SEMI_TRAILER_SPEC,c=Math.cos(yaw),s=Math.sin(yaw);
 const sample=(x,z)=>finite(groundHeight(x,z),hitch.y-1.2);
 let pitch=0,roll=0;
 for(let i=0;i<2;i++){
  const d=L*Math.cos(pitch)+wheelY*Math.sin(pitch),x=hitch.x+s*d,z=hitch.z+c*d;
  const left=sample(x-c*1.02,z+s*1.02),right=sample(x+c*1.02,z-s*1.02),target=(left+right)/2+wheelRadius+.018-hitch.y;
  roll=clamp(Math.atan2(right-left,2.04),-.18,.18);
  pitch=clamp(Math.atan2(wheelY,L)-Math.asin(clamp(target/Math.hypot(L,wheelY),-.95,.95)),-.38,.38);
 }
 trailer.root.position.copy(hitch);trailer.root.rotation.set(pitch,yaw,roll,'YXZ');
 return{pitch,roll};
}

/** The ordinary 11 m chase camera sits over the box and aims through its roof.
 * Frame the complete combination instead, including portrait side-orbit views. */
export function semiTrailerChasePose(anchor,tractorYaw,orbit,trailerYaw=tractorYaw,aspect=1){
 const relative=wrap(orbit-trailerYaw),halfWidth=Math.abs(Math.sin(relative))*9.1+Math.abs(Math.cos(relative))*1.6;
 const distance=Math.max(22,halfWidth/(Math.tan(58*Math.PI/360)*Math.max(.3,finite(aspect,1)))*1.2);
 const look=new THREE.Vector3(anchor.x+Math.sin(trailerYaw)*4.6,anchor.y+1.7,anchor.z+Math.cos(trailerYaw)*4.6);
 return{position:look.clone().add(new THREE.Vector3(Math.sin(orbit)*distance,distance*.42,Math.cos(orbit)*distance)),look,distance};
}

export function installSemiCargoTrailers(game){
 if(game.semiCargoTrailers)return game.semiCargoTrailers;
 const trailers=new Map(),hitch=new THREE.Vector3(),hitchPosition=new THREE.Vector3();
 const ground=(x,z)=>game.groundContact?.heightAt?.(x,z)??game.world?.groundHeight?.(x,z)??0;
 const dispose=car=>{const trailer=trailers.get(car);if(!trailer)return;trailer.dispose();trailers.delete(car);if(car.trailer===trailer)delete car.trailer;};
 let refreshUI=()=>{};
 function setAttached(attached,car=game.vehicle){
  if(car?.model?.id!=='semi')return{ok:false,reason:'请先选择 Semi'};
  if(!attached&&semiTrailerLoadState(car,game).loaded)return{ok:false,reason:'货箱内仍有当前订单货物，请先完成交付或取消货运，不能直接卸下货箱'};
  if(!semiTrailerStationary(car))return{ok:false,reason:'请先完全停稳，再装上或卸下货箱'};
  car.semiTrailerAttached=!!attached;car.semiTrailerDoorsOpen=false;update(0);
  return{ok:true,reason:attached?'已装上空货箱':'已卸下货箱 · 仅牵引车'};
 }
 function toggleDoors(car=game.vehicle){
  if(car?.model?.id!=='semi'||!semiTrailerLoadState(car,game).attached)return{ok:false,reason:'请先装上货箱'};
  if(!semiTrailerStationary(car))return{ok:false,reason:'请先完全停稳，再手动开关货箱门'};
  car.semiTrailerDoorsOpen=car.semiTrailerDoorsOpen!==true;update(0);
  return{ok:true,reason:car.semiTrailerDoorsOpen?'货箱门已手动打开':'货箱门已手动关闭'};
 }
 function update(dt=0){
  const cars=new Set([game.vehicle,...(game.traffic??[]),...(game.police??[]),game.personalVehicle]);
  for(const [car]of trailers)if(!cars.has(car)||!car.root?.parent)dispose(car);
  for(const car of cars){
   if(car?.model?.id!=='semi'||!car.root?.parent)continue;
   // Moving clears the request rather than merely hiding an open door. Braking
   // back to zero, selecting P, or a pickup hold can never reopen it.
   if(!semiTrailerStationary(car))car.semiTrailerDoorsOpen=false;
   const state=semiTrailerLoadState(car,game);
   if(!state.attached){car.semiTrailerDoorsOpen=false;dispose(car);continue;}
   let trailer=trailers.get(car);if(!trailer){trailer=createSemiTrailer();trailers.set(car,trailer);car.trailer=trailer;game.scene.add(trailer.root);}
   trailer.root.visible=car.root.visible&&!car.populationDormant;if(!trailer.root.visible)continue;
   car.root.updateWorldMatrix(true,true);const rig=car.semiRig?.hitch;
   if(rig)rig.getWorldPosition(hitch);else{hitchPosition.set(0,1.2,2.05);hitch.copy(car.root.localToWorld(hitchPosition));}
   const e=car.root.matrixWorld.elements,yaw=Math.atan2(e[8],e[10]);
   trailer.state=followSemiTrailer(trailer.state,hitch,yaw);alignSemiTrailer(trailer,hitch,trailer.state.yaw,ground);
   trailer.loaded=state.loaded;trailer.payloadKg=state.payloadKg;trailer.updateLoad(state);trailer.updateLights(car);
   const target=state.doorsOpen?1:0;trailer.doorAmount=THREE.MathUtils.damp(trailer.doorAmount,target,5,Math.max(0,finite(dt)));
   for(const door of trailer.doors)door.pivot.rotation.y=door.side*trailer.doorAmount*1.8;
   trailer.wheelRotation=finite(trailer.wheelRotation)+((finite(car.speed)<0?-1:1)*trailer.state.distance)/SEMI_TRAILER_SPEC.wheelRadius;
   const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),trailer.wheelRotation),matrix=new THREE.Matrix4();let i=0;
   for(const z of SEMI_TRAILER_SPEC.axles)for(const side of [-1,1]){matrix.compose(new THREE.Vector3(side*1.293,SEMI_TRAILER_SPEC.wheelY,z),rotation,new THREE.Vector3(.035,.23,.23));trailer.wheelHubs.setMatrixAt(i++,matrix);}trailer.wheelHubs.instanceMatrix.needsUpdate=true;
  }
  refreshUI();
 }
 if(typeof game.updateCamera==='function'){
  const originalCamera=game.updateCamera.bind(game);
  game.updateCamera=(dt,pose)=>{
   originalCamera(dt,pose);const car=game.vehicle,t=game.transition,blend=t?.pose?.carBlend??1;
   if(car?.model?.id!=='semi'||!car.trailer||game.cameraMode!==0||(!game.inCar&&!t)||game.flight?.active||game.aircraft?.active||blend<=0||(t?.time===0&&t.cameraStart))return;
   const anchor=t?(pose?.position??car.pos):(game.cameraAnchor??pose?.position??car.pos),yaw=pose?.yaw??car.yaw,follow=t?yaw:(game.followYaw??yaw),orbit=follow+(game.cameraYaw??0);
   const next=semiTrailerChasePose(anchor,yaw,orbit,car.trailer.state?.yaw??yaw,game.camera.aspect);
   if(t){
    const oldPosition=new THREE.Vector3(Math.sin(orbit)*11,5.5,Math.cos(orbit)*11).add(anchor),oldLook=new THREE.Vector3(-Math.sin(yaw)*5,1.1,-Math.cos(yaw)*5).add(anchor);
    game.camera.position.add(next.position.sub(oldPosition).multiplyScalar(blend));game.cameraLook.add(next.look.sub(oldLook).multiplyScalar(blend));
   }else{game.camera.position.copy(next.position);game.cameraLook.copy(next.look);}
   game.camera.lookAt(game.cameraLook);
  };
 }
 const originalLighting=game.updateVehicleLighting.bind(game);game.updateVehicleLighting=dt=>{originalLighting(dt);update(game.paused?0:dt);};
 const originalRemove=game.removeVehicle.bind(game);game.removeVehicle=car=>{dispose(car);return originalRemove(car);};
 game.semiCargoTrailers={update,dispose,trailers,setAttached,toggleDoors,getState:(car=game.vehicle)=>semiTrailerLoadState(car,game),visualOnly:true};
 refreshUI=installSemiTrailerControls(game,game.semiCargoTrailers);return game.semiCargoTrailers;
}

// Reuse existing phone layouts. These are independent actions, never brake or
// parking handlers. Empty-box selection is per vehicle for the current session.
function installSemiTrailerControls(game,service){
 const ui=game.ui;if(typeof ui?.renderPhone!=='function')return()=>{};
 const render=ui.renderPhone.bind(ui);let controls=null;
 const refresh=()=>{
  if(!controls?.panel.isConnected)return;
  const {car,status,attach,doors}=controls,state=service.getState(car);
  const label=state.loaded?`货箱已装货 · ${state.payloadKg/1000} 吨 · 交付或取消订单后才能卸下`:state.attached?'已装上空货箱':'无货箱 · 仅牵引车';
  const setText=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
  setText(status,label);setText(attach,state.attached?'卸下货箱':'装上空货箱');
  attach.title=state.loaded?'当前订单仍有货物，不能直接卸下货箱':'';
  setText(doors,state.doorsOpen?'关闭货箱门':'打开货箱门');doors.disabled=!state.attached;doors.setAttribute('aria-pressed',String(state.doorsOpen));
 };
 ui.renderPhone=page=>{
  render(page);controls=null;
  if(!['garage','jobs'].includes(page)||game.vehicle?.model?.id!=='semi')return;
  const content=document.getElementById('phone-content');if(!content)return;
  const panel=document.createElement('section');panel.dataset.semiTrailerControls='';
  const heading=document.createElement('h4');heading.className='phone-section-label';heading.textContent='当前 Semi · 货箱控制';
  const status=document.createElement('p');status.className='phone-note';status.setAttribute('role','status');
  const attach=document.createElement('button');attach.type='button';attach.className='phone-row';attach.dataset.semiTrailerAttach='';
  const doors=document.createElement('button');doors.type='button';doors.className='phone-row';doors.dataset.semiTrailerDoors='';
  const note=document.createElement('p');note.className='phone-note';note.textContent='停稳后操作。货箱门独立手动开关，与刹车 / P 挡无关；起步自动关门，停车不会重新打开。无货默认不带货箱；空货箱选择仅保留本次车辆会话，载货存档会自动恢复货箱。挂车仅为视觉随动，无独立碰撞或铰接物理。';
  const car=game.vehicle,act=action=>{if(game.vehicle!==car){ui.renderPhone(page);return;}const result=action();ui.toast?.(result.reason,result.ok?'':'error');refresh();};
  attach.onclick=()=>act(()=>service.setAttached(!service.getState(car).attached,car));doors.onclick=()=>act(()=>service.toggleDoors(car));
  panel.append(heading,status,attach,doors,note);content.prepend(panel);controls={panel,car,status,attach,doors};refresh();
 };
 return refresh;
}

