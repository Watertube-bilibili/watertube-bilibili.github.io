/** Optional PBR hook. Materials/textures remain owned by the supplied pack;
 * cache once per shared map so chunk churn cannot grow the pack's material set. */
export function makeMapMaterialFactory(pack){const cache=new Map();function use(key,create){if(!cache.has(key)){const material=create();if(material?.isMaterial)material.userData.sharedMapPack=true;cache.set(key,material);}return cache.get(key);}return(color,options={})=>{
 if(options.surface==='asphalt-slope-fallback')return use('asphalt-slope-fallback',()=>pack.slopeFallback?.()??null);
 if(options.surface==='asphalt')return use('asphalt',()=>pack.surface('asphalt'));
 if(color===0x77aeb7)return use('glass',()=>pack.glass({color,opacity:.32}));
 if([0xe6d8bd,0xd9cdb7,0xd5cab4].includes(color))return use('concrete',()=>pack.surface('concrete'));
 return null;
};}
