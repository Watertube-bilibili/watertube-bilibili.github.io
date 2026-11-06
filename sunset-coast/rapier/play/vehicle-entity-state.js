import {disposeLightTrainer,updateAircraftDamage} from './flyable-aircraft.js';

// Entity identity and membership are shared by simulation, garage recall and saves.
// Rendering visibility never hides the player car.
export {nextVehicleInstanceId} from './vehicle-identity.js';
export function activeVehicles(game){
 return [...new Set([game.vehicle,...(game.traffic??[]),...(game.police??[]),game.personalVehicle,game.robotaxi?.taxi,game.aircraft?.aircraft].filter(v=>v&&!(game.flight?.active&&v===game.vehicle)&&!v.populationDormant&&(v===game.vehicle||v===game.personalVehicle||v.isRobotaxi||v.root?.visible!==false)))];
}
export function captureCollisionOrigins(vehicles){for(const v of vehicles)v.collisionPrevious={x:v.pos.x,z:v.pos.z,yaw:v.yaw};}
const scalar=value=>value===null||['number','string','boolean','undefined'].includes(typeof value);
const dataFields=['brakeFault','axleFault','damageRegions','collisionPrevious','roadsterAir','roadsterControl','roadsterManeuver','roadsterState','roadsterRequest','roadsterTires','lightState'];
const arrayFields=['wheelCompressions','wheelVisualCompressions'];
const vectorFields=['linear','angular'];
const aircraftSurfaces=['propeller','aileronLeft','aileronRight','flapLeft','flapRight','elevator','rudder'];
function restoreProperties(target,saved,keys){for(const key of keys)if(Object.hasOwn(saved,key))target[key]=saved[key];else delete target[key];}
/** Checkpoint authoritative entities, preserving mesh/factory identity. GPU resources
 * and physics bodies belong to their adapters and are never cloned here. */
