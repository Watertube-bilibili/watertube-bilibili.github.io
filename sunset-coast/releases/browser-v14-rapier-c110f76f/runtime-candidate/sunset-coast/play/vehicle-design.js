import {registerVehicleFactoryDisposer,releaseVehicleFactory} from './vehicle-construction.js';
import * as THREE from './vendor/three.module.js';
import {MODELS} from './vehicle-catalog.js';

// Original parametric bodywork: open wheel arches, separate moving doors,
// sculpted shoulders and cabin glazing. No extracted third-party assets.
const S = {
  s:{length:4.88,width:1.94,roof:1.47,belt:.91,base:.23,wheel:.385,axles:[-1.43,1.43],cabin:[-1.24,-.52,.69,1.71],roofWidth:.73,door:[-1.04,.31],kind:'sedan',spokes:10,grip:9.8},
  x:{length:4.98,width:2.02,roof:1.79,belt:1.04,base:.3,wheel:.435,axles:[-1.46,1.47],cabin:[-1.28,-.6,1.88,2.40],roofWidth:.78,door:[-1.08,.6],kind:'suv',spokes:5,grip:9},
  r:{length:4.56,width:1.99,roof:1.26,belt:.82,base:.19,wheel:.38,axles:[-1.34,1.35],cabin:[-1.1,-.48,.56,1.47],roofWidth:.705,door:[-.91,.73],kind:'sport',spokes:5,grip:11.2},
  cybr:{length:5.32,width:2.07,roof:1.81,belt:1.12,base:.35,wheel:.45,axles:[-1.55,1.54],cabin:[-1.45,-.73,.42,1.06],roofWidth:.805,door:[-1.24,.21],kind:'pickup',spokes:6,grip:8.7},
  m:{length:4.06,width:1.79,roof:1.57,belt:.94,base:.24,wheel:.35,axles:[-1.21,1.2],cabin:[-.97,-.53,1.48,1.96],roofWidth:.71,door:[-.8,.5],kind:'hatch',spokes:5,grip:9.7},
  nomad:{length:4.82,width:2.03,roof:1.97,belt:1.13,base:.38,wheel:.47,axles:[-1.42,1.43],cabin:[-1.33,-1.00,2.00,2.33],roofWidth:.83,door:[-1.14,.37],kind:'offroad',spokes:6,grip:8.9},
  gt:{length:5.18,width:2.02,roof:1.21,belt:.84,base:.19,wheel:.395,axles:[-1.48,1.48],cabin:[-.48,.13,.92,1.75],roofWidth:.645,door:[-.37,1.08],kind:'gt',spokes:10,grip:11.4},
  vela:{length:5.04,width:1.97,roof:1.46,belt:.94,base:.23,wheel:.395,axles:[-1.46,1.49],cabin:[-1.22,-.61,.88,1.67],roofWidth:.74,door:[-1.05,.5],kind:'saloon',spokes:12,grip:9.9},
  estate:{length:4.95,width:1.95,roof:1.6,belt:.95,base:.25,wheel:.4,axles:[-1.45,1.46],cabin:[-1.2,-.62,2.01,2.39],roofWidth:.75,door:[-1.03,.54],kind:'wagon',spokes:5,grip:9.8},
  apex:{length:4.64,width:2.04,roof:1.19,belt:.78,base:.16,wheel:.385,axles:[-1.39,1.39],cabin:[-1.4,-.74,.27,1.16],roofWidth:.68,door:[-1.13,.55],kind:'super',spokes:5,grip:12},
  aria:{length:5.16,width:2.05,roof:1.96,belt:1.08,base:.28,wheel:.425,axles:[-1.57,1.57],cabin:[-1.97,-1.49,2.15,2.49],roofWidth:.81,door:[-1.76,-.1],kind:'van',spokes:8,grip:8.8},
  c800:{length:5.63,width:2.10,roof:2.22,belt:1.25,base:.30,wheel:.45,axles:[-1.71,1.70],cabin:[-2.11,-1.62,2.40,2.74],roofWidth:.855,door:[-1.97,-.32],kind:'van',spokes:16,grip:8.9,seatRows:[-.94,.47,1.73],upperColor:0xd8c8ad},
  coupe:{length:4.48,width:1.88,roof:1.37,belt:.85,base:.22,wheel:.375,axles:[-1.31,1.29],cabin:[-1.01,-.46,.62,1.66],roofWidth:.68,door:[-.85,.8],kind:'classic',spokes:8,grip:10.2},
  s800:{length:5.48,width:2.02,roof:1.58,belt:1.03,base:.24,wheel:.41,axles:[-1.66,1.66],cabin:[-1.40,-.68,1.05,1.97],roofWidth:.765,door:[-1.24,.42],kind:'saloon',style:'horizon',spokes:18,grip:9.7,seatRows:[-.18,1.33],driverZ:-.18,cameraZ:-.24,upperColor:0xc3cbd5},
  v6:{length:4.18,width:1.70,roof:1.91,belt:1.02,base:.27,wheel:.325,axles:[-1.28,1.27],cabin:[-1.97,-1.64,1.72,1.98],roofWidth:.715,door:[-1.80,-.42],kind:'microvan',style:'utility',spokes:8,grip:8.3,seatRows:[-1.06,.03,1.12],driverZ:-1.06,cameraZ:-1.12},
  q3:{length:3.98,width:1.75,roof:1.55,belt:.92,base:.23,wheel:.345,axles:[-1.23,1.23],cabin:[-1.10,-.57,1.18,1.80],roofWidth:.68,door:[-.95,.25],kind:'hatch',style:'pixel',spokes:4,grip:9.5,seatRows:[-.13,.96],driverZ:-.13,cameraZ:-.19},
  t9:{length:4.94,width:1.94,roof:1.70,belt:1.00,base:.31,wheel:.41,axles:[-1.45,1.46],cabin:[-1.23,-.61,1.81,2.28],roofWidth:.765,door:[-1.07,.42],kind:'wagon',style:'cross',spokes:7,grip:9.3,seatRows:[-.06,1.10],driverZ:-.06,cameraZ:-.12},
  h4:{length:4.16,width:1.82,roof:1.50,belt:.91,base:.23,wheel:.355,axles:[-1.24,1.24],cabin:[-1.13,-.63,1.20,1.86],roofWidth:.70,door:[-.96,.30],kind:'hatch',style:'surf',pack:'coastline',spokes:6,grip:9.6,seatRows:[-.16,.85],driverZ:-.16,cameraZ:-.22,upperColor:0x203c49},
  w8:{length:5.10,width:1.91,roof:1.48,belt:.92,base:.23,wheel:.385,axles:[-1.49,1.49],cabin:[-1.30,-.70,1.93,2.37],roofWidth:.73,door:[-1.10,.44],kind:'wagon',style:'liner',pack:'coastline',spokes:9,grip:9.9,seatRows:[-.16,1.05],driverZ:-.16,cameraZ:-.22},
  b7:{length:4.26,width:1.96,roof:1.94,belt:1.10,base:.39,wheel:.455,axles:[-1.20,1.20],cabin:[-1.10,-.80,1.49,1.90],roofWidth:.80,door:[-.95,.50],kind:'offroad',style:'ridge',pack:'coastline',spokes:6,grip:8.8,seatRows:[-.05,1.03],driverZ:-.05,cameraZ:-.11,upperColor:0xd6c8a7},
  y9:{length:5.24,width:2.02,roof:1.84,belt:1.08,base:.30,wheel:.425,axles:[-1.57,1.57],cabin:[-1.39,-.78,1.98,2.45],roofWidth:.805,door:[-1.20,.30],kind:'suv',style:'grand-tour',spokes:12,grip:9.2,seatRows:[-.30,.77,1.78],driverZ:-.30,cameraZ:-.36,upperColor:0xc4c9ca},
  k2:{length:4.32,width:1.90,roof:1.29,belt:.81,base:.18,wheel:.365,axles:[-1.29,1.24],cabin:[-1.10,-.52,.50,1.45],roofWidth:.665,door:[-.92,.67],kind:'sport',style:'arc',pack:'coastline',spokes:7,grip:11.1,seatRows:[.08],driverZ:.08,cameraZ:.02}
};
const geometryCache=new Map(), materialCache=new Map(), sharedGeometries=new WeakSet();
const cache=(key,build)=>{if(!geometryCache.has(key)){const g=build();geometryCache.set(key,g);sharedGeometries.add(g);}return geometryCache.get(key);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function material(key,params){if(!materialCache.has(key))materialCache.set(key,new THREE.MeshPhysicalMaterial(params));return materialCache.get(key);}
function mesh(parent,geo,mat){const o=new THREE.Mesh(geo,mat);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function geo(vertices,indices){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
function grid(rows,cols,fn,flip=false){const v=[],idx=[];for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++)v.push(...fn(i/rows,j/cols));for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+1,c=a+cols+1,d=c+1;idx.push(...(flip?[a,b,c,b,d,c]:[a,c,b,b,c,d]));}return geo(v,idx);}
function join(geometries){const arrays={position:[],normal:[]};for(const geometry of geometries){const g=geometry.index?geometry.toNonIndexed():geometry;for(const name of Object.keys(arrays))arrays[name].push(g.getAttribute(name).array);if(g!==geometry)g.dispose();}const result=new THREE.BufferGeometry();for(const name of Object.keys(arrays)){const length=arrays[name].reduce((n,a)=>n+a.length,0),a=new Float32Array(length);let offset=0;for(const source of arrays[name]){a.set(source,offset);offset+=source.length;}result.setAttribute(name,new THREE.BufferAttribute(a,3));}result.computeBoundingSphere();return result;}
function mergeStatic(parent,key){const groups=new Map();parent.updateMatrixWorld(true);for(const o of [...parent.children]){if(!o.isMesh||o.userData.animated)continue;const k=o.material.uuid;if(!groups.has(k))groups.set(k,{material:o.material,objects:[]});groups.get(k).objects.push(o);}for(const [k,{material,objects}]of groups){if(objects.length<2)continue;const signature=key+':'+k;let combined=geometryCache.get(signature);if(!combined){const pieces=objects.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);});combined=join(pieces);pieces.forEach(g=>g.dispose());geometryCache.set(signature,combined);sharedGeometries.add(combined);}objects.forEach(o=>{parent.remove(o);if(!sharedGeometries.has(o.geometry))o.geometry.dispose();});mesh(parent,combined,material);}}
function roundedBox(w,h,d,r=.035){return cache(`rb:${w}:${h}:${d}:${r}`,()=>{r=Math.min(r,w/2-.0001,h/2-.0001,d/2-.0001);const shape=new THREE.Shape(),x=-w/2+r,y=-h/2+r,ww=w-2*r,hh=h-2*r;shape.moveTo(x,y);shape.lineTo(x+ww,y);shape.lineTo(x+ww,y+hh);shape.lineTo(x,y+hh);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:4});g.translate(0,0,-d/2+r);return g;});}
function box(parent,mat,w,h,d,x,y,z,r=.025){const o=mesh(parent,roundedBox(w,h,d,r),mat);o.position.set(x,y,z);return o;}
function tube(parent,mat,points,r=.012,segments=40){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(curve,segments,r,6,false),mat);}
function line(parent,mat,a,b,r=.012){const diff=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=mesh(parent,cache('cylinder6',()=>new THREE.CylinderGeometry(1,1,1,6)),mat);o.position.copy(new THREE.Vector3(...a)).add(new THREE.Vector3(...b)).multiplyScalar(.5);o.scale.set(r,diff.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());return o;}
function panel(parent,mat,outline,depth=.02){const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.006});return mesh(parent,g,mat);}

