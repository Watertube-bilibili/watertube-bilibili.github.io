// New browser-world entry only. Legacy URLs retain their original runner and keys.
export const BROWSER_WORLD_SCHEMA=2;
export const BROWSER_WORLD_ROADSTER_MODELS=Object.freeze(['roadster_rocket']);
export function browserWorldRequest(search=globalThis.location?.search??''){
 const p=new URLSearchParams(search);if(p.get('runtime')!=='browser')return null;
 const map=p.get('world');if(!['estuary','crescent'].includes(map))throw Error('浏览器地图身份无效');
 for(const k of p.keys())if(!['runtime','world','browserSlot'].includes(k))throw Error('正式浏览器入口不接受实验或旧档参数');
 if(p.getAll('world').length!==1||p.getAll('runtime').length!==1||p.getAll('browserSlot').length!==1)throw Error('入口身份重复或缺失');
 const id=p.get('browserSlot');if(!/^b-[a-z0-9-]{1,96}$/.test(id??''))throw Error('请从日出存档页进入');
 return {map,id,backend:'browser',schema:BROWSER_WORLD_SCHEMA};
}
export function assertBrowserSnapshotCapability(s,map){
 // Do not discard parked/owned unsupported vehicles merely to make a save load.
 const ids=[s.vehicle?.model,...(s.owned??[]),...Object.keys(s.vehicleStates??{})];
 if(ids.some(id=>/^roadster/i.test(id??'')&&!BROWSER_WORLD_ROADSTER_MODELS.includes(id))||s.aircraft)throw Error('存档包含尚未完成迁移的车型或飞机，原数据保留');
 if(map==='crescent'&&(s.job||s.deliveryCareer?.active))throw Error('弧湾职业存档尚未兼容，原数据保留');
 if(map==='estuary'&&s.job)throw Error('旧城职业坐标不可迁入新地图，原数据保留');
 return s;
}
