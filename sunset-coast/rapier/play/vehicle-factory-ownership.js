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