function bodyFunctions(s){
  const half=s.length/2,w=s.width/2,boxy=['pickup','offroad','van','microvan'].includes(s.kind),sport=['sport','gt','super','classic'].includes(s.kind);
  const stations=[[-half,.79,s.belt-.17],[-half+.18,.91,s.belt-.07],[-half+.55,.97,s.belt+.005],[s.axles[0],1,s.belt+.045],[-.3,.975,s.belt],[.52,.986,s.belt-.008],[s.axles[1],1.015,s.belt+.044],[half-.32,.94,s.belt+.003],[half,.76,s.belt-.08]];
  if(boxy){stations[0][1]=.84;stations[1][1]=.96;stations.at(-1)[1]=.88;stations.at(-2)[1]=.985;}
  if(s.kind==='microvan'){stations[0][1]=.92;stations[1][1]=.97;stations.at(-1)[1]=.93;stations.at(-2)[1]=.985;}
  if(s.style==='grand-tour'){stations[0][1]=.89;stations[1][1]=.97;stations[7][1]=.98;stations[8][1]=.87;}
  if(s.style==='horizon'){stations[0][1]=.87;stations[1][1]=.94;stations[6][1]=1.005;stations[7][1]=.97;stations[8][1]=.86;}
  if(s.kind==='gt'){stations[0][1]=.84;stations[1][1]=.92;stations[2][1]=.99;stations[3][1]=1.015;stations[4][1]=.946;stations[5][1]=1.0;stations[6][1]=1.075;stations[7][1]=.98;stations[8][1]=.86;stations[0][2]=.65;stations[1][2]=.70;stations[2][2]=.79;stations[7][2]=.81;stations[8][2]=.72;}
  if(s.kind==='super'){stations[0][1]=.59;stations[1][1]=.78;stations[4][1]=.945;stations[5][1]=1.0;stations[6][1]=1.035;stations[0][2]-=.05;}
  const interpolate=(z,channel)=>{z=clamp(z,-half,half);let i=0;while(i<stations.length-2&&stations[i+1][0]<z)i++;const a=stations[i],b=stations[i+1],p=stations[Math.max(0,i-1)],q=stations[Math.min(stations.length-1,i+2)],t=(z-a[0])/(b[0]-a[0]);const m0=(b[channel]-p[channel])/(b[0]-p[0]),m1=(q[channel]-a[channel])/(q[0]-a[0]);return(2*t*t*t-3*t*t+1)*a[channel]+(t*t*t-2*t*t+t)*(b[0]-a[0])*m0+(-2*t*t*t+3*t*t)*b[channel]+(t*t*t-t*t)*(b[0]-a[0])*m1;};
  const width=z=>interpolate(z,1)*w;
  const shoulder=z=>interpolate(z,2);
  const archRadius=s.wheel+(s.kind==='offroad'?.075:.045),wheelY=s.wheel;
  const bottom=z=>Math.max(s.base,...s.axles.map(axle=>Math.abs(z-axle)<archRadius?wheelY+Math.sqrt(Math.max(0,archRadius*archRadius-(z-axle)**2)):s.base));
  const sideX=(z,y)=>{const t=clamp((y-s.base)/(shoulder(z)-s.base),0,1);return width(z)*(.96+.04*Math.sin(t*Math.PI)-.028*t**6);};
  const top=(z,u)=>shoulder(z)+(.066+(sport?-.013:0))*Math.pow(Math.max(0,1-u*u),.65);
  const roofY=z=>{const [a,b,c,d]=s.cabin;if(z<a||z>d)return shoulder(z)+.018;if(z<b)return lerp(shoulder(a)+.02,s.roof-.052,(z-a)/(b-a));if(z>c)return lerp(s.roof-.052,shoulder(d)+.03,(z-c)/(d-c));return s.roof-.052+.025*Math.sin((z-b)/(c-b)*Math.PI);};
  const roofWidthAt=z=>{const[a,b,c,d]=s.cabin;return z<b?lerp(width(a)*.932,s.roofWidth,clamp((z-a)/(b-a),0,1)):z>c?lerp(s.roofWidth,width(d)*.932,clamp((z-c)/(d-c),0,1)):s.roofWidth;};
  const windowX=(z,t)=>lerp(width(z)*.932,roofWidthAt(z),t)-Math.sin(t*Math.PI)*.018;
  return{half,w,width,shoulder,bottom,sideX,top,roofY,windowX,archRadius,wheelY,boxy,sport};
}

