import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// SUNSET COAST 1.0: original game landmarks, inspired by silhouette principles,
// not surveys, engineering models, exact replicas, or official affiliated attractions.
export const LANDMARKS = Object.freeze({
 lantern:{id:'lantern',name:'云灯电视塔',subtitle:'北京中央电视塔形态启发',height:194,observationY:113.2,observationRadius:13.6,lobbyRadius:14,entry:{x:0,y:.65,z:16.8},lift:{x:0,y:.65,z:5.8},topLift:{x:0,y:113.2,z:5.8},ticket:80,footprintRadius:24},
 spiral:{id:'spiral',name:'海湾之弦塔',subtitle:'广州塔开放扭转结构启发',height:226,observationY:160.6,observationRadius:10.6,lobbyRadius:15,entry:{x:0,y:.65,z:17.2},lift:{x:0,y:.65,z:5.8},topLift:{x:0,y:160.6,z:5.8},ticket:100,footprintRadius:24}
});
const TAU=Math.PI*2, up=new THREE.Vector3(0,1,0);
function materials(){return {
 stone:new THREE.MeshStandardMaterial({color:0xd4cbbb,roughness:.82}),
 polished:new THREE.MeshStandardMaterial({color:0xe5e0d4,roughness:.27,metalness:.06}),
 lightStone:new THREE.MeshStandardMaterial({color:0xe8ded0,roughness:.7}),
 dark:new THREE.MeshStandardMaterial({color:0x30474c,roughness:.56,metalness:.3}),
 steel:new THREE.MeshStandardMaterial({color:0xb4c3c5,roughness:.32,metalness:.66}),
 gold:new THREE.MeshStandardMaterial({color:0xb88649,roughness:.38,metalness:.62}),
 glass:new THREE.MeshStandardMaterial({color:0x6f9da7,roughness:.23,metalness:.22,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide}),
 wood:new THREE.MeshStandardMaterial({color:0x805e40,roughness:.72}),
 green:new THREE.MeshStandardMaterial({color:0x446553,roughness:.95}),
 light:new THREE.MeshStandardMaterial({color:0xffebc9,emissive:0xffbc6c,emissiveIntensity:1.0}),
 teal:new THREE.MeshStandardMaterial({color:0x63c1c2,emissive:0x1b9d9b,emissiveIntensity:.65}),
 pink:new THREE.MeshStandardMaterial({color:0xe4a0b6,emissive:0xb04c8e,emissiveIntensity:.5})
};}
class Batch {
 constructor(mats){this.mats=mats;this.buckets=new Map();}
 add(key,g,p=[0,0,0],rot=[0,0,0],scale=[1,1,1]){const m=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale));g.applyMatrix4(m);if(g.index)g=g.toNonIndexed();if(!this.buckets.has(key))this.buckets.set(key,[]);this.buckets.get(key).push(g);return this;}
 box(key,w,h,d,x=0,y=0,z=0,ry=0){return this.add(key,new THREE.BoxGeometry(w,h,d),[x,y,z],[0,ry,0]);}
 cyl(key,rt,rb,h,x=0,y=0,z=0,n=48,open=false){return this.add(key,new THREE.CylinderGeometry(rt,rb,h,n,1,open),[x,y,z]);}
 ring(key,r,t,y,n=64){return this.add(key,new THREE.TorusGeometry(r,t,t<.08?4:6,t<.08?Math.min(n,48):n),[0,y,0],[Math.PI/2,0,0]);}
 beam(key,a,b,r=.15,sides=6){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);const q=new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),sides,1,true);g.applyQuaternion(q);return this.add(key,g,A.add(B).multiplyScalar(.5).toArray());}
 finish(name){const group=new THREE.Group();group.name=name;for(const [key,geos] of this.buckets){const merged=mergeGeometries(geos);const mesh=new THREE.Mesh(merged,this.mats[key]);mesh.name=`${name}:${key}`;mesh.castShadow=key!=='glass'&&key!=='light';mesh.receiveShadow=true;group.add(mesh);geos.forEach(g=>g.dispose());}return group;}
}
function annulus(batch,key,inner,outer,y,thickness=.18,seg=72){const s=new THREE.Shape();s.absarc(0,0,outer,0,TAU,false);const h=new THREE.Path();h.absarc(0,0,inner,0,TAU,true);s.holes.push(h);const g=new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:false,curveSegments:seg/4});g.rotateX(-Math.PI/2);batch.add(key,g,[0,y-thickness,0]);}
function polar(r,a,y){return [Math.sin(a)*r,y,Math.cos(a)*r];}
function rail(batch,r,y,{posts=48,gap=false}={}){for(let i=0;i<posts;i++){const a=i/posts*TAU;if(gap&&Math.abs(Math.sin(a))<.17&&Math.cos(a)>.8)continue;batch.beam('steel',polar(r,a,y),polar(r,a,y+1.18),.045,5);}batch.ring('steel',r,.055,y+1.18,posts);batch.ring('steel',r,.035,y+.5,posts);}
const PIXEL_FONT={A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],I:['111','010','010','010','010','010','111'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],Y:['10001','10001','01010','00100','00100','00100','00100'],'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00110','01000','10000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'8':['01110','10001','10001','01110','10001','10001','01110']};
function text3D(batch,text,x,y,z,size=.06,key='gold'){const widths=[...text].map(c=>PIXEL_FONT[c]?.[0].length??3);let at=x-(widths.reduce((a,b)=>a+b+1,0)-1)*size/2;[...text].forEach((c,idx)=>{const rows=PIXEL_FONT[c];rows?.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')batch.box(key,size*.91,size*.91,.025,at+i*size,y+(6-j)*size,z);}));at+=(widths[idx]+1)*size;});}
function roundedBox(batch,key,w,h,d,x,y,z,r=.12){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);batch.add(key,new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:4}),[x,y,z-d/2]);}
function arcSlab(batch,key,inner,outer,y,height,x=0,z=0){const s=new THREE.Shape();s.absarc(0,0,outer,0,Math.PI,false);s.lineTo(-inner,0);s.absarc(0,0,inner,Math.PI,0,true);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1,curveSegments:16});g.rotateX(-Math.PI/2);g.rotateY(Math.PI);batch.add(key,g,[x,y,z]);}
function leafyPlant(batch,x,y,z){batch.cyl('lightStone',.6,.43,.78,x,y+.39,z,24);batch.cyl('gold',.62,.62,.045,x,y+.76,z,24); // pot rim corrected at caller with real pot cylinder lip
 for(let i=0;i<7;i++){const a=i/7*TAU,top=[x+Math.sin(a)*.56,y+1.45+(i%3)*.18,z+Math.cos(a)*.56];batch.beam('wood',[x,y+.6,z],top,.022,5);const leaf=new THREE.SphereGeometry(.45,10,6);batch.add('green',leaf,top,[Math.sin(a)*.3,a,.35],[.48,1.3,.8]);}}
