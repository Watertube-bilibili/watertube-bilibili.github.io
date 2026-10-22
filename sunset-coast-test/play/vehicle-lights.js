import * as THREE from './vendor/three.module.js';

// Presentation only. No steering inference, physics writes, timers, extra meshes,
// draw calls, or saved control state. Bounded road illumination lives separately
// in night-lighting.js. Local -X is the driver's left.
export const VEHICLE_LIGHT_LIMITS=Object.freeze({blinkPeriod:.8,blinkOn:.4,tailIdle:.32,brakeGain:2.35,signalIntensity:2.8,brakeThreshold:.025});
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const unit=n=>Math.max(0,Math.min(1,finite(n)));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const controller=v=>v?.vehicleLights;
const lampRole=(m,mesh)=>m?.name==='Semi_Red_Lamp'&&!mesh?.name?.startsWith('Chassis__')?null:m?.userData?.vehicleLampRole??({
 'Vehicle Headlamp':'head','Vehicle Tail Lamp':'brake','Roadster_Headlamp':'head','Roadster_Tail_Light':'brake',
 'Roadster_Side_Marker':'signal','G9 light':'head','G9 tail':'brake','Headlight':'head','Brakelight':'brake','Signallight':'signal','Semi_DRL':'head','Semi_Amber_Lamp':'signal','Semi_Red_Lamp':'brake'
}[m?.name]??null);

// A material gets its own immutable mesh-to-car bind transform, so signal sides
// follow a moving door/chassis without sampling world/interpolated poses per frame.
function bindMatrix(root,mesh){
 const chain=[];for(let n=mesh;n&&n!==root;n=n.parent)chain.push(n);
 const result=new THREE.Matrix4();for(let i=chain.length-1;i>=0;i--){chain[i].updateMatrix();result.multiply(chain[i].matrix);}return result;
}
function extents(mesh,matrix,role){
 const p=mesh.geometry.attributes.position,point=new THREE.Vector3(),ys=[],box=new THREE.Box3();
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(matrix);box.expandByPoint(point);ys.push(point.y);}
 ys.sort((a,b)=>a-b);
 // Keep the lower half of the upper rear signature red while the amber section
 // blinks. Low reflectors cannot steal the central/high stop-lamp channel.
 const upper=ys.filter(y=>y>(box.min.y+box.max.y)*.5);
 let signalY=upper.length?upper[Math.floor(upper.length*.5)]:(box.min.y+box.max.y)*.5;
 // A curved full-width tail signature may peak only at its center. Its global
 // upper median can then exclude both outer turn-signal sections entirely.
 // Only in that case, use the outer sides' own vertical midpoint; keep the
 // existing X mask so the central red stop segment remains untouched.
 if(role!=='brake')return{box,signalY};
 const cutoff=Math.max(Math.abs(box.min.x),Math.abs(box.max.x))*.62,left=[],right=[];
 for(let i=0;i<p.count;i++){
  point.fromBufferAttribute(p,i).applyMatrix4(matrix);
  if(Math.abs(point.x)>=cutoff)(point.x<0?left:right).push(point.y);
 }
 if(left.length&&right.length&&(!left.some(y=>y>=signalY)||!right.some(y=>y>=signalY))){
  const midpoint=values=>(Math.min(...values)+Math.max(...values))*.5;
  signalY=Math.min(signalY,midpoint(left),midpoint(right));
 }
 return{box,signalY};
}
const vertexHeader='uniform mat4 vehicleLampBind;\nvarying vec3 vVehicleLampPosition;\n';
const fragmentHeader=`varying vec3 vVehicleLampPosition;
uniform vec4 vehicleLampControl;
uniform vec4 vehicleLampRegion;
uniform vec3 vehicleSignalColor;
`;
// control = enabled-left, enabled-right, shared blink phase, dedicated signal;
// region = outer X cutoff, rear Y cutoff, front Z cutoff, brake material flag.
const fragmentPatch=`
float vehicleLampSide = vVehicleLampPosition.x < 0.0 ? vehicleLampControl.x : vehicleLampControl.y;
float vehicleLampMask = vehicleLampControl.w > 0.5 ? 1.0 : step(vehicleLampRegion.x, abs(vVehicleLampPosition.x));
if (vehicleLampControl.w < 0.5) {
  if (vehicleLampRegion.w > 0.5) vehicleLampMask *= step(vehicleLampRegion.y, vVehicleLampPosition.y);
  else vehicleLampMask *= step(vVehicleLampPosition.z, vehicleLampRegion.z);
}
if (vehicleLampMask > 0.5 && (vehicleLampSide > 0.5 || vehicleLampControl.w > 0.5)) {
  float vehicleSignalOn = vehicleLampSide * vehicleLampControl.z;
  diffuseColor.rgb = mix(vec3(0.055, 0.018, 0.003), vehicleSignalColor, vehicleSignalOn);
  totalEmissiveRadiance = vehicleSignalColor * vehicleSignalOn * 2.8;
}
`;
function installMaterial(mesh,source,role,root,state){
 const material=source.clone(),matrix=bindMatrix(root,mesh),{box,signalY}=extents(mesh,matrix,role);
 const maxX=Math.max(Math.abs(box.min.x),Math.abs(box.max.x));
 const uniforms={
  vehicleLampBind:{value:matrix},vehicleLampControl:{value:new THREE.Vector4(0,0,0,role==='signal'?1:0)},
  vehicleLampRegion:{value:new THREE.Vector4(maxX*.62,signalY,Math.min(-.5,(box.min.z+box.max.z)*.5+.08),role==='brake'?1:0)},
  vehicleSignalColor:{value:new THREE.Color(0xffa020)}
 };
 material.onBeforeCompile=shader=>{
  // Fail safely on an incompatible shader: retain authored headlamps and
  // ordinary CPU-driven brake emissive, rather than corrupting another surface.
  if(!shader.vertexShader.includes('#include <begin_vertex>')||!shader.fragmentShader.includes('#include <emissivemap_fragment>')){binding.shaderSupported=false;return;}
  binding.shaderSupported=true;
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=vertexHeader+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvVehicleLampPosition = (vehicleLampBind * vec4(position, 1.0)).xyz;');
  shader.fragmentShader=fragmentHeader+shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+fragmentPatch);
 };
 // All models/instances share one patch variant per existing material feature set.
 material.customProgramCacheKey=()=> 'neon-vehicle-lights-v1';
 material.userData={...material.userData,vehicleLampRole:role,vehicleLampOwned:true};
 const binding={mesh,source,material,role,uniforms,bounds:box,baseIntensity:finite(source.emissiveIntensity,1)};
 state.bindings.push(binding);return material;
}