let buildingDesignedRoot=null;
const disposedDesignedRoots=new WeakSet(),designedOwnedGeometry=new WeakMap();
function captureDesignedGeometry(root){const owned=new Set();root.traverse(o=>{if(o.isMesh&&o.geometry&&!sharedGeometries.has(o.geometry))owned.add(o.geometry);});designedOwnedGeometry.set(root,owned);}
function releaseDesignedRoot(root){if(disposedDesignedRoots.has(root))return;disposedDesignedRoots.add(root);for(const g of designedOwnedGeometry.get(root)??[])g.dispose();designedOwnedGeometry.delete(root);root.removeFromParent();}
export function createDesignedCar(modelId='s',simple=false,colorOverride=null){const previous=buildingDesignedRoot;buildingDesignedRoot=null;try{const car=buildDesignedCar(modelId,simple,colorOverride);captureDesignedGeometry(car.root);return car;}catch(error){if(buildingDesignedRoot){captureDesignedGeometry(buildingDesignedRoot);releaseVehicleFactory({root:buildingDesignedRoot});}throw error;}finally{buildingDesignedRoot=previous;}}
function buildDesignedCar(modelId='s',simple=false,colorOverride=null){
  const model=MODELS.find(m=>m.id===modelId)||MODELS[0],s=S[model.id],f=bodyFunctions(s),root=new THREE.Group(),chassis=new THREE.Group(),wheels=[],doors=[];root.add(chassis);buildingDesignedRoot=root;registerVehicleFactoryDisposer(root,()=>releaseDesignedRoot(root));
  const isC800=model.id==='c800',isHorizon=s.style==='horizon',isMicro=s.kind==='microvan',accent=isC800?0xcbbd9f:isHorizon?0xc8d4e2:model.brand==='aurelia'?0xa58d72:0xc7ccd0,paintColor=colorOverride??model.color;
  const paint=material(`paint:${paintColor}:${s.kind}`,{color:paintColor,metalness:s.kind==='pickup'?.9:.66,roughness:s.kind==='pickup'?.29:.22,clearcoat:1,clearcoatRoughness:.15,envMapIntensity:1.3});
  const dark=material('trim',{color:0x111820,metalness:.22,roughness:.34}),rubber=material('rubber',{color:0x101318,metalness:0,roughness:.79}),glass=material(isC800?'c800:privacy-glass':'glass',{color:0x263941,metalness:.1,roughness:.12,clearcoat:1,transparent:true,opacity:isC800?.76:.9,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.5}),chrome=material(`metal:${accent}`,{color:accent,metalness:.95,roughness:.22}),rimDark=material('rimdark',{color:0x39434b,metalness:.89,roughness:.28}),light=material('headlight',{color:0xe8faff,emissive:0x9bd8ed,emissiveIntensity:1.5,metalness:.2,roughness:.13}),tail=material('tail',{color:0x9d1427,emissive:0xfa1831,emissiveIntensity:1.5,metalness:.22,roughness:.18}),lampGlass=material('lampglass',{color:0x899faa,metalness:.42,roughness:.12,clearcoat:1}),seat=material(model.brand==='aurelia'?'cognac':'ivory',{color:model.brand==='aurelia'?0x965d3e:0xc0bbae,roughness:.86}),seam=material('seam',{color:0x22272c,roughness:.6}),brake=material('brake',{color:0xc74832,metalness:.46,roughness:.37});
  light.name='Vehicle Headlamp';tail.name='Vehicle Tail Lamp';
  const upperPaint=s.upperColor?material(isC800?'c800:champagne':model.id+':upper-paint',{color:s.upperColor,metalness:.72,roughness:.23,clearcoat:1,clearcoatRoughness:.13,envMapIntensity:1.3}):paint;
  const cabinSeat=isC800?material('c800:oyster-leather',{color:0xe3d9c7,roughness:.79}):isHorizon?material('s800:cloud-leather',{color:0xcfd4d2,roughness:.82}):isMicro?material('v6:woven-seat',{color:0x788181,roughness:.96}):seat;
  const key=model.id+':'+simple,rows=simple?64:112;
  const add=(name,build,mat=paint,parent=chassis)=>mesh(parent,cache(key+':'+name,build),mat);

  // Painted side skins stop at the circular wheel openings: there is no solid
  // body cube behind the tires. The front door is its own curved surface.
  function sideSurface(side,z0,z1,gap=0){return grid(Math.max(3,Math.ceil((z1-z0)/s.length*rows)),8,(u,v)=>{const z=lerp(z0,z1,u),bottom=f.bottom(z)+gap,y=lerp(bottom,f.shoulder(z),v);return[side*f.sideX(z,y),y,z];},side>0);}
  for(const side of [-1,1]){
    add('side-front:'+side,()=>sideSurface(side,-f.half,s.door[0]-.006));
    add('side-rear:'+side,()=>sideSurface(side,s.door[1]+.006,f.half));
    const door=new THREE.Group();door.position.set(side*f.width(s.door[0])*.975,s.belt-.23,s.door[0]);chassis.add(door);
    const transform=g=>g.translate(-door.position.x,-door.position.y,-door.position.z);
    add('door-skin:'+side,()=>transform(sideSurface(side,s.door[0]+.004,s.door[1]-.004,.008)),paint,door);
    if(isC800){
      // The shoulder band follows the same curved skin as the body, and its
      // front section belongs to the opening door. It is not a box overlay.
      const upperSide=(z0,z1)=>grid(Math.max(4,Math.ceil((z1-z0)/s.length*rows)),5,(u,v)=>{const z=lerp(z0,z1,u),y=lerp(Math.max(f.bottom(z)+.009,f.shoulder(z)-.23),f.shoulder(z)+.002,v);return[side*(f.sideX(z,y)+.0035),y,z];},side>0);
      add('upper-front:'+side,()=>upperSide(-f.half,s.door[0]-.006),upperPaint);
      add('upper-rear:'+side,()=>upperSide(s.door[1]+.006,f.half),upperPaint);
      add('upper-door:'+side,()=>transform(upperSide(s.door[0]+.005,s.door[1]-.005)),upperPaint,door);
      for(const [z0,z1,parent]of [[-f.half+.04,s.door[0]-.008,chassis],[s.door[0]+.009,s.door[1]-.009,door],[s.door[1]+.009,f.half-.04,chassis]]){
        const points=[];for(let i=0;i<=28;i++){const z=lerp(z0,z1,i/28),y=Math.max(f.bottom(z)+.012,f.shoulder(z)-.229);points.push([side*(f.sideX(z,y)+.009)-(parent===door?door.position.x:0),y-(parent===door?door.position.y:0),z-(parent===door?door.position.z:0)]);}tube(parent,chrome,points,.006,28);
      }
    }
    const framePoints=[];for(let i=0;i<=24;i++){const z=lerp(s.door[0],s.door[1],i/24),y=f.shoulder(z)+.021;framePoints.push([side*f.width(z)*.937-door.position.x,y-door.position.y,z-door.position.z]);}
    tube(door,chrome,framePoints,.009,24);
    const windowGeometry=(z0,z1)=>grid(28,8,(u,v)=>{const z=lerp(z0,z1,u),bottom=f.shoulder(z)+.028,y=lerp(bottom,Math.max(bottom+.004,f.roofY(z)-.024),v);return[side*f.windowX(z,v),y,z];},side>0);
    add('door-window:'+side,()=>transform(windowGeometry(s.door[0]+.032,s.door[1]-.025)),glass,door);
    add('rear-window:'+side,()=>windowGeometry(s.door[1]+.025,s.cabin[3]-.035),glass);
    if(s.cabin[0]<s.door[0]-.012)add('quarter-front:'+side,()=>windowGeometry(s.cabin[0]+.015,s.door[0]-.012),glass);
    const roofEdge=[];for(let i=0;i<=44;i++){const z=lerp(s.cabin[0],s.cabin[3],i/44),t=clamp((f.roofY(z)-(f.shoulder(z)+.025))/(s.roof-(f.shoulder(z)+.025)),0,1);roofEdge.push([side*f.windowX(z,1),f.roofY(z),z]);}
    tube(chassis,upperPaint,roofEdge,isC800?.045:s.kind==='offroad'?.031:.024,44);
    // A and B pillars define separate glass panes without a solid dark canopy.
    for(const z of [s.door[0],s.door[1]])line(chassis,dark,[side*f.windowX(z,0),f.shoulder(z)+.018,z],[side*f.windowX(z,1),f.roofY(z),z],z===s.door[1]?.028:.014);
    if(!isC800&&['suv','hatch','offroad','wagon','van','microvan'].includes(s.kind)){
      const z=lerp(s.door[1],s.cabin[3],.62);line(chassis,dark,[side*f.windowX(z,0),f.shoulder(z),z],[side*f.windowX(z,1),f.roofY(z),z],.018);
    }
    // Door returns and interior panel move with the skin; an open door reveals
    // a cabin, not another fixed painted panel.
    const innerZ=(s.door[1]-s.door[0])/2,innerH=s.belt-s.base-.15;
    box(door,dark,.035,innerH,s.door[1]-s.door[0]-.12,side*-.055,-.13,innerZ,.012);
    box(door,cabinSeat,.042,innerH*.42,s.door[1]-s.door[0]-.23,side*-.077,-.08,innerZ,.015);
    box(door,chrome,.025,.028,.13,side*-.106,.025,innerZ-.18,.005);
    const handleZ=s.door[1]-.24,hy=f.shoulder(handleZ)-.12,hx=side*(f.sideX(handleZ,hy)+.012);
    box(door,chrome,.025,.027,.175,hx-door.position.x,hy-door.position.y,handleZ-door.position.z,.008);
    const mirrorX=side*(f.width(s.door[0])+.125),mirrorY=f.shoulder(s.door[0])+.115,mirrorZ=s.door[0]+.21;
    line(door,dark,[side*.005,.22,.16],[mirrorX-door.position.x,mirrorY-door.position.y,mirrorZ-door.position.z],.027);
    const mirror=box(door,isC800?upperPaint:paint,.20,.085,.23,mirrorX-door.position.x,mirrorY-door.position.y,mirrorZ-door.position.z,.045);mirror.rotation.y=-side*.12;
    box(door,chrome,.171,.06,.011,mirrorX-door.position.x,mirrorY-door.position.y,mirrorZ-door.position.z+.117,.025);
    if(!simple)box(door,light,.14,.01,.026,mirrorX-door.position.x,mirrorY-door.position.y-.013,mirrorZ-door.position.z-.134,.004);
    mergeStatic(door,key+':door:'+side+':'+paintColor);doors.push({pivot:door,side});
    // Lower sculpted sill and clearly defined open arch lip.
    const sillPoints=[];for(let i=0;i<=30;i++){const z=lerp(s.axles[0]+f.archRadius+.01,s.axles[1]-f.archRadius-.01,i/30);sillPoints.push([side*(f.sideX(z,s.base+.065)+.012),s.base+.065,z]);}
    tube(chassis,['offroad','pickup','suv'].includes(s.kind)?dark:paint,sillPoints,.055,30);
    for(const axle of s.axles){const lip=[];for(let i=0;i<=40;i++){const a=Math.PI*i/40,z=axle-Math.cos(a)*f.archRadius,y=s.wheel+Math.sin(a)*f.archRadius;lip.push([side*(f.sideX(z,y)+.009),y,z]);}tube(chassis,['offroad','pickup'].includes(s.kind)?dark:paint,lip,s.kind==='offroad'?.052:.019,40);}
    // Recessed wheel-well lining keeps the wheel opening truly open while
    // preventing a see-through gap to the opposite side of the chassis.
    const well=material('wheel-well',{color:0x11151a,roughness:.9,side:THREE.DoubleSide});
    for(const axle of s.axles){
      add('well-arch:'+side+':'+axle,()=>grid(40,5,(u,v)=>{const a=Math.PI*u,z=axle-Math.cos(a)*(f.archRadius+.01),y=s.wheel+Math.sin(a)*(f.archRadius+.01);return[side*lerp(.57,f.sideX(z,y)-.012,v),y,z];}),well);
      add('well-back:'+side+':'+axle,()=>grid(32,8,(u,v)=>{const z=axle-f.archRadius+2*f.archRadius*u,upper=s.wheel+Math.sqrt(Math.max(0,f.archRadius*f.archRadius-(z-axle)**2));return[side*.57,lerp(s.base-.04,upper,v),z];},side<0),well);
    }

    // Rear door perimeter is a recessed seam, with a separate flush handle.
    if(['sedan','suv','pickup','hatch','offroad','saloon','wagon','van','microvan'].includes(s.kind)){
      const z=Math.min(s.cabin[3]-.12,s.axles[1]-.06),pts=[];for(let i=0;i<=24;i++){const t=i/24,zz=lerp(s.axles[1]-f.archRadius-.09,z,t*t),y=lerp(s.base+.10,f.shoulder(z)-.005,t);pts.push([side*(f.sideX(zz,y)+.005),Math.max(y,f.bottom(zz)+.008),zz]);}tube(chassis,seam,pts,.005,24);
      const hz=z-.18,yy=f.shoulder(hz)-.12;box(chassis,chrome,.025,.025,.16,side*(f.sideX(hz,yy)+.012),yy,hz,.007);
    }
  }
  // Upper fender, hood, and deck surfaces share continuous curved sections.
  const topSurface=(z0,z1,u0=-1,u1=1)=>grid(Math.max(4,Math.ceil((z1-z0)/s.length*rows)),24,(a,b)=>{const z=lerp(z0,z1,a),u=lerp(u0,u1,b);return[f.width(z)*.932*u,f.top(z,u),z];});
  add('hood',()=>topSurface(-f.half,s.cabin[0]),s.pack?paint:upperPaint);
  if(s.kind!=='pickup')add('deck',()=>topSurface(s.cabin[3],f.half),s.pack?paint:upperPaint);
  else{
    add('bed-floor',()=>grid(10,10,(u,v)=>[lerp(-.81,.81,v),.64,lerp(1.05,f.half-.16,u)]),dark);
    for(const side of [-1,1]){box(chassis,dark,.08,.43,1.45,side*.86,.88,1.77);box(chassis,paint,.16,.07,1.52,side*.94,1.165,1.77);}
    box(chassis,dark,1.73,.46,.085,0,.89,1.06);for(let i=0;i<9;i++)box(chassis,rimDark,.015,.014,1.4,-.7+i*.175,.655,1.77,.003);
  }
  for(const side of [-1,1])add('shoulder:'+side,()=>topSurface(s.cabin[0],s.kind==='pickup'?f.half:s.cabin[3],side<0?-1:.935,side<0?-.935:1),s.pack?paint:upperPaint);
  // Smoothly crowned roof and curved windscreens.
  add('roof',()=>grid(26,24,(u,v)=>{const z=lerp(s.cabin[1],s.cabin[2],u),x=lerp(-s.roofWidth,s.roofWidth,v),y=f.roofY(z)+.045*Math.sin(v*Math.PI);return[x,y,z];}),s.upperColor?upperPaint:isMicro?paint:s.style==='pixel'?dark:['hatch','classic','offroad'].includes(s.kind)?paint:glass);
  for(const front of [true,false]){const z0=front?s.cabin[0]:s.cabin[2],z1=front?s.cabin[1]:s.cabin[3];add(front?'windscreen':'backlight',()=>grid(14,24,(u,v)=>{const z=lerp(z0,z1,u),t=front?u:1-u,w=lerp(f.width(front?z0:z1)*.932,s.roofWidth,t),x=lerp(-w,w,v),y=f.roofY(z)+.037*Math.sin(v*Math.PI);return[x,y,z-(front?1:-1)*.023*Math.sin(v*Math.PI)*Math.sin(u*Math.PI)];}),glass);const z=front?s.cabin[0]:s.cabin[3],p=[];for(let i=0;i<=20;i++){const u=i/20,x=lerp(-f.width(z)*.93,f.width(z)*.93,u);p.push([x,f.shoulder(z)+.025+.028*Math.sin(u*Math.PI),z]);}tube(chassis,dark,p,.017,20);}
  // Painted caps define the roof boundary; glass roofs keep a narrow body rail.
  for(const z of [s.cabin[1],s.cabin[2]]){const points=[];for(let i=0;i<=20;i++){const t=i/20;points.push([lerp(-s.roofWidth,s.roofWidth,t),f.roofY(z)+.045*Math.sin(t*Math.PI),z]);}tube(chassis,upperPaint,points,isC800?.026:.019,20);}
  // Lower bumpers and closed end faces curve gently across the nose and tail.
  for(const front of [true,false]){const z=front?-f.half:f.half,top=f.shoulder(z);add(front?'nose':'tailcap',()=>grid(10,30,(a,b)=>{const u=lerp(-1,1,b),y=lerp(s.base+.025,f.top(z,u),a),x=f.sideX(z,Math.min(y,top))*u;return[x,y,z+(front?-.035:.025)*Math.sin(b*Math.PI)*Math.sin(a*Math.PI)];},!front));const bumper=box(chassis,dark,f.width(z)*1.94,.09,.22,0,s.base+.06,z+(front?.045:-.045),.045);}
  box(chassis,dark,s.width*.84,.035,s.length*.84,0,s.base-.018,0,.012);
  buildLights(chassis,model,s,f,{paint,dark,chrome,light,tail,lampGlass},simple);

  // Precision wheel assemblies: rounded tire cross-section, open spokes,
  // machined rim lips, vented brake discs, and stationary painted calipers.
  const tireWidth=isMicro?.195:s.style==='pixel'?.215:['offroad','pickup','super'].includes(s.kind)?.285:.26,track=s.width-(isMicro?.205:s.style==='pixel'?.23:.285);
  const tireGeo=cache(key+':tire',()=>{const r=s.wheel,w=tireWidth/2,p=[[r*.72,-w*.78],[r*.78,-w],[r*.91,-w],[r*.98,-w*.62],[r,-w*.28],[r,w*.28],[r*.98,w*.62],[r*.91,w],[r*.78,w],[r*.72,w*.78],[r*.72,-w*.78]];const g=new THREE.LatheGeometry(p.map(v=>new THREE.Vector2(...v)),simple?36:64);g.rotateZ(Math.PI/2);return g;});
  const torus=(r,tubeRadius)=>cache(`torus:${r}:${tubeRadius}:${simple}`,()=>{const g=new THREE.TorusGeometry(r,tubeRadius,6,simple?32:64);g.rotateY(Math.PI/2);return g;});
  const discGeo=cache(key+':disc',()=>{const g=new THREE.CylinderGeometry(s.wheel*.67,s.wheel*.67,.023,simple?32:56);g.rotateZ(Math.PI/2);return g;});
  const hubGeo=cache(key+':hub',()=>{const g=new THREE.CylinderGeometry(s.wheel*.16,s.wheel*.16,.042,24);g.rotateZ(Math.PI/2);return g;});
  for(const side of [-1,1])for(const axle of s.axles){const pivot=new THREE.Group(),spin=new THREE.Group();pivot.position.set(side*track/2,s.wheel,axle);root.add(pivot);pivot.add(spin);mesh(spin,tireGeo,rubber);const rimX=side*(tireWidth/2+.007);mesh(spin,torus(s.wheel*.755,.019),chrome).position.x=rimX;mesh(spin,torus(s.wheel*.705,.01),rimDark).position.x=rimX;mesh(spin,torus(s.wheel*.895,.007),rubber).position.x=side*tireWidth/2;mesh(spin,discGeo,rimDark).position.x=rimX-side*.046;mesh(spin,hubGeo,chrome).position.x=rimX+side*.018;
    const spokePieces=[];for(let j=0;j<s.spokes;j++){const angle=j/s.spokes*Math.PI*2,count=s.spokes===5?2:1;for(let branch=0;branch<count;branch++){const points=[],r0=s.wheel*.13,r1=s.wheel*.72;for(let i=0;i<=8;i++){const t=i/8,r=lerp(r0,r1,t),theta=angle+(s.kind==='classic'?0:.18*t)+((branch-.5)*(count-1)*.17*t),width=lerp(.026,.041,t);points.push({r,theta,width});}const g=grid(8,1,(u,v)=>{const p=points[Math.round(u*8)],theta=p.theta+(v-.5)*p.width/p.r;return[rimX+side*(.009+.021*Math.sin(u*Math.PI)),Math.cos(theta)*p.r,Math.sin(theta)*p.r];},side<0);spokePieces.push(g);}}const sg=join(spokePieces);spokePieces.forEach(g=>g.dispose());mesh(spin,sg,chrome); // visible actual gaps between spokes
    if(!simple){for(let j=0;j<5;j++){const a=j/5*Math.PI*2;const bolt=mesh(spin,cache('bolt',()=>{const g=new THREE.CylinderGeometry(.012,.012,.012,6);g.rotateZ(Math.PI/2);return g;}),dark);bolt.position.set(rimX+side*.044,Math.cos(a)*.046,Math.sin(a)*.046);}const caliper=box(pivot,brake,.055,.22,.075,rimX-side*.066,.035,-s.wheel*.5,.026);caliper.rotation.x=-.14;
      const score=[];for(let j=0;j<22;j++){const a=j/22*Math.PI*2;score.push([Math.cos(a)*s.wheel*.51,Math.sin(a)*s.wheel*.51]);}for(const [yy,zz]of score){const dot=mesh(spin,cache('brake-hole',()=>{const g=new THREE.CircleGeometry(.012,6);g.rotateY(Math.PI/2);return g;}),dark);dot.position.set(rimX-side*.032,yy,zz);dot.rotation.y=side<0?Math.PI:0;}
    }
    mergeStatic(spin,key+':wheel:'+side+':'+paintColor);wheels.push({pivot,spin,side,front:axle===s.axles[0],radius:s.wheel});
  }
  let steeringWheel=null,infotainmentMesh=null;
  {
    // Cabin floor, sculpted upholstered seats and a floating central display.
    const rows=s.seatRows??(s.kind==='van'?[-.73,.53,1.48]:s.kind==='gt'?[.65]:['sport','super','gt','classic'].includes(s.kind)?[.11]:[.02,1.05]),seatX=s.width*.215,seatY=s.base+(isC800?.24:.21);
    box(chassis,dark,s.width*.79,.04,s.cabin[3]-s.cabin[0],0,s.base+.065,(s.cabin[3]+s.cabin[0])/2,.018);
    for(const side of [-1,1])for(const z of rows){const headY=Math.min(isC800?1.65:s.roof-.20,f.roofY(z+.32)-.17),backHeight=Math.max(.27,headY-seatY-.12);box(chassis,cabinSeat,.56,.15,.53,side*seatX,seatY,z,.065);const back=box(chassis,cabinSeat,.53,backHeight,.13,side*seatX,seatY+backHeight/2,z+.24,.05);back.rotation.x=-.11;box(chassis,cabinSeat,.27,.14,.115,side*seatX,headY,z+.275,.043);for(const dx of [-.22,.22])box(chassis,cabinSeat,.085,.2,.47,side*seatX+dx,seatY+.065,z,.035);
      if(isC800){
        // Three clearly separated pairs of seats, with a walk-through aisle.
        box(chassis,dark,.37,.16,.38,side*seatX,seatY-.14,z,.035);
        for(const dx of [-.31,.31]){box(chassis,cabinSeat,.09,.085,.46,side*seatX+dx,seatY+.28,z+.035,.032);box(chassis,chrome,.04,.022,.24,side*seatX+dx,seatY+.237,z+.06,.008);}
        if(!simple){for(const dx of [-.13,0,.13])line(chassis,chrome,[side*seatX+dx,seatY+.17,z+.155],[side*seatX+dx,headY-.18,z+.225],.0024);}
        if(z===rows[1]){const footrest=box(chassis,cabinSeat,.43,.075,.30,side*seatX,seatY-.06,z-.40,.034);footrest.rotation.x=-.25;}
      }
    }
    const dashZ=s.cabin[0]+.27,dashY=s.belt-.07;box(chassis,dark,s.width*.8,.18,.33,0,dashY,dashZ,.052);box(chassis,cabinSeat,s.width*.775,.06,.28,0,dashY-.075,dashZ+.02,.018);box(chassis,chrome,s.width*.75,.013,.016,0,dashY+.007,dashZ+.177,.003);
    const displayMat=material('display',{color:0x102935,emissive:0x134456,emissiveIntensity:.5,roughness:.17});const screen=box(chassis,dark,.38,.245,.027,0,dashY+.15,dashZ+.175,.019);screen.rotation.x=-.14;infotainmentMesh=mesh(chassis,new THREE.PlaneGeometry(.344,.21),displayMat);infotainmentMesh.position.set(0,dashY+.15,dashZ+.198);infotainmentMesh.name='Infotainment-'+model.id;infotainmentMesh.userData.animated=true;
    box(chassis,dark,.19,.16,.8,0,seatY-.015,s.door[0]+.75,.05);
    const sw=new THREE.Group();sw.position.set(-seatX,dashY+.09,dashZ+.37);sw.rotation.x=-.25;chassis.add(sw);mesh(sw,cache('steering-wheel',()=>new THREE.TorusGeometry(.158,.016,10,40)),dark);box(sw,chrome,.255,.023,.017,0,-.022,0,.005);box(sw,dark,.075,.071,.028,0,-.018,.014,.015);line(sw,chrome,[0,-.03,0],[0,-.14,0],.009);steeringWheel=sw;
    // Hood shut-lines, slim windshield wipers and tiny geometric brand badge.
    for(const side of [-1,1]){const pts=[];for(let i=0;i<=24;i++){const z=lerp(-f.half+.29,s.cabin[0]-.035,i/24),u=side*lerp(.63,.7,i/24);pts.push([f.width(z)*.932*u,f.top(z,u)+.002,z]);}tube(chassis,seam,pts,.0038,24);line(chassis,dark,[side*.19,f.shoulder(s.cabin[0])+.055,s.cabin[0]+.06],[side*.66,f.shoulder(s.cabin[0])+.07,s.cabin[0]+.1],.007);}
    if(!isC800&&!s.pack){const badge=box(chassis,chrome,.065,.058,.01,0,s.belt-.175,-f.half-.036,.01);badge.rotation.z=Math.PI/4;}
    const plate=material('plate',{color:0xdde0d8,roughness:.47});box(chassis,plate,.39,.086,.014,0,s.base+.175,f.half+.031,.012);for(let i=0;i<6;i++)box(chassis,dark,.016,.038,.003,-.115+i*.045,s.base+.175,f.half+.04,.002);
  }
  modelDetails(chassis,s,f,{paint,dark,chrome,light,tail,seat},simple);
  if(s.pack)buildCoastlineDetails(chassis,s,f,{paint,upperPaint,dark,chrome,light,tail,seat:cabinSeat,glass},simple);
  else if(s.style)buildExpansionDetails(chassis,s,f,{paint,upperPaint,dark,chrome,light,tail,seat:cabinSeat,glass},simple);
  if(isC800)buildC800Details(chassis,s,f,{paint:upperPaint,dark,chrome,light,tail,seat:cabinSeat,glass},simple);
  mergeStatic(chassis,key+':body:'+paintColor);
  root.traverse(o=>{if(o.isMesh)o.userData.semantic=3;});root.userData.model=model.id;root.userData.design='original-2026';
  if(isC800){root.name='CHENJING-C800';root.userData.cabin={rows:3,seats:6,layout:'2+2+2',seatRows:[...s.seatRows],roofHeight:s.roof};root.userData.twoTone={lower:paintColor,upper:s.upperColor};}
  if(s.style){
    root.name=model.brand.toUpperCase()+'-'+model.id.toUpperCase();
    root.userData.design=s.pack?'original-2026-coastline':'original-2026-1.5';
    root.userData.bodyStyle=s.kind;
    root.userData.cabin={rows:s.seatRows.length,seats:s.seatRows.length*2,layout:s.seatRows.map(()=>2).join('+'),seatRows:[...s.seatRows],roofHeight:s.roof};
    if(s.upperColor)root.userData.twoTone={lower:paintColor,upper:s.upperColor};
  }
  return{root,chassis,wheels,doors,model,steeringWheel,infotainmentMesh,wheelBase:s.axles[1]-s.axles[0],rearAxle:s.axles[1],track,maxSteer:['offroad','van','microvan'].includes(s.kind)?.57:.6,lateralGrip:s.grip,driverCamera:new THREE.Vector3(-s.width*.215,s.roof-.22,s.cameraZ??(isC800?-1.00:s.kind==='van'?-.79:s.kind==='gt'?.57:.03)),driverPosition:new THREE.Vector3(-s.width*.215,s.base+.03,s.driverZ??(isC800?-.94:s.kind==='van'?-.7:s.kind==='gt'?.65:.1)),exitPosition:new THREE.Vector3(-s.width/2-.73,0,s.driverZ??(isC800?-.92:-.25)),instrumentPosition:new THREE.Vector3(-s.width*.215,s.belt+.06,s.cabin[0]+.53),instrumentSize:isC800?[.40,.16]:[.34,.15],pedalMount:new THREE.Vector3(-s.width*.215,s.base+.065,s.cabin[0]+.49),height:s.roof,halfWidth:s.width/2,dimensions:{length:s.length,width:s.width,height:s.roof},entryOpening:{front:s.door[0],rear:s.door[1],sill:s.base,roof:s.roof},mass:model.mass};
}