function interiorLights(root,meta){for(const [y,r]of [[3.95,7.5],[meta.observationY+3.45,6.5]])for(const side of[-1,1]){const light=new THREE.PointLight(0xffefdc,65,23,2);light.position.set(side*r,y,3);light.userData.interiorLight=true;light.name='landmark-interior-local-light';root.add(light);}}

function elevator(batch,y){
 // Layered open portal: bevelled limestone surround, brass reveal and rounded jambs.
 roundedBox(batch,'lightStone',1.03,3.2,.56,-1.62,y+1.6,4.12,.17);roundedBox(batch,'lightStone',1.03,3.2,.56,1.62,y+1.6,4.12,.17);
 roundedBox(batch,'lightStone',4.3,.56,.56,0,y+3.5,4.12,.16);batch.box('gold',.075,3.2,.16,-1.03,y+1.6,4.4);batch.box('gold',.075,3.2,.16,1.03,y+1.6,4.4);batch.box('gold',2.12,.075,.16,0,y+3.2,4.4);
 roundedBox(batch,'dark',1.28,.38,.06,0,y+3.43,4.44,.07);text3D(batch,y>10?'1':'G',0,y+3.28,4.485,.05,'light');
 text3D(batch,'LIFT',0,y+3.64,4.43,.033,'dark');
 batch.box('lightStone',2,.12,2.4,0,y+.06,3.15);batch.box('light',1.7,.08,1.8,0,y+3.1,3.15);roundedBox(batch,'steel',2,3.1,.08,0,y+1.55,2.1,.05);
 batch.box('steel',.08,3.1,2.2,-1.05,y+1.55,3.1);batch.box('steel',.08,3.1,2.2,1.05,y+1.55,3.1);batch.beam('gold',[-.85,y+1.0,2.25],[.85,y+1.0,2.25],.035,8);
 roundedBox(batch,'dark',.34,.6,.08,1.63,y+1.36,4.46,.06);for(let i=0;i<2;i++){const g=new THREE.CylinderGeometry(.085,.085,.035,16);g.rotateX(Math.PI/2);batch.add(i?'gold':'teal',g,[1.63,y+1.2+i*.24,4.52]);}
 // Real geometry directional arrow and destination label, readable without a texture.
 batch.beam('gold',[1.5,y+2.05,4.48],[1.63,y+2.18,4.48],.026,5);batch.beam('gold',[1.63,y+2.18,4.48],[1.76,y+2.05,4.48],.026,5);
}
function table(batch,x,y,z){batch.cyl('gold',.09,.2,.72,x,y+.36,z,12);batch.cyl('wood',.72,.72,.1,x,y+.75,z,32);batch.cyl('polished',.7,.7,.055,x,y+.82,z,32);
 for(let j=0;j<2;j++){const side=j?1:-1,px=x+side*1.05;batch.cyl('wood',.3,.3,.09,px,y+.56,z,20);for(const dx of[-.17,.17])for(const dz of[-.17,.17])batch.beam('dark',[px+dx,y+.04,z+dz],[px+dx*.85,y+.53,z+dz*.85],.026,6);for(const dz of[-.21,.21])batch.beam('gold',[px+side*.22,y+.53,z+dz],[px+side*.31,y+1.06,z+dz],.025,6);for(const h of[.78,.96])batch.beam('wood',[px+side*.28,y+h,z-.25],[px+side*.28,y+h,z+.25],.06,8);}
 batch.cyl('lightStone',.13,.13,.02,x+.2,y+.865,z,20);batch.cyl('lightStone',.08,.065,.13,x+.2,y+.935,z,16);batch.cyl('dark',.065,.065,.008,x+.2,y+1.003,z,16);
}
function telescope(batch,x,y,z,ry=0){batch.cyl('steel',.08,.12,1.02,x,y+.51,z,8);batch.beam('gold',[x-.45*Math.cos(ry),y+1.2,z-.45*Math.sin(ry)],[x+.45*Math.cos(ry),y+1.45,z+.45*Math.sin(ry)],.17,12);}
function makeLobby(batch,meta){const y=.65,r=meta.lobbyRadius;
 batch.cyl('stone',24,24,.24,0,.12,0,96);batch.cyl('lightStone',r+2,r+2,.45,0,.38,0,72);batch.cyl('dark',r+.3,r+.8,.22,0,.68,0,72);batch.cyl('polished',r,r,.17,0,.72,0,72);
 const near=r-.4,far=23.4,w=2.6,lo=.24,hi=.81;const verts=[-w,hi,near,w,hi,near,w,lo,far,-w,lo,far,-w,0,near,w,0,near,w,0,far,-w,0,far];const ramp=new THREE.BufferGeometry();ramp.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));ramp.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(16),2));ramp.setIndex([0,2,1,0,3,2,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7,4,5,6,4,6,7]);ramp.computeVertexNormals();batch.add('lightStone',ramp);
 // Real narrow stone joints, bronze wayfinding inlay and concentric paving bands.
 for(let radius=4.5;radius<r;radius+=1.5)batch.ring('stone',radius,.018,.816,72);
 for(let i=0;i<32;i++)batch.beam('stone',polar(4.1,i/32*TAU,.818),polar(r-.2,i/32*TAU,.818),.012,4);
 batch.ring('gold',5.0,.022,.824,72);batch.ring('gold',r-1.0,.024,.824,72);for(const x of[-.7,.7])batch.box('gold',.035,.014,7.2,x,.822,9);
 for(let i=0;i<32;i++){const a=i/32*TAU;if(Math.cos(a)>.92)continue;const x=Math.sin(a)*r,z=Math.cos(a)*r;batch.box('glass',TAU*r/32*.95,4.1,.09,x,2.78,z,a);batch.box('steel',.12,4.15,.16,x,2.78,z,a);}
 batch.cyl('lightStone',r+1,r+1,.35,0,4.98,0,72);batch.ring('gold',r+.75,.11,4.92);batch.ring('light',r-.5,.035,4.75);
 // Coherent radial ceiling coffers, timber baffles and recessed luminous rings.
 annulus(batch,'lightStone',3.2,r-.3,4.73,.055);for(let i=0;i<32;i++){const a=i/32*TAU;batch.beam('wood',polar(3.5,a,4.61),polar(r-.6,a,4.61),.07,4);}
 for(const radius of[5.1,8.9,12.2]){if(radius>r-.5)continue;batch.ring('gold',radius,.065,4.57,72);batch.ring('light',radius,.042,4.52,72);}
 for(let i=0;i<16;i++){const a=i/16*TAU;batch.cyl('dark',.22,.22,.05,Math.sin(a)*(r-2.1),4.67,Math.cos(a)*(r-2.1),16);batch.cyl('light',.16,.16,.025,Math.sin(a)*(r-2.1),4.635,Math.cos(a)*(r-2.1),16);}
 for(let i=0;i<12;i++){const a=i/12*TAU;if(Math.cos(a)>.9)continue;batch.cyl('lightStone',.19,.25,4.1,Math.sin(a)*(r-.8),2.8,Math.cos(a)*(r-.8),16);batch.cyl('gold',.26,.26,.1,Math.sin(a)*(r-.8),.86,Math.cos(a)*(r-.8),16);}
 // A genuinely curved reception desk with plinth, layered stone worktop and slatted front.
 arcSlab(batch,'wood',1.85,2.35,.82,1.03,-7,4.1);arcSlab(batch,'dark',1.8,2.4,.82,.1,-7,4.1);arcSlab(batch,'polished',1.73,2.48,1.87,.15,-7,4.1);
 for(let i=0;i<25;i++){const a=i/24*Math.PI;batch.beam('gold',[-7-Math.cos(a)*2.38,.97,4.1+Math.sin(a)*2.38],[-7-Math.cos(a)*2.38,1.8,4.1+Math.sin(a)*2.38],.018,4);}
 roundedBox(batch,'dark',.72,.42,.06,-7,2.26,5.85,.035);batch.box('steel',.08,.22,.12,-7,2.03,5.82);batch.box('steel',.4,.04,.28,-7,1.96,5.82);
 for(const x of[-8,-6])batch.beam('gold',[x,1.97,4],[x,2.45,4],.035,6);roundedBox(batch,'dark',2.55,.7,.1,-7,2.74,4.0,.08);text3D(batch,'TICKETS',-7,2.58,4.07,.046,'light');
 for(let i=0;i<3;i++){const z=-3+i*3;for(let j=0;j<4;j++)batch.box('wood',2.7,.1,.145,7,1.28,z-.24+j*.16);for(const x of[5.8,8.2]){batch.beam('dark',[x,.83,z-.27],[x,1.35,z-.27],.05,8);batch.beam('dark',[x,.83,z+.27],[x,1.35,z+.27],.05,8);batch.beam('dark',[x,1.32,z-.3],[x,1.98,z-.42],.045,8);batch.beam('gold',[x,1.6,z-.25],[x,1.6,z+.32],.045,8);}for(let k=0;k<3;k++)batch.box('wood',2.7,.13,.1,7,1.58+k*.18,z-.38);}
 for(const x of[-10.5,10.5])leafyPlant(batch,x,.81,8);
 elevator(batch,.81);
 for(let i=0;i<16;i++){const a=i/16*TAU;if(Math.cos(a)>.86)continue;const x=Math.sin(a)*22,z=Math.cos(a)*22;batch.cyl('dark',.14,.14,.85,x,.68,z,8);batch.cyl('light',.16,.16,.08,x,1.1,z,8);}
}
function observation(batch,meta){const y=meta.observationY,r=meta.observationRadius;
 annulus(batch,'polished',2.8,r,y,.25);batch.cyl('dark',3.45,3.45,4.7,0,y+2.35,0,48);
 for(let i=0;i<48;i++){const a=i/48*TAU,x=Math.sin(a)*(r-.2),z=Math.cos(a)*(r-.2);batch.box('glass',TAU*(r-.2)/48*.98,3.8,.08,x,y+2.0,z,a);batch.box('steel',.075,3.9,.11,x,y+2.0,z,a);}
 annulus(batch,'lightStone',3.3,r+.2,y+4.15,.18);for(let i=0;i<24;i++){const a=i/24*TAU;batch.beam('wood',polar(3.7,a,y+3.88),polar(r-.5,a,y+3.88),.055,4);if(Math.cos(a)<.72)batch.beam('wood',polar(3.49,a,y+.12),polar(3.49,a,y+3.7),.055,5);}for(let radius=5;radius<r-.6;radius+=2)batch.ring('stone',radius,.017,y+.007,48);for(let i=0;i<24;i++)batch.beam('stone',polar(3.7,i/24*TAU,y+.01),polar(r-.2,i/24*TAU,y+.01),.01,4);batch.ring('light',r-3,.028,y+3.85,48);batch.ring('light',r-1,.035,y+3.85);batch.ring('gold',r+.2,.1,y+.08);rail(batch,r-.45,y,{posts:48});
 elevator(batch,y);
 for(let i=0;i<4;i++){const a=(i+.5)/4*TAU;table(batch,Math.sin(a)*(r-3),y,Math.cos(a)*(r-3));}
 telescope(batch,-r+1.7,y,0,0);telescope(batch,r-1.7,y,0,0);
 batch.box('wood',2.4,.85,1.0,-4.8,y+.43,-4);batch.box('lightStone',2.5,.1,1.1,-4.8,y+.91,-4);
}
function shaftFlutes(batch,r,y0,y1,count=24){for(let i=0;i<count;i++){const a=i/count*TAU;batch.beam('lightStone',polar(r,a,y0),polar(r*.83,a,y1),.12,5);}}
export function createLanternTower({lod=true}={}){
 const meta=LANDMARKS.lantern,mats=materials(),root=new THREE.Group();root.name=meta.name;root.userData.landmark=structuredClone(meta);
 const b=new Batch(mats);makeLobby(b,meta);
 b.cyl('lightStone',8.4,15.7,2.4,0,6.3,0,72);b.ring('gold',15.7,.22,5.2);b.cyl('lightStone',6.4,10.6,2.0,0,8.2,0,64);b.ring('gold',10.5,.2,7.3);
 b.cyl('stone',3.65,5.0,97.8,0,57.9,0,64);shaftFlutes(b,4.95,10,106);
 // Distinct hanging-lantern pod: curved undercroft, recessed glazing, faceted crown.
 const pts=[[4.1,102],[5.5,104],[8.3,106.2],[11.7,108.2],[14.4,109.8],[14.7,111.3],[14.3,112.3]].map(([x,y])=>new THREE.Vector2(x,y));b.add('lightStone',new THREE.LatheGeometry(pts,72));
 b.ring('gold',14.55,.18,112.1);b.cyl('dark',14.25,14.25,.32,0,112.65,0,72);observation(b,meta);
 b.cyl('lightStone',11.4,14.8,2.4,0,119.0,0,72);b.cyl('stone',6.4,11.4,1.7,0,121.05,0,64);b.ring('gold',14.6,.16,117.9);b.ring('light',14.1,.04,112.7);b.ring('light',14.7,.04,118.0);
 annulus(b,'stone',4.5,11.3,122.1,.2);rail(b,10.8,122.1,{posts:48});b.cyl('lightStone',3.1,4.6,33,0,137.4,0,48);b.cyl('dark',2.9,3.3,3.4,0,155.3,0,48);b.ring('gold',3.1,.16,157);
 b.cyl('stone',1.25,2.4,18,0,166,0,32);b.cyl('lightStone',.38,.85,18,0,184,0,24);
 for(let i=0;i<9;i++){b.cyl(i%2?'lightStone':'gold',.95-i*.06,.95-i*.06,.45,0,175+i*2,0,16);}b.cyl('light',.18,.2,1,0,193.5,0,12);
 root.add(b.finish('lantern:batched-architecture'));interiorLights(root,meta);root.userData.walk={floor:.81,deck:meta.observationY,outerRadius:meta.observationRadius-.75,innerRadius:3.65};return root;
}
// A ruled twisted elliptical shell creates a real narrow waist and varying profile.
export function spiralPoint(a,t){const top=a+Math.PI*.74;const bx=18*Math.sin(a),bz=14.2*Math.cos(a),tx=12.8*Math.sin(top)+1.1,tz=10.6*Math.cos(top)-.7;return [bx*(1-t)+tx*t,7.2+t*168,bz*(1-t)+tz*t];}
function spiralStructure(mats,low=false){const b=new Batch(mats),n=low?12:24,steps=low?14:28,rings=low?23:46,ringSeg=low?32:48;
 for(let i=0;i<n;i++){const a=i/n*TAU+Math.PI/24;for(let j=0;j<steps;j++){b.beam('steel',spiralPoint(a,j/steps),spiralPoint(a,(j+1)/steps),low?.19:.22,low?4:6);}}
 for(let k=0;k<rings;k++){const t=k/(rings-1);for(let i=0;i<ringSeg;i++)b.beam('lightStone',spiralPoint(i/ringSeg*TAU,t),spiralPoint((i+1)/ringSeg*TAU,t),.12,low?4:5);}
 for(let i=0;i<n;i++)for(let j=0;j<steps;j++){if(low&&j%2)continue;b.beam('steel',spiralPoint(i/n*TAU+Math.PI/24,j/steps),spiralPoint((i+1)/n*TAU+Math.PI/24,(j+1)/steps),.085,4);}
 // Discrete architectural uplight strips share batches; no per-strut point lights.
 for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/24;for(let j=0;j<steps;j++){const A=spiralPoint(a,j/steps),B=spiralPoint(a,(j+1)/steps);b.beam(i%2?'pink':'teal',A,B,.035,4);}}
 return b.finish(low?'spiral:lod-distance':'spiral:lod-near');
}
export function createBaySpiralTower({lod=true}={}){
 const meta=LANDMARKS.spiral,mats=materials(),root=new THREE.Group();root.name=meta.name;root.userData.landmark=structuredClone(meta);const b=new Batch(mats);makeLobby(b,meta);
 b.cyl('dark',2.8,3.7,151,0,80.5,0,48);for(let i=0;i<8;i++)b.beam('gold',polar(3.72,i/8*TAU,5),polar(2.82,i/8*TAU,156),.06,5);
 b.cyl('dark',10.4,8.0,7.2,0,156.5,0,64);for(let h=154;h<160;h+=1.35)b.ring('steel',8.7+(h-154)*.28,.09,h);
 observation(b,meta);b.cyl('lightStone',10.6,11.1,.4,0,165.05,0,64);annulus(b,'stone',3.0,11.1,166.2,.2);rail(b,10.8,166.2,{posts:48});
 b.cyl('dark',3.1,3.1,2,0,166.2,0,40);b.cyl('stone',2.35,3.1,12,0,173,0,40);b.cyl('steel',1.1,2.0,20,0,189,0,24);b.cyl('lightStone',.45,1,20,0,209,0,20);b.cyl('gold',.18,.4,7,0,222.5,0,12);b.cyl('light',.2,.2,.6,0,225.7,0,10);
 for(let i=0;i<12;i++){const a=i/12*TAU;const p=polar(9.5,a,168.6);b.add('glass',new THREE.SphereGeometry(.85,12,8),p,[0,0,0],[1,1.25,1]);b.beam('steel',polar(9.5,a,166.4),p,.07,5);}
 for(let i=0;i<24;i++){const a=(i+.5)/24*TAU,p=spiralPoint(a,0),foot=[p[0]*1.03,.48,p[2]*1.03];b.beam('steel',foot,p,.24,8);b.cyl('lightStone',.48,.62,.36,foot[0],.42,foot[2],16);b.cyl('steel',.38,.38,.08,foot[0],.64,foot[2],12);for(const side of[-1,1])b.cyl('gold',.045,.045,.1,foot[0]+side*.29,.73,foot[2],8);}root.userData.anchoredColumns=24;root.add(b.finish('spiral:batched-architecture'));interiorLights(root,meta);if(lod){const levels=new THREE.LOD();levels.name='spiral-structure-lod';levels.addLevel(spiralStructure(mats,false),0);levels.addLevel(spiralStructure(mats,true),370,.08);root.add(levels);}else root.add(spiralStructure(mats,false));root.userData.walk={floor:.81,deck:meta.observationY,outerRadius:meta.observationRadius-.75,innerRadius:3.65};return root;
}
export function landmarkRenderBudget(root){let geometries=0,triangles=0,drawCalls=0;root.traverse(o=>{if(o.isMesh){geometries++;drawCalls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});return{geometries,triangles,drawCalls,includesAllLODs:true};}
