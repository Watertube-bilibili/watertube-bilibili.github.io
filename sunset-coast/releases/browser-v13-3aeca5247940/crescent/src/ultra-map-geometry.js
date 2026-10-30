import * as THREE from '../vendor/three.module.js';
import {PALETTE,CHUNK_SIZE,TERRAIN_STEP,groundHeight,heightVertex,terrainKind,ROADS,TRAILS,MUSEUM,FAIR,RIDES,shoreline,nearestRoute} from './ultra-map-layout.js';
export class GeometryBatch {
 constructor(name){this.name=name;this.batches=new Map();this.surfaces=[];this.colliders=[];}
 tri(a,b,c,color,solid=false){const key=typeof color==='number'?color:PALETTE[color];if(!this.batches.has(key))this.batches.set(key,[]);this.batches.get(key).push(...a,...b,...c);if(solid)this.surfaces.push(...a,...b,...c);}
 quad(a,b,c,d,color,solid=false){this.tri(a,b,c,color,solid);this.tri(a,c,d,color,solid);}
 plane(x0,x1,z0,z1,y,color,solid=false){this.quad([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0],color,solid);}
 box(x,y,z,w,h,d,color,solid=false,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw),p=(a,b,e)=>[x+c*a+s*e,y+b,z-s*a+c*e],v=[p(-w/2,-h/2,-d/2),p(w/2,-h/2,-d/2),p(w/2,h/2,-d/2),p(-w/2,h/2,-d/2),p(-w/2,-h/2,d/2),p(w/2,-h/2,d/2),p(w/2,h/2,d/2),p(-w/2,h/2,d/2)];
  for(const f of [[1,0,3,2],[4,5,6,7],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]])this.quad(...f.map(i=>v[i]),color,solid);
  if(solid)this.colliders.push({x,z,w:w/2,d:d/2,baseY:y-h/2,height:h,yaw,kind:this.name});
 }
 cylinder(x,y,z,r,h,color,n=10,topR=r,solid=false){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r],u=[x+Math.cos(a)*topR,y+h,z+Math.sin(a)*topR],v=[x+Math.cos(b)*topR,y+h,z+Math.sin(b)*topR];this.quad(p,u,v,q,color,solid);this.tri([x,y+h,z],v,u,color,solid);}if(solid)this.colliders.push({x,z,w:r,d:r,baseY:y,height:h,yaw:0,round:true,kind:this.name});}
 beam(a,b,width,color,solid=false){const mid=new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5),len=new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)),g=new THREE.BoxGeometry(width,len,width),m=new THREE.Matrix4().compose(mid,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize()),new THREE.Vector3(1,1,1));g.applyMatrix4(m);const p=g.attributes.position,idx=g.index;for(let i=0;i<idx.count;i+=3)this.tri(...[0,1,2].map(k=>[p.getX(idx.getX(i+k)),p.getY(idx.getX(i+k)),p.getZ(idx.getX(i+k))]),color,solid);g.dispose();if(solid){const dx=b[0]-a[0],dz=b[2]-a[2];this.colliders.push({x:mid.x,z:mid.z,w:width/2,d:Math.max(width,Math.hypot(dx,dz))/2,baseY:Math.min(a[1],b[1])-width/2,height:Math.abs(b[1]-a[1])+width,yaw:Math.atan2(dx,dz),kind:this.name});}}
 build(){const group=new THREE.Group();group.name=this.name;const buckets=new Map();for(const [color,vertices]of this.batches){const key=color===PALETTE.glass?'glass':'opaque';if(!buckets.has(key))buckets.set(key,{vertices:[],colors:[]});const out=buckets.get(key),rgb=new THREE.Color(color).toArray();out.vertices.push(...vertices);for(let i=0;i<vertices.length;i+=3)out.colors.push(...rgb);}for(const [key,{vertices,colors}]of buckets){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();geo.computeBoundingSphere();const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:key==='glass'?.32:.82,metalness:key==='glass'?.18:0,transparent:key==='glass',opacity:key==='glass'?.3:1,depthWrite:key!=='glass',forceSinglePass:true,side:key==='glass'?THREE.DoubleSide:THREE.FrontSide});const mesh=new THREE.Mesh(geo,mat);mesh.name=this.name+'-'+key;mesh.receiveShadow=true;mesh.castShadow=this.name!=='terrain'&&key!=='glass';mesh.userData.semantic=5;mesh.userData.ultraOwned=true;group.add(mesh);}group.userData.surfaces=this.surfaces;group.userData.colliders=this.colliders;return group;}

}
function roadRibbon(b,a,c,left,right,color,offset=.045,solid=false){
 const len=Math.hypot(c.x-a.x,c.z-a.z),nx=-(c.z-a.z)/len,nz=(c.x-a.x)/len,poly=[[a.x+nx*left,a.z+nz*left],[a.x+nx*right,a.z+nz*right],[c.x+nx*right,c.z+nz*right],[c.x+nx*left,c.z+nz*left]];
 const minX=Math.floor(Math.min(...poly.map(p=>p[0]))/8)*8,maxX=Math.max(...poly.map(p=>p[0])),minZ=Math.floor(Math.min(...poly.map(p=>p[1]))/8)*8,maxZ=Math.max(...poly.map(p=>p[1]));
 function clip(subject){for(let j=0;j<4;j++){const p=poly[j],q=poly[(j+1)%4],input=subject;subject=[];if(!input.length)break;const side=v=>-((q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0]));let prev=input.at(-1),sp=side(prev);for(const curr of input){const sc=side(curr);if((sc>=-1e-7)!==(sp>=-1e-7)){const t=sp/(sp-sc);subject.push([prev[0]+(curr[0]-prev[0])*t,prev[1]+(curr[1]-prev[1])*t]);}if(sc>=-1e-7)subject.push(curr);prev=curr;sp=sc;}}return subject;}
 for(let z=minZ;z<maxZ;z+=8)for(let x=minX;x<maxX;x+=8)for(const tri of [[[x,z],[x,z+8],[x+8,z]],[[x+8,z],[x,z+8],[x+8,z+8]]]){const out=clip(tri).map(p=>[p[0],groundHeight(p[0],p[1])+offset,p[1]]);for(let i=1;i<out.length-1;i++)b.tri(out[0],out[i],out[i+1],color,solid);}
}
export function buildTerrainChunk(cx,cz,lod=0){const b=new GeometryBatch('terrain'),x0=cx*CHUNK_SIZE,z0=cz*CHUNK_SIZE,s=lod?64:TERRAIN_STEP;for(let z=z0;z<z0+CHUNK_SIZE;z+=s)for(let x=x0;x<x0+CHUNK_SIZE;x+=s){const a=[x,heightVertex(x,z),z],c=[x+s,heightVertex(x+s,z),z],d=[x,heightVertex(x,z+s),z+s],e=[x+s,heightVertex(x+s,z+s),z+s],color=terrainKind(x+s/2,z+s/2);b.tri(a,d,c,color);b.tri(c,d,e,color);}
 {for(const route of [...ROADS,...TRAILS]){const ps=route.points;for(let i=1;i<ps.length;i++){const a=ps[i-1],c=ps[i],mx=(a.x+c.x)/2,mz=(a.z+c.z)/2;if(Math.floor(mx/CHUNK_SIZE)!==cx||Math.floor(mz/CHUNK_SIZE)!==cz)continue;const len=Math.hypot(c.x-a.x,c.z-a.z),nx=-(c.z-a.z)/len,nz=(c.x-a.x)/len,w=route.width/2,p=(q,off)=>[q.x+nx*off,groundHeight(q.x+nx*off,q.z+nz*off)+.045,q.z+nz*off];roadRibbon(b,a,c,-w,w,route.kind==='asphalt'?'asphalt':'sand',.045+Math.max(0,ROADS.indexOf(route))*.003,true);if(route.kind==='asphalt'&&!lod){for(const off of [-w+.5,w-.5])roadRibbon(b,a,c,off-.07,off+.07,'paint',.06);if(i%2===0){const d={x:(a.x+c.x)*.5,z:(a.z+c.z)*.5};roadRibbon(b,a,d,-.1,.1,'paint',.065);}}else if(route.kind==='dirt'&&!lod&&i%4===0){for(const sign of[-1,1]){const x=mx+nx*(w+1.5)*sign,z=mz+nz*(w+1.5)*sign,y=groundHeight(x,z);b.box(x,y+.65,z,.18,1.3,.18,'timber');b.box(x,y+1.15,z,.3,.35,.3,route.color);}}}}
 // Sparse clustered coastal pines; no per-frame work, no transparent leaf cards.
 let seed=(cx*17713+cz*8171+719)>>>0;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);if(!lod)for(let i=0;i<16;i++){const x=x0+random()*CHUNK_SIZE,z=z0+random()*CHUNK_SIZE;if(shoreline(x)-z<36||nearestRoute(x,z).distance<23||reserved(x,z))continue;const y=groundHeight(x,z),h=5+random()*4;b.cylinder(x,y,z,.25,h*.75,'timber',6,.15);b.cylinder(x,y+h*.45,z,2.8,h*.7,'leaf',7,.25);}}
 const g=b.build();g.userData.chunk={cx,cz,lod};return g;
}
export function reserved(x,z){return(x> -500&&x< -315&&z>80&&z<230)||(x>450&&x<625&&z>55&&z<180)||(x>-50&&x<55&&z>-140&&z<100)||(x>-650&&x<-540&&z>0&&z<90);}
function rail(b,a,c,y,width=.12){b.beam([a[0],y,a[1]],[c[0],y,c[1]],width,'metal',true);const n=Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/4);for(let i=0;i<=n;i++){const t=i/n;b.box(a[0]+(c[0]-a[0])*t,y-.55,a[1]+(c[1]-a[1])*t,.1,1.1,.1,'metal',true);}}
function planter(b,x,z,y,w=7,d=3){b.box(x,y+.4,z,w,.8,d,'concrete',true);b.box(x,y+.86,z,w-.4,.2,d-.4,'leaf');}
function bench(b,x,z,y,yaw=0){b.box(x,y+.52,z,3.2,.18,.8,'timber',true,yaw);b.box(x,y+.92,z+.32,3.2,.66,.12,'timber',true,yaw);for(const dx of[-1.1,1.1])b.box(x+dx,y+.25,z,.12,.5,.6,'metal');}
export function createMuseum(lod=0){const b=new GeometryBatch('tide-atlas');if(lod){b.box(-400,13.5,158,100,11,56,'concrete');b.box(-400,13,129.8,95,8,.2,'glass');return b.build();}
 // One continuous plaza and actual floor, rather than an opaque landmark box.
 b.box(-400,8.05,152,122,.5,96,'concrete');b.quad([-406,8.054,96],[-406,8.31,104],[-394,8.31,104],[-394,8.054,96],'concrete',true);b.plane(-461,-339,104,132,8.31,'concrete',true);b.plane(-461,-339,184,200,8.31,'concrete',true);b.plane(-461,-448,132,184,8.31,'concrete',true);b.plane(-352,-339,132,184,8.31,'concrete',true);
 b.box(-400,8.1,158,98,.4,54,'concrete');b.plane(-448,-352,132,184,8.31,'timber',true);
 // Entrance gap: 12 metres, no hidden collider across it.
 b.box(-427,13.5,132,42,10,.35,'glass',true);b.box(-373,13.5,132,42,10,.35,'glass',true);
 b.box(-449,13.5,158,.6,10,53,'concrete',true);b.box(-351,13.5,158,.6,10,53,'concrete',true);
 b.box(-400,13.5,184,98,10,.35,'glass',true);
 // Thin white wraparound fascia, horizontal daylight architecture instead of towers.
 b.box(-400,18.8,158,104,.6,58,'concrete',true);b.plane(-452,-348,129,187,19.11,'concrete',true);
 // Clear central rooftop path, two low folded timber skylight wings beside it.
 for(const side of [-1,1])for(let i=0;i<17;i++){const x=-400+side*(13+i*2.1),h=.5+Math.sin(i/17*Math.PI)*2.3;b.box(x,19.2+h/2,158,.35,h,43,'timber',true);}
 for(const x of [-442,-429,-416,-384,-371,-358]){b.box(x,13.4,133.2,.36,9.2,.5,'concrete',true);b.box(x,13.4,182.8,.36,9.2,.5,'concrete',true);}
 // Interior: freestanding tide-table, suspended timber boat form, seating bays.
 b.cylinder(-400,8.31,163,8,.55,'concrete',32,8,true);b.cylinder(-400,9.11,163,7.4,.05,'water',32,7.4);
 for(let i=0;i<13;i++){const x=-425+i*4;const h=Math.sin(i/12*Math.PI)*2.2;b.beam([x,14+h,152-Math.sin(i/12*Math.PI)*2.8],[x,14+h,152+Math.sin(i/12*Math.PI)*2.8],.16,'timber');}
 for(const x of[-437,-363])for(const z of[146,172])bench(b,x,z,8.31);
 for(const x of[-437,-363]){b.box(x,9.45,160,2.5,1.8,1.1,'concrete',true);b.box(x,10.4,160,2.2,.1,.9,'glass');}
 // 74 m open-air ramp, 8.30 degrees, not stairs or an invisible teleport.
 const rampY=z=>8.31+(z-126)/74*(19.11-8.31);
 b.quad([-346,rampY(126),126],[-346,rampY(200),200],[-340,rampY(200),200],[-340,rampY(126),126],'timber',true);
 for(const x of[-346,-340]){for(let z=126;z<200;z+=2){b.beam([x,rampY(z)+1.1,z],[x,rampY(z+2)+1.1,z+2],.12,'metal',true);b.box(x,rampY(z)+.55,z,.12,1.1,.12,'metal',true);}}
 b.plane(-403,-340,200,206,19.11,'timber',true);b.plane(-403,-397,187,200,19.11,'timber',true);
 rail(b,[-403,206],[-340,206],20.21);rail(b,[-397,200],[-346,200],20.21);rail(b,[-403,187],[-403,200],20.21);rail(b,[-397,187],[-397,200],20.21);
 rail(b,[-452,129],[-348,129],20.21);rail(b,[-452,129],[-452,187],20.21);rail(b,[-348,129],[-348,187],20.21);rail(b,[-452,187],[-403,187],20.21);rail(b,[-397,187],[-348,187],20.21);
 for(const x of[-343,-400])for(const z of[184,204])b.cylinder(x,0,z,.7,x===-343&&z===184?rampY(184)-.2:18.9,'concrete',8,.5,true);
 for(const x of[-454,-346])planter(b,x,112,8.31,6,5);
 // Flush promenade edging, no obstruction at the road/entrance.
 for(const z of[114,124])for(const x of[-431,-420,-380,-369])b.box(x,8.34,z,8,.035,.15,'timber');
 for(const x of[-425,-400,-375])b.box(x,18.4,155,8,.12,1.2,0xfff3dc);const group=b.build();for(const x of[-425,-400,-375]){const light=new THREE.PointLight(0xfff0dc,700,70,2);light.position.set(x,16,155);light.userData.ultraInterior=true;group.add(light);}return group;
}
export function createMarina(lod=0){const b=new GeometryBatch('white-sail-marina');b.plane(-32,32,-122,-70,8.1,'concrete',!lod);b.plane(-4,4,-70,54,8.1,'timber',!lod);for(const z of[-30,15,50]){b.plane(-42,-4,z-2,z+2,8.1,'timber',!lod);b.plane(4,42,z-2,z+2,8.1,'timber',!lod);}if(!lod){for(const x of[-24,-12,12,24]){b.box(x,9,-96,1.5,1.8,.4,'concrete',true);b.beam([x,9.9,-96],[x,14,-101],.12,'metal');}
 for(const z of[-22,23])for(const x of[-28,28]){b.box(x,1.2,z,6,2,15,'concrete');b.box(x,2.7,z,4,1,7,'timber');b.beam([x,3,z],[x,16,z],.1,'metal');b.tri([x,15,z],[x,3.5,z-5],[x,3.5,z],'paint');}
 for(const z of[-70,-20,30,52])for(const x of[-3.8,3.8])b.cylinder(x,-4,z,.35,12,'timber',8,.25,true);
 for(const x of[-4,4])for(const [a,c]of[[-70,-33],[-27,12],[18,47]])rail(b,[x,a],[x,c],9.2);rail(b,[-4,54],[4,54],9.2);for(const z of[-30,15,50])for(const side of[-1,1]){for(const edge of[-2,2])rail(b,[side*4,z+edge],[side*42,z+edge],9.2);rail(b,[side*42,z-2],[side*42,z+2],9.2);}for(const x of[-22,22])bench(b,x,-80,8.1);}
 return b.build();}
