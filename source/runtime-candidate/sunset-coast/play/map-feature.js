const params=new URLSearchParams(globalThis.location?.search||'');
export const CRESCENT_MAP=(params.get('map')==='crescent'&&params.get('preview')==='1'||params.get('runtime')==='browser'&&params.get('world')==='crescent');
export const COMMON_MAP=CRESCENT_MAP||params.get('world')==='estuary'||params.get('map')==='estuary'&&params.get('preview')==='1';
export const COMMON_PBR=COMMON_MAP&&params.get('pbr')==='1';
export let commonMaterialPack=null;
export function setCommonMaterialPack(pack){commonMaterialPack=pack;}
