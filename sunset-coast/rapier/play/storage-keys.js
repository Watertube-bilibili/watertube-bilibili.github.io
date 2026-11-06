import {CITY_PREFIX,CITY_ACTIVE_KEY,cityStorageKeys,cityIndexKey,isCitySlotId,parseCitySlot} from './city-save-store.js';
export const CANDIDATE_STORAGE_RELEASE='original-city-rapier-candidate-v1';
export const ACTIVE_SAVE_KEY=CITY_ACTIVE_KEY;
export const PREVIEW_SLOT_INDEX_PREFIX=CITY_PREFIX+':slot-index:';
export const isPreviewSlotId=isCitySlotId;
export class PreviewSlotError extends Error{}
export const previewSlotIndexKey=cityIndexKey;
export const storageKeysForSlot=cityStorageKeys;
export const storageKeysForRelease=()=>cityStorageKeys(null);
export const FORMAL_STORAGE_KEYS=cityStorageKeys(null);
export function parsePreviewSlotSearch(search=''){if(!new URLSearchParams(search).has('citySlot'))return null;return parseCitySlot(search);}
export function readPreviewSlotRecord(storage,slot){if(!isCitySlotId(slot))throw Error('候选存档编号无效');const record=JSON.parse(storage.getItem(cityIndexKey(slot))??'null');if(record?.version!==1||record.slot!==slot)throw Error('候选来源记录缺失或损坏');return record;}
export const resolvePreviewSlot=search=>parsePreviewSlotSearch(search);
export const ACTIVE_PREVIEW_SLOT=parsePreviewSlotSearch(globalThis.location?.search??'');
export const STORAGE_KEYS=cityStorageKeys(ACTIVE_PREVIEW_SLOT);
export const {SAVE_KEY,ASSIST_SETTINGS_KEY,QUALITY_PREFERENCE_KEY,RELEASE_READ_KEY,COCKPIT_OPEN_KEY,COCKPIT_POSITION_KEY,INPUT_MODE_KEY,MISSION_HIDDEN_KEY}=STORAGE_KEYS;
export const SAVE_SCOPE_LABEL='原始完整城市 · Rapier 独立进度';
export const SAVE_SCOPE_NOTE='Rapier 使用独立进度。原始标准版与 Beta 存档、槽位身份及备份均保留。';
export const SAVE_EXPORT_PREFIX='sunrise-original-city-candidate-';
