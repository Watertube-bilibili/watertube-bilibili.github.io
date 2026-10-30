// Isolated r180 candidate. Inject the game's THREE namespace; no extra renderer/library.
export const MATERIAL_TIERS=Object.freeze({
 low:Object.freeze({size:256,anisotropy:1,bump:false,clearcoat:false,worldTextureReads:2,textureGpuBytes:1398102}),
 medium:Object.freeze({size:512,anisotropy:2,bump:true,clearcoat:true,worldTextureReads:2,textureGpuBytes:5592406}),
 high:Object.freeze({size:512,anisotropy:4,bump:true,clearcoat:true,worldTextureReads:2,textureGpuBytes:5592406})
});
// Four RGB PNGs can be GPU-expanded to RGBA8; mip allowance is 4/3. Estimates exclude existing game assets.
export async function createPBRMaterialPack(THREE,{tier='low',baseURL=new URL('./assets/',import.meta.url),maxAnisotropy=1,loader=new THREE.TextureLoader()}={}){
 const quality=MATERIAL_TIERS[tier];if(!quality)throw new Error('Unknown material tier: '+tier);
 const owned=new Set(),materials=new Set();let disposed=false;
 const load=async(kind,type)=>{const t=await loader.loadAsync(new URL(`${kind}-${type}-${quality.size}.png`,baseURL).href);owned.add(t);t.colorSpace=type==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=Math.max(1,Math.min(quality.anisotropy,maxAnisotropy));t.name=`pbr-${kind}-${type}`;return t;};
 let maps;
 // Wait for all pending loads before cleanup, including partial failure.
 const entries=await Promise.allSettled(['asphalt','concrete'].flatMap(k=>['color','surface'].map(async t=>[k+'-'+t,await load(k,t)])));
 const failure=entries.find(r=>r.status==='rejected');if(failure){owned.forEach(t=>t.dispose());throw failure.reason;}
 maps=Object.fromEntries(entries.map(r=>r.value));
 function guard(){if(disposed)throw new Error('Material pack disposed');}
 function track(m){materials.add(m);return m;}
 function surface(kind,{color=0xffffff,repeatMeters=kind==='asphalt'?2:3.6}={}){
  guard();if(!['asphalt','concrete'].includes(kind))throw new Error('Unsupported surface');
  if(!(repeatMeters>0&&Number.isFinite(repeatMeters)))throw new Error('repeatMeters must be positive');
  const m=track(new THREE.MeshStandardMaterial({color,roughness:1,metalness:0}));m.name='pbr-'+kind;
  // Object normal projected into world space; instancing transform is included. Static city/roads only.
  // Dominant-axis projection avoids missing/stretching UVs on the current procedural meshes.
  m.onBeforeCompile=shader=>{
   shader.uniforms.pbrColor={value:maps[kind+'-color']};shader.uniforms.pbrSurface={value:maps[kind+'-surface']};
   shader.vertexShader='varying vec3 pbrPosition;\nvarying vec3 pbrWorldNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 pbrVertex=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
    pbrVertex=instanceMatrix*pbrVertex;
    #endif
    pbrPosition=(modelMatrix*pbrVertex).xyz;
    pbrWorldNormal=inverseTransformDirection(transformedNormal,viewMatrix);`);
   shader.fragmentShader='varying vec3 pbrPosition;\nvarying vec3 pbrWorldNormal;\nuniform sampler2D pbrColor;\nuniform sampler2D pbrSurface;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 pbrN=abs(normalize(pbrWorldNormal));
    vec2 pbrUV=(pbrN.y>max(pbrN.x,pbrN.z)?pbrPosition.xz:(pbrN.x>pbrN.z?pbrPosition.zy:pbrPosition.xy))/${repeatMeters.toFixed(6)};
    vec3 pbrData=texture2D(pbrSurface,pbrUV).rgb;
    diffuseColor.rgb*=texture2D(pbrColor,pbrUV).rgb;
    float pbrHeight=(pbrData.r-.5)*${kind==='asphalt'?'.006':'.003'}*(1.0-smoothstep(30.0,110.0,length(vViewPosition)));`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(pbrData.g,.65,1.0);');
   if(quality.bump)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec3 pbrQ0=dFdx(-vViewPosition),pbrQ1=dFdy(-vViewPosition);
    vec3 pbrR1=cross(pbrQ1,normal),pbrR2=cross(normal,pbrQ0);
    float pbrDet=dot(pbrQ0,pbrR1);
    normal=normalize(abs(pbrDet)*normal-sign(pbrDet)*(dFdx(pbrHeight)*pbrR1+dFdy(pbrHeight)*pbrR2));`);
  };
  m.customProgramCacheKey=()=>`city-pbr-v1-${kind}-${tier}-${repeatMeters}`;
  return m;
 }
 function carPaint(color=0x851d26,{metallic=false}={}){guard();return track(new THREE.MeshPhysicalMaterial({color,metalness:metallic?.62:0,roughness:.28,clearcoat:quality.clearcoat?1:0,clearcoatRoughness:.18,envMapIntensity:1}));}
 function glass({color=0xaabec5,opacity=.38}={}){guard();return track(new THREE.MeshPhysicalMaterial({color,metalness:0,roughness:.1,ior:1.5,transparent:true,opacity,depthWrite:false,transmission:0,envMapIntensity:1}));}
 return {quality,surface,carPaint,glass,dispose(){if(disposed)return;disposed=true;materials.forEach(m=>m.dispose());owned.forEach(t=>t.dispose());},get textureCount(){return owned.size;}};
}
