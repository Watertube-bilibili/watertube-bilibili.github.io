import * as THREE from './vendor/three.module.js';

// Render-only cold-gas visualization. Every channel is measured AFTER Godot
// applies a force or torque; keys, requested lift and air-mode flags never
// fabricate an active jet. No flame, light, simulation force or growing trail.
export const ROADSTER_JET_CHANNELS=Object.freeze(['up','down','forward','reverse','left','right','pitchUp','pitchDown','rollLeft','rollRight','yawLeft','yawRight']);
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const unit=n=>Math.max(0,Math.min(1,finite(n)));
const trimOf=v=>v?.model?.id==='roadster_rocket'?'rocket':v?.model?.id==='roadster_thrust'?'thrust':null;
export function sanitizeRoadsterJets(value){return Object.fromEntries(ROADSTER_JET_CHANNELS.map(key=>[key,unit(value?.[key])]));}
const nozzle=(id,position,direction,kind,radius,base,positive=[],negative=[])=>Object.freeze({id,position:Object.freeze(position),direction:Object.freeze(direction),kind,radius,base,positive:Object.freeze(positive),negative:Object.freeze(negative)});
// Coordinates are the mouth centers of the shipped Blender model in the
// chassis's game axes: X right, Y up, -Z forward. Exhaust opposes force.
export const ROADSTER_JET_NOZZLES=Object.freeze([
 ...[-.62,-.205,.205,.62].map((x,i)=>nozzle('rear'+i,[x,.55,2.432],[0,0,1],'rear',.064,'forward')),
 ...[-1,1].flatMap(side=>[-.68,.62].map((z,i)=>nozzle('lift'+(side<0?'L':'R')+(i?'R':'F'),[side*.72,.140,z],[0,-1,0],'attitude',.057,'up',[i?'pitchDown':'pitchUp',side<0?'rollRight':'rollLeft'],[i?'pitchUp':'pitchDown',side<0?'rollLeft':'rollRight']))),
 ...[-1,1].flatMap(side=>[-.68,.62].map((z,i)=>nozzle('side'+(side<0?'L':'R')+(i?'R':'F'),[side*1.022,.40,z],[side,0,0],'attitude',.035,side<0?'right':'left',[(side<0)===!!i?'yawLeft':'yawRight'],[(side<0)===!!i?'yawRight':'yawLeft']))),
 ...[-1,1].flatMap(side=>[[-1.60,.833],[1.70,.938]].map(([z,y],i)=>nozzle('top'+(side<0?'L':'R')+(i?'R':'F'),[side*.39,y+.009,z],[0,1,0],'attitude',.033,'down',[i?'pitchUp':'pitchDown',side<0?'rollLeft':'rollRight'],[i?'pitchDown':'pitchUp',side<0?'rollRight':'rollLeft']))),
 ...[-1,1].map(side=>nozzle('front'+(side<0?'L':'R'),[side*.53,.44,-2.414],[0,0,-1],'attitude',.036,'reverse')),
]);
export const ROADSTER_JET_BUDGET=Object.freeze({drawCalls:2,nozzles:ROADSTER_JET_NOZZLES.length,puffsPerNozzle:3,triangles:ROADSTER_JET_NOZZLES.length*6*4,textures:0,lights:0});

function allowed(v){return !!trimOf(v)&&finite(v?.battery,100)>0&&finite(v?.condition,100)>0&&v?.roadsterState?.mode!=='unpowered';}
export function roadsterNozzleStrength(v,spec){
 if(!allowed(v)||spec.kind!=='rear'&&trimOf(v)!=='rocket')return 0;
 const channels=v.roadsterState?.jets;if(!channels)return 0;
 let amount=unit(channels[spec.base]);
 // Signed differential pairs show the physical torque direction, including
 // damping after the player releases a key. This is a visual allocation of
 // the measured body wrench, not a new force allocator for the rigid body.
 for(const key of spec.positive)amount+=unit(channels[key])*.60;
 for(const key of spec.negative)amount-=unit(channels[key])*.60;
 return unit(amount);
}

