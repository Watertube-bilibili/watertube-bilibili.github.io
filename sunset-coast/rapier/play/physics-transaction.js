import {checkpointGameState} from './vehicle-entity-state.js';

// One fixed step owns all save requests until motion, contacts, damage and career
// updates succeed. Stores stage revisions in memory and publish one durable write.
export function createPhysicsTransactions(game){
 const participants=new Set();let current=null,failure=null;
 const allowed=()=>!failure&&!game.physics?.failed&&!game.browserWorldLifecycle?.stopped;
 const register=participant=>{if(current)throw Error('Cannot register a store during a physics step');participants.add(participant);return()=>participants.delete(participant);};
 const begin=()=>{
  if(current)throw Error('Nested physics transaction');if(!allowed())throw Error('Physics writes are blocked');
  current={restore:checkpointGameState(game),saves:new Map(),disposals:new Map(),flushing:false};
  try{for(const participant of participants)participant.begin();}catch(error){rollback(error);throw error;}
 };
 const requestSave=(writer,args=[])=>{
  if(!allowed())return false;
  if(current&&!current.flushing){const previous=current.saves.get(writer);current.saves.set(writer,previous?.[0]===true?[true,...args.slice(1)]:args);return true;}
  return Reflect.apply(writer,game,args);
 };
 // Removing membership/meshes is reversible; freeing an existing entity's
 // factory, damage or GPU resources must wait for the successful step.
 const deferVehicleDisposal=(vehicle,dispose)=>{if(!current||!current.restore.retainsVehicle(vehicle))return false;current.disposals.set(vehicle,dispose);return true;};
 function rollback(error=null){
  const pending=current;current=null;
  for(const participant of participants)participant.rollback();
  pending?.restore();
  if(error){failure=error;game.paused=true;}
  return false;
 }
 const commit=()=>{
  if(!current)throw Error('No physics transaction');
  if(!allowed())return rollback(game.physics?.error??Error('Physics lifecycle stopped before commit'));
  current.flushing=true;
  try{
   for(const [writer,args] of current.saves)if(Reflect.apply(writer,game,args)===false)throw Error('Queued save could not commit');
   for(const participant of participants)if(participant.commit()===false)throw Error('Physics save revision conflict');
   const disposals=current.disposals;current=null;
   // A cleanup failure cannot turn an already durable commit into a rollback.
   for(const dispose of disposals.values())try{dispose();}catch(error){console.error('Committed vehicle cleanup failed',error);}
   return true;
  }catch(error){rollback(error);throw error;}
 };
 return {begin,commit,rollback,register,requestSave,deferVehicleDisposal,get active(){return !!current;},get failed(){return !!failure;},get error(){return failure;},canWrite:allowed};
}
