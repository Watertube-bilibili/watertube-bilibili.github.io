import * as THREE from './vendor/three.module.js';
import {groundHeight} from './regions.js';
import {SURFACE_DEPTH_BIAS} from './surface-layout.js';
/** Original procedural airliner: tapered fuselage, swept wings, nacelles and tail. */
export function createPassengerJet(){
 const root=new THREE.Group();root.name='SUNSET AIR original twin-engine passenger jet';
 const gears=[],wheels=[];
 const gearGroup=(name,x,y,z,axis,sign)=>{const group=new THREE.Group();group.name=name;group.position.set(x,y,z);root.add(group);gears.push({group,axis,sign});return group;};
 const moveToGear=(mesh,group,radius=0)=>{mesh.position.sub(group.position);root.remove(mesh);group.add(mesh);if(radius)wheels.push({mesh,radius});return mesh;};
 const white=new THREE.MeshStandardMaterial({color:0xe8edea,roughness:.45,metalness:.22}),blue=new THREE.MeshStandardMaterial({color:0x26798d,roughness:.45}),glass=new THREE.MeshStandardMaterial({color:0x193c4e,roughness:.22,metalness:.55}),dark=new THREE.MeshStandardMaterial({color:0x242b2d,roughness:.87}),metal=new THREE.MeshStandardMaterial({color:0x969f9e,roughness:.45,metalness:.7});
 const add=(geometry,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.userData.semantic=5;root.add(m);return m};
 const profile=[new THREE.Vector2(.12,-27),new THREE.Vector2(1,-25.6),new THREE.Vector2(2.2,-23),new THREE.Vector2(2.65,-19),new THREE.Vector2(2.8,-12),new THREE.Vector2(2.8,13),new THREE.Vector2(2.1,21),new THREE.Vector2(.35,26)];
 const fuselage=add(new THREE.LatheGeometry(profile,20),white,0,5.5,0);fuselage.rotation.x=Math.PI/2;
 // Lathe's -Y end rotates toward -Z: the tapered cockpit is the nose.
 const box=(w,h,d,m,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 for(const side of [-1,1]){
  const wingShape=new THREE.Shape();wingShape.moveTo(side*2,0);wingShape.lineTo(side*23,11);wingShape.lineTo(side*24,15);wingShape.lineTo(side*6,9);wingShape.lineTo(side*2,10);wingShape.closePath();
  const wing=add(new THREE.ExtrudeGeometry(wingShape,{depth:.55,bevelEnabled:false}),white,0,4.35,-3);wing.rotation.x=Math.PI/2;
  const stabilizerShape=new THREE.Shape();stabilizerShape.moveTo(side*1.8,0);stabilizerShape.lineTo(side*10,6);stabilizerShape.lineTo(side*10,8);stabilizerShape.lineTo(side*2,5);stabilizerShape.closePath();const stabilizer=add(new THREE.ExtrudeGeometry(stabilizerShape,{depth:.32,bevelEnabled:false}),white,0,6,18);stabilizer.rotation.x=Math.PI/2;
  const engine=add(new THREE.CylinderGeometry(1.45,1.15,5.5,16),white,side*8.3,2.75,1);engine.rotation.x=Math.PI/2;
  const intake=add(new THREE.CylinderGeometry(1.17,1.17,.18,16),dark,side*8.3,2.75,-1.84);intake.rotation.x=Math.PI/2;
  const fan=add(new THREE.ConeGeometry(.5,.7,10),metal,side*8.3,2.75,-1.99);fan.rotation.x=-Math.PI/2;
  for(let i=0;i<24;i++){const z=-17+i*1.42;box(.055,.48,.64,glass,side*2.78,6.05,z)}
  box(.08,1.85,1.22,blue,side*2.72,5.15,-19);box(.08,1.8,1.15,blue,side*2.72,5.2,16);
  const cockpit=box(1.2,.7,2.2,glass,side*1.55,6.45,-23);cockpit.rotation.y=-side*.18;
  const gear=gearGroup(side<0?'left main landing gear':'right main landing gear',side*3.4,2.7,5,'z',-side);
  moveToGear(box(.24,2.2,.3,metal,side*3.4,1.35,5),gear);for(const dz of [-.55,.55]){const wheel=add(new THREE.CylinderGeometry(.65,.65,.45,12),dark,side*3.4,.65,5+dz);wheel.rotation.z=Math.PI/2;moveToGear(wheel,gear,.65);}
  const tip=box(.24,1.9,1.3,blue,side*23.8,5.7,11.4);tip.rotation.z=-side*.2;
 }
 const finShape=new THREE.Shape();finShape.moveTo(0,0);finShape.lineTo(8,0);finShape.lineTo(7,7);finShape.lineTo(4.5,7);finShape.closePath();const fin=add(new THREE.ExtrudeGeometry(finShape,{depth:.45,bevelEnabled:false}),blue,.225,7.5,15.5);fin.name='swept vertical stabilizer';fin.rotation.y=-Math.PI/2;
 const noseGear=gearGroup('nose landing gear',0,3,-18,'x',-1);moveToGear(box(.3,2.7,.3,metal,0,1.65,-18),noseGear);for(const s of [-1,1]){const wheel=add(new THREE.CylinderGeometry(.48,.48,.3,10),dark,s*.27,.5,-18);wheel.rotation.z=Math.PI/2;moveToGear(wheel,noseGear,.48);}
 root.userData.gears=gears;root.userData.wheels=wheels;
 root.userData.originalProceduralAsset=true;root.userData.aircraftType='twin-engine narrow-body passenger jet';return root;
}
/** Cosmetic gear/wheel articulation only; passenger travel has no rigid body. */
export function animatePassengerJet(root,pose,dt=0){
 const gear=Math.max(0,Math.min(1,Number.isFinite(pose.gear)?pose.gear:1));
 for(const {group,axis,sign}of root.userData.gears??[]){group.rotation[axis]=sign*(1-gear)*Math.PI/2;group.visible=gear>.001;}
 if(pose.phase==='roll'||pose.phase==='rotate'||pose.phase==='rollout')for(const {mesh,radius}of root.userData.wheels??[]){const rotation=Math.max(0,Number.isFinite(pose.speed)?pose.speed:0)*Math.max(0,Math.min(.1,dt))/radius;mesh.rotateY(rotation);}
}
export function createAirportScene(parent,airport){
 const root=new THREE.Group();root.name=airport.id;root.userData.airport=airport.id;parent.add(root);root.visible=false;const colliders=[],y=airport.altitude;
 const mats=new Map();const material=(color,opts={})=>{const key=color+JSON.stringify(opts);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.88,...opts}));return mats.get(key)};
 const box=(w,h,d,color,x,yy,z,opts={})=>{const bias=opts.semantic===1?SURFACE_DEPTH_BIAS.road:opts.semantic===2?SURFACE_DEPTH_BIAS.paint:{};const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/40)),1,Math.max(1,Math.ceil(d/40))),material(color,{...bias,...Object.fromEntries(Object.entries(opts).filter(([key])=>key!=='semantic'))}));m.position.set(x,y+yy,z);m.userData.semantic=opts.semantic??5;root.add(m);return m};
 const b=airport.bounds,r=airport.runway;
 box(b.maxX-b.minX-28,.06,b.maxZ-b.minZ-28,0x83928a,(b.maxX+b.minX)/2,-.04,(b.maxZ+b.minZ)/2,SURFACE_DEPTH_BIAS.underlay);
 box(450,.10,640,0x758284,r.x-145,.018,r.z,SURFACE_DEPTH_BIAS.shoulder);
 box(r.width,.13,r.length,0x333d42,r.x,.01,r.z,{semantic:1});
 box(18,.14,r.length-170,0x636f70,r.x-110,.035,r.z,{semantic:1});
 for(let z=r.z-r.length/2+55;z<r.z+r.length/2-35;z+=60)box(.6,.025,26,0xf1f1db,r.x,.0635,z,{semantic:2});
 for(const end of [-1,1])for(let i=-3;i<=3;i++)box(2.2,.025,35,0xe9ecdf,r.x+i*5,.0635,r.z+end*(r.length/2-50),{semantic:2});
 for(const side of [-1,1]){box(.4,.025,r.length-20,0xe4e5d6,r.x+side*(r.width/2-1),.0635,r.z,{semantic:2});for(let z=r.z-r.length/2;z<=r.z+r.length/2;z+=100)box(.3,.4,.3,0x86d8ed,r.x+side*(r.width/2+2),.25,z,{emissive:0x4bb5cf,emissiveIntensity:.5})}
 const t=airport.terminal;
 box(65,12,132,0x7eafb5,t.x,6,t.z,{metalness:.3,roughness:.3});box(72,.8,142,0xd7ddce,t.x,12.5,t.z);box(69,.5,136,0xc7cfc2,t.x,.28,t.z);colliders.push({x:t.x,z:t.z,w:36,d:71,baseY:y,height:12.9,yaw:0,kind:'terminal'});
 for(let z=t.z-57;z<=t.z+57;z+=14){box(1,12.5,.8,0xbac8c3,t.x-33,6.2,z);box(1,12.5,.8,0xbac8c3,t.x+33,6.2,z)}
 for(const dz of [-43,33]){box(45,3.1,4,0xafbeb5,t.x+50,4,dz+t.z);box(5,5,5,0x9baca7,t.x+70,2.5,dz+t.z);colliders.push({x:t.x+50,z:t.z+dz,w:22.5,d:2,baseY:y+2.45,height:3.1,yaw:0,kind:'jet-bridge'}, {x:t.x+70,z:t.z+dz,w:2.5,d:2.5,baseY:y,height:5,yaw:0,kind:'jet-bridge-support'})}
 // Glass tower, ringed control cab and radar identify the airport from the road.
 const tx=b.minX+145,tz=b.minZ+100;box(10,31,10,0xabb9b0,tx,15.5,tz);box(20,5,18,0x53818d,tx,33.5,tz,{metalness:.3});box(23,.7,21,0xd8dfd0,tx,36.4,tz);box(.6,9,.6,0x6d7f82,tx,40,tz);box(8,.6,1,0xb5c8c0,tx,44,tz);colliders.push({x:tx,z:tz,w:5,d:5,baseY:y,height:31,yaw:0,kind:'tower'}, {x:tx,z:tz,w:10,d:9,baseY:y+31,height:5,yaw:0,kind:'tower-cab'}, {x:tx,z:tz,w:11.5,d:10.5,baseY:y+36.05,height:.7,yaw:0,kind:'tower-roof'}, {x:tx,z:tz,w:.3,d:.3,baseY:y+35.5,height:9,yaw:0,kind:'tower-mast'}, {x:tx,z:tz,w:4,d:.5,baseY:y+43.7,height:.6,yaw:0,kind:'tower-radar'});
 const jet=createPassengerJet();jet.position.set(r.x-120,y+.14,r.z+95);root.add(jet);const jetBounds=new THREE.Box3().setFromObject(jet),jetCenter=jetBounds.getCenter(new THREE.Vector3()),jetSize=jetBounds.getSize(new THREE.Vector3());colliders.push({x:jetCenter.x,z:jetCenter.z,w:jetSize.x/2,d:jetSize.z/2,baseY:jetBounds.min.y,height:jetSize.y,yaw:0,kind:'aircraft'});
 // A readable terminal sign uses a local canvas only when a browser supplies one.
 if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#183d49';ctx.fillRect(0,0,512,96);ctx.fillStyle='#dbf5dc';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(airport.code+'  SUNSET AIR',256,48);const texture=new THREE.CanvasTexture(canvas),sign=new THREE.Mesh(new THREE.PlaneGeometry(42,6),new THREE.MeshBasicMaterial({map:texture}));sign.position.set(t.x-33.1,y+9,t.z);sign.rotation.y=-Math.PI/2;root.add(sign);sign.userData.ownedTexture=texture}}
 return{root,airport,colliders,dispose(){root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();o.userData.ownedTexture?.dispose()});root.removeFromParent()}};
}
