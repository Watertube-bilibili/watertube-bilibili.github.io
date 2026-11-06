import {ensureVehicleAsset,vehicleAssetReady,vehicleAssetStatus} from './vehicle-asset-registry.js';
export function cancelPendingVehicleAsset(game){game.vehicleAssetEpoch=(game.vehicleAssetEpoch??0)+1;game.pendingVehicleAsset=null;}
// Async selection is transactional: the current car, money, owned list and save
// remain untouched until the exact latest request has a usable model.
export function queueVehicleAssetAction(game,id,kind,perform,label=id){
 cancelPendingVehicleAsset(game);const epoch=game.vehicleAssetEpoch,vehicle=game.vehicle;
 const pending={id,kind,epoch,promise:null};game.pendingVehicleAsset=pending;
 game.ui?.toast?.('正在加载 '+label+'；当前车辆和存档保持不变。');game.ui?.refreshVehicleAssets?.();
 pending.promise=ensureVehicleAsset(id).then(ready=>{
  if(game.vehicleAssetEpoch!==epoch||game.pendingVehicleAsset!==pending)return false;
  game.pendingVehicleAsset=null;
  if(!ready){game.ui?.toast?.(label+' 模型加载失败，未扣费或改动存档；再次选择可重试。','error');game.ui?.refreshVehicleAssets?.();return false;}
  if(game.vehicle!==vehicle||game.aircraft?.active||game.flight?.active||game.autonomyTest?.active||game.robotaxi?.passenger){game.ui?.toast?.('车型已载入；当前操作已改变，请重新选择。');game.ui?.refreshVehicleAssets?.();return false;}
  const ok=perform();game.ui?.refreshVehicleAssets?.();
  if(ok&&kind==='spawn'){if(game.ui?.vehicleAssetView==='garage')game.ui.closeModal();if(game.ui?.phonePage==='garage'&&game.ui.isPhoneOpen?.())game.ui.closePhone();}
  return !!ok;
 });return false;
}
export function vehicleAssetActionLabel(game,model,fallback){
 if(game.pendingVehicleAsset?.id===model.id)return'模型加载中…';
 if(!vehicleAssetReady(model.id)&&vehicleAssetStatus(model.id)==='error')return'加载失败 · 点击重试';
 return fallback;
}
