import {attachSemiDisplays,semiDisplayState} from './semi-displays.js';
import {updateVehicleInfotainment,disposeVehicleInfotainment} from './vehicle-infotainment.js';
import {attachG9Navigation,updateG9Navigation,disposeG9Navigation} from './g9-navigation.js';
import {attachRoadsterDisplays,updateRoadsterDisplays,disposeRoadsterDisplays} from './roadster-displays.js';
import * as THREE from './vendor/three.module.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const vec=new THREE.Vector3();

// A real surface in the cabin. Its texture and material belong to this car;
// changing the player's readings never changes a traffic car or showroom copy.
export function attachVehicleInstruments(car) {
  if (!car?.root || !car.chassis) return null;
  if (car.instruments) return car.instruments;
  if(car.model?.id==='semi'){const display=attachSemiDisplays(car);car.instruments={kind:'semi',display,lastUpdate:0};display.update(.1,semiDisplayState(car));return car.instruments;}
  attachG9Navigation(car);
  const roadster=attachRoadsterDisplays(car);if(roadster)return roadster;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=384;
  const context=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=false;
  const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});
  let surface=car.instrumentMesh;
  if (!surface && car.model?.id==='vision') surface=car.root.getObjectByName('InteriorSteeringDash');
  let group=null, originalMaterial=null;
  if (surface?.isMesh) {
    // Keep the GLB's real trapezoid instrument surface and its original UVs.
    texture.flipY=false;
    originalMaterial=surface.material;surface.material=material;
  } else {
    const width=car.instrumentSize?.[0]??.38,height=car.instrumentSize?.[1]??.16;
    group=new THREE.Group();group.name='live-instrument-cluster';
    if(car.instrumentPosition)group.position.copy(car.instrumentPosition);
    else if(car.steeringWheel){
      car.root.updateWorldMatrix(true,true);
      car.steeringWheel.getWorldPosition(vec);car.chassis.worldToLocal(vec);
      group.position.copy(vec).add(new THREE.Vector3(0,.07,-.14));
    }else group.position.set(-.4,1,-.8);
    group.rotation.x=car.instrumentTilt??-.14;
    const housing=new THREE.Mesh(new THREE.BoxGeometry(width+.024,height+.024,.026),
      new THREE.MeshStandardMaterial({color:0x111c24,metalness:.45,roughness:.3}));
    surface=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
    surface.position.z=.0135;group.add(housing,surface);car.chassis.add(group);
    group.traverse(o=>{if(o.isMesh)o.userData.semantic=3;});
  }
  surface.userData.semantic=3;
  car.instruments={canvas,context,texture,material,surface,group,originalMaterial,
    lastUpdate:-Infinity,signature:'',state:null};
  updateVehicleInstruments(car,0);
  return car.instruments;
}

export function updateVehicleInstruments(car,time=0,{autopilot=false,game=null}={}) {
  if(car?.model?.id==='semi'){const panel=car.instruments??attachVehicleInstruments(car);const active=game?.vehicle===car;panel.display.update(Math.max(0,time-panel.lastUpdate),semiDisplayState(car,{autopilot:active&&autopilot,cargoStatus:active?game?.cargoStatus:null}));panel.lastUpdate=time;return;}
  updateG9Navigation(car,time,game);
  updateVehicleInfotainment(car,time,game);
  const panel=car?.instruments??attachVehicleInstruments(car);if(!panel)return;
  if(panel.kind==='roadster'){updateRoadsterDisplays(car,time,{autopilot});return;}
  if(time>=panel.lastUpdate && time-panel.lastUpdate<.05)return;
  const signedSpeed=Number.isFinite(car.speed)?car.speed:0;
  const speed=Math.round(Math.abs(signedSpeed)*3.6),gear=Math.abs(signedSpeed)<.15?'P':signedSpeed<0?'R':'D';
  const charge=Math.round(clamp(Number.isFinite(car.battery)?car.battery:100,0,100));
  const range=Math.round((car.model?.range??420)*charge/100);
  const state={speed,gear,charge,range,autopilot:!!autopilot};
  const signature=Object.values(state).join('|');panel.lastUpdate=time;
  if(signature===panel.signature)return;
  panel.signature=signature;panel.state=state;
  paint(panel.context,state,car.model?.brand??car.model?.name?.split(' ')[0]??'SUNSET COAST');
  panel.texture.needsUpdate=true;
}

