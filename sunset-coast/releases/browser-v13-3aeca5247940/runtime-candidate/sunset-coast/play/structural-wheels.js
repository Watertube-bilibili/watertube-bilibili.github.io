import * as THREE from './vendor/three.module.js';
const states=new WeakMap();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function wheelDamageState(v){
 let s=states.get(v);if(s)return s;
 if(!v.structuralWheelPreview)return null; // Only audited opt-in S. Roadsters remain byte/behaviour unchanged.
 v.root.updateMatrixWorld(true);const inverse=v.root.matrixWorld.clone().invert();
 s=v.wheels.map(w=>({wheel:w,index:(w.front?0:2)+(w.side>0?1:0),center:new THREE.Vector3().setFromMatrixPosition(w.pivot.matrixWorld).applyMatrix4(inverse),stress:0,directStress:0,bend:0,flat:0,broken:false,detached:false,restParent:w.pivot.parent,restPosition:(w.structuralRestPosition??w.pivot.position).clone(),restQuaternion:(w.structuralRestQuaternion??w.pivot.quaternion).clone(),meshes:[],events:new Map()}));
 states.set(v,s);return s;
}
export function impactStructuralWheels(v,impact){
 const s=wheelDamageState(v);if(!s||!Array.isArray(impact?.point)||!impact.point.every(Number.isFinite)||!Number.isFinite(impact.normalImpulse)||impact.normalImpulse<=0||!Number.isFinite(impact.normalSpeed)||impact.normalSpeed<=1.2||impact.eventId==null)return false;
 const points=(Array.isArray(impact.points)&&impact.points.length?impact.points:[impact.point]).filter(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite));
 if(!points.length)return false;
 for(const q of s){if(q.detached)continue;
  const distance=Math.min(...points.map(p=>q.center.distanceTo(new THREE.Vector3(...p))));
  const direct=distance>.8?0:Math.exp(-distance*distance/(2*.43*.43));
  // Chassis impact transfers a bounded load to the struck axle, without pretending the tire was struck.
  const axleImpact=points.some(p=>Math.abs(p[2]-q.center.z)<1.35&&Math.abs(p[0]-q.center.x)<1.6);
  const transferred=axleImpact&&impact.normalSpeed>8?.22:0;
  const impulse=impact.normalImpulse*Math.max(direct,transferred),previous=q.events.get(impact.eventId)??0;
  if(impulse<=previous)continue;q.events.set(impact.eventId,impulse);if(q.events.size>32)q.events.delete(q.events.keys().next().value);
  q.stress=Math.min(1e6,q.stress+impulse-previous);q.directStress=Math.min(1e6,q.directStress+(impulse-previous)*(direct>0?1:0));
  q.flat=clamp((q.directStress-1800)/55000,0,.16);q.bend=clamp((q.stress-4500)/60000,0,.2);q.broken=q.stress>=14000;q.wheel.structuralTireScale=1-q.flat;
  if(!q.meshes.length)q.wheel.spin.traverse(mesh=>{if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;const name=String(mesh.name);if(!/Tire|WheelRubber|WheelMetal|BrakeDisc|Rim|Tread|Spoke/i.test(name))return;const source=mesh.geometry,owned=source.clone();mesh.geometry=owned;owned.computeBoundingBox();const center=owned.boundingBox.getCenter(new THREE.Vector3());mesh.updateMatrix();const toSpin=mesh.matrix.clone(),fromSpin=toSpin.clone().invert();const radialCenter=center.clone().applyMatrix4(toSpin);q.meshes.push({mesh,source,owned,center:radialCenter,toSpin,fromSpin,rest:owned.attributes.position.array.slice(),tire:/Tire|Rubber|Tread/i.test(name)});});
  for(const m of q.meshes){const p=m.owned.attributes.position;for(let i=0;i<p.count;i++){const j=i*3,point=new THREE.Vector3(m.rest[j],m.rest[j+1],m.rest[j+2]).applyMatrix4(m.toSpin),crush=m.tire?q.flat:q.bend*.35;point.y=m.center.y+(point.y-m.center.y)*(1-crush);if(m.tire)point.z=m.center.z+(point.z-m.center.z)*(1-crush);point.applyMatrix4(m.fromSpin);p.setXYZ(i,point.x,point.y,point.z);}p.needsUpdate=true;m.owned.computeVertexNormals();m.owned.computeBoundingSphere();}
 }
 return true;
}
export function structuralWheelControls(v){const s=states.get(v)??[];const broken=s.find(q=>q.broken),total=s.reduce((n,q)=>n+q.flat,0);return {flat:[0,1,2,3].map(i=>s.find(q=>q.index===i)?.flat??0),toe:[0,1,2,3].map(i=>{const q=s.find(q=>q.index===i);return q?q.bend*q.wheel.side*.5:0;}),broken:!!broken,side:broken?.wheel.side??0,throttleScale:clamp(1-total*.3,.3,1),steeringScale:clamp(1-s.filter(q=>q.wheel.front).reduce((n,q)=>n+q.bend,0),.4,1),steeringPull:clamp(s.filter(q=>q.wheel.front).reduce((n,q)=>n+q.bend*q.wheel.side*.3,0),-.08,.08),detachedWheels:v.nativeWheelDamageSupported?s.filter(q=>q.stress>=22000).map(q=>q.index):[]};}
export function applyStructuralWheelVisuals(v){for(const q of states.get(v)??[]){if(q.detached||q.wheel.pivot.userData.structuralDetached)continue;const w=q.wheel;w.pivot.position.x=q.restPosition.x+w.side*q.bend*.18;w.pivot.rotation.z=w.side*q.bend;w.pivot.rotation.y+=w.side*(q.bend*.5+(q.broken?.18:0));}}
export function acceptNativeWheelSnapshot(v,state,scene){
 v.nativeWheelDamageSupported=state.wheelDamageVersion===1;if(!v.nativeWheelDamageSupported||state.wheelRepairSerial!==(v.structuralWheelRepairSerial??0)||state.id!==v.physicsId)return;
 v.nativeDetachedWheels=Array.isArray(state.detachedWheels)?state.detachedWheels.filter(i=>Number.isInteger(i)&&i>=0&&i<4):[];
 v.nativeWheelDebris=state.wheelDebris??[];v.nativeWheelSupportCount=state.wheelSupportCount;
 for(const q of states.get(v)??[]){if(!v.nativeDetachedWheels.includes(q.index)||state.wheelCompressions?.[q.index]!==0)continue;const d=state.wheelDebris?.find(d=>d.index===q.index);
  if(d&&Array.isArray(d.pos)&&d.pos.length===3&&d.pos.every(Number.isFinite)&&Array.isArray(d.quat)&&d.quat.length===4&&d.quat.every(Number.isFinite)){
   if(q.wheel.pivot.parent!==scene)scene.attach(q.wheel.pivot);q.detached=true;q.wheel.pivot.userData.structuralDetached=true;
   q.wheel.pivot.visible=true;q.wheel.pivot.position.fromArray(d.pos);q.wheel.pivot.quaternion.fromArray(d.quat);
  }else{if(q.wheel.pivot.parent!==scene)scene.attach(q.wheel.pivot);q.detached=true;q.wheel.pivot.userData.structuralDetached=true;q.wheel.pivot.visible=false;}
 }
}
export function repairStructuralWheels(v){v.structuralWheelRepairSerial=(v.structuralWheelRepairSerial??0)+1;for(const q of states.get(v)??[]){for(const m of q.meshes){m.mesh.geometry=m.source;m.owned.dispose();}q.restParent.add(q.wheel.pivot);q.wheel.pivot.position.copy(q.restPosition);q.wheel.pivot.quaternion.copy(q.restQuaternion);q.wheel.pivot.visible=true;delete q.wheel.pivot.userData.structuralDetached;delete q.wheel.structuralTireScale;}states.delete(v);v.nativeDetachedWheels=[];v.nativeWheelDebris=[];}
export function structuralWheelStats(v){return(states.get(v)??[]).map(q=>({index:q.index,stress:q.stress,directStress:q.directStress,flat:q.flat,bend:q.bend,broken:q.broken,detached:q.detached}));}

export function unloadStructuralWheels(v){for(const q of states.get(v)??[])if(q.detached||structuralWheelControls(v).detachedWheels.includes(q.index))q.wheel.pivot.visible=false;v.nativeWheelDebris=[];}
