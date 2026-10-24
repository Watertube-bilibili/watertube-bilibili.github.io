// Presentation-only deterministic surface library. Shared 256² packed textures;
// no downloads, additional draw calls, reflection cameras, or collision changes.
import * as THREE from './vendor/three.module.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const textures=new Map();
function hash(x,y,seed=17){let n=Math.imul(x+seed,374761393)^Math.imul(y+seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
function noise(x,y,period,seed){const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,s=u*u*(3-2*u),t=v*v*(3-2*v),h=(a,b)=>hash((a%period+period)%period,(b%period+period)%period,seed);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iy),h(ix+1,iy),s),THREE.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),s),t);}
// R = small-scale height; G = roughness variation; B = reflectance variation.
// Linear data, not sRGB. Tile boundaries and all mip levels remain continuous.
export function surfaceTexture(kind='asphalt'){
 if(textures.has(kind))return textures.get(kind);
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const fine=hash(x,y,31),grain=noise(x/4,y/4,64,57),cloud=noise(x/32,y/32,8,83);
  let h=.5,r=.5,c=.5;
  if(kind==='asphalt'){const aggregate=noise(x/4,y/4,64,29);h=.14+aggregate*.6+fine*.26;r=.32+aggregate*.6;c=.16+aggregate*.50+fine*.18+cloud*.16;}
  else if(kind==='terrain'){const grains=noise(x/8,y/8,32,91);h=grains*.7+fine*.3;r=.4+grains*.5;c=cloud*.42+grains*.36+fine*.22;}
  else if(kind==='rubber'){h=.32+fine*.2+grain*.22;r=.45+fine*.4;c=.35+grain*.3;}
  else if(kind==='metal'){h=.48+(noise(x/2,y/32,128,133)-.5)*.06;r=.25+noise(x/2,0,128,19)*.6;c=.43+fine*.12;}
  else if(kind==='paint'){h=.49+(fine-.5)*.02;r=.42+fine*.16;c=.47+fine*.06;}
  else {h=.3+grain*.37+fine*.18+cloud*.15;r=.45+grain*.4;c=.27+cloud*.37+grain*.22+fine*.14;}
  data.set([Math.round(clamp(h)*255),Math.round(clamp(r)*255),Math.round(clamp(c)*255),255],(y*size+x)*4);
 }
 const texture=new THREE.DataTexture(data,size,size);texture.name='coast-packed-'+kind;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;textures.set(kind,texture);return texture;
}
export const SURFACE_BUDGET=Object.freeze({textureSize:256,maxAnisotropy:4,additionalPasses:0,worldSamples:2,vehicleSamples:1});
const normalDetail=`
 // Derivative bump mapping: world-unit height, no UV seams or extra texture reads.
 vec3 coastQ0=dFdx(-vViewPosition),coastQ1=dFdy(-vViewPosition);
 vec3 coastR1=cross(coastQ1,normal),coastR2=cross(normal,coastQ0);
 float coastDet=dot(coastQ0,coastR1);
 normal=normalize(abs(coastDet)*normal-sign(coastDet)*(dFdx(coastHeight)*coastR1+dFdy(coastHeight)*coastR2));`;