function buildLights(parent,model,s,f,m,simple){
  const {dark,chrome,light,tail,lampGlass,paint}=m,front=-f.half,back=f.half;
  // Lens shape is distinct from its luminous signature: lights have depth,
  // dark housings, individual projector elements and a clear outer cover.
  const lens=(side,x,y,z,w,h,slant=0)=>{const outline=[[-w/2,-h/2],[w/2,-h*.36],[w/2-.025,h/2],[-w/2+.035,h*.36]],o=panel(parent,dark,outline,.043);o.position.set(side*x,y,z);o.rotation.y=side*slant;const gl=panel(parent,lampGlass,outline.map(([a,b])=>[a*.94,b*.86]),.011);gl.position.set(side*x,y,z-.009);gl.rotation.y=side*slant;return {x:side*x,y,z:z-.01};};
  const blade=(p,w,side,y=0,slant=0)=>{const o=box(parent,light,w,.015,.02,p.x,p.y+y,p.z-.007,.007);o.rotation.y=side*slant;return o;};
  const projectors=(p,w,count)=>{if(simple)return;for(let i=0;i<count;i++){const sphere=mesh(parent,cache('projector',()=>new THREE.SphereGeometry(.03,14,10)),light);sphere.scale.set(1,.72,.3);sphere.position.set(p.x+(i-(count-1)/2)*(w/(count+1)),p.y-.015,p.z-.008);}};
  if(model.id==='c800'){
    buildC800Lights(parent,s,f,m,simple);
    return;
  }
  if(s.pack){
    buildCoastlineLights(parent,s,f,m,simple);
    return;
  }
  if(s.style){
    buildExpansionLights(parent,s,f,m,simple);
    return;
  }
  if(s.kind==='gt'){
    // AURELIA's original crescent signatures wrap upward around a closed nose.
    // The single lower cooling slot deliberately has no grille divisions.
    const intake=panel(parent,dark,[[-.64,.02],[-.53,-.047],[.53,-.047],[.64,.02],[.55,.038],[-.55,.038]],.027);intake.position.set(0,.349,front-.026);
    for(const side of [-1,1]){
      const outline=[[-.165,-.024],[-.05,-.035],[.055,-.004],[.167,.061],[.148,.075],[.038,.052],[-.13,.02]].map(([x,y])=>[side*x,y]);
      const housing=panel(parent,dark,outline,.027);housing.position.set(side*.584,.656,front-.016);
      const lens=panel(parent,lampGlass,outline.map(([x,y])=>[x*.88,y*.73]),.008);lens.position.set(side*.584,.656,front-.023);
      const crescent=[];for(let i=0;i<=24;i++){const t=i/24;crescent.push([side*(.43+.30*t),.667+.064*t*t-.022*Math.sin(t*Math.PI),front-.039+.017*t]);}
      tube(parent,light,crescent,.008,24);
      const lower=[];for(let i=0;i<=10;i++){const t=i/10;lower.push([side*(.437+.13*t),.639+.011*t*t,front-.037]);}tube(parent,light,lower,.0055,10);
      if(!simple)for(let i=0;i<3;i++)box(parent,light,.018,.011,.007,side*(.572+i*.027),.659+i*.012,front-.032,.003);
    }
  }else if(['classic','offroad','hatch'].includes(s.kind)){
    for(const side of [-1,1]){const x=side*(s.kind==='hatch'?.53:.6),y=f.shoulder(front)-.068,z=front+.006,r=s.kind==='offroad'?.16:s.kind==='classic'?.155:.132;const housing=mesh(parent,cache('round-housing:'+r,()=>new THREE.CylinderGeometry(r+.035,r+.045,.067,40)),dark);housing.rotation.x=Math.PI/2;housing.position.set(x,y,z);const lamp=mesh(parent,cache('round-lamp:'+r,()=>new THREE.CircleGeometry(r,40)),lampGlass);lamp.rotation.y=Math.PI;lamp.position.set(x,y,z-.041);const ring=mesh(parent,cache('light-ring:'+r,()=>new THREE.TorusGeometry(r*.82,.011,8,48)),light);ring.position.set(x,y,z-.05);box(parent,light,r*1.22,.018,.018,x,y,z-.054,.007);}
    if(s.kind==='offroad'){box(parent,dark,1.15,.255,.065,0,f.shoulder(front)-.055,front+.015,.035);for(let i=0;i<7;i++)box(parent,chrome,.022,.165,.015,-.4+i*.133,f.shoulder(front)-.055,front-.03,.006);}else box(parent,dark,.75,.13,.045,0,s.base+.21,front-.035,.035);
  }else{
    const thin=['pickup','super','sport'].includes(s.kind),yy=f.shoulder(front)-.031;
    for(const side of [-1,1]){const p=lens(side,s.kind==='van'?.65:.535,yy,front-.018,thin?.39:.37,thin?.066:.087,-.10);blade(p,thin?.405:.375,side,.027,-.1);projectors(p,.35,thin?3:4);
      if(['suv','van','wagon'].includes(s.kind)){const o=box(parent,light,.014,.18,.019,side*.808,yy-.066,front-.027,.006);o.rotation.z=side*.06;}
      if(['sport','super'].includes(s.kind)){const p2={x:side*.655,y:yy+.026,z:front+.023};blade(p2,.29,side,0,-side*.08);}
    }
    if(['pickup','suv','van'].includes(s.kind))box(parent,light,1.09,.013,.025,0,yy+.025,front-.044,.006);
    const intakeW=s.kind==='saloon'?1.21:s.kind==='gt'?1.28:1.36,intakeH=['van','saloon','gt'].includes(s.kind)?.18:.1;
    box(parent,dark,intakeW,intakeH,.08,0,s.base+.19,front-.017,.034);
    if(['gt','saloon','van'].includes(s.kind)){for(let i=0;i<15;i++)box(parent,chrome,.012,intakeH*.7,.012,-intakeW*.42+i*intakeW*.84/14,s.base+.19,front-.061,.004);}
    if(['sport','super'].includes(s.kind))for(const side of [-1,1]){const p=box(parent,dark,.22,.13,.12,side*.69,s.base+.18,front+.025,.04);p.rotation.y=-side*.12;}
  }
  // Rear lamp outer lenses with separate illuminated signature and reverse lens.
  const rearY=s.belt-.025;
  if(s.kind==='gt'){for(const side of[-1,1]){box(parent,dark,.47,.12,.045,side*.47,rearY-.05,back+.018,.048);const loop=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;loop.push([side*.47+Math.cos(a)*.194,rearY-.046+Math.sin(a)*.027,back+.045]);}tube(parent,tail,loop,.009,40);box(parent,tail,.12,.008,.014,side*.47,rearY-.049,back+.047,.004);}}
  else if(['offroad','wagon','van'].includes(s.kind))for(const side of [-1,1]){box(parent,dark,.105,.37,.043,side*f.width(back)*.88,rearY-.02,back+.012,.025);box(parent,tail,.055,.29,.018,side*f.width(back)*.88,rearY-.007,back+.043,.014);box(parent,tail,.31,.025,.023,side*.6,rearY+.123,back+.034,.009);}
  else{box(parent,dark,f.width(back)*1.85,.088,.044,0,rearY,back+.012,.022);box(parent,tail,f.width(back)*1.76,.021,.025,0,rearY+.014,back+.041,.009);for(const side of [-1,1])box(parent,tail,.32,.016,.029,side*.54,rearY-.025,back+.042,.008);}
  for(const side of [-1,1]){box(parent,tail,.17,.015,.018,side*.58,s.base+.125,back+.07,.006);if(!simple)box(parent,light,.06,.014,.015,side*.42,rearY-.031,back+.047,.004);}
  if(['sport','super','gt'].includes(s.kind)){for(const x of [-.56,-.28,0,.28,.56])box(parent,dark,.028,.085,.34,x,s.base+.006,back-.075,.008);for(const side of [-1,1])box(parent,chrome,.15,.052,.04,side*.58,s.base+.12,back+.091,.02);}
}

