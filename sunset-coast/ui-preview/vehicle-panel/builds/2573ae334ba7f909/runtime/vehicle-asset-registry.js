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
// Only the active saved vehicle is needed before restoration creates colliders.
// Merely owning an optional vehicle must not add bytes to the initial load.
export function prepareSavedVehicleAsset(storage,key,onProgress){
 let id;try{id=JSON.parse(storage?.getItem(key)||'null')?.vehicle?.model;}catch{return Promise.resolve(true);}
 return id?ensureVehicleAsset(id,onProgress):Promise.resolve(true);
}
export function showVehicleAssetBootError(container,label){
 if(label)label.textContent='存档车型模型暂未载入，游戏尚未启动，原有存档未改动。请检查网络后重试。';
 if(!container||typeof document==='undefined')return;
 const button=document.createElement('button');button.type='button';button.textContent='重试加载存档车型';button.style.cssText='margin-top:18px;padding:12px 20px;border-radius:10px';button.onclick=()=>location.reload();container.append(button);
}
