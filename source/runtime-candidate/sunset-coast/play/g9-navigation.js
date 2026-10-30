import * as THREE from './vendor/three.module.js';
import {GRID,WORLD_LIMIT,WORLD_MIN_X,roadSpans,HIGHWAY,MOUNTAIN_ROADS} from './streaming-world.js';
import {navigationGuidance} from './navigation-guidance.js';

const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const activeCars=new WeakMap();
const point=p=>({x:p.x,z:p.z});
// Read-only snapshot. A parked G9 never borrows the active car or taxi's route.
export function g9NavigationState(car,game=null){
 const pos=finite(car.pos)?point(car.pos):{x:0,z:0},yaw=Number.isFinite(car.yaw)?car.yaw:0;
 const active=game?.vehicle===car&&game.inCar&&!game.robotaxi?.active&&!game.flight?.active&&!game.aircraft?.active;
 const nav=active?navigationGuidance(game):{active:false};
 const destination=nav.active&&finite(nav.destination)?{...point(nav.destination),name:String(nav.destination.name??'目的地')}:null;
 const index=Math.max(0,Math.min(game?.routeIndex??0,game?.route?.length??0));
 // Draw the actual remaining route, including its genuine previous waypoint.
 // Never join an off-road car to a waypoint with an invented drivable segment.
 const route=destination&&game.route?.length?[index?game.route[index-1]:game.navigationOrigin,...game.route.slice(index)].filter(finite).map(point):[];
 const available=route.length>1;
 const offRoute=!!(destination&&game.navigationRecalculating);
 return{pos,yaw,heading:Math.round(((-yaw*180/Math.PI)%360+360)%360)%360,
  speed:Math.round(Math.abs(Number.isFinite(car.speed)?car.speed:0)*3.6),destination,route,
  instruction:destination?available?nav.instruction:'路线暂不可用':'尚未设置目的地',
  turnText:destination&&available?nav.turnText:'—',remainingText:destination&&available?nav.remainingText:'—',
  maneuver:destination&&available?nav.maneuver:'none',offRoute,available,
  color:offRoute?'#efbd7d':'#bdeca0'};
}