export function checkpointVehicles(vehicles){
 const saved=[...new Set(vehicles)].map(v=>{
  const values=Object.fromEntries(Object.entries(v).filter(([,value])=>scalar(value)));
  const data={};for(const key of dataFields)if(Object.hasOwn(v,key))data[key]=structuredClone(v[key]);
  const arrays={};for(const key of arrayFields)if(v[key])arrays[key]=v[key].slice();
  const vectors={};for(const key of vectorFields)if(Object.hasOwn(v,key))vectors[key]={value:v[key],copy:v[key]?.clone?.()??structuredClone(v[key])};
  const surfaces=v.kind==='aircraft'?aircraftSurfaces.flatMap(key=>v[key]?[{object:v[key],quaternion:v[key].quaternion.clone()}]:[]):v.kind==='motorcycle'?['steering','kickstand'].flatMap(key=>v.motorcycleRig?.[key]?[{object:v.motorcycleRig[key],quaternion:v.motorcycleRig[key].quaternion.clone()}]:[]):[];
  return {v,values,data,arrays,vectors,surfaces,pos:v.pos.clone(),rootPosition:v.root.position.clone(),rootQuaternion:v.root.quaternion.clone(),q:v.physicsQuaternion?.clone(),previous:v.previousRenderPose?{...v.previousRenderPose,position:v.previousRenderPose.position.clone(),quaternion:v.previousRenderPose.quaternion?.clone(),wheels:v.previousRenderPose.wheels?.map(w=>({...w}))}:undefined,wheels:(v.wheels??[]).map(w=>({w,spinAngle:w.spinAngle,p:w.pivot.position.clone(),q:w.pivot.quaternion.clone(),sq:w.spin.quaternion.clone()}))};
 });
 return()=>{for(const {v,values,data,arrays,vectors,surfaces,pos,rootPosition,rootQuaternion,q,previous,wheels} of saved){
  for(const [key,value]of Object.entries(v))if(scalar(value)&&!Object.hasOwn(values,key))delete v[key];
  Object.assign(v,values);restoreProperties(v,structuredClone(data),dataFields);restoreProperties(v,arrays,arrayFields);
  v.pos.copy(pos);v.root.position.copy(rootPosition);v.root.quaternion.copy(rootQuaternion);
  for(const key of vectorFields){const saved=vectors[key];if(!saved){delete v[key];continue;}if(saved.value?.copy){saved.value.copy(saved.copy);v[key]=saved.value;}else v[key]=structuredClone(saved.copy);}
  if(q){v.physicsQuaternion??=q.clone();v.physicsQuaternion.copy(q);}else delete v.physicsQuaternion;
  if(previous)v.previousRenderPose=previous;else delete v.previousRenderPose;
  for(const x of wheels){x.w.spinAngle=x.spinAngle;x.w.pivot.position.copy(x.p);x.w.pivot.quaternion.copy(x.q);x.w.spin.quaternion.copy(x.sq);}
  for(const surface of surfaces)surface.object.quaternion.copy(surface.quaternion);
  if(v.kind==='aircraft'&&v.damageParts)updateAircraftDamage(v);
 }};
}
const gameData=['owned','transactions','vehicleStates','worldVehicleStates','vehicleFaults','roadsterAirLedger','job','destination','route','blockedRoads','deliveryNavigation','policeStats'];
const gameValues=['time','clockMinutes','money','health','armor','wanted','heat','jobsCompleted','lastSave','inCar','playerYaw','autopilot','routeIndex','vehicleSerial','ammo','god','policeSerial','policeDispatchAt','policePlanAt','arrestTimer'];
const vehicleReferences=['vehicle','personalVehicle','nearestCar'];
function checkpointMembership(game){
 const references={},lists={};
 for(const key of vehicleReferences)if(Object.hasOwn(game,key))references[key]=game[key];
 for(const key of ['traffic','police'])if(Object.hasOwn(game,key))lists[key]={array:game[key],members:game[key]?.slice()};
 const services=[['robotaxi','taxi'],['aircraft','aircraft']].flatMap(([owner,key])=>game[owner]?[{owner:game[owner],key,exists:Object.hasOwn(game[owner],key),value:game[owner][key]}]:[]);
 const members=()=>[...new Set([...(game.allVehicles?.()??[]),...vehicleReferences.map(key=>game[key]),...(game.traffic??[]),...(game.police??[]),...services.map(s=>s.owner[s.key]),game.aircraft?.personalVehicle,game.aircraft?.entryContext?.vehicle].filter(v=>v?.root&&v?.pos))];
 const original=members(),known=new Set(original),roots=original.map(v=>({root:v.root,parent:v.root.parent,visible:v.root.visible}));
 return {vehicles:original,restore(){
  // Newly issued entities own resources too. Remove them through the normal
  // host cleanup after the transaction has closed, before restoring its ledgers.
  for(const v of members())if(!known.has(v)){if(v.kind==='aircraft')disposeLightTrainer(v);else if(typeof game.removeVehicle==='function')game.removeVehicle(v,{capture:false});else v.root.removeFromParent();}
  restoreProperties(game,references,vehicleReferences);
  for(const key of ['traffic','police']){const saved=lists[key];if(!saved){delete game[key];continue;}if(Array.isArray(saved.array))saved.array.splice(0,saved.array.length,...saved.members);game[key]=saved.array;}
  for(const s of services)if(s.exists)s.owner[s.key]=s.value;else delete s.owner[s.key];
  for(const {root,parent,visible} of roots){if(root.parent!==parent){root.removeFromParent();parent?.add(root);}root.visible=visible;}
  // The spatial index may contain an entity created or removed in this step.
  game._trafficSpatialIndex=null;
 }};
}
function checkpointAircraftService(service){
 if(!service)return()=>{};
 const valueKeys=['phase','pendingBoard','notice','elapsed','_disposed'],dataKeys=['controls','savedState','_commands'],values={},data={};
 for(const key of valueKeys)if(Object.hasOwn(service,key))values[key]=service[key];
 for(const key of dataKeys)if(Object.hasOwn(service,key))data[key]=structuredClone(service[key]);
 const personalVehicle=service.personalVehicle,context=service.entryContext,entry=context?{...context,playerPosition:context.playerPosition?.clone?.()??context.playerPosition}:context,reset=service.awaitResetPose?.clone?.(),hadReset=Object.hasOwn(service,'awaitResetPose'),contacts=service.contacts,contactData=contacts?structuredClone([...contacts]):null;
 return()=>{
  restoreProperties(service,values,valueKeys);restoreProperties(service,structuredClone(data),dataKeys);service.personalVehicle=personalVehicle;service.entryContext=entry;
  if(hadReset)service.awaitResetPose=reset??null;else delete service.awaitResetPose;
  if(contacts){contacts.clear();for(const [key,value]of contactData)contacts.set(key,value);service.contacts=contacts;}
 };
}
export function checkpointGameState(game){
 const membership=checkpointMembership(game),vehicles=checkpointVehicles(membership.vehicles),aircraft=checkpointAircraftService(game.aircraft),values={},data={};
 for(const key of gameValues)if(Object.hasOwn(game,key))values[key]=game[key];
 for(const key of gameData)if(Object.hasOwn(game,key))data[key]=structuredClone(game[key]);
 const player=game.playerPos?.clone(),person=game.person?.root,personState=person?{position:person.position.clone(),quaternion:person.quaternion.clone(),visible:person.visible}:null;
 const restore=()=>{membership.restore();vehicles();aircraft();restoreProperties(game,values,gameValues);restoreProperties(game,data,gameData);if(player)game.playerPos.copy(player);if(person){person.position.copy(personState.position);person.quaternion.copy(personState.quaternion);person.visible=personState.visible;}};
 const retained=new Set(membership.vehicles);restore.retainsVehicle=v=>retained.has(v);return restore;
}