function modelDetails(parent,s,f,m,simple){
  if(s.pack)return; // Each Coastline body has its own accessory layout below.
  const {paint,dark,chrome,light}=m;
  if(!s.upperColor&&['wagon','suv','van','offroad'].includes(s.kind))for(const side of [-1,1]){const z0=s.cabin[1]+.12,z1=s.cabin[2]-.13;line(parent,s.kind==='offroad'?dark:chrome,[side*s.roofWidth*.83,s.roof+.023,z0],[side*s.roofWidth*.83,s.roof+.023,z1],.023);for(const z of [z0+.12,z1-.12])box(parent,dark,.045,.055,.15,side*s.roofWidth*.83,s.roof-.003,z,.014);}
  if(s.kind==='offroad'&&!s.pack){
    for(const z of [-.63,.35,1.14])box(parent,dark,1.67,.055,.084,0,s.roof+.087,z,.018);
    if(!simple){box(parent,dark,1.2,.16,.92,0,s.roof+.2,.48,.07);for(const side of [-1,1])box(parent,chrome,.025,.18,.96,side*.43,s.roof+.2,.48,.008);}
    const spare=mesh(parent,cache('spare-tyre',()=>new THREE.TorusGeometry(.328,.116,12,56)),material('rubber',{color:0x101318,roughness:.8}));spare.position.set(0,1.03,f.half+.13);const hub=mesh(parent,cache('spare-hub',()=>new THREE.CylinderGeometry(.233,.233,.12,32)),chrome);hub.rotation.x=Math.PI/2;hub.position.set(0,1.03,f.half+.17);box(parent,paint,.25,.25,.021,0,1.03,f.half+.242,.045);
    for(const side of [-1,1])box(parent,chrome,.13,.075,.14,side*.6,s.base+.1,-f.half-.1,.018);
  }
  if(['sport','gt','super'].includes(s.kind)){
    const rear=s.kind==='super'?f.half-.36:f.half-.27,w=s.width*.79;box(parent,s.kind==='gt'?paint:dark,w,.035,.19,0,f.shoulder(rear)+.075,rear,.015);
    for(const side of [-1,1]){
      const z=s.kind==='super'?.74:-.8,y=s.belt-.19,x=side*(f.width(z)+.016);const vent=box(parent,dark,.024,.14,.38,x,y,z,.03);vent.rotation.z=side*-.09;
      if(!simple)for(let i=0;i<3;i++)box(parent,chrome,.027,.007,.27,x+side*.007,y-.039+i*.039,z,.002);
    }
  }
  if(s.kind==='super'){
    // Exposed rear engine deck and recessed flying-buttress vents.
    const z=(s.cabin[3]+f.half-.3)/2;box(parent,dark,1.2,.025,.55,0,f.top(z,0)+.015,z,.032);for(let i=0;i<9;i++)box(parent,rimMaterial(),1.13,.012,.017,0,f.top(z,0)+.033,z-.2+i*.05,.004);
    for(const side of [-1,1])line(parent,paint,[side*.67,s.roof-.11,.62],[side*.88,s.belt+.12,1.51],.032);
  }
  if(s.kind==='hatch')box(parent,dark,1.27,.048,.24,0,s.roof-.038,s.cabin[2]+.14,.021);
  if(s.kind==='pickup'){for(const side of [-1,1])line(parent,dark,[side*.87,1.26,1.15],[side*.87,1.26,f.half-.12],.025);box(parent,chrome,.43,.028,.017,0,s.belt-.17,f.half+.052,.009);}
  if(s.kind==='classic'){for(const side of [-1,1]){const points=[];for(let i=0;i<=30;i++){const z=lerp(-f.half+.32,f.half-.3,i/30);points.push([side*(f.width(z)+.003),f.shoulder(z)-.1,z]);}tube(parent,chrome,points,.008,30);}box(parent,chrome,1.36,.035,.026,0,s.base+.155,-f.half-.062,.01);}
}
function rimMaterial(){return material('rimdark',{color:0x39434b,metalness:.89,roughness:.28});}

