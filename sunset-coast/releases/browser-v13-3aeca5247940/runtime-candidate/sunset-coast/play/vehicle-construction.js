import * as T from './vendor/three.module.js';

// Factories declare only resources they own. This registry never infers GPU
// ownership from scene overlap, names, UUIDs or a traversal of cached assets.
const owners=new WeakMap(),scopes=[];
function track(root){for(const scope of scopes)scope.roots.add(root);}
export function registerVehicleFactoryDisposer(root,dispose){
 if(!root?.isObject3D||typeof dispose!=='function')throw Error('Explicit vehicle factory ownership required');
 if(owners.has(root))throw Error('Vehicle factory root already issued');
 owners.set(root,{dispose,instance:null,released:false});track(root);return root;
}
export function registerIssuedVehicle(instance){
 if(!instance?.root?.isObject3D)throw Error('Vehicle constructor returned no owned root');
 let owner=owners.get(instance.root);if(!owner){owner={dispose:typeof instance.dispose==='function'?()=>instance.dispose():null,instance:null,released:false};owners.set(instance.root,owner);}
 if(owner.released)throw Error('Vehicle factory instance has been released');
 owner.instance=instance;track(instance.root);return instance;
}
export function releaseVehicleFactory(instance){const root=instance?.root,owner=owners.get(root);if(!owner||owner.released)return false;owner.released=true;owner.dispose?.();root.removeFromParent();return true;}
export function beginVehicleConstruction(){const scope={roots:new Set()};scopes.push(scope);return scope;}
export function endVehicleConstruction(scope){if(scopes.at(-1)!==scope)throw Error('Vehicle construction scope mismatch');scopes.pop();}
export function cleanupVehicleConstruction(scope,services={}){
 const errors=[];for(const root of scope.roots){const owner=owners.get(root);if(owner?.released)continue;const instance=owner?.instance??{root};
  for(const [name,fn]of [['instruments',services.disposeVehicleInstruments],['lights',services.disposeVehicleLights],['jets',services.disposeRoadsterJets],['damage',services.disposeVehicleDamage]])try{fn?.(instance);}catch(error){errors.push(name+': '+error.message);}
  try{releaseVehicleFactory(instance);}catch(error){errors.push('factory: '+error.message);}root.removeFromParent();
 }return errors;
}

const tickets=new WeakMap(),finished=new WeakSet(),clone=value=>structuredClone(value??{});
const json=JSON.stringify,liveVehicle=v=>json([v?.condition,v?.battery,v?.speed,v?.yaw,v?.pos?.x,v?.pos?.y,v?.pos?.z,v?.instanceId]);
const authority=game=>{if(game.physics?.failed===true)throw Error('物理后端已停止，未更换车辆');const l=game.browserWorldLifecycle;if(l?.stopped===true||l?.signal?.aborted===true)throw Error('页面生命周期已停止，未更换车辆');l?.checkpoint?.();};
const abort=(game,error)=>{game.vehicleConstructionAbortedToken={};return{ok:false,error:String(error?.message??error)};};
const observed=g=>({vehicle:g.vehicle,live:liveVehicle(g.vehicle),money:g.money,owned:g.owned,ownedJSON:json(g.owned),transactions:g.transactions,transactionsJSON:json(g.transactions),vehicleStates:g.vehicleStates,vehicleStatesJSON:json(g.vehicleStates),vehicleFaults:g.vehicleFaults,vehicleFaultsJSON:json(g.vehicleFaults),roadsterAirLedger:g.roadsterAirLedger,roadsterAirLedgerJSON:json(g.roadsterAirLedger),vehicleSerial:g.vehicleSerial,abort:g.vehicleConstructionAbortedToken,assetEpoch:g.vehicleAssetEpoch,pending:g.pendingVehicleAsset,inCar:g.inCar,pose:json([g.position.x,g.position.y,g.position.z,g.yaw])});
const unchanged=(g,b)=>g.vehicle===b.vehicle&&liveVehicle(g.vehicle)===b.live&&g.money===b.money&&g.owned===b.owned&&json(g.owned)===b.ownedJSON&&g.transactions===b.transactions&&json(g.transactions)===b.transactionsJSON&&g.vehicleStates===b.vehicleStates&&json(g.vehicleStates)===b.vehicleStatesJSON&&g.vehicleFaults===b.vehicleFaults&&json(g.vehicleFaults)===b.vehicleFaultsJSON&&g.roadsterAirLedger===b.roadsterAirLedger&&json(g.roadsterAirLedger)===b.roadsterAirLedgerJSON&&g.vehicleSerial===b.vehicleSerial&&g.vehicleConstructionAbortedToken===b.abort&&g.vehicleAssetEpoch===b.assetEpoch&&g.pendingVehicleAsset===b.pending&&g.inCar===b.inCar&&json([g.position.x,g.position.y,g.position.z,g.yaw])===b.pose;