function paint(ctx,s,brand) {
  const W=1024,H=384;ctx.clearRect(0,0,W,H);ctx.fillStyle='#061016';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#203642';ctx.lineWidth=3;ctx.strokeRect(20,20,W-40,H-40);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#a0b6c1';ctx.font='500 26px sans-serif';ctx.fillText(brand.toUpperCase(),W/2,51);
  ctx.fillStyle='#f5fafb';ctx.font='500 172px sans-serif';ctx.fillText(String(s.speed),W/2,168);
  ctx.fillStyle='#99adb9';ctx.font='400 29px sans-serif';ctx.fillText('km/h',W/2,266);
  ctx.fillStyle=s.gear==='R'?'#ffc48c':'#dbe9ef';ctx.font='500 69px sans-serif';ctx.fillText(s.gear,153,167);
  ctx.fillStyle='#8099a8';ctx.font='400 22px sans-serif';ctx.fillText('GEAR',153,236);
  const c=s.charge<15?'#ffb078':'#a8e4d1';ctx.fillStyle=c;ctx.font='500 48px sans-serif';ctx.fillText(s.charge+'%',868,171);
  ctx.strokeStyle=c;ctx.lineWidth=3;ctx.strokeRect(825,99,78,27);ctx.fillRect(904,107,5,11);
  ctx.fillRect(831,105,66*s.charge/100,15);ctx.fillStyle='#8099a8';ctx.font='400 22px sans-serif';ctx.fillText('BATTERY',868,236);
  ctx.fillStyle='#263a45';ctx.fillRect(71,298,882,5);
  ctx.fillStyle=s.autopilot?'#66c8ff':'#a9e3cc';ctx.fillRect(71,298,882*clamp(s.speed/240,0,1),5);
  ctx.textAlign='left';ctx.fillStyle='#a4b8c4';ctx.font='400 25px sans-serif';ctx.fillText(s.range+' km',71,334);
  ctx.textAlign='right';ctx.fillStyle=s.autopilot?'#75d0ff':'#99adba';ctx.font='500 25px sans-serif';ctx.fillText(s.autopilot?'PILOT ACTIVE':'MANUAL',953,334);
}

// Only call when the car is removed permanently, not when it becomes traffic.
export function disposeVehicleInstruments(car) {
  disposeG9Navigation(car);
  disposeVehicleInfotainment(car);
  setVehicleInteriorView(car,false);
  if(car?.cabinGlass){for(const material of car.cabinGlass.clones.values())material.dispose();delete car.cabinGlass;}
  const panel=car?.instruments;if(!panel)return;
  if(panel.kind==='semi'){panel.display.dispose();delete car.instruments;return;}
  if(disposeRoadsterDisplays(car))return;
  if(panel.originalMaterial)panel.surface.material=panel.originalMaterial;
  if(panel.group){panel.group.removeFromParent();panel.group.traverse(o=>{
    if(o.isMesh){o.geometry.dispose();if(o.material!==panel.material)o.material.dispose();}
  });}
  panel.texture.dispose();panel.material.dispose();delete car.instruments;
}

// External tint remains unchanged. From the driving seat, a lightly tinted
// inner surface keeps the road visible instead of rendering opaque blue glass.
export function setVehicleInteriorView(car,enabled) {
  if(!car?.root || car.interiorView===!!enabled)return;
  car.interiorView=!!enabled;
  if(!enabled){
    for(const [mesh,original] of car.cabinGlass?.meshes??[])mesh.material=original;
    return;
  }
  if(!car.cabinGlass){
    const clones=new Map(),meshes=[];
    const clearer=original=>{
      if(!((original.transmission??0)>.1 || (original.transparent && original.opacity<1 && original.metalness<=.2)))return original;
      if(!clones.has(original)){
        const m=original.clone();m.name='neon-clear-cabin-glass';m.color.setHex(0xc0d7de);
        m.opacity=.055;m.transparent=true;m.depthWrite=false;m.metalness=0;m.roughness=.08;
        if('transmission' in m)m.transmission=0;
        if('clearcoat' in m)m.clearcoat=.08;
        m.envMapIntensity=.3;clones.set(original,m);
      }
      return clones.get(original);
    };
    car.root.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const original=mesh.material;
      const converted=Array.isArray(original)?original.map(clearer):clearer(original);
      if(Array.isArray(original)?converted.some((m,i)=>m!==original[i]):converted!==original)meshes.push([mesh,original,converted]);
    });
    car.cabinGlass={clones,meshes};
  }
  for(const [mesh,,converted] of car.cabinGlass.meshes)mesh.material=converted;
}
