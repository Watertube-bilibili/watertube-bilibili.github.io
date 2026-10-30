// One registry per contact pass. Each vehicle has exactly one physical owner;
// each unordered pair is solved once, including mixed motorcycle/Rocket bodies.
import {Vector3} from './vendor/three.module.js';
import {collideBodies} from './browser-rigidbody-contacts.js';
export class BrowserBodyRegistry {
 constructor(adapters,{collide=collideBodies}={}){this.adapters=adapters;this.collide=collide;this.entries=new Map();this.pairs=new Map();this.solvedPairs=0;}
 owner(v){const owners=this.adapters.filter(a=>a.states.has(v));if(owners.length>1)throw Error('Vehicle has multiple rigid-body owners');return owners[0]??null;}
 hasRigid(v){return !!this.owner(v);}
 entry(v){let r=this.entries.get(v);if(r?.owner)return r;const owner=this.owner(v),state=owner?.states.get(v),fallback=this.adapters[0];if(!owner&&!fallback)throw Error('No collision body provider');r={owner,state,body:state?.body??fallback.planarBody(v),previous:state?.previous??fallback.planarBody(v,true)};this.entries.set(v,r);return r;}
 pair(a,b){if(a===b)throw Error('Self collision pair');let seen=this.pairs.get(a);if(seen?.has(b)||this.pairs.get(b)?.has(a))throw Error('Duplicate collision pair');if(!seen)this.pairs.set(a,seen=new Set());seen.add(b);this.solvedPairs++;
  const A=this.entry(a),B=this.entry(b),hit=this.collide(A.body,B.body,A.previous,B.previous);if(!hit)return null;
  for(const[v,r]of[[a,A],[b,B]]){if(r.owner)r.owner.publish(v,r.state);else{const body=r.body,f=new Vector3(0,0,-1).applyQuaternion(body.orientation);v.pos.x=body.position.x;v.pos.z=body.position.z;v.yaw=Math.atan2(-f.x,-f.z);v.speed=body.velocity.dot(f);v.yawRate=body.angularVelocity.y;v.slipVelocityX=body.velocity.x+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=body.velocity.z+Math.cos(v.yaw)*v.speed;}}
  // Route each side through one damage queue only; planar cars use the rigid
  // counterpart's queue, never both adapters' queues.
  (A.owner??B.owner).remember(a,b,hit);(B.owner??A.owner).remember(b,a,{...hit,normal:hit.normal.clone().negate()});return hit;
 }
}