/** Attach once after model creation. Existing geometry and rig nodes are untouched. */
export function attachVehicleLights(v){
 if(!v?.root||controller(v))return v;
 const state={bindings:[],elapsed:0,disposed:false};
 v.lightState={turnSignal:null,hazards:false,blinkOn:false,leftOn:false,rightOn:false,brake:0,brakeSource:null,active:false};
 v.vehicleLights=state;
 v.root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const convert=source=>{const role=lampRole(source,mesh);return role?installMaterial(mesh,source,role,v.root,state):source;};
  if(Array.isArray(mesh.material))mesh.material=mesh.material.map(convert);else mesh.material=convert(mesh.material);
 });
 resetVehicleLights(v);return v;
}

/** Explicit indicator requests only. UI may opt into toggle-on-second-press. */
export function setVehicleTurnSignal(v,direction,{toggle=false}={}){
 if(!v?.root)return false;attachVehicleLights(v);
 if(![null,'left','right'].includes(direction))return false;
 const state=v.lightState,next=toggle&&state.turnSignal===direction?null:direction;
 if(next!==state.turnSignal||state.hazards)controller(v).elapsed=0;
 state.turnSignal=next;state.hazards=false;applyState(v);return true;
}
export function setVehicleHazards(v,enabled){
 if(!v?.root)return false;attachVehicleLights(v);
 const state=v.lightState,next=!!enabled;if(next!==state.hazards)controller(v).elapsed=0;
 state.hazards=next;state.turnSignal=null;applyState(v);return true;
}

