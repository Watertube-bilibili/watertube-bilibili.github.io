/** SUNSET COAST 1.0 — local review candidate, NOT published.
 * Actual punched masonry shells, recessed glazing and open furnished interiors.
 * No façade image contains windows. Geometry is batched by block/material;
 * a distant solid silhouette LOD is never used within walking/detail range.
 */
import * as THREE from './vendor/three.module.js';
import {isMobilePerformanceDevice} from './performance-profile.js';

export const ARCHITECTURE_VERSION='sunset-coast-1.0-geometry-review-1';
export const ARCHITECTURE_DETAIL_RADIUS=175;
export const ARCHITECTURE_MOBILE_DETAIL_RADIUS=115;
export const ENTERABLE_BUILDINGS=Object.freeze([
 {id:'cafe',name:'TIDE / COFFEE',x:-54.5,z:134.5,w:22,d:21,floors:3,style:'deco',yaw:0},
 {id:'market',name:'COAST / PROVISIONS',x:105.5,z:134.5,w:23,d:22,floors:3,style:'brick',yaw:0},
 {id:'gallery',name:'ATELIER / 08',x:25.5,z:25.5,w:22,d:22,floors:5,style:'modern',yaw:Math.PI},
 {id:'lobby',name:'THE PALM / HOTEL',x:-134.5,z:-134.5,w:23,d:22,floors:4,style:'terrace',yaw:Math.PI}
]);
const STYLE={
 deco:{wall:0xe5dbc6,trim:0xf3ebdc,accent:0x3d7775,metal:0x37595a,wood:0x946b43,glass:0x415d62},
 brick:{wall:0x995d45,trim:0xd9c5a3,accent:0x3b5658,metal:0x273e41,wood:0x876045,glass:0x3c5459},
 terrace:{wall:0xd4cab5,trim:0xf0e6d4,accent:0x6b7b62,metal:0x394d45,wood:0xa67f50,glass:0x4a6365},
 modern:{wall:0xadb4ad,trim:0xe7e8dd,accent:0x455c61,metal:0x2e464b,wood:0x96774e,glass:0x416570}
};
const hash=(a,b,c=0)=>{let n=Math.imul(a+37,374761393)^Math.imul(b+71,668265263)^Math.imul(c+3,1274126177);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;};
const unitBox=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(.5,.5,1,16),leaf=new THREE.IcosahedronGeometry(1,1),shade=new THREE.ConeGeometry(.5,1,20,1,true);
const quad=new THREE.PlaneGeometry(1,1);
const roofPrism=(()=>{const p=[[-.5,0,-.5],[.5,0,-.5],[0,1,-.5],[-.5,0,.5],[.5,0,.5],[0,1,.5]],faces=[[0,2,1],[3,4,5],[0,3,5],[0,5,2],[1,2,5],[1,5,4],[0,1,4],[0,4,3]],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(faces.flatMap(f=>f.flatMap(i=>p[i])),3));g.computeVertexNormals();return g;})();
const rounded=(()=>{const s=new THREE.Shape(),r=.11;s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);s.lineTo(-.5+r,.5);s.quadraticCurveTo(-.5,.5,-.5,.5-r);s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);const g=new THREE.ExtrudeGeometry(s,{depth:.8,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.09,bevelThickness:.1,curveSegments:4});g.translate(0,0,-.4);return g;})();
const materials={
 masonry:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.86}),
 trim:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.68}),
 metal:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.34,metalness:.42}),
 wood:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.73}),
 glass:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.18,metalness:.26}),
 clear:new THREE.MeshStandardMaterial({color:0x9fbab4,transparent:true,opacity:.18,roughness:.13,metalness:.1,depthWrite:false}),
 greenery:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),
 glow:new THREE.MeshStandardMaterial({color:0xffe2a9,emissive:0xffca7f,emissiveIntensity:.45,roughness:.4}),
};
// InstancedMesh instanceColor is independent of geometry vertex colors. These
// shared primitive geometries have no 'color' vertex attribute; enabling both
// would multiply the tint by a missing/black attribute on some WebGL drivers.
for(const material of Object.values(materials))if(material.vertexColors){material.vertexColors=false;material.userData.instanceTint=true;}
materials.glass.emissive.setHex(0xc9a975);materials.glass.emissiveIntensity=0;materials.glass.userData.nightEmission=.12;
const dummy=new THREE.Object3D(),color=new THREE.Color();
class Batch {
 constructor(parent,name){this.parent=parent;this.name=name;this.items=new Map();this.count=0;}
 add(mat,geom,tint,x,y,z,w,h,d,yaw=0,rx=0,rz=0){if(w<=0||h<=0||d<=0)return;const key=mat+':'+geom.uuid;let b=this.items.get(key);if(!b){b={material:materials[mat],geometry:geom,rows:[]};this.items.set(key,b);}b.rows.push([x,y,z,w,h,d,yaw,rx,rz,tint]);this.count++;}
 flush(){const group=new THREE.Group();group.name=this.name;for(const {material,geometry,rows} of this.items.values()){const m=new THREE.InstancedMesh(geometry,material,rows.length);m.name=this.name+'/'+material.type;m.userData.semantic=5;m.userData.architecture=true;m.castShadow=!material.transparent;m.receiveShadow=true;for(let i=0;i<rows.length;i++){const [x,y,z,w,h,d,yaw,rx,rz,tint]=rows[i];dummy.position.set(x,y,z);dummy.rotation.set(rx,yaw,rz);dummy.scale.set(w,h,d);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);if(material.userData.instanceTint)m.setColorAt(i,color.setHex(tint));}m.computeBoundingSphere();group.add(m);rows.length=0;}this.parent.add(group);return group;}
}
function makeLabel(text,background=0x314b4b){
 const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#'+background.toString(16).padStart(6,'0');ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#f5edda';ctx.font='500 52px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,66,950);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return new THREE.MeshStandardMaterial({map:t,roughness:.65});
}
export function pedestrianColliderContains(b,p,radius=.3,actorHeight=1.8){
 const y=Number.isFinite(p.y)?p.y:0,base=Number.isFinite(b.baseY)?b.baseY:0,top=base+(Number.isFinite(b.height)?b.height:1000);
 if(top<y+.08||base>y+actorHeight)return false;
 const c=Math.cos(b.yaw??0),s=Math.sin(b.yaw??0),dx=p.x-b.x,dz=p.z-b.z;
 return Math.abs(dx*c-dz*s)<b.w+radius&&Math.abs(dx*s+dz*c)<b.d+radius;
}
export function coreBuildingSpecifications(roads){
 const specs=[];for(let ix=0;ix<roads.length-1;ix++)for(let iz=0;iz<roads.length-1;iz++){
  if((ix===0&&iz===2)||(ix===3&&iz===2))continue;
  const cx=(roads[ix]+roads[ix+1])/2,cz=(roads[iz]+roads[iz+1])/2;
  for(let a=0;a<2;a++)for(let b=0;b<2;b++){
   const x=cx+(a-.5)*29,z=cz+(b-.5)*29,entry=ENTERABLE_BUILDINGS.find(s=>s.x===x&&s.z===z);
   const n=hash(ix,iz,a*2+b),style=['deco','brick','terrace','modern'][(ix+(iz>3?0:1)+(a+b===1?1:0))%4];
   specs.push({...{id:`block-${ix}-${iz}-${a}-${b}`,x,z,w:20+n%4,d:20+(n>>>4)%4,floors:3+(n>>>8)%(ix>=4?8:4),style,yaw:b?0:Math.PI},...entry,enterable:!!entry,block:ix+':'+iz});
  }
 }return specs;
}
function authorBuilding(spec,batch,far,colliders,labels,interiorLights){
 const s=STYLE[spec.style],{w,d,floors}=spec,h=4+floors*3.2,cs=Math.cos(spec.yaw),sn=Math.sin(spec.yaw);
 const point=(x,z)=>({x:spec.x+x*cs+z*sn,z:spec.z-x*sn+z*cs});
 const add=(mat,tint,x,y,z,bw,bh,bd,yaw=0,geometry=unitBox,rx=0,rz=0)=>{const p=point(x,z);batch.add(mat,geometry,tint,p.x,y,p.z,bw,bh,bd,yaw+spec.yaw,rx,rz);};
 const box=(tint,x,y,z,bw,bh,bd,mat='masonry',yaw=0)=>add(mat,tint,x,y,z,bw,bh,bd,yaw);
 const collision=(x,z,bw,bd,base,height,kind='architecture-wall',yaw=0)=>{const p=point(x,z);colliders.push({x:p.x,z:p.z,w:bw/2,d:bd/2,baseY:base,height,yaw:yaw+spec.yaw,kind,architectureId:spec.id});};
 const facade=(width,depth,faceYaw)=>{
  const c=Math.cos(faceYaw),n=Math.sin(faceYaw),f=(tint,u,y,v,bw,bh,bd,mat='masonry')=>box(tint,u*c+v*n,y,-u*n+v*c,bw,bh,bd,mat,faceYaw),outer=depth/2,thick=.52;
  const bays=Math.max(3,Math.round(width/4.4)),pitch=width/bays,opening=pitch-1.02;
  // Storey bands and piers physically enclose real holes. No cuboid behind them.
  for(let floor=0;floor<floors;floor++){
   const y0=4+floor*3.2,wh=spec.style==='brick'?2.18:2.05,wy=y0+1.63;
   f(s.wall,0,y0+.37,outer-thick/2,width,.74,thick);
   f(s.wall,0,y0+3.03,outer-thick/2,width,.34,thick);
   for(let j=0;j<=bays;j++){const u=-width/2+j*pitch;f(s.wall,u,wy,outer-thick/2,j===0||j===bays?.48:1.02,2.18,thick);}
   for(let j=0;j<bays;j++){
    const u=-width/2+(j+.5)*pitch,glassV=outer-.38;
    // Deep reveals (0.38m) and a lower-projecting sill give parallax at glancing angles.
    f(s.trim,u,wy-wh/2-.08,outer-.04,opening+.22,.16,.82,'trim');
    f(s.trim,u,wy+wh/2+.08,outer-.20,opening+.18,.14,.64,'trim');
    f(s.trim,u-opening/2-.05,wy,outer-.20,.10,wh,.64,'trim');f(s.trim,u+opening/2+.05,wy,outer-.20,.10,wh,.64,'trim');
    f(s.metal,u,wy,glassV,opening,.09,.075,'metal');
    f(s.metal,u,wy,glassV,.07,wh,.075,'metal');
    f(s.glass+(j%3)*0x030303,u,wy,glassV-.045,opening-.06,wh-.09,.045,'glass');
    // A separate solid deep room back and thin reveal side return are visible behind glass.
    if((j+floor)%3===0)f(0xbdb29a,u+opening*.23,wy,glassV-.08,.34,wh-.12,.045,'trim');
    if(spec.style==='brick'){f(s.metal,u,wy+.55,glassV+.015,opening,.045,.065,'metal');f(s.metal,u,wy-.55,glassV+.015,opening,.045,.065,'metal');}
    if((spec.style==='terrace'||spec.style==='deco')&&floor%2===0&&j%2===1){
     const balcony=1.35;f(s.trim,u,y0+.37,outer+.57,opening+.52,.20,balcony,'trim');
     f(s.metal,u,y0+1.45,outer+1.18,opening+.38,.075,.075,'metal');
     for(let k=0;k<=6;k++)f(s.metal,u-opening/2+k*opening/6,y0+.95,outer+1.18,.055,.94,.055,'metal');
     for(const side of [-1,1])f(s.metal,u+side*(opening/2+.14),y0+1.45,outer+.61,.065,.075,1.18,'metal');
     if(j%3===1){f(0xa38b70,u,y0+.61,outer+.97,.85,.28,.30,'trim');f(0x64815d,u,y0+.80,outer+.97,.80,.20,.27,'greenery');}
    }
   }
   if(spec.style==='deco'||spec.style==='modern')f(s.trim,0,y0+3.18,outer+.045,width+.26,.12,.33,'trim');
  }
  // Ground-level retail bays: door void is 2.8m clear on the front facade only.
  const front=Math.abs(faceYaw)<.01,door=front&&spec.enterable;
  f(s.trim,0,3.72,outer-.12,width,.56,.76,'trim');
  if(door){
   for(const side of [-1,1]){const bw=(width-3.0)/2;f(s.wall,side*(1.5+bw/2),.28,outer-.26,bw,.44,.52);f(s.metal,side*1.49,1.72,outer-.26,.12,3.15,.46,'metal');}
   // Open pivoted leaves sit parallel to doorway jambs, not across the walkthrough.
   for(const side of [-1,1]){const x=side*1.51;f(s.metal,x,1.70,outer-.86,.085,3.08,1.25,'metal');f(s.metal,x+side*.09,1.45,outer-.79,.075,.63,.06,'metal');}
  }else f(s.trim,0,.28,outer-.26,width,.44,.52,'trim');
  const retailCount=Math.max(3,Math.round(width/4.3)),step=width/retailCount;
  for(let j=0;j<=retailCount;j++){const u=-width/2+j*step;if(door&&Math.abs(u)<1.6)continue;f(s.accent,u,1.88,outer-.22,.26,3.15,.62,'trim');}
  for(let j=0;j<retailCount;j++){
   const a=-width/2+j*step+.16,b=a+step-.32,segments=door?(b<-1.5||a>1.5?[[a,b]]:[[a,Math.min(b,-1.55)],[Math.max(a,1.55),b]]):[[a,b]];
   for(const [lo,hi]of segments){if(hi-lo<.1)continue;const u=(lo+hi)/2;f(s.metal,u,3.10,outer-.35,hi-lo,.09,.12,'metal');f(s.metal,u,.55,outer-.35,hi-lo,.09,.12,'metal');f(s.glass,u,1.83,outer-.40,hi-lo,2.47,.04,spec.enterable?'clear':'glass');}
  }
  if(spec.style==='modern'){for(let j=0;j<=bays;j++)f(s.trim,-width/2+j*pitch,h/2+1.4,outer+.08,.19,h-2.8,.48,'trim');}
  if(spec.style==='brick'){for(let j=0;j<=bays;j+=2)f(s.wall,-width/2+j*pitch,h/2,outer+.11,.42,h,.39);}
  // Cornices, coping and a full parapet, rather than a paper thin roof texture.
  f(s.trim,0,h+.06,outer,width+.5,.26,.82,'trim');f(s.wall,0,h+.48,outer-.12,width,.58,.32);f(s.trim,0,h+.79,outer-.11,width+.30,.16,.50,'trim');
 };
 facade(w,d,0);facade(w,d,Math.PI);facade(d,w,Math.PI/2);facade(d,w,-Math.PI/2);
 // Actual floor/ceiling plates; interiors have no solid ground-level filler.
 box(spec.id==='gallery'?0xb7b4a7:0xc5b391,0,.045,0,w-.6,.09,d-.6,'trim');
 box(0xc9c5b5,0,3.96,0,w-.7,.22,d-.7,'trim');
 box(0x666d64,0,h-.06,0,w-.7,.22,d-.7);
 for(let f=1;f<floors;f++)box(0x646963,0,4+f*3.2,0,w-.7,.14,d-.7);
 // Distinct roof silhouettes, utility ducts and terraces.
 if(spec.style==='deco'){
  box(s.wall,-w*.25,h+.7,-d*.12,w*.33,1.4,d*.54);box(s.trim,-w*.25,h+1.48,-d*.12,w*.37,.16,d*.58,'trim');
  for(let q=0;q<3;q++)box(s.accent,w*.38,h+.5+q*.23,d*.19,.50,.12,d*.44,'trim');
 }else if(spec.style==='modern'){
  box(s.accent,0,h+1.25,-d*.12,w*.62,2.5,d*.56,'metal');
  for(let q=0;q<6;q++)box(s.trim,-w*.31+q*w*.124,h+1.4,-d*.12,.14,2.9,d*.58,'trim');
 }else if(spec.style==='brick'){
  for(let q=0;q<3;q++){const rx=-w*.31+q*w*.31;add('metal',0x4c5b59,rx,h+.20,0,w*.29,1.34,d*.72,0,roofPrism);box(s.wall,rx,h+.42,-d*.30,w*.29,.72,.28);}
  box(s.wall,w*.30,h+1.4,-d*.31,.8,2.9,.8);box(s.trim,w*.30,h+2.88,-d*.31,1.0,.20,1,'trim');
 }else{
  box(s.trim,-w*.22,h+.32,-d*.18,w*.4,.16,d*.5,'trim');
  for(let k=0;k<5;k++)box(s.wood,-w*.4+k*w*.09,h+1.85,-d*.18,.12,.14,d*.54,'wood');
  for(const xx of [-w*.4,-w*.04])for(const zz of [-d*.43,d*.07])box(s.wood,xx,h+.96,zz,.15,1.80,.15,'wood');
 }
 // Sidewalk aprons are separate from interior flooring: no coplanar hidden slab.
 for(const side of [-1,1])box(0xc1bcaa,0,.025,side*(d/2+.87),w+3.2,.05,1.70,'trim');
 for(const side of [-1,1])box(0xc1bcaa,side*(w/2+.84),.025,0,1.65,.05,d-.02,'trim');
 // Expansion joints are real narrow channels between paving strips (not zebra decals).
 for(let x=-w/2+1;x<w/2;x+=2.4)for(const side of [-1,1])box(0xaaa797,x,.053,side*(d/2+.90),.022,.012,1.65,'trim');
 // Corner planters and simple bollards give the ground floor a human scale.
 if(hash(Math.round(spec.x),Math.round(spec.z))%3===0||spec.enterable){
  for(const side of [-1,1]){
   box(0xa58f73,side*(w/2-1),.35,d/2+1.00,.82,.64,.76,'trim');
   add('greenery',0x5e7754,side*(w/2-1),.90,d/2+1.00,.90,.78,.86,0,leaf);
   if(spec.enterable)collision(side*(w/2-1),d/2+1.00,.84,.78,0,1.22,'streetscape-planter');
  }
 }
 if(spec.style==='brick'||spec.style==='modern')for(const side of [-1,1])add('metal',s.metal,side*(w*.40),.56,d/2+1.50,.12,1.10,.12,0,cylinder);
 // Front canopy has real thickness and cantilever supports. It never intrudes on a road.
 box(s.accent,0,3.35,d/2+.77,w*.91,.14,1.84,'metal');
 for(const xx of [-w*.37,w*.37])box(s.metal,xx,3.08,d/2+.54,.08,.52,.08,'metal');
 if(spec.enterable){
  const sign=new THREE.Mesh(quad,makeLabel(spec.name,s.accent));const p=point(0,d/2+.10);sign.position.set(p.x,3.77,p.z);sign.rotation.y=spec.yaw;sign.scale.set(w*.74,.62,1);sign.userData.semantic=5;labels.add(sign);
  // Full-height shell colliders plus a separate upper mass. The walking query
  // respects height; the native bridge keeps collision for flight/vehicles above.
  collision(-w/2+.23,0,.46,d,0,h,'architecture-wall');collision(w/2-.23,0,.46,d,0,h,'architecture-wall');collision(0,-d/2+.23,w,.46,0,h,'architecture-wall');
  const side=(w-3)/2;for(const xx of [-1,1])collision(xx*(1.5+side/2),d/2-.23,side,.46,0,3.5);
  collision(0,0,w,d,3.78,h-3.78,'architecture-upper');
  collision(0,d/2-.23,3,.46,3.12,.66,'architecture-lintel');
  furnish(spec,{box,add,collision,point},s,interiorLights);
 }else collision(0,0,w+.12,d+.12,0,h+.9,'building');
 far.add('masonry',unitBox,s.wall,spec.x,h/2,spec.z,w,h,d,spec.yaw);
 far.add('trim',unitBox,s.trim,spec.x,h+.2,spec.z,w+.5,.4,d+.5,spec.yaw);
 // Far LOD still keeps geometric glazing bands and projecting masonry piers;
 // only sub-pixel mullions, sill returns, furniture and balcony pickets disappear.
 for(const faceYaw of [0,Math.PI,Math.PI/2,-Math.PI/2]){
  const width=Math.abs(Math.sin(faceYaw))>.5?d:w,depth=Math.abs(Math.sin(faceYaw))>.5?w:d,c=Math.cos(faceYaw),n=Math.sin(faceYaw),emit=(mat,tint,u,y,v,bw,bh,bd)=>{const p=point(u*c+v*n,-u*n+v*c);far.add(mat,unitBox,tint,p.x,y,p.z,bw,bh,bd,faceYaw+spec.yaw);};
  for(let f=0;f<floors;f++)emit('glass',s.glass,0,5.63+f*3.2,depth/2+.045,width-.7,2.05,.06);
  const bays=Math.max(3,Math.round(width/4.4));for(let j=0;j<=bays;j++)emit('masonry',s.wall,-width/2+j*width/bays,h/2,depth/2+.13,.9,h,.23);
 }

 spec.height=h+.9;spec.front=point(0,d/2);spec.doorWidth=spec.enterable?3:0;spec.windowRecess=.38;
}
function furnish(spec,{box,add,collision,point},s,lights){
 const {w,d}=spec;
 const furniture=(x,z,bw,bd,height=.9)=>collision(x,z,bw,bd,.08,height,'interior-furniture');
 const chair=(x,z,yaw=0)=>{
  add('wood',s.wood,x,.52,z,.62,.14,.60,yaw,rounded);
  const c=Math.cos(yaw),n=Math.sin(yaw),p=(u,v)=>[x+u*c+v*n,z-u*n+v*c];
  for(const u of [-.23,.23])for(const v of [-.22,.22]){const [xx,zz]=p(u,v);box(s.metal,xx,.26,zz,.055,.52,.055,'metal');}
  const [xx,zz]=p(0,.26);add('wood',s.wood,xx,.88,zz,.64,.64,.11,yaw,rounded);furniture(x,z,.66,.66,1.16);
 };
 const table=(x,z,r=.63)=>{add('wood',s.wood,x,.86,z,r*2,.10,r*2,0,cylinder);add('metal',s.metal,x,.43,z,.10,.83,.10,0,cylinder);add('metal',s.metal,x,.10,z,.65,.08,.65,0,cylinder);furniture(x,z,r*2,r*2,.91);};
 const planter=(x,z,size=1)=>{add('trim',0xb09d81,x,.32,z,.65*size,.62*size,.65*size,0,cylinder);for(let q=0;q<5;q++)add('greenery',q%2?0x68815c:0x415f45,x+Math.sin(q*2.4)*.24,.8+q*.13,z+Math.cos(q*2.4)*.23,.35,.7,.30,q*.7,leaf,0,.32);furniture(x,z,.66,.66,1.4);};
 const pendant=(x,z)=>{box(s.metal,x,3.30,z,.024,.96,.024,'metal');add('metal',s.accent,x,2.75,z,.62,.40,.62,0,shade);add('glow',0xffffff,x,2.58,z,.31,.08,.31,0,cylinder);};
 // Wainscot, framed wall art and acoustic ceiling slats.
 for(const side of [-1,1])box(s.wood,side*(w/2-.42),.57,0,.08,1.04,d-.8,'wood');
 for(let j=0;j<10;j++)box(s.wood,-w*.4+j*w*.088,3.77,0,.08,.10,d*.84,'wood');
 if(spec.id==='cafe'){
  // Service counter: softened edge, panelled apron, espresso station, cups.
  add('wood',s.wood,-w*.19,.58,-d*.30,w*.50,1.06,1.38,0,rounded);box(0xdfd8c5,-w*.19,1.17,-d*.30,w*.52,.14,1.5,'trim');furniture(-w*.19,-d*.30,w*.52,1.5,1.2);
  for(let slat=0;slat<24;slat++)box(0x75583c,-w*.43+slat*w*.021,.63,-d*.30+.705,.045,.95,.035,'wood');
  add('metal',0x9aaba7,-w*.29,1.51,-d*.31,1.16,.58,.64,0,rounded);box(0x203c3c,-w*.29,1.68,-d*.275,.82,.23,.05,'metal');
  for(let j=0;j<4;j++){add('trim',0xe6dcca,-w*.06+j*.26,1.31,-d*.27,.16,.20,.16,0,cylinder);}
  for(let row=0;row<3;row++){box(s.wood,-w*.22,1.25+row*.64,-d/2+.67,w*.47,.10,.50,'wood');for(let j=0;j<6;j++)add('trim',[0xa85f42,0xc2b18b,0x6b8069][j%3],-w*.40+j*1.12,1.47+row*.64,-d/2+.68,.25,.34,.25,0,cylinder);}
  for(const x of [-7.2,-3.2,3.2,7.2])for(const z of [-1.4,4.0]){table(x,z);chair(x,z+1.12,0);chair(x,z-1.12,Math.PI);pendant(x,z);}
  box(0x677e6b,-w/2+1.10,.56,1.5,1.10,.82,9.4,'wood');box(0x4c6657,-w/2+.62,1.05,1.5,.20,.83,9.4,'wood');furniture(-w/2+1.10,1.5,1.1,9.4,1.3);
 }else if(spec.id==='market'){
  // Stocked shelves, three real aisles, checkout and produce islands.
  for(const x of [-7.2,-3.4,3.4,7.2])for(const z of [-3.8,2.7]){
   box(s.wood,x,1.03,z,1.20,1.9,3.80,'wood');
   for(let level=0;level<4;level++){box(s.trim,x,0.38+level*.49,z,1.44,.09,3.91,'trim');for(let j=0;j<7;j++)for(const side of [-1,1])box([0xd6b063,0x7b9774,0xbd6b50,0x738ca0][(j+level)%4],x+side*.47,.57+level*.49,z-1.55+j*.48,.30,.32,.32,'trim');}
   furniture(x,z,1.45,3.91,2.1);
  }
  box(s.wood,2.8,.53,-d*.32,5.3,1.0,1.30,'wood');box(0xd3d6c6,2.8,1.08,-d*.32,5.5,.13,1.45,'trim');furniture(2.8,-d*.32,5.5,1.45,1.15);
  box(s.metal,4.4,1.38,-d*.32,.58,.42,.12,'metal');
  for(const z of [-4,2.4]){pendant(-3,z);pendant(3,z);}
 }else if(spec.id==='gallery'){
  // Recognizable exhibits, not anonymous egg/blob placeholder sculptures.
  // Opaque gallery liners support framed architectural skyline studies.
  for(const side of [-1,1]){
   box(0xe8e4d8,side*(w/2-.46),1.73,0,.10,2.80,d-1.1,'trim');
   for(let j=0;j<3;j++){
    const z=-6+j*5;box(s.metal,side*(w/2-.54),2.00,z,.14,1.77,2.38,'metal');box(0xede3cc,side*(w/2-.65),2.00,z,.12,1.50,2.10,'trim');
    box(0x3b646c,side*(w/2-.73),1.38,z,.045,.045,1.82,'trim');
    for(let k=0;k<5;k++){const bh=[.48,.78,1.02,.65,.42][(k+j)%5],zz=z-.72+k*.36;
     box([0x537879,0xa77151,0x777f69][j],side*(w/2-.75),1.40+bh/2,zz,.045,bh,.26,'trim');
     for(let row=0;row<Math.floor(bh/.18);row++)box(0xe4d8ae,side*(w/2-.79),1.48+row*.18,zz,.022,.045,.15,'trim');
    }
   }
  }
  // Left display: a legible miniature coastal street, six building masses and roads.
  box(0xd7d3c6,-4.5,.48,-2.3,3.2,.82,2.35,'trim');box(0x56706b,-4.5,.91,-2.3,3.3,.08,2.45,'trim');
  box(0x526263,-4.5,.97,-2.3,3.12,.035,.35,'trim');box(0xd6c89b,-4.5,.993,-2.3,3.0,.012,.025,'trim');
  for(const side of [-1,1])for(let k=0;k<3;k++){
   const xx=-5.48+k*.95,zz=-2.3+side*.70,bh=[.62,1.12,.78][(k+(side>0?1:0))%3];
   box([0xe4d3b3,0x9c7055,0xb4c2b8][k],xx,.99+bh/2,zz,.66,bh,.60,'trim');box(0x455c60,xx,1.01+bh,zz,.71,.06,.65,'metal');
   for(let row=0;row<Math.floor(bh/.20);row++)for(const dx of [-.18,.18])box(0x2f5961,xx+dx,1.10+row*.20,zz-side*.309,.12,.11,.025,'metal');
  }
  furniture(-4.5,-2.3,3.3,2.45,2.25);
  // Right display: communications/observation tower with podium, shaft, deck and spire.
  box(0xd7d3c6,4.5,.48,-2.3,2.65,.82,2.35,'trim');box(0x56706b,4.5,.91,-2.3,2.75,.08,2.45,'trim');
  add('trim',0xd9c7a4,4.5,1.02,-2.3,1.25,.14,1.25,0,cylinder);add('trim',0xdfd9c9,4.5,1.60,-2.3,.25,1.14,.25,0,cylinder);
  add('metal',0x8c5a41,4.5,2.13,-2.3,.84,.14,.84,0,cylinder);add('glass',0x375b62,4.5,2.27,-2.3,.80,.18,.80,0,cylinder);add('trim',0xe9ddc5,4.5,2.40,-2.3,.93,.08,.93,0,cylinder);
  add('metal',0x8d6e47,4.5,2.70,-2.3,.055,.56,.055,0,cylinder);
  for(let k=0;k<6;k++){const a=k*Math.PI/3;box(0xd7c8ac,4.5+Math.cos(a)*.39,2.27,-2.3+Math.sin(a)*.39,.035,.22,.035,'trim');}
  furniture(4.5,-2.3,2.75,2.45,2.95);
  add('wood',s.wood,0,.48,-6.2,4.5,.70,1.0,0,rounded);furniture(0,-6.2,4.5,1,.9);
  for(const x of [-5,5])for(const z of [-3,4])pendant(x,z);
 }else{
  // Lobby seating groups, reception desk, brass divider and luggage shelf.
  for(const side of [-1,1]){
   add('wood',0x6f8170,side*5.7,.56,1.8,3.5,.76,1.14,0,rounded);add('wood',0x566d5c,side*5.7,1.02,2.25,3.6,.85,.30,0,rounded);furniture(side*5.7,1.8,3.7,1.6,1.4);table(side*5.7,-.1,.64);
  }
  add('wood',s.wood,0,.64,-6.6,6.1,1.15,1.45,0,rounded);box(0xe1d9c9,0,1.23,-6.6,6.2,.12,1.6,'trim');furniture(0,-6.6,6.2,1.6,1.3);
  for(let j=0;j<11;j++)box(0xa18355,-4+j*.8,2.3,-d/2+.8,.07,2.6,.07,'metal');
  for(const x of [-5,5]){pendant(x,1);pendant(x,-4);}
 }
 planter(-w*.37,d*.34);planter(w*.37,d*.34);
 // Two pooled no-shadow interior lights per space, activated only nearby.
 for(const z of [-d*.23,d*.23]){const p=point(0,z);const light=new THREE.PointLight(0xffdeb0,30,15,2);light.position.set(p.x,3.35,p.z);light.userData.interiorId=spec.id;lights.push(light);}
 // Small exterior bench and tactile planters are geometric, not decals.
 for(const side of [-1,1]){box(s.wood,side*w*.31,.52,d/2+1.05,2.45,.13,.62,'wood');for(const xx of [-.95,.95])box(s.metal,side*w*.31+xx,.28,d/2+1.05,.08,.5,.50,'metal');}
}
export function createCityArchitecture(scene,colliders=[],{roads=[-240,-160,-80,0,80,160,240],specs=coreBuildingSpecifications(roads),mobile=isMobilePerformanceDevice()}={}){
 const root=new THREE.Group();root.name='SUNSET COAST 1.0 / rebuilt architecture';scene.add(root);
 const labels=new THREE.Group();labels.name='enterable-premises-signs';root.add(labels);
 const blocks=new Map(),lights=[],before=colliders.length;
 for(const spec of specs){let block=blocks.get(spec.block??'showcase');if(!block){const group=new THREE.Group();root.add(group);block={group,detail:new Batch(group,'physical-facades'),far:new Batch(group,'distant-silhouettes'),specs:[]};blocks.set(spec.block??'showcase',block);}block.specs.push(spec);authorBuilding(spec,block.detail,block.far,colliders,labels,lights);}
 for(const block of blocks.values()){block.detailGroup=block.detail.flush();block.farGroup=block.far.flush();block.x=block.specs.reduce((n,s)=>n+s.x,0)/block.specs.length;block.z=block.specs.reduce((n,s)=>n+s.z,0)/block.specs.length;block.farGroup.visible=false;}
 lights.forEach(l=>root.add(l));
 const stats={version:ARCHITECTURE_VERSION,buildings:specs.length,enterable:specs.filter(s=>s.enterable).length,instances:[...blocks.values()].reduce((n,b)=>n+b.detail.count,0),colliders:colliders.length-before,mobile,detailRadius:mobile?ARCHITECTURE_MOBILE_DETAIL_RADIUS:ARCHITECTURE_DETAIL_RADIUS,activeDetailBlocks:blocks.size,drawBatches:[...blocks.values()].reduce((n,b)=>n+b.detail.items.size,0)};
 function update(position,{allDetailed=false}={}){let active=0;for(const b of blocks.values()){const radius=(mobile?ARCHITECTURE_MOBILE_DETAIL_RADIUS:ARCHITECTURE_DETAIL_RADIUS)+(b.detailActive===true?10:b.detailActive===false?-10:0),close=allDetailed||Math.hypot(position.x-b.x,position.z-b.z)<radius;b.detailActive=close;b.detailGroup.visible=close;b.farGroup.visible=!close;active+=+close;}for(const l of lights)l.visible=allDetailed||Math.hypot(position.x-l.position.x,position.z-l.position.z)<38;for(const label of labels.children)label.visible=allDetailed||Math.hypot(position.x-label.position.x,position.z-label.position.z)<260;stats.activeDetailBlocks=active;return stats;}
 return{root,blocks,specs,interiors:specs.filter(s=>s.enterable),lights,stats,update,nightMaterials:[materials.glass]};
}