export function createArrival(lod=0){const b=new GeometryBatch('arrival');b.plane(-635,-549,-12,40,8.1,'asphalt',!lod);if(!lod){for(let i=0;i<9;i++){const x=-630+i*9;for(const z of[-2,30]){b.plane(x,x+.12,z-5,z+5,8.12,'paint');}}for(const x of[-636,-548])planter(b,x,14,8.1,3,50);b.box(-590,11.5,-11,42,.4,13,'timber');for(const x of[-610,-570])b.box(x,9.7,-11,.3,3.2,.3,'metal',true);}
 return b.build();}
export function createFair(lod=0){const b=new GeometryBatch('cape-gardens');b.plane(466,603,96,164,9.1,'sand',!lod);b.plane(466,496,96,114,9.13,'asphalt',!lod);const az=shoreline(485)-105;b.quad([479,8.045,az],[479,9.13,96],[491,9.13,96],[491,8.045,az],'asphalt',!lod);b.quad([502,8.045,82],[502,9.13,96],[508,9.13,96],[508,8.045,82],'concrete',!lod);b.plane(491,596,96,104,9.13,'concrete',!lod);b.plane(502,544,104,157,9.13,'concrete',!lod);b.plane(556,582,104,155,9.13,'concrete',!lod);
 const w=RIDES.wheel,axle=24.1;for(const side of[-1,1])for(const z of[w.z-3,w.z+3])b.beam([w.x+side*9,9.1,z],[w.x,axle,z],.65,'concrete',!lod);
 const c=RIDES.carousel;b.cylinder(c.x,9.1,c.z,7,.35,'timber',28,7,!lod);b.cylinder(c.x,13,c.z,8,2.2,'concrete',24,.2);b.cylinder(c.x,9.45,c.z,.35,4,'metal',10,.3,!lod);
 if(!lod){for(const x of[499,550,592])for(const z of[99,157])planter(b,x,z,9.13,6,4);for(const x of[479,491])b.box(x,11.8,94,.2,5.4,.2,'metal',true);b.box(485,14.5,94,14,.5,1,'timber');for(const z of[103,151])bench(b,592,z,9.13);}
 const root=b.build(),r=new GeometryBatch('wheel-rotor');for(const z of[-2,2])for(let i=0;i<40;i++){const a=i/40*Math.PI*2,c=(i+1)/40*Math.PI*2;r.beam([Math.cos(a)*13,Math.sin(a)*13,z],[Math.cos(c)*13,Math.sin(c)*13,z],.25,'metal');if(i%5===0)r.beam([0,0,z],[Math.cos(a)*13,Math.sin(a)*13,z],.15,'timber');}const rotor=r.build();rotor.position.set(w.x,axle,w.z);root.add(rotor);
 const cabin=new THREE.InstancedMesh(new THREE.BoxGeometry(2.7,2,3.7),new THREE.MeshStandardMaterial({color:PALETTE.concrete,roughness:.7}),8),glass=new THREE.InstancedMesh(new THREE.BoxGeometry(2.1,1,.04),new THREE.MeshStandardMaterial({color:PALETTE.glass,roughness:.3}),8);root.add(cabin,glass);const dummy=new THREE.Object3D();
 const cb=new GeometryBatch('carousel-rotor');if(!lod)for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*5,z=Math.sin(a)*5;cb.cylinder(x,.35,z,.07,3.6,'metal',6);cb.box(x,1,z,1.1,.8,1.5,i%2?'accent':'timber');}const carousel=cb.build();carousel.position.set(c.x,9.1,c.z);root.add(carousel);
 function animate(id,angle){if(id==='wheel'){rotor.rotation.z=angle;for(let i=0;i<8;i++){const a=i/8*Math.PI*2-Math.PI/2+angle;dummy.position.set(w.x+Math.cos(a)*13,axle-1+Math.sin(a)*13,w.z);dummy.updateMatrix();cabin.setMatrixAt(i,dummy.matrix);dummy.position.z-=1.87;dummy.updateMatrix();glass.setMatrixAt(i,dummy.matrix);}cabin.instanceMatrix.needsUpdate=glass.instanceMatrix.needsUpdate=true;}else if(id==='carousel')carousel.rotation.y=angle;}
 animate('wheel',0);root.userData.animateRide=animate;root.userData.rideSeat=(id,angle)=>id==='wheel'?{x:w.x+Math.cos(angle-Math.PI/2)*13,y:axle-2+Math.sin(angle-Math.PI/2)*13,z:w.z}:{x:c.x+Math.cos(angle)*5,y:9.5,z:c.z-Math.sin(angle)*5};return root;
}
export const ENTITY_SPECS=[{id:'museum',x:-400,z:158,build:createMuseum},{id:'marina',x:0,z:-50,build:createMarina},{id:'arrival',x:-590,z:43,build:createArrival},{id:'fair',x:535,z:118,build:createFair}];
export function disposeGroup(group){let geometry=0,material=0;group.traverse(o=>{if(o.isMesh){o.geometry.dispose();geometry++;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();material++;}}});group.removeFromParent();group.clear();return{geometry,material};}
