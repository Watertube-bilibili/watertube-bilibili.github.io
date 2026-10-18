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
export const STORAGE_KEYS=betaStorageKeys(ACTIVE_PREVIEW_SLOT);
export const {SAVE_KEY,ASSIST_SETTINGS_KEY,QUALITY_PREFERENCE_KEY,RELEASE_READ_KEY,COCKPIT_OPEN_KEY,COCKPIT_POSITION_KEY,INPUT_MODE_KEY,MISSION_HIDDEN_KEY}=STORAGE_KEYS;
export const SAVE_SCOPE_LABEL='2.0 Beta · 独立测试存档';
export const SAVE_SCOPE_NOTE='测试版使用独立存档。复制只新建副本，标准版与已有测试进度均保留；初始副本备份保存在此浏览器。';
export const SAVE_EXPORT_PREFIX='sunset-coast-2.0-beta-';