// CHENJING is a fictional marque: the C800's layered gateway grille, paired
// light blades and satin champagne cap are original geometry, not a car asset.
function buildC800Lights(parent,s,f,m,simple){
  const {dark,chrome,light,tail,lampGlass}=m,front=-f.half,back=f.half;
  box(parent,chrome,1.27,.60,.055,0,.743,front-.042,.060);
  box(parent,dark,1.205,.536,.035,0,.743,front-.080,.048);
  for(let i=0;i<19;i++){
    const x=(i-9)*.056,t=Math.abs(i-9)/9;
    box(parent,chrome,.014,.475-t*.045,.025,x,.742,front-.111+Math.abs(x)*.025,.005);
    if(!simple)box(parent,lampGlass,.006,.437-t*.045,.006,x+.012,.742,front-.124+Math.abs(x)*.025,.002);
  }
  // A narrow floating brow spans two deep, separate matrix-light housings.
  box(parent,dark,1.81,.061,.043,0,1.095,front-.038,.021);
  box(parent,light,1.73,.013,.012,0,1.108,front-.065,.006);
  for(const side of [-1,1]){
    box(parent,dark,.312,.105,.065,side*.760,1.022,front-.029,.027);
    box(parent,lampGlass,.270,.071,.019,side*.760,1.023,front-.069,.019);
    for(let i=0;i<(simple?2:4);i++)box(parent,light,.028,.028,.010,side*(.675+i*(simple?.135:.053)),1.024,front-.084,.007);
    const signature=[[side*.896,1.08,front-.057],[side*.915,.986,front-.049],[side*.893,.844,front-.037],[side*.856,.820,front-.036]];
    tube(parent,light,signature,.009,20);
    box(parent,dark,.142,.137,.064,side*.779,.581,front-.014,.033);
    box(parent,chrome,.127,.012,.012,side*.779,.609,front-.052,.005);
    box(parent,light,.059,.017,.015,side*.779,.569,front-.056,.006);
  }
  // The small split-gate emblem uses two rising arcs, rather than a borrowed logo.
  for(const side of [-1,1])tube(parent,chrome,[[side*.044,1.145,front-.031],[side*.020,1.177,front-.024],[side*.014,1.199,front-.014]],.007,12);
  box(parent,dark,1.56,.089,.073,0,.368,front-.018,.028);
  box(parent,chrome,1.56,.014,.026,0,.406,front-.058,.007);
  // The tall rear signatures follow the actual raked backlight surface,
  // rather than floating on a vertical plane behind the upper cabin.
  const rearBase=f.roofY(s.cabin[3]),rearTop=f.roofY(s.cabin[2]);
  const rearZ=y=>y<rearBase?lerp(back+.027,s.cabin[3]+.025,clamp((y-1.105)/(rearBase-1.105),0,1)):lerp(s.cabin[3],s.cabin[2],clamp((y-rearBase)/(rearTop-rearBase),0,1))+.025;
  for(const side of [-1,1]){
    const spine=[];for(let i=0;i<=30;i++){const y=lerp(1.12,1.947,i/30);spine.push([side*.842,y,rearZ(y)]);}
    tube(parent,dark,spine,.041,36);
    tube(parent,tail,spine.map(([x,y,z])=>[x,y,z+.030]),.012,36);
    tube(parent,tail,[[side*.842,1.947,rearZ(1.947)+.028],[side*.751,1.948,rearZ(1.948)+.030],[side*.653,1.948,rearZ(1.948)+.030]],.010,12);
    box(parent,light,.100,.016,.019,side*.653,1.043,back+.046,.006);
    box(parent,tail,.160,.018,.019,side*.657,.438,back+.062,.006);
  }
  box(parent,dark,1.71,.060,.032,0,1.119,back+.025,.023);
  box(parent,tail,1.66,.015,.014,0,1.127,back+.046,.007);
  box(parent,chrome,1.29,.015,.021,0,.983,back+.047,.006);
}

function buildC800Details(parent,s,f,m,simple){
  const {paint,dark,chrome,light,seat}=m;
  const wood=material('c800:smoked-walnut',{color:0x45382c,metalness:.12,roughness:.49});
  const ambient=material('c800:ambient',{color:0xf3d4a2,emissive:0xe7b66e,emissiveIntensity:.55,roughness:.4});
  const lining=material('c800:headlining',{color:0xbeb8ac,roughness:.94,side:THREE.DoubleSide});
  // Satin rails cap the continuous dark glasshouse. The rear pillars separate
  // the second and third row windows, while the roof stays high to the tail.
  for(const side of [-1,1]){
    const pillarZ=1.25;
    line(parent,dark,[side*f.windowX(pillarZ,0),f.shoulder(pillarZ),pillarZ],[side*f.windowX(pillarZ,1),f.roofY(pillarZ),pillarZ],.032);
    const rearPillar=[];for(let i=0;i<=18;i++){const z=lerp(s.cabin[2],s.cabin[3],i/18);rearPillar.push([side*f.windowX(z,1),f.roofY(z),z]);}tube(parent,paint,rearPillar,.059,18);
    const belt=[];for(let i=0;i<=32;i++){const z=lerp(s.door[1]+.03,s.cabin[3]-.05,i/32);belt.push([side*(f.width(z)*.940),f.shoulder(z)+.018,z]);}tube(parent,chrome,belt,.012,32);
    // Restrained sliding-door tracks and flush handles make the long cabin
    // legible even with the doors shut, without changing hinge animation APIs.
    const track=[];for(let i=0;i<=20;i++){const z=lerp(.06,2.21,i/20),y=f.shoulder(z)-.325;track.push([side*(f.sideX(z,y)+.006),y,z]);}tube(parent,dark,track,.006,20);
    box(parent,chrome,.028,.026,.218,side*(f.sideX(.1,1.04)+.015),1.04,.10,.008);
    const sill=[];for(let i=0;i<=28;i++){const z=lerp(-1.12,1.10,i/28);sill.push([side*(f.sideX(z,.4)+.012),.399,z]);}tube(parent,chrome,sill,.011,28);
    // Rear passenger armrest shelves, walnut inserts and warm ambient strips.
    for(const z of [.44,1.75]){
      box(parent,dark,.12,.25,.90,side*.858,.81,z,.036);
      box(parent,seat,.15,.066,.82,side*.818,.968,z,.029);
      box(parent,wood,.025,.081,.70,side*.772,.889,z,.013);
      box(parent,ambient,.008,.010,.69,side*.754,.939,z,.003);
    }
    // Warm indirect lighting follows the spacious upper cabin.
    line(parent,ambient,[side*.753,2.077,-1.13],[side*.753,2.077,2.10],.006);
  }
  // Flat luggage-floor edge and raised headliner preserve usable third-row
  // volume. Three slim roof console lights make the high roof readable.
  box(parent,lining,1.65,.023,3.82,0,2.137,.36,.020);
  for(const z of [-.63,.77,1.92]){
    box(parent,chrome,.33,.019,.17,0,2.110,z,.028);
    box(parent,light,.25,.007,.094,0,2.098,z,.020);
  }
  box(parent,wood,1.59,.034,.024,0,1.201,-1.649,.009);
  box(parent,ambient,1.55,.009,.008,0,1.222,-1.632,.003);
  // Twin second-row displays are framed in walnut behind the front seats.
  if(!simple)for(const side of [-1,1]){
    box(parent,wood,.355,.223,.029,side*.4515,1.277,-.594,.022);
    box(parent,dark,.315,.180,.008,side*.4515,1.277,-.575,.017);
    box(parent,ambient,.10,.009,.005,side*.4515,1.227,-.570,.003);
  }
  box(parent,dark,1.61,.047,.35,0,.412,2.47,.020);
  // Tailgate badge: clean geometric lettering avoids font or image downloads.
  for(const [i,width]of [.052,.034,.048,.047,.025,.048,.049,.041].entries())box(parent,chrome,width,.013,.011,(i-3.5)*.093,1.055,f.half+.047,.003);
  box(parent,chrome,.23,.052,.019,.571,.878,f.half+.049,.010);
}