/** Construct a replacement on private books/Scene before payment, owned mutation
 * or disposal of any old/recalled car. No storage rollback is performed. */
export function prepareVehicleSpawn(game,model,services={}){
 if(!model||typeof model.id!=='string')return abort(game,Error('车型身份无效'));
 if(game.robotaxi?.active||game.robotaxi?.passenger)return abort(game,Error('请先结束接送，再更换车辆'));
 for(const name of ['makeVehicle','rememberBrakeFault','captureGarageVehicle'])if(typeof game[name]!=='function'||game[name].name.startsWith('bound '))return abort(game,Error('Vehicle preparation requires unbound Game '+name));
 const scope=beginVehicleConstruction();let result;
 try{
  authority(game);const before=observed(game),shadow=Object.create(game);shadow.scene=new T.Scene();shadow.vehicleStates=clone(game.vehicleStates);shadow.vehicleFaults=clone(game.vehicleFaults);shadow.roadsterAirLedger=clone(game.roadsterAirLedger);shadow.vehicleSerial=game.vehicleSerial;
  Reflect.apply(game.rememberBrakeFault,shadow,[]);
  const recalled=[...new Set([game.vehicle,...(game.traffic??[])])].find(v=>game.isGarageCar(v)&&v.model?.id===model.id);if(recalled)Reflect.apply(game.captureGarageVehicle,shadow,[recalled]);
  for(const [id,state]of Object.entries(shadow.vehicleStates))shadow.vehicleStates[id]={...(game.vehicleStates?.[id]??{}),...state};
  const p=game.position.clone(),vehicle=Reflect.apply(game.makeVehicle,shadow,[model.id,p.x,p.z,game.yaw,false,recalled?.paintColor??null,{state:shadow.vehicleStates[model.id],isGarageVehicle:true}]);
  if(!vehicle?.root?.isObject3D||vehicle.model?.id!==model.id||scope.roots.size!==1||!scope.roots.has(vehicle.root))throw Error('Vehicle constructor identity mismatch');
  services.serializeVehicleDamage?.(vehicle);services.preflight?.(vehicle);
  if(!Number.isFinite(game.money)||!Array.isArray(game.owned)||!Array.isArray(game.transactions))throw Error('购车账户状态无效');
  const buying=!game.owned.includes(model.id),price=buying?model.price:0;if(!Number.isFinite(price)||price<0||game.money<price)throw Error('余额不足，未购买车型');
  const financial={money:game.money-price,owned:buying?[...game.owned,model.id]:[...game.owned],transactions:price>0?[{label:'购买 '+model.name,amount:-price,time:game.clockString()},...game.transactions]:[...game.transactions]};
  authority(game);if(!unchanged(game,before))throw Error('准备期间状态已变化，未扣款');
  result=Object.freeze({ok:true,vehicle});tickets.set(result,{scope,services,before,financial,books:{vehicleStates:shadow.vehicleStates,vehicleFaults:shadow.vehicleFaults,roadsterAirLedger:shadow.roadsterAirLedger}});
  const ticket=result;Promise.resolve().then(()=>{if(!finished.has(ticket))discardVehicleSpawn(game,ticket,Error('Vehicle preparation expired before synchronous commit'));});
 }catch(error){result=abort(game,error);const errors=cleanupVehicleConstruction(scope,services);if(errors.length)result.cleanupErrors=errors;}
 finally{endVehicleConstruction(scope);}return result;
}
export function discardVehicleSpawn(game,ticket,error){const data=tickets.get(ticket);if(!data||finished.has(ticket))return false;finished.add(ticket);cleanupVehicleConstruction(data.scope,data.services);abort(game,error);return true;}
export function commitVehicleSpawn(game,ticket){const data=tickets.get(ticket);if(!data||finished.has(ticket))return false;try{authority(game);if(!unchanged(game,data.before))throw Error('购买期间状态已变化，未扣款');}catch(error){discardVehicleSpawn(game,ticket,error);return false;}
 game.money=data.financial.money;game.owned=data.financial.owned;game.transactions=data.financial.transactions;game.vehicleStates=data.books.vehicleStates;game.vehicleFaults=data.books.vehicleFaults;game.roadsterAirLedger=data.books.roadsterAirLedger;finished.add(ticket);return true;
}