// Same deterministic road atlas and exclusions used to draw/build the game world.
export function g9NearbyRoads(pos,radius=390){
 const b={left:pos.x-radius,right:pos.x+radius,top:pos.z-radius,bottom:pos.z+radius},roads=[];
 const add=(a,z,kind='road')=>{if(Math.max(a.x,z.x)<b.left||Math.min(a.x,z.x)>b.right||Math.max(a.z,z.z)<b.top||Math.min(a.z,z.z)>b.bottom)return;roads.push({a,b:z,kind});};
 for(let x=Math.max(-240,Math.ceil(b.left/GRID)*GRID);x<=Math.min(WORLD_LIMIT,b.right);x+=GRID)
  for(const [a,z]of roadSpans([[Math.max(-WORLD_LIMIT,b.top),Math.min(WORLD_LIMIT,b.bottom)]],x,true))add({x,z:a},{x,z});
 for(let z=Math.ceil(Math.max(-WORLD_LIMIT,b.top)/GRID)*GRID;z<=Math.min(WORLD_LIMIT,b.bottom);z+=GRID)
  for(const [a,x]of roadSpans([[Math.max(WORLD_MIN_X,b.left),Math.min(WORLD_LIMIT,b.right)]],z,false))add({x:a,z},{x,z});
 for(const {a,b:to}of MOUNTAIN_ROADS)add(a,to,'mountain');
 add({x:-262,z:-WORLD_LIMIT},{x:-262,z:WORLD_LIMIT});
 add({x:HIGHWAY.x,z:HIGHWAY.zMin},{x:HIGHWAY.x,z:HIGHWAY.zMax},'highway');
 for(const z of HIGHWAY.exits)add({x:HIGHWAY.x-HIGHWAY.approachLength,z},{x:HIGHWAY.x+HIGHWAY.approachLength,z},'highway');
 return roads;
}
const label=(ctx,t,x,y,size,color='#ecf3eb')=>{ctx.fillStyle=color;ctx.font=`500 ${size}px sans-serif`;ctx.fillText(t,x,y);};
export function paintG9Navigation(ctx,s){
 ctx.clearRect(0,0,768,320);ctx.fillStyle='#101d23';ctx.fillRect(0,0,768,320);ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineCap='round';
 // North-up map: world coordinates translate as the actual car moves; only the
 // heading marker rotates. Explicit scale/compass remove orientation ambiguity.
 const left=290,width=478,cx=left+width/2,cy=150,scale=.73;
 const px=x=>cx+(x-s.pos.x)*scale,pz=z=>cy+(z-s.pos.z)*scale;
 ctx.save();ctx.beginPath();ctx.rect(left,0,width,280);ctx.clip();
 ctx.fillStyle='#193138';ctx.fillRect(left,0,width,280);
 ctx.fillStyle='#244b59';ctx.fillRect(left,0,Math.max(0,px(-306)-left),280);
 for(const r of g9NearbyRoads(s.pos)){
  ctx.strokeStyle=r.kind==='highway'?'#827953':r.kind==='mountain'?'#5c7863':'#385058';ctx.lineWidth=(r.kind==='highway'?30:20)*scale;
  ctx.beginPath();ctx.moveTo(px(r.a.x),pz(r.a.z));ctx.lineTo(px(r.b.x),pz(r.b.z));ctx.stroke();
 }
 if(s.available){ctx.beginPath();s.route.forEach((p,i)=>i?ctx.lineTo(px(p.x),pz(p.z)):ctx.moveTo(px(p.x),pz(p.z)));ctx.strokeStyle='#0c2229';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle=s.color;ctx.lineWidth=5;ctx.setLineDash(s.offRoute?[8,7]:[]);ctx.stroke();ctx.setLineDash([]);}
 if(s.destination){const x=px(s.destination.x),y=pz(s.destination.z);if(x>=left+10&&x<758&&y>=10&&y<270){ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#14252a';ctx.lineWidth=3;ctx.stroke();}}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-s.yaw);ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-10,11);ctx.lineTo(0,6);ctx.lineTo(10,11);ctx.closePath();ctx.fillStyle='#f4fff5';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#377b89';ctx.stroke();ctx.restore();ctx.restore();
 label(ctx,'N ↑',722,24,18,'#c4d7d0');ctx.strokeStyle='#c4d7d0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(681,254);ctx.lineTo(754,254);ctx.stroke();label(ctx,'100 m',692,238,15,'#c4d7d0');
 label(ctx,'G9  /  实时导航',22,27,19,'#a3bdb4');
 // Vector maneuver symbols stay readable even where a font lacks arrow glyphs.
 ctx.save();ctx.translate(44,89);ctx.strokeStyle=s.color;ctx.lineWidth=4;ctx.beginPath();
 if(s.maneuver==='left'||s.maneuver==='right'){
  const d=s.maneuver==='left'?-1:1;ctx.moveTo(-d*10,19);ctx.lineTo(-d*10,-9);ctx.lineTo(d*15,-9);ctx.moveTo(d*6,-18);ctx.lineTo(d*15,-9);ctx.lineTo(d*6,0);
 }else if(s.maneuver==='straight'){
  ctx.moveTo(0,20);ctx.lineTo(0,-20);ctx.moveTo(-10,-10);ctx.lineTo(0,-20);ctx.lineTo(10,-10);
 }else if(s.maneuver==='uturn'){
  ctx.moveTo(12,20);ctx.lineTo(12,-7);ctx.bezierCurveTo(12,-25,-12,-25,-12,-7);ctx.lineTo(-12,10);ctx.moveTo(-20,2);ctx.lineTo(-12,10);ctx.lineTo(-4,2);
 }else if(s.maneuver==='arrive'){
  ctx.moveTo(-10,20);ctx.lineTo(-10,-20);ctx.lineTo(14,-20);ctx.lineTo(8,-10);ctx.lineTo(14,0);ctx.lineTo(-10,0);
 }else{ctx.arc(0,0,15,.35,Math.PI*1.9);ctx.moveTo(15,-15);ctx.lineTo(15,-4);ctx.lineTo(4,-4);}
 ctx.stroke();ctx.restore();label(ctx,s.turnText,85,89,36,s.color);
 label(ctx,s.instruction,22,139,22);
 // Fit long place names without allowing them to collide with the map.
 ctx.save();ctx.beginPath();ctx.rect(22,160,248,64);ctx.clip();label(ctx,s.destination?.name??'在手机或地图中选择地点',22,179,18,'#b8cac3');label(ctx,s.destination?'剩余 '+s.remainingText:'显示当前车辆位置与路网',22,210,17,'#91aba4');ctx.restore();
 label(ctx,s.speed+' km/h',22,254,21);label(ctx,'航向 '+s.heading+'°',155,254,16,'#91aba4');
 ctx.fillStyle='#0a171d';ctx.fillRect(0,280,768,40);label(ctx,'只读车载屏 · 使用手机 / 地图设置或取消目的地',22,300,17,'#b4c9c0');
}

export function attachG9Navigation(car){
 if(car?.infotainmentProfile!=='xiangjie-g9'||!car.infotainmentSurfaces?.center?.isMesh)return null;
 if(car.g9Navigation)return car.g9Navigation;
 if(typeof document==='undefined')return null;
 let texture,material;
 try{
  const low=car.root?.userData.detail==='simple',canvas=document.createElement('canvas');canvas.width=low?384:768;canvas.height=low?160:320;
  const context=canvas.getContext('2d');if(!context)return null;context.scale(low?.5:1,low?.5:1);
  texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.name='G9 per-car live navigation';
  material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});
  const surface=car.infotainmentSurfaces.center;
  car.g9Navigation={canvas,context,texture,material,surface,originalMaterial:surface.material,lastUpdate:-Infinity,signature:'',interval:low?.4:.2,uploads:0};surface.material=material;
  updateG9Navigation(car,0);return car.g9Navigation;
 }catch{texture?.dispose();material?.dispose();return null;}
}
export function updateG9Navigation(car,time=0,game=null){
 if(game){const previous=activeCars.get(game);if(previous&&previous!==car&&previous.g9Navigation){previous.g9Navigation.lastUpdate=-Infinity;updateG9Navigation(previous,time,null);}activeCars.set(game,car);}
 const panel=car?.g9Navigation??attachG9Navigation(car);if(!panel)return false;
 if(time>=panel.lastUpdate&&time-panel.lastUpdate<panel.interval)return false;
 panel.lastUpdate=time;
 const s=g9NavigationState(car,game);
 const signature=JSON.stringify({...s,pos:{x:Math.round(s.pos.x*2)/2,z:Math.round(s.pos.z*2)/2},yaw:Math.round(s.yaw*100)/100});
 if(signature===panel.signature)return false;
 paintG9Navigation(panel.context,s);panel.state=s;panel.signature=signature;panel.texture.needsUpdate=true;panel.uploads++;return true;
}
export function disposeG9Navigation(car){
 const p=car?.g9Navigation;if(!p)return;
 if(p.surface.material===p.material)p.surface.material=p.originalMaterial;
 p.texture.dispose();p.material.dispose();delete car.g9Navigation;
}