/** Read effective actuators, never requestedBrakeAmount or input/pedal wishes. */
export function vehicleBrakeLightDemand(v){
 const manual=v?.brakeFault?.broken?0:unit(Number.isFinite(v?.manualBrakePressure)?v.manualBrakePressure:v?.manualBrakeAmount);
 const electronic=unit(v?.electronicBrakeAmount);
 // A snapshot's combined effective service pressure is authoritative when it
 // exists, unless a broken manual circuit would be its only stale source.
 const combined=unit(v?.brakeAmount),service=Math.max(manual,electronic,v?.brakeFault?.broken?electronic:combined);
 if(service>VEHICLE_LIGHT_LIMITS.brakeThreshold)return{amount:service,source:electronic>=manual&&electronic>VEHICLE_LIGHT_LIMITS.brakeThreshold?'electronic':'service'};
 if(v?.handbrake&&Math.abs(finite(v.speed))>.5)return{amount:1,source:'handbrake'};
 // Coasting, collision impulses and uphill drag must not impersonate service
 // brakes. A future regen actuator must explicitly report its effective effort.
 const deceleration=-Math.sign(finite(v?.speed))*finite(v?.longitudinalAcceleration);
 if(unit(v?.regenerativeBrakeAmount)>.025&&Math.abs(finite(v?.speed))>.5&&deceleration>1.3)return{amount:unit(v.regenerativeBrakeAmount),source:'regenerative'};
 return{amount:0,source:null};
}
function applyState(v){
 const rig=controller(v),s=v.lightState;if(!rig||rig.disposed)return;
 s.blinkOn=(s.hazards||s.turnSignal!==null)&&rig.elapsed%VEHICLE_LIGHT_LIMITS.blinkPeriod<VEHICLE_LIGHT_LIMITS.blinkOn;
 s.leftOn=s.blinkOn&&(s.hazards||s.turnSignal==='left');s.rightOn=s.blinkOn&&(s.hazards||s.turnSignal==='right');
 for(const b of rig.bindings){
  const controls=b.uniforms.vehicleLampControl.value;
  controls.x=s.hazards||s.turnSignal==='left'?1:0;controls.y=s.hazards||s.turnSignal==='right'?1:0;controls.z=s.blinkOn?1:0;
  if(b.role==='brake')b.material.emissiveIntensity=s.active?VEHICLE_LIGHT_LIMITS.tailIdle*(s.night??1)+(s.brake>0?VEHICLE_LIGHT_LIMITS.brakeGain*(.65+.35*s.brake):0):0;
  else if(b.role==='head')b.material.emissiveIntensity=s.active?(.18+(s.night??1)*1.6):0;
  else if(b.role==='signal')b.material.emissiveIntensity=0;
 }
}

/** Call once per rendered car; dt=0 while paused freezes the blink phase. */
export function updateVehicleLights(v,dt=0,options={}){
 if(!v?.root)return null;attachVehicleLights(v);
 const rig=controller(v),s=v.lightState;
 const identity=v.instanceId??null,resetSerial=finite(v.physicsResetSerial);
 if(rig.observedLifecycle&&(rig.identity!==identity||rig.resetSerial!==resetSerial)){
  resetVehicleLights(v);rig.identity=identity;rig.resetSerial=resetSerial;return s;
 }
 rig.observedLifecycle=true;rig.identity=identity;rig.resetSerial=resetSerial;
 const active=own(options,'active')?!!options.active:!v.parked&&!v.populationDormant&&v.root.visible!==false;
 if(!active){resetVehicleLights(v);return s;}
 s.active=true;s.night=own(options,'night')?unit(options.night):(s.night??1);
 rig.elapsed=(rig.elapsed+Math.max(0,finite(dt)))%VEHICLE_LIGHT_LIMITS.blinkPeriod;
 const demand=vehicleBrakeLightDemand(v);s.brake=demand.amount;s.brakeSource=demand.source;applyState(v);return s;
}
/** Ephemeral controls are intentionally absent from all save schemas. */
export function resetVehicleLights(v){
 const rig=controller(v);if(!rig||rig.disposed)return;
 Object.assign(v.lightState,{turnSignal:null,hazards:false,blinkOn:false,leftOn:false,rightOn:false,brake:0,brakeSource:null,active:false});rig.elapsed=0;applyState(v);
}
export function disposeVehicleLights(v){
 const rig=controller(v);if(!rig||rig.disposed)return;
 resetVehicleLights(v);
 for(const binding of rig.bindings){const {mesh,material,source}=binding;
  if(Array.isArray(mesh.material))mesh.material=mesh.material.map(m=>m===material?source:m);else if(mesh.material===material)mesh.material=source;
  material.dispose();
 }
 rig.bindings.length=0;rig.disposed=true;delete v.vehicleLights;delete v.lightState;
}

/** Reuse lamp geometry bounds, not a Roadster-specific guessed position. */
export function vehicleHeadlampAnchors(v){
 attachVehicleLights(v);const rig=controller(v);if(rig.headlampAnchors)return rig.headlampAnchors;
 const box=new THREE.Box3();for(const binding of rig.bindings)if(binding.role==='head')box.union(binding.bounds);
 const length=v.dimensions?.length??(Number.isFinite(v.halfLength)?v.halfLength*2:4.6),width=v.dimensions?.width??(v.halfWidth??1)*2;
 const height=v.dimensions?.height??v.height??1.5;
 const valid=!box.isEmpty(),y=valid?(box.min.y+box.max.y)*.5:Math.min(1.2,height*.48),z=valid?box.min.z:-length*.47;
 const left=valid?Math.min(-.12,box.min.x):-width*.34,right=valid?Math.max(.12,box.max.x):width*.34;
 return rig.headlampAnchors=[new THREE.Vector3(left,y,z),new THREE.Vector3(right,y,z)];
}
