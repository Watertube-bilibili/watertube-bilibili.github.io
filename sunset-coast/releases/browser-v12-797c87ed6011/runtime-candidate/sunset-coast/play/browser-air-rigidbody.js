// Experimental shared-convention wrench integrator. Angular algorithm copied unchanged
// from independently checked browser-motorcycle-rigidbody.js; no motorcycle forces.
// Caller must solve contacts. This file alone is NOT flight gameplay.
import {Vector3 as V,Quaternion as Q} from './vendor/three.module.js';
export function integrateAirWrench(body,wrench,dt){
 if(!Number.isFinite(dt)||dt<=0||dt>1/60+1e-10||!Number.isFinite(body.config.mass)||body.config.mass<=0)throw Error('Invalid rigid timestep/mass');
 const all=[...body.position.toArray(),...body.velocity.toArray(),...body.orientation.toArray(),...body.angularVelocity.toArray(),...body.inertia.toArray(),...wrench.force.toArray(),...wrench.torque.toArray()];
 if(!all.every(Number.isFinite)||body.inertia.toArray().some(x=>x<=0)||Math.abs(body.orientation.length()-1)>1e-6)throw Error('Invalid rigid state/wrench');
 const b={...body,position:body.position.clone(),velocity:body.velocity.clone(),orientation:body.orientation.clone(),angularVelocity:body.angularVelocity.clone()};
 b.velocity.addScaledVector(wrench.force,dt/body.config.mass).addScaledVector(new V(0,-9.81,0),dt);b.position.addScaledVector(b.velocity,dt);
 integrateRotation(b,wrench.torque,dt);
 if(![...b.position.toArray(),...b.velocity.toArray(),...b.orientation.toArray(),...b.angularVelocity.toArray()].every(Number.isFinite))throw Error('Nonfinite rigid result');
 Object.assign(body,b);return body;
}
function integrateRotation(b,torque,dt){
 const q=b.orientation,L=b.angularVelocity.clone().applyQuaternion(q.clone().invert()).multiply(b.inertia).applyQuaternion(q);
 const minInertia=Math.min(...b.inertia.toArray());
 const count=Math.max(1,Math.ceil(dt*(L.length()+torque.length()*dt)/minInertia/.05));
 if(count>1024)throw Error('Motorcycle angular integration budget exceeded');
 const h=dt/count;
 const omegaAt=(orientation,momentum)=>momentum.clone().applyQuaternion(orientation.clone().invert()).divide(b.inertia).applyQuaternion(orientation);
 const rotate=(start,omega,duration)=>{const n=omega.length();return n>1e-14?start.clone().premultiply(new Q().setFromAxisAngle(omega.clone().divideScalar(n),n*duration)).normalize():start.clone();};
 for(let i=0;i<count;i++){
  const nextL=L.clone().addScaledVector(torque,h).multiplyScalar(Math.exp(-.3*h));
  const midL=L.clone().add(nextL).multiplyScalar(.5);let omega=omegaAt(q,midL);
  for(let iteration=0;iteration<8;iteration++)omega=omegaAt(rotate(q,omega,h*.5),midL);
  q.copy(rotate(q,omega,h));L.copy(nextL);
 }
 b.angularVelocity.copy(omegaAt(q,L));
}