// Three crossed, feathered ribbons are visible from any camera. All instances
// share this tiny topology; shaders replace textures and CPU particle spawning.
function ribbonGeometry(){
 const positions=[],uvs=[],index=[];
 for(let plane=0;plane<3;plane++){
  const c=Math.cos(plane*Math.PI/3),s=Math.sin(plane*Math.PI/3),start=positions.length/3;
  for(const [x,z]of[[-1,0],[1,0],[-1,1],[1,1]]){positions.push(x*c,x*s,z);uvs.push((x+1)/2,z);}
  index.push(start,start+1,start+2,start+2,start+1,start+3);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(index);return geometry;
}
function material(mist=false){
 const m=new THREE.ShaderMaterial({name:mist?'Roadster cold gas mist':'Roadster cold gas stream',transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.NormalBlending,toneMapped:false,
  uniforms:{clock:{value:0},mist:{value:mist?1:0},gasColor:{value:new THREE.Color(mist?0xbbd5df:0xe9f6fa)}},
  vertexShader:`attribute float gasStrength; attribute float gasSeed;
varying vec2 gasUV; varying float gasAlpha; varying float seed;
uniform float mist;
void main(){gasUV=uv;gasAlpha=gasStrength;seed=gasSeed;
vec3 p=position;float flare=mix(.30+1.55*uv.y,1.0,mist);p.xy*=flare;
gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.0);}`,
  fragmentShader:`uniform vec3 gasColor; uniform float clock; uniform float mist;
varying vec2 gasUV; varying float gasAlpha; varying float seed;
void main(){float edge=max(0.0,1.0-abs(gasUV.x*2.0-1.0));
float span=mix(pow(1.0-gasUV.y,1.2),sin(3.14159265*gasUV.y),mist);
float ripple=.86+.14*sin(gasUV.y*33.0-clock*28.0+seed);
float alpha=pow(edge,1.6)*span*ripple*gasAlpha*mix(.42,.14,mist);
if(alpha<.003)discard;gl_FragColor=vec4(gasColor,alpha);}`});
 return m;
}
function batch(count,mist){
 const geometry=ribbonGeometry();geometry.setAttribute('gasStrength',new THREE.InstancedBufferAttribute(new Float32Array(count),1).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('gasSeed',new THREE.InstancedBufferAttribute(Float32Array.from({length:count},(_,i)=>i*2.399963),1));
 const mesh=new THREE.InstancedMesh(geometry,material(mist),count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.name=mist?'RoadsterColdGasMist':'RoadsterColdGasStreams';mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=2;mesh.userData.roadsterGas=true;mesh.visible=false;mesh.raycast=()=>{};return mesh;
}
export function attachRoadsterJets(v){
 if(v?.roadsterJets)return v.roadsterJets;
 if(!trimOf(v)||!v.chassis?.add||!v.roadsterRig)return null;
 const specs=ROADSTER_JET_NOZZLES.filter(s=>s.kind==='rear'||trimOf(v)==='rocket'),group=new THREE.Group();group.name='RoadsterColdGas';group.userData.roadsterGas=true;group.visible=false;
 const streams=batch(specs.length,false),mist=batch(specs.length*3,true);group.add(streams,mist);v.chassis.add(group);
 const state=v.roadsterJets={group,streams,mist,specs,clock:0,active:0,disposed:false,matrix:new THREE.Matrix4(),position:new THREE.Vector3(),scale:new THREE.Vector3(),
  mounts:specs.map(s=>({position:new THREE.Vector3(...s.position),direction:new THREE.Vector3(...s.direction),quaternion:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...s.direction))})),strengths:new Float32Array(specs.length)};
 return state;
}
export function clearRoadsterJets(v){
 const state=v?.roadsterJets;if(!state)return;
 state.active=0;state.group.visible=false;state.streams.visible=false;state.mist.visible=false;state.strengths.fill(0);
 for(const mesh of[state.streams,state.mist]){mesh.geometry.attributes.gasStrength.array.fill(0);mesh.geometry.attributes.gasStrength.needsUpdate=true;}
}
export function updateRoadsterJets(v,dt=1/60){
 const any=allowed(v)&&ROADSTER_JET_NOZZLES.some(spec=>roadsterNozzleStrength(v,spec)>.008);
 if(!any){clearRoadsterJets(v);return;}
 const state=attachRoadsterJets(v);if(!state)return;
 state.clock=(state.clock+Math.max(0,Math.min(.1,finite(dt))))%3600;state.active=0;
 const coreAlpha=state.streams.geometry.attributes.gasStrength,puffAlpha=state.mist.geometry.attributes.gasStrength;
 for(let i=0;i<state.specs.length;i++){
  const spec=state.specs[i],mount=state.mounts[i],strength=roadsterNozzleStrength(v,spec),active=strength>.008;
  state.strengths[i]=active?strength:0;if(active)state.active++;
  const length=active?.16+1.26*Math.sqrt(strength):0,radius=spec.radius*(1+strength*.4);
  state.position.copy(mount.position);state.scale.set(radius,radius,length);state.matrix.compose(state.position,mount.quaternion,state.scale);state.streams.setMatrixAt(i,state.matrix);coreAlpha.array[i]=active?Math.sqrt(strength):0;
  for(let p=0;p<3;p++){
   const index=i*3+p,age=(state.clock*(2.3+strength*.9)+p/3+i*.137)%1,spread=radius*(1.3+age*4.5),distance=length*(.28+age*.90);
   state.position.copy(mount.position).addScaledVector(mount.direction,distance);state.scale.set(spread,spread,spread*2);state.matrix.compose(state.position,mount.quaternion,state.scale);state.mist.setMatrixAt(index,state.matrix);puffAlpha.array[index]=active?strength*Math.sin(Math.PI*age):0;
  }
 }
 state.group.visible=state.active>0;state.streams.visible=state.group.visible;state.mist.visible=state.group.visible;
 for(const mesh of[state.streams,state.mist]){mesh.instanceMatrix.needsUpdate=true;mesh.geometry.attributes.gasStrength.needsUpdate=true;mesh.material.uniforms.clock.value=state.clock;}
}
export function disposeRoadsterJets(v){
 const state=v?.roadsterJets;if(!state)return;
 clearRoadsterJets(v);state.disposed=true;state.group.removeFromParent();
 for(const mesh of[state.streams,state.mist]){mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();}
 delete v.roadsterJets;
}

// Offline tools/tests may inspect the same exact mount/intensity mapping. The
// live update above keeps bounded typed arrays instead of allocating this list.
export function roadsterJetSnapshot(v){return ROADSTER_JET_NOZZLES.map(spec=>({id:spec.id,position:[...spec.position],direction:[...spec.direction],radius:spec.radius,strength:roadsterNozzleStrength(v,spec)}));}
