import {characterAssetReady} from './character-assets.js';

// Asset state is visible without blocking driving, save selection or physics.
// Track current scene actors so a failed NPC never silently becomes ready.
export function watchCharacterAsset(game,actor=game.person){
 if(typeof document==='undefined'||!document.body)return;
 let panel=document.getElementById('character-asset-status');
 if(!panel){
  panel=document.createElement('div');panel.id='character-asset-status';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
  panel.style.cssText='position:fixed;z-index:2200;left:12px;top:78px;max-width:min(420px,calc(100vw - 24px));padding:10px 14px;border:1px solid #8aa8a0;border-radius:9px;background:#15282dee;color:#eef4ef;font:13px/1.5 system-ui;pointer-events:auto';
  const text=document.createElement('span');text.id='character-asset-message';
  const retry=document.createElement('button');retry.id='character-asset-retry';retry.type='button';retry.textContent='重试角色模型';retry.style.cssText='margin-left:10px;padding:5px 9px;cursor:pointer';panel.append(text,retry);document.body.append(panel);
 }
 game.characterAssetUnwatch?.();
 const characters=()=>[...new Set([game.person,...(game.pedestrians??[]),...(game.police??[]).flatMap(p=>[p.person,p.actor])])].filter(p=>p?.retryCharacterAsset);
 const update=()=>{
  if(game.person!==actor)return;
  const live=characters(),failed=live.filter(p=>p.root.userData.characterAssetState==='error'),loading=live.filter(p=>p.root.userData.characterAssetState==='loading'),error=failed.length>0;
  panel.hidden=!loading.length&&!error;panel.dataset.state=error?'error':loading.length?'loading':'ready';
  document.getElementById('character-asset-message').textContent=error?`原角色模型加载失败（${failed.length} 人），当前仅为占位人物。`:`正在载入原角色模型（${loading.length} 人），当前仅为占位人物…`;
  const retry=document.getElementById('character-asset-retry');retry.hidden=!error;retry.disabled=!error;
  retry.onclick=()=>{if(game.person!==actor)return;const failed=characters().filter(p=>p.root.userData.characterAssetState==='error');Promise.all(failed.map(p=>p.retryCharacterAsset())).then(update);};
 };
 const watched=characters();for(const p of watched){p.root.addEventListener('characterstate',update);p.root.addEventListener('characterready',update);p.assetReady?.then(update);}
 game.characterAssetUnwatch=()=>{for(const p of watched){p.root.removeEventListener('characterstate',update);p.root.removeEventListener('characterready',update);}};
 update();
}

export function refreshCharacterThumbnailWhenReady(game,id,actor){
 return actor.assetReady?.then(()=>{
  if(!characterAssetReady(actor.root.userData.characterAssetId))return;
  const image=document.querySelector('[data-select-character="'+id+'"]')?.closest('.character-card')?.querySelector('img');
  if(image){image.src=game.characterThumbnail(id);if(game.characterThumbnailErrors)delete game.characterThumbnailErrors[id];}
 }).catch(error=>{(game.characterThumbnailErrors??={})[id]=String(error?.message??error);});
}