export function applySurfaceMaterial(material,kind='concrete',{local=false}={}){
 if(!material?.isMeshStandardMaterial||material.userData.coastSurface)return material;
 material.userData.coastSurface=kind;material.userData.coastSurfaceBudget=local?1:2;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);shader.uniforms.coastSurfaceMap={value:surfaceTexture(kind)};
  shader.vertexShader='varying vec3 coastSurfacePosition;\nvarying vec3 coastSurfaceNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 coastSurfaceVertex=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    coastSurfaceVertex=instanceMatrix*coastSurfaceVertex;
   #endif
   coastSurfacePosition=${local?'coastSurfaceVertex.xyz':'(modelMatrix*coastSurfaceVertex).xyz'};
   coastSurfaceNormal=${local?'objectNormal':'inverseTransformDirection(transformedNormal,viewMatrix)'};`);
  shader.fragmentShader='varying vec3 coastSurfacePosition;\nvarying vec3 coastSurfaceNormal;\nuniform sampler2D coastSurfaceMap;\n'+shader.fragmentShader;
  const scale={asphalt:.72,concrete:.66,terrain:.29,rock:.5,paint:8,rubber:6,metal:4,leather:9}[kind]??.65;
  const amplitude={asphalt:.008,concrete:.004,terrain:.03,rock:.023,paint:.000035,rubber:.0009,metal:.00012,leather:.0006}[kind]??.004;
  const contrast=kind==='terrain'?.7:kind==='asphalt'?.65:kind==='paint'?.05:kind==='metal'?.08:kind==='rubber'?.18:.30;
  const detail=`
   vec3 coastN=abs(normalize(coastSurfaceNormal));
   vec2 coastUV=coastN.y>max(coastN.x,coastN.z)?coastSurfacePosition.xz:(coastN.x>coastN.z?coastSurfacePosition.zy:coastSurfacePosition.xy);
   vec3 coastDetail=texture2D(coastSurfaceMap,coastUV*${scale.toFixed(5)}).rgb;
   float coastMacro=${local?'0.5':'texture2D(coastSurfaceMap,coastUV*.023).b'};
   float coastRelief=coastDetail.r;
   float coastReflectance=1.0+(coastDetail.b-.5)*${contrast.toFixed(4)}+(coastMacro-.5)*${local?'0.0':kind==='terrain'?'.48':'.20'};
   ${kind==='concrete'?`// 1.8 m concrete slabs; derivative-width joints do not shimmer at distance.
   vec2 coastGrid=coastUV/1.8,coastEdge=abs(fract(coastGrid-.5)-.5);
   vec2 coastAA=max(fwidth(coastGrid),vec2(.0005));
   vec2 coastJoint=1.0-smoothstep(vec2(.004),vec2(.004)+coastAA,coastEdge);
   float coastJointMask=max(coastJoint.x,coastJoint.y);
   coastReflectance*=1.0-.24*coastJointMask;coastRelief-=coastJointMask*.32;`:''}
   ${kind==='terrain'?`float coastRock=smoothstep(.18,.57,1.0-coastN.y);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.235,.205),coastRock*.65);`:''}
   diffuseColor.rgb*=coastReflectance;
   float coastDistanceFade=1.0-smoothstep(${local?'18.0,55.0':'38.0,135.0'},length(vViewPosition));
   float coastHeight=(coastRelief-.5)*${amplitude.toFixed(6)}*coastDistanceFade;`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+detail);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor+(coastDetail.g-.5)*${kind==='paint'?'.035':'.13'},.065,1.0);`);
  if(!material.normalMap&&!material.bumpMap)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+normalDetail);
 };
 material.customProgramCacheKey=()=>key+'-coast-surface-v3-'+kind+'-'+local;material.needsUpdate=true;return material;
}
export function vehicleSurfaceKind(name=''){
 const s=name.toLowerCase();
 if(/lamp|light|display|screen|ambient|plate|license|stitch|caliper|brake/.test(s))return null;
 if(/paint|pearl|ano_white|champagne/.test(s))return 'paint';
 if(/glass|privacy|backlight/.test(s))return 'glass';
 if(/rubber|tire|tyre|tread|wheel-well/.test(s))return 'rubber';
 if(/chrome|metal|aluminium|titanium|satin|rim|hardware|steel/.test(s))return 'metal';
 if(/leather|seat|suede|headlin|woven|cognac|ivory/.test(s))return 'leather';
 return null;
}
export function tuneVehicleMaterial(material,name=material?.name??''){
 const kind=vehicleSurfaceKind(name);if(!kind||!material?.isMeshStandardMaterial||material.userData.coastVehicleFinish)return material;
 let m=material;
 // Imported standard paint gains a real clear-coat BRDF, not a brighter color.
 if(kind==='paint'&&!m.isMeshPhysicalMaterial){m=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(m,material);m.defines={...m.defines,PHYSICAL:''};}
 m.userData.coastVehicleFinish=kind;
 if(kind==='paint'){
  m.metalness=Math.min(.82,Math.max(.42,m.metalness));m.roughness=.26;m.clearcoat=1;m.clearcoatRoughness=.16;m.envMapIntensity=1.12;
 }else if(kind==='glass'){
  // Dielectric glazing: reflections come from Fresnel, not metallic blue paint.
  m.metalness=0;m.roughness=.09;m.envMapIntensity=1.0;
  if(m.isMeshPhysicalMaterial){m.ior=1.5;m.clearcoat=0;m.specularIntensity=1;}
  // Retain authored alpha/tints, especially the Semi's clear laminated glass.
  if(m.transparent)m.depthWrite=false;
 }else if(kind==='rubber'){m.metalness=0;m.roughness=.88;m.envMapIntensity=.32;}
 else if(kind==='metal'){m.metalness=Math.max(.78,m.metalness);m.roughness=/satin|titanium|steel/i.test(name)?.34:.25;m.envMapIntensity=1.08;}
 else {m.metalness=0;m.roughness=Math.max(.78,m.roughness);m.envMapIntensity=.5;}
 if(kind!=='glass')applySurfaceMaterial(m,kind,{local:true});m.needsUpdate=true;return m;
}
const finishedMaterials=new WeakMap();
export function applyVehicleMaterials(car){
 car.root.traverse(o=>{if(!o.isMesh)return;const finish=m=>{if(!finishedMaterials.has(m))finishedMaterials.set(m,tuneVehicleMaterial(m));return finishedMaterials.get(m);};o.material=Array.isArray(o.material)?o.material.map(finish):finish(o.material);});return car;
}
