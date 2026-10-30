import {browserWorldRequest} from './browser-world-policy.js';
import {browserWorldConfig} from './browser-world-slots.js';
const browserWorld=browserWorldRequest();
const worldConfig=browserWorld?browserWorldConfig(browserWorld.map,browserWorld.id):null;
import {requestedEstuary,estuaryConfig,estuarySlotFromSearch} from './estuary-save-slots.js';
import {BETA_PREFIX,ACTIVE_BETA_KEY,BETA_INDEX_PREFIX,betaStorageKeys,betaIndexKey,readBetaSlotRecord,isBetaSlotId,BetaSaveError} from './beta-save-slots.js';
// The beta origin path shares storage with standard. Every runtime key, including
// preferences and the active pointer, is therefore explicitly beta-only.
export const CANDIDATE_STORAGE_RELEASE='2.0.0-beta';
export const ACTIVE_SAVE_KEY=ACTIVE_BETA_KEY;
export const PREVIEW_SLOT_INDEX_PREFIX=BETA_INDEX_PREFIX;
export const isPreviewSlotId=isBetaSlotId;
export const PreviewSlotError=BetaSaveError;
export const previewSlotIndexKey=betaIndexKey;
export const readPreviewSlotRecord=readBetaSlotRecord;
export const storageKeysForSlot=betaStorageKeys;
export const storageKeysForRelease=()=>betaStorageKeys(null);
// Compatibility export for older modules; beta never points it at standard keys.
export const FORMAL_STORAGE_KEYS=betaStorageKeys(null);
export function parsePreviewSlotSearch(search=''){
 const values=new URLSearchParams(search).getAll('slot');
 if(!values.length)return null;
 if(values.length!==1||!isBetaSlotId(values[0]))throw new BetaSaveError('invalid-slot','测试版存档入口无效，请返回测试版首页。');
 return values[0];
}
export function resolvePreviewSlot(search='',storage){const slot=parsePreviewSlotSearch(search);if(slot!==null)readBetaSlotRecord(storage,slot);return slot;}
export const ACTIVE_PREVIEW_SLOT=globalThis.document?.documentElement?.dataset?.neonBetaEntry==='true'?null:resolvePreviewSlot(globalThis.location?.search??'',globalThis.localStorage);
const browserPhysics=new URLSearchParams(globalThis.location?.search??'').get('physics')==='browser';
const estuary=requestedEstuary(globalThis.location?.search??'')?estuaryConfig(estuarySlotFromSearch(location.search)):null;
export const STORAGE_KEYS=worldConfig?Object.freeze(Object.fromEntries(Object.entries(betaStorageKeys(null)).map(([name])=>[name,name==='SAVE_KEY'?worldConfig.key:worldConfig.key+':preference:'+name]))):browserPhysics?Object.freeze(Object.fromEntries(Object.entries(betaStorageKeys(null)).map(([name])=>[name,'sunrise:browser-physics:20261030:'+name]))):estuary?Object.freeze(Object.fromEntries(Object.entries(betaStorageKeys(null)).map(([name])=>[name,name==='SAVE_KEY'?estuary.key:estuary.key+':preference:'+name]))):betaStorageKeys(ACTIVE_PREVIEW_SLOT);
export const {SAVE_KEY,ASSIST_SETTINGS_KEY,QUALITY_PREFERENCE_KEY,RELEASE_READ_KEY,COCKPIT_OPEN_KEY,COCKPIT_POSITION_KEY,INPUT_MODE_KEY,MISSION_HIDDEN_KEY}=STORAGE_KEYS;
export const SAVE_SCOPE_LABEL=worldConfig?'SUNRISE · '+worldConfig.map.toUpperCase()+' · 浏览器独立完整进度':estuary?'ESTUARY · 独立新地图存档':'2.0 Beta · 独立测试存档';
export const SAVE_SCOPE_NOTE=worldConfig?'每张地图的完整玩家进度独立保存；旧城和原生运行器存档不自动迁移。导入及不支持车型不会覆盖原档。':estuary?'新地图使用独立进度，旧城与 ULTRA 存档不变。支持保存、刷新继续和导出备份；暂不支持导入或回退备份。':'测试版使用独立存档。复制只新建副本，标准版与已有测试进度均保留；初始副本备份保存在此浏览器。';
export const SAVE_EXPORT_PREFIX='sunset-coast-2.0-beta-';