// 1.5 originals: shared chassis/door APIs, independent proportions and light
// signatures. These details contain no logos, textures or imported car meshes.
function buildGrandTourLights(parent,s,f,m,simple){
  const {dark,chrome,light,tail,lampGlass}=m,front=-f.half,back=f.half;
  // Original wide, calm front with a floating light ribbon and separate lamps.
  box(parent,dark,1.80,.071,.048,0,1.016,front-.020,.025);
  box(parent,light,1.70,.017,.016,0,1.028,front-.052,.007);
  for(const side of [-1,1]){
    const arc=[];for(let i=0;i<=18;i++){const t=i/18;arc.push([side*(.68+.20*t),1.028-.032*t*t,front-.052+.057*t*t]);}tube(parent,light,arc,.009,18);
    box(parent,dark,.36,.15,.065,side*.668,.896,front-.016,.035);
    box(parent,lampGlass,.318,.105,.013,side*.668,.898,front-.058,.024);
    for(let i=0;i<(simple?2:4);i++)box(parent,light,.032,.035,.008,side*(.560+i*(simple?.195:.065)),.902,front-.069,.007);
    box(parent,dark,.15,.10,.050,side*.790,.495,front+.014,.026);
    box(parent,chrome,.14,.014,.012,side*.790,.482,front-.023,.005);
  }
  box(parent,dark,1.40,.115,.061,0,.48,front-.018,.035);
  for(let i=0;i<3;i++)box(parent,chrome,1.25,.009,.012,0,.45+i*.031,front-.055,.004);
  box(parent,dark,1.78,.079,.044,0,1.031,back+.020,.027);
  box(parent,tail,1.68,.021,.016,0,1.041,back+.050,.009);
  for(const side of [-1,1]){box(parent,tail,.32,.012,.015,side*.59,1.013,back+.050,.005);box(parent,light,.09,.016,.012,side*.58,.82,back+.047,.005);}
}
function buildGrandTourDetails(parent,s,f,m,simple){
  const {dark,chrome,light,seat}=m;
  // A roof sensor pod and satin rear pillars give this six-seat body its own silhouette.
  box(parent,dark,.29,.075,.19,0,s.roof+.007,-.64,.029);
  box(parent,chrome,.24,.012,.012,0,s.roof+.025,-.738,.004);
  for(const side of [-1,1]){
    const z=1.92;line(parent,chrome,[side*f.windowX(z,0),f.shoulder(z)+.03,z],[side*f.windowX(z,1),f.roofY(z)-.015,z],.027);
    box(parent,dark,.08,.055,2.48,side*1.005,.322,.02,.018);
    box(parent,chrome,.045,.012,2.36,side*1.035,.352,.02,.005);
    const hz=.74,hy=f.shoulder(hz)-.12;box(parent,chrome,.025,.027,.18,side*(f.sideX(hz,hy)+.012),hy,hz,.008);
    for(const z of [.77,1.78])for(const dx of [-.29,.29])box(parent,seat,.08,.07,.38,side*s.width*.215+dx,.82,z,.027);
    if(!simple){box(parent,dark,.31,.18,.025,side*s.width*.215,1.20,.015,.019);box(parent,light,.12,.006,.006,side*s.width*.215,1.15,.032,.002);}
  }
  box(parent,chrome,1.51,.014,.018,0,.89,f.half+.05,.005);
}
function buildExpansionLights(parent,s,f,m,simple){
  if(s.style==='grand-tour'){buildGrandTourLights(parent,s,f,m,simple);return;}
  const {dark,chrome,light,tail,lampGlass}=m,front=-f.half,back=f.half;
  if(s.style==='horizon'){
    // A low floating bridge, paired diagonal wings and three offset blades.
    // This restrained horizontal face is intentionally its own construction.
    box(parent,dark,1.27,.235,.055,0,s.belt-.30,front-.031,.045);
    for(let i=0;i<3;i++)box(parent,chrome,1.12-i*.075,.014,.014,0,s.belt-.36+i*.061,front-.067,.005);
    for(const side of [-1,1]){
      box(parent,dark,.365,.095,.043,side*.656,s.belt-.164,front-.044,.026);
      box(parent,lampGlass,.325,.061,.009,side*.656,s.belt-.163,front-.071,.017);
      tube(parent,light,[[side*.48,s.belt-.098,front-.065],[side*.69,s.belt-.10,front-.072],[side*.845,s.belt-.052,front-.047]],.008,18);
      tube(parent,light,[[side*.803,s.belt-.17,front-.065],[side*.832,s.belt-.255,front-.05],[side*.797,s.belt-.284,front-.049]],.007,12);
      if(!simple)for(let i=0;i<4;i++)box(parent,light,.025,.021,.008,side*(.548+i*.068),s.belt-.162,front-.079,.005);
      box(parent,dark,.175,.066,.06,side*.685,s.base+.18,front-.032,.024);
      box(parent,chrome,.171,.013,.016,side*.685,s.base+.15,front-.073,.005);
    }
    box(parent,dark,1.60,.067,.03,0,s.belt-.087,back+.019,.028);
    box(parent,tail,1.51,.012,.016,0,s.belt-.069,back+.044,.006);
    for(const side of [-1,1])tube(parent,tail,[[side*.42,s.belt-.107,back+.045],[side*.64,s.belt-.107,back+.045],[side*.775,s.belt-.064,back+.039]],.007,16);
  }else if(s.style==='utility'){
    // Tall square lamps, an honest narrow bumper and simple steel-look wheels
    // give the short, upright microvan a distinctly practical silhouette.
    box(parent,dark,1.38,.145,.085,0,s.base+.13,front-.025,.031);
    box(parent,dark,.64,.125,.039,0,s.belt-.23,front-.029,.018);
    for(let i=0;i<3;i++)box(parent,chrome,.55,.012,.012,0,s.belt-.265+i*.036,front-.056,.004);
    for(const side of [-1,1]){
      box(parent,dark,.255,.238,.045,side*.559,s.belt-.183,front-.025,.018);
      box(parent,lampGlass,.213,.195,.011,side*.559,s.belt-.183,front-.053,.012);
      box(parent,light,.168,.118,.012,side*.559,s.belt-.159,front-.064,.014);
      box(parent,chrome,.191,.022,.014,side*.559,s.belt-.249,front-.065,.005);
      box(parent,dark,.11,.455,.045,side*.684,s.belt-.12,back+.021,.019);
      box(parent,tail,.071,.26,.014,side*.684,s.belt-.068,back+.049,.009);
      box(parent,light,.065,.061,.016,side*.684,s.belt-.251,back+.048,.008);
    }
    box(parent,dark,1.41,.112,.067,0,s.base+.07,back+.008,.025);
    box(parent,chrome,.35,.022,.015,0,s.belt-.065,back+.04,.004);
  }else if(s.style==='pixel'){
    for(const side of [-1,1]){
      box(parent,dark,.275,.188,.055,side*.516,s.belt-.132,front-.020,.036);
      box(parent,lampGlass,.231,.145,.012,side*.516,s.belt-.132,front-.054,.023);
      for(const x of [-1,1])for(const y of [-1,1])box(parent,light,.056,.035,.01,side*.516+x*.062,s.belt-.132+y*.038,front-.065,.009);
      box(parent,dark,.266,.137,.04,side*.515,s.belt-.062,back+.022,.035);
      for(const x of [-1,1])box(parent,tail,.061,.069,.014,side*.515+x*.061,s.belt-.062,back+.048,.012);
    }
    box(parent,dark,.84,.084,.04,0,s.base+.175,front-.035,.032);
    box(parent,chrome,.39,.015,.017,0,s.belt-.124,front-.054,.006);
  }else{
    for(const side of [-1,1]){
      box(parent,dark,.399,.098,.055,side*.569,s.belt-.14,front-.028,.026);
      tube(parent,light,[[side*.381,s.belt-.119,front-.064],[side*.642,s.belt-.115,front-.064],[side*.757,s.belt-.05,front-.043]],.008,16);
      for(let i=0;i<(simple?2:3);i++)box(parent,light,.03,.021,.012,side*(.474+i*.073),s.belt-.151,front-.064,.006);
      box(parent,dark,.13,.175,.057,side*.722,s.base+.25,front-.022,.023);
      box(parent,light,.071,.019,.014,side*.722,s.base+.236,front-.056,.007);
      box(parent,dark,.108,.341,.039,side*.758,s.belt+.012,back+.014,.025);
      tube(parent,tail,[[side*.548,s.belt+.137,back+.042],[side*.756,s.belt+.137,back+.042],[side*.756,s.belt-.115,back+.042]],.010,20);
      box(parent,tail,.284,.018,.015,side*.44,s.belt-.025,back+.047,.007);
    }
    box(parent,dark,1.10,.122,.057,0,s.base+.15,front-.023,.033);
    box(parent,chrome,1.19,.019,.03,0,s.base+.058,front-.031,.008);
    box(parent,chrome,1.18,.024,.034,0,s.base+.061,back+.033,.009);
  }
  for(const side of [-1,1])box(parent,tail,.137,.014,.017,side*.51,s.base+.12,back+.043,.006);
}

