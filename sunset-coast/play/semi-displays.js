import * as THREE from './vendor/three.module.js';
export const SEMI_DISPLAY_SPECS=Object.freeze(['Left','Right'].map(side=>Object.freeze({type:side.toLowerCase(),name:side+'_Display_Surface',width:1200,height:760})));
const number=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
export function semiDisplayState(car,{autopilot=null,job=null,cargoStatus=null}={}){
 const speed=number(car?.speed),battery=number(car?.battery),cargoKg=number(cargoStatus?.massKg),cargo=cargoKg!==null?cargoKg/1000:number(car?.cargo?.tonnes),limit=number(car?.cargo?.ratedTonnes);
 return {connected:!!car,speed:speed===null?null:Math.round(Math.abs(speed)*3.6),battery:battery===null?null:Math.max(0,Math.min(100,battery)),gear:car?.gear??null,cargo,overloaded:cargoStatus?.overloaded??(cargo!==null&&limit!==null&&cargo>limit),coupled:car?.trailer?true:car?.trailer===null?false:null,autopilot:typeof autopilot==='boolean'?autopilot:null,destination:cargoStatus?.destination??job?.destination??null,distance:number(job?.distanceKm),jobStatus:cargoStatus?.phase??job?.status??null,cargoLabel:cargoStatus?.cargoLabel??null,integrity:number(cargoStatus?.integrity),reward:number(cargoStatus?.reward),abstractCargo:!!cargoStatus,warning:car?.warning??''};
}
const shown=(v,suffix='',digits=0)=>v===null||v===undefined?'--':typeof v==='number'?v.toFixed(digits)+suffix:String(v)+suffix;
export function paintSemiDisplay(ctx,type,s){
 const W=1200,H=760;ctx.clearRect(0,0,W,H);ctx.fillStyle='#0b1016';ctx.fillRect(0,0,W,H);
 const text=(value,x,y,size=25,color='#e9f0f7')=>{ctx.fillStyle=color;ctx.font=`500 ${size}px Arial, sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(String(value),x,y);};
 const line=y=>{ctx.fillStyle='#32404c';ctx.fillRect(30,y,1140,2);};
 text('SEMI',36,37,28);text('SUNSET COAST / 2.0 Beta',856,37,20,'#91a5b8');line(74);
 if(!s.connected)text('TELEMETRY NOT CONNECTED',36,115,25,'#d3ac72');
 if(type==='left'){
  text(shown(s.speed),36,218,108);text('km/h',40,294,24,'#91a5b8');text(shown(s.gear),338,219,66);
  text('BATTERY',610,156,22,'#91a5b8');text(shown(s.battery,'%'),610,222,50,'#bfe3ce');
  text(s.abstractCargo?'CARGO JOB':'TRACTOR / TRAILER',38,380,21,'#91a5b8');text(s.abstractCargo?(s.cargoLabel??'No cargo'):s.coupled===null?'Coupling unknown':s.coupled?'Trailer coupled':'No trailer',38,432,32);
  text('PAYLOAD',610,380,21,'#91a5b8');text(shown(s.cargo,' t',1),610,432,40);
  text('CARGO INTEGRITY',610,504,20,'#91a5b8');text(shown(s.integrity,'%'),610,550,34);text(s.overloaded?'OVERLOAD: LONGER BRAKING DISTANCE':s.warning||'VEHICLE STATUS',38,610,25,s.overloaded?'#e2ac65':'#91a5b8');
 }else{
  text('DISPATCH / ROUTE',38,145,23,'#91a5b8');text(s.destination??'No destination',38,207,38);
  text('DISTANCE',38,314,21,'#91a5b8');text(shown(s.distance,' km',1),38,369,39);
  text('DELIVERY',610,314,21,'#91a5b8');text(s.jobStatus??'No active job',610,369,30);
  text('DRIVING ASSIST',38,480,21,'#91a5b8');text(s.autopilot===null?'--':s.autopilot?'ACTIVE':'MANUAL',38,535,34,'#75b9ef');
  text('Cargo, route and assist state are unique to this tractor.',38,607,21,'#91a5b8');
 }
 line(685);text('VEHICLE          NAVIGATION          CARGO          CLIMATE',38,724,23,'#91a5b8');
}
export function attachSemiDisplays(car,makeCanvas=()=>document.createElement('canvas')){
 const displays=SEMI_DISPLAY_SPECS.map(spec=>{const surface=car.root.getObjectByName(spec.name);if(!surface)throw Error('Semi screen missing '+spec.name);const canvas=makeCanvas();canvas.width=spec.width;canvas.height=spec.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D screen canvas unavailable');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;const previous=surface.material;const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});surface.material=material;return{surface,canvas,ctx,texture,material,previous,spec};});
 let elapsed=.1;
 return{update(delta,state){elapsed+=Number.isFinite(delta)?Math.max(0,delta):0;if(elapsed<.1)return;elapsed=0;for(const d of displays){paintSemiDisplay(d.ctx,d.spec.type,state);d.texture.needsUpdate=true;}},dispose(){for(const d of displays){if(d.surface.material===d.material)d.surface.material=d.previous;d.texture.dispose();d.material.dispose();}}};
}
