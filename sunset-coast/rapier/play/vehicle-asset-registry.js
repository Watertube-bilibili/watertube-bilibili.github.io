// Small providers register metadata/loader functions only. Registering a model
// never starts a download. Trims sharing one provider share its in-flight load.
const providers=new Map(),states=new WeakMap();
export function registerVehicleAsset(ids,provider){
 if(!provider||typeof provider.ready!=='function'||typeof provider.load!=='function')throw Error('Invalid vehicle asset provider');
 for(const id of ids){if(providers.has(id)&&providers.get(id)!==provider)throw Error('Duplicate vehicle asset provider: '+id);providers.set(id,provider);}
}
const key=value=>typeof value==='string'?value:value?.id;
export const requiresVehicleAsset=id=>providers.has(key(id));
export const vehicleAssetReady=id=>!requiresVehicleAsset(id)||providers.get(key(id)).ready();
export function vehicleAssetStatus(id){const p=providers.get(key(id));return!p||p.ready()?'ready':states.get(p)?.status??'idle';}
export function ensureVehicleAsset(id,onProgress){
 const provider=providers.get(key(id));if(!provider||provider.ready())return Promise.resolve(true);
 const current=states.get(provider);if(current?.promise)return current.promise;
 const state={status:'loading',promise:null};states.set(provider,state);
 state.promise=Promise.resolve().then(()=>provider.load(onProgress)).then(ok=>{state.status=ok&&provider.ready()?'ready':'error';return state.status==='ready';},()=>{state.status='error';return false;}).finally(()=>{state.promise=null;});return state.promise;
}
// Actual saved parked world vehicles also need their authored geometry before
// synchronous restore. Merely owning a showroom vehicle still loads nothing.
export function savedVehicleModels(save){return [...new Set([save?.vehicle?.model,...Object.values(save?.worldVehicleStates??{}).map(record=>record?.model)].filter(id=>typeof id==='string'))];}
export function prepareSavedVehicleAsset(storage,key,onProgress){
 let saved;try{saved=JSON.parse(storage?.getItem(key)||'null');}catch{return Promise.resolve(true);}
 return Promise.all(savedVehicleModels(saved).map(id=>ensureVehicleAsset(id,onProgress))).then(results=>results.every(Boolean));
}
export function showVehicleAssetBootError(container,label){
 if(label)label.textContent='存档车型模型暂未载入，游戏尚未启动，原有存档未改动。请检查网络后重试。';
 if(!container||typeof document==='undefined')return;
 const button=document.createElement('button');button.type='button';button.textContent='重试加载存档车型';button.style.cssText='margin-top:18px;padding:12px 20px;border-radius:10px';button.style.pointerEvents='auto';button.style.color='#142b38';button.style.background='#f5f0e6';button.onclick=()=>location.reload();container.append(button);
}