function buildExpansionDetails(parent,s,f,m,simple){
  if(s.style==='grand-tour'){buildGrandTourDetails(parent,s,f,m,simple);return;}
  const {paint,upperPaint,dark,chrome,light,seat}=m;
  if(s.style==='horizon'){
    const wood=material('s800:blue-ash',{color:0x374753,roughness:.54,metalness:.12});
    const ambient=material('s800:ambient',{color:0xd6dbe9,emissive:0x8fb6e0,emissiveIntensity:.35,roughness:.55});
    for(const side of [-1,1]){
      // Broad, tapered C pillars and a slim belt rail emphasize the long
      // three-box profile without borrowing a production badge or grille.
      mesh(parent,grid(18,4,(u,v)=>{const z=lerp(s.cabin[2]+.16,s.cabin[3]-.055,u),y=f.roofY(z),bottom=f.shoulder(z)+.02;return[side*(f.windowX(z,lerp(.67,1,v))+.003),lerp(bottom,y,lerp(.67,1,v))+.004,z];},side>0),upperPaint);
      const belt=[];for(let i=0;i<=40;i++){const z=lerp(s.door[1]+.04,f.half-.16,i/40);belt.push([side*(f.width(z)*.941),f.shoulder(z)+.013,z]);}tube(parent,chrome,belt,.009,40);
      box(parent,seat,.096,.071,.66,side*.782,.79,1.22,.028);
      box(parent,wood,.037,.099,.62,side*.753,.72,1.22,.016);
      line(parent,ambient,[side*.727,.783,.93],[side*.727,.783,1.5],.005);
      if(!simple){
        box(parent,dark,.31,.186,.026,side*.434,1.06,.149,.019);
        box(parent,ambient,.258,.132,.006,side*.434,1.06,.165,.014);
      }
    }
    box(parent,seat,.28,.255,.90,0,.585,1.20,.055);
    box(parent,wood,.265,.025,.55,0,.723,1.07,.018);
    for(const z of [.96,1.15]){
      const cup=mesh(parent,cache('s800:cup',()=>new THREE.TorusGeometry(.052,.008,6,20)),chrome);cup.rotation.x=Math.PI/2;cup.position.set(0,.742,z);
    }
    box(parent,wood,1.44,.025,.034,0,s.belt-.025,s.cabin[0]+.45,.007);
    line(parent,ambient,[-.70,s.belt+.006,s.cabin[0]+.47],[.70,s.belt+.006,s.cabin[0]+.47],.004);
  }else if(s.style==='utility'){
    // Long roof gutters, pressed side swage, sliding-door track and tailgate
    // crossbar. Only the front doors hinge, as with the established entry rig.
    for(const side of [-1,1]){
      line(parent,paint,[side*.724,s.roof-.012,-1.56],[side*.724,s.roof-.012,1.75],.018);
      const swage=[],track=[];
      for(let i=0;i<=28;i++){const z=lerp(-.34,1.81,i/28),y=Math.max(f.bottom(z)+.013,s.belt-.22);swage.push([side*(f.sideX(z,y)+.005),y,z]);track.push([side*(f.sideX(z,s.belt-.073)+.009),s.belt-.073,z]);}
      tube(parent,paint,swage,.011,28);tube(parent,dark,track,.006,28);
      box(parent,dark,.026,.055,.16,side*(f.width(.04)+.012),s.belt-.167,.04,.015);
      const z=1.69;line(parent,paint,[side*f.windowX(z,0),f.shoulder(z),z],[side*f.windowX(z,1),f.roofY(z),z],.034);
    }
    box(parent,dark,1.15,.037,.22,0,s.base+.09,1.81,.016);
    // A short rear wiper belongs to the upright backlight plane.
    line(parent,dark,[-.03,1.37,f.half-.037],[.32,1.43,f.half-.063],.006);
  }else if(s.style==='pixel'){
    // Broad body-colour rear sail panels frame a black floating roof.
    for(const side of [-1,1]){
      const pts=[];for(let i=0;i<=20;i++){const z=lerp(1.13,1.71,i/20);pts.push([side*f.windowX(z,1),f.roofY(z),z]);}tube(parent,paint,pts,.063,20);
      box(parent,dark,.026,.045,.147,side*(f.width(.99)+.009),1.018,.99,.012);
    }
    box(parent,paint,.77,.045,.175,0,s.roof-.016,1.26,.022);
  }else{
    // Raised touring estate: protective lower cladding, long roof and useful
    // load bars rather than a tall SUV cabin or a replica off-road accessory.
    for(const side of [-1,1]){
      for(const axle of s.axles){const lip=[];for(let i=0;i<=32;i++){const a=Math.PI*i/32,z=axle-Math.cos(a)*(f.archRadius+.02),y=s.wheel+Math.sin(a)*(f.archRadius+.02);lip.push([side*(f.sideX(z,y)+.013),y,z]);}tube(parent,dark,lip,.031,32);}
      const sill=[];for(let i=0;i<=24;i++){const z=lerp(-.92,.93,i/24);sill.push([side*(f.sideX(z,s.base+.065)+.018),s.base+.065,z]);}tube(parent,dark,sill,.051,24);
    }
    for(const z of [-.10,1.30])box(parent,dark,1.38,.038,.075,0,s.roof+.060,z,.014);
    if(!simple){box(parent,dark,1.35,.046,.29,0,s.base+.098,2.02,.016);line(parent,dark,[-.12,1.204,2.237],[.25,1.205,2.237],.006);}
  }
}


// Coastline collection: compact original signatures built from the same cached
// geometry/material vocabulary. No textures, downloaded models or brand logos.
function buildCoastlineLights(parent,s,f,m,simple){
  const {dark,chrome,light,tail,lampGlass}=m,front=-f.half,back=f.half;
  for(const side of [-1,1]){
    const x=side*s.width*.29,y=s.belt-.13;
    if(s.style==='surf'){
      box(parent,dark,.35,.15,.052,x,y,front-.025,.062);
      box(parent,lampGlass,.30,.11,.012,x,y,front-.058,.045);
      // Capsule outline: rounded ends, not the previous hatch's square pixels.
      const points=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;points.push([x+.123*Math.cos(a),y+.035*Math.sin(a),front-.069]);}
      tube(parent,light,points,.009,32);
      box(parent,dark,.30,.135,.043,x,s.belt-.05,back+.019,.055);
      box(parent,tail,.25,.035,.017,x,s.belt-.05,back+.045,.015);
    }else if(s.style==='liner'){
      box(parent,dark,.42,.104,.05,x,y,front-.026,.026);
      for(const dy of [-.026,.026])box(parent,light,.351,.012,.014,x,y+dy,front-.058,.005);
      box(parent,dark,.47,.085,.041,x,s.belt-.02,back+.021,.024);
      for(const dy of [-.018,.018])box(parent,tail,.40,.012,.016,x,s.belt-.02+dy,back+.047,.005);
      if(!simple)for(let i=0;i<3;i++)box(parent,lampGlass,.043,.027,.013,x+(i-1)*.09,y,front-.056,.008);
    }else if(s.style==='ridge'){
      // Separate upper running light and recessed lower projector pods.
      box(parent,dark,.35,.076,.058,x,y+.04,front-.022,.022);
      box(parent,light,.285,.018,.016,x,y+.045,front-.062,.008);
      box(parent,dark,.22,.17,.07,x,y-.17,front-.032,.037);
      box(parent,lampGlass,.16,.112,.014,x,y-.17,front-.075,.032);
      box(parent,light,.113,.053,.012,x,y-.17,front-.088,.022);
      box(parent,dark,.17,.32,.05,side*.75,s.belt-.06,back+.02,.036);
      for(const dy of [-.085,.085])box(parent,tail,.10,.075,.015,side*.75,s.belt-.06+dy,back+.053,.022);
    }else{
      const points=[[side*.40,y+.02,front-.065],[side*.53,y+.042,front-.067],[side*.69,y+.012,front-.046],[side*.75,y-.028,front-.018]];
      tube(parent,dark,points,.033,20);tube(parent,light,points.map(([x,y,z])=>[x,y+.009,z-.024]),.009,20);
      box(parent,dark,.37,.10,.047,x,s.belt-.02,back+.019,.04);
      tube(parent,tail,[[x-.14,s.belt-.025,back+.05],[x,s.belt+.003,back+.053],[x+.14,s.belt-.025,back+.05]],.010,18);
    }
    box(parent,tail,.12,.016,.015,side*.57,s.base+.12,back+.04,.006);
  }
  box(parent,dark,s.style==='ridge'?.82:1.02,s.style==='ridge'?.19:.085,.052,0,s.base+.18,front-.03,.025);
  if(s.style==='ridge')for(const z of [front-.055,back+.045])box(parent,chrome,1.05,.085,.035,0,s.base+.045,z,.018);
}

function buildCoastlineDetails(parent,s,f,m,simple){
  const {paint,upperPaint,dark,chrome,seat}=m;
  if(s.style==='surf'){
    // Painted rear sails frame a dark roof; the body remains short and rounded.
    for(const side of [-1,1]){
      const sail=[];for(let i=0;i<=18;i++){const z=lerp(1.22,1.76,i/18);sail.push([side*f.windowX(z,1),f.roofY(z),z]);}tube(parent,paint,sail,.045,18);
    }
    box(parent,upperPaint,1.18,.04,.18,0,f.roofY(1.31)+.045,1.31,.018);
  }else if(s.style==='liner'){
    // Low horizontal luggage cover behind the rear row, visibly useful load bay.
    box(parent,dark,1.32,.035,.70,0,s.belt-.12,1.83,.018);
    box(parent,paint,1.35,.035,.18,0,f.roofY(1.98)+.04,1.98,.015);
    if(!simple)for(const side of [-1,1])line(parent,chrome,[side*.45,s.base+.10,1.50],[side*.45,s.base+.10,2.25],.008);
  }else if(s.style==='ridge'){
    // Short-body trail SUV: no giant roof box or duplicate Nomad spare assembly.
    for(const side of [-1,1]){
      box(parent,dark,.16,.085,1.15,side*(s.width/2+.012),s.base-.025,.04,.023);
      line(parent,dark,[side*.62,s.roof+.024,-.61],[side*.62,s.roof+.024,1.33],.023);
      for(const z of [-.45,1.18])box(parent,dark,.05,.055,.16,side*.62,s.roof-.005,z,.014);
      box(parent,chrome,.10,.06,.10,side*.49,s.base+.14,-f.half-.07,.017);
    }
    box(parent,dark,1.20,.10,.08,0,s.base+.13,f.half+.035,.022);
    box(parent,upperPaint,.30,.025,.025,0,s.belt-.12,f.half+.044,.008);
  }else{
    // Two-seat coupe with a compact parcel shelf and broad shoulder vents.
    box(parent,paint,1.36,.035,.14,0,s.belt+.065,f.half-.18,.014);
    box(parent,seat,1.10,.045,.44,0,s.belt-.15,.99,.025);
    for(const side of [-1,1]){
      const z=.84,y=s.belt-.13;box(parent,dark,.026,.095,.29,side*(f.width(z)+.008),y,z,.022);
      if(!simple)for(const dy of [-.024,.024])box(parent,chrome,.029,.007,.21,side*(f.width(z)+.024),y+dy,z,.003);
    }
  }
}
