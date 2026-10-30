import {signalState,signalLensColor} from './intersection-signals.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {daylightProfile,applyNaturalLighting,applyRoadSurface,applyFacadeScale,addBuildingContactShadows} from './realistic-visuals.js';
import {createStreamingWorld,groundHeight,buildTerrainHeightfield} from './streaming-world.js';
import {readFileSync} from 'node:fs';
test('lighting stays finite and continuous over midnight, dawn and dusk',()=>{
 for(const weather of ['clear','rain','fog'])for(let h=-24;h<48;h+=.05){const a=daylightProfile(h,weather),b=daylightProfile(h+.01,weather);assert(Object.values(a).every(Number.isFinite));assert(Math.abs(a.sun-b.sun)<.05);assert(a.exposure>=1);}
 assert.deepEqual(daylightProfile(0),daylightProfile(24));assert(daylightProfile(12).fog<daylightProfile(12,'fog').fog);
});
test('natural lighting mutates presentation only',()=>{const game={clockMinutes:720,weather:'clear',scene:{background:new THREE.Color(),fog:{color:new THREE.Color(),density:0}},hemi:new THREE.HemisphereLight(),sun:new THREE.DirectionalLight(),renderer:{},vehicle:{speed:13}};applyNaturalLighting(game);assert.equal(game.vehicle.speed,13);assert.equal(game.renderer.toneMappingExposure,1.04);});
test('asphalt shader supports instancing with two mipmapped samples, no extra render pass',()=>{const mat=applyRoadSurface(new THREE.MeshStandardMaterial());const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};mat.onBeforeCompile(shader);assert(shader.vertexShader.includes('instanceMatrix*coastPosition'));assert.equal((shader.fragmentShader.match(/texture2D\(coastGrain/g)||[]).length,2);assert.equal(shader.uniforms.coastGrain.value.generateMipmaps,true);});
test('facade storey scale is world based and one ordinary map sample',()=>{const mat=applyFacadeScale(new THREE.MeshStandardMaterial({map:new THREE.Texture()})),shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};mat.onBeforeCompile(shader);assert(shader.vertexShader.includes('vec2(12.0,24.0)'));assert(shader.fragmentShader.includes('texture2D(map,coastFacadeUV)'));});
test('active signal authority illuminates amber and exactly one lens',()=>{for(const state of ['red','amber','green'])assert.equal(['red','amber','green'].filter(lens=>signalLensColor(state,lens)!==0x17232a).length,1);});
test('baked contact draws are instanced and do not cast shadows or change colliders',()=>{const parent=new THREE.Group(),colliders=[{x:0,z:0,w:10,d:12,kind:'building'},{x:1,z:2,w:2,d:2,kind:'highway-barrier'}],before=JSON.stringify(colliders);const mesh=addBuildingContactShadows(parent,colliders);assert.equal(mesh.count,1);assert.equal(mesh.castShadow,false);assert.equal(mesh.material.depthWrite,false);assert.equal(JSON.stringify(colliders),before);});
test('streamed geometry finite; signals match controller parity; eviction bounded across map',()=>{
 const scene=new THREE.Scene(),world=createStreamingWorld(scene,[]);
 for(const pos of [{x:800,z:800},{x:3200,z:4000},{x:9600,z:7200},{x:12000,z:-9600}]){
  world.update(pos,true);assert(world.chunks.size<=25);assert(world.colliders.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.z)));
  world.updateSignals(18);for(const chunk of world.chunks.values()){chunk.group.traverse(m=>{if(m.geometry?.attributes.position)assert(Array.from(m.geometry.attributes.position.array).every(Number.isFinite));});if(chunk.signalMesh){assert.equal(chunk.signalMesh.count,chunk.lampGrid.length);assert(chunk.lampGrid.length%12===0);for(let i=0;i<chunk.lampGrid.length;i++){const lamp=chunk.lampGrid[i],color=new THREE.Color();chunk.signalMesh.getColorAt(i,color);const expected=new THREE.Color(signalLensColor(signalState(18,lamp.i,lamp.j,lamp.axis),lamp.lens));assert(color.distanceTo?color.distanceTo(expected)<1e-5:Math.abs(color.r-expected.r)<1e-5);}}}
 }
 world.dispose();assert.equal(world.chunks.size,0);assert.equal(scene.children.length,0);
});
test('street and highway divider offsets retain geometry and road safety boundaries',()=>{const src=readFileSync(new URL('./streaming-world.js',import.meta.url),'utf8');assert(src.includes('side*(express?9:5.5)'));assert(src.includes('z+side*5.5'));assert(src.includes('Math.abs(z-roadCoord(z))<18'));assert(src.includes('Math.abs(x-roadCoord(x))<18'));});
test('shared Godot heightfield edge stays exactly continuous',()=>{const a=buildTerrainHeightfield(30,22),b=buildTerrainHeightfield(31,22);for(let z=0;z<a.depth;z++)assert.equal(a.heights[z*a.width+a.width-1],b.heights[z*b.width]);});
test('core world builds all four-view, three-lens signals in one instanced mesh',async()=>{
 const {createWorld,ROAD}=await import('./world.js');
 const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 try{const scene=new THREE.Scene(),world=createWorld(scene);assert.equal(world.signals.length,ROAD.length*ROAD.length*12);world.updateCoreSignals(9);let meshes=[];scene.traverse(o=>{if(o.isInstancedMesh&&o.count===world.signals.length&&o.material.isMeshBasicMaterial)meshes.push(o)});assert.equal(meshes.length,1);assert(meshes[0].instanceColor);world.dispose();}finally{globalThis.document=old;}
});
