// Rapier tire/suspension force adapter, derived from the existing Roadster force law.
// Uses authored axle positions for all car models; Rapier alone integrates poses.
import {Vector3 as V} from './vendor/three.module.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),approach=(x,y,d)=>x+clamp(y-x,-d,d),num=(x,d=0)=>Number.isFinite(x)?x:d;
const limit=(x,y,r)=>{const s=Math.min(1,r/(Math.hypot(x,y)||1));return[x*s,y*s];};
export function createRoadsterWheels(config,speed=0){
 const radii=Array.from({length:4},(_,i)=>clamp(config.wheelOffsets?.[i]?.[3]??.389,.15,1));
 return {radii,angularSpeeds:radii.map(r=>speed/r),angles:[0,0,0,0],slipRatios:[0,0,0,0],normalLoads:[0,0,0,0],forces:[[0,0],[0,0],[0,0],[0,0]],contacts:[false,false,false,false],tcsActive:[false,false,false,false],freeSpeed:Math.max(20,config.maxSpeed+15),manualPressure:0,steer:0,drift:0,compressions:[0,0,0,0],brakeAmount:0,supportCount:0};
}
function contact(t,i,long,lat,drive,brake,load,tireLimit,grip,quarter,dt,tcs){
 t.contacts[i]=true;t.normalLoads[i]=load;const r=t.radii[i],old=t.angularSpeeds[i],slipScale=Math.max(2,Math.abs(long));t.slipRatios[i]=(old*r-long)/slipScale;const request=drive;
 if(tcs){const budget=Math.min(Math.sqrt(Math.max(0,tireLimit*tireLimit-Math.min(Math.abs(lat),tireLimit)**2))*.9,quarter*grip*.9);drive=clamp(drive,-budget,budget);const slip=t.slipRatios[i]*Math.sign(drive);if(slip>.12)drive*=clamp(.1/slip,0,1);t.tcsActive[i]=Math.abs(drive)<Math.abs(request)-.01;}
 const torque=(drive*r+2*drive/Math.max(1,quarter)/r)*clamp((t.freeSpeed-Math.abs(old*r))/10,0,1);let free=old+torque/2*dt,locked=false,combined=[0,0];const brakeTorque=brake*r;
 if(tireLimit>.001){const bodyCompliance=slipScale/(tireLimit/.1)+dt/Math.max(1,quarter),compliance=bodyCompliance+dt*r*r/2;
  if(brakeTorque>0){const lockedForce=limit(-long/bodyCompliance,lat,tireLimit),holding=free*2/dt-lockedForce[0]*r;if(Math.abs(holding)<=brakeTorque){combined=lockedForce;locked=true;}else free-=Math.sign(holding)*brakeTorque/2*dt;}
  if(!locked)combined=limit((free*r-long)/compliance,lat,tireLimit);
 }else free=approach(free,0,brakeTorque/2*dt);
 t.angularSpeeds[i]=locked?0:free-combined[0]*r/2*dt;t.angles[i]+=(old+t.angularSpeeds[i])*.5*dt;t.forces[i]=combined;return combined;
}
export function rapierWheelWrench(b,t,c,dt,surface,airState){
 if(!(Number.isFinite(dt)&&dt>0&&dt<=1/60+1e-10)||typeof surface?.raycast!=='function')throw Error('Invalid wheel step');
 const cfg=b.config,m=cfg.mass,q=b.orientation,up=new V(0,1,0).applyQuaternion(q),f=new V(0,0,-1).applyQuaternion(q),right=new V(1,0,0).applyQuaternion(q),speed=b.velocity.dot(f);
 let throttle=clamp(num(c.throttle),-1,1),requested=c.manualBrakeBroken?0:clamp(num(c.manualBrake),0,1),electronic=clamp(num(c.electronicBrake),0,1);if(c.manualBrakeBroken)t.manualPressure=0;
 const start=t.manualPressure,rate=requested>start?24:30;t.manualPressure=approach(start,requested,rate*dt);const ramp=Math.min(dt,Math.abs(requested-start)/rate),average=(start+t.manualPressure)*.5*ramp/dt+requested*(1-ramp/dt);t.brakeAmount=Math.max(t.manualPressure,electronic);
 const hand=c.handbrake?1:0;t.drift=approach(t.drift,Math.abs(speed)>2?hand:0,(hand?5:2.2)*dt);
 const grip=clamp(cfg.lateralGrip,3,18),brake=Math.max(Math.max(average,electronic)*Math.min(8.4,grip*.96),hand*5.2),broken=c.axleBroken===true,side=broken?clamp(num(c.axleSide),-1,1):0;
 let power=cfg.power*(broken?.18:1);if(num(c.condition,100)<=0||num(c.battery,100)<=0)power=0; // no phantom 5% EV propulsion at zero energy
 let drive=brake<=.001?throttle*power:0;const planar=new V(b.velocity.x,0,b.velocity.z),ps=planar.length();let resistance=.14*Math.tanh(2*ps)+.0004*ps*ps+(broken?1.6*Math.tanh(2*ps):0);
 if(airState?.mode==='road'&&up.y>.65)resistance+=(airState.wing??0)*ps*ps*(Math.max(num(c.manualBrake),electronic)>.15?.0008:.00012);
 if(drive){const direction=Math.sign(drive),max=broken?3:direction>0?cfg.maxSpeed:9,drag=resistance*(ps?planar.clone().normalize().dot(f):0)*direction;drive=direction*Math.min(Math.abs(drive),Math.max(0,(max-speed*direction)*4+drag));}
 const wb=cfg.wheelBase??2.9,track=cfg.track??1.65,available=Math.sqrt(Math.max(.25,grip*grip-Math.min(grip,brake)**2)),steerLimit=Math.min(cfg.maxSteer??.55,Math.atan(available*wb/Math.max(1,speed*speed))),target=clamp(num(c.steer)*(broken?.45:1),-steerLimit,steerLimit);t.steer=approach(t.steer,target,(Math.abs(target)<.005||Math.sign(target)!==Math.sign(t.steer)?2.6:1.65)*dt);
 const force=new V(),torque=new V(),apply=(v,r)=>{force.add(v);torque.add(r.clone().cross(v));},velocityAt=r=>b.velocity.clone().add(b.angularVelocity.clone().cross(r));
 t.supportCount=0;t.contacts.fill(false);t.slipRatios.fill(0);t.normalLoads.fill(0);t.tcsActive.fill(false);t.compressions.fill(0);t.forces=t.forces.map(()=>[0,0]);const tcs=c.roadsterTcs!==false;
 for(let i=0;i<4;i++){
  const axle=i<2?-1:1; // native order front left,right;rear left,right
  const wheelSide=i%2===0?-1:1,geometry=cfg.wheelOffsets?.[i],wx=geometry?.[0]??wheelSide*track*.5,wz=geometry?.[2]??axle*wb*.5,mount=new V(wx,.1,wz).applyQuaternion(q),origin=b.position.clone().add(mount);
  let hit=surface.raycast(origin,up.clone().negate(),.9);
  if(hit&&geometry?.length>=5&&up.y>.5){const compression=1-origin.distanceTo(hit.position),center=origin.clone().addScaledVector(up,geometry[4]-.82+compression-.18),foot=surface.raycast(new V(center.x,origin.y,center.z),new V(0,-1,0),.9/up.y);if(foot&&foot.normal.dot(up)>=.3&&foot.position.y>hit.position.y+.0001)hit=foot;}
  if(!hit||hit.normal.dot(up)<.3)continue;const compression=Math.max(0,1-origin.clone().sub(hit.position).dot(up));if(compression<=0)continue;
  t.supportCount++;t.compressions[i]=compression;const normal=hit.normal.clone().normalize(),compressionSpeed=-velocityAt(mount).dot(normal),stop=Math.max(0,compression-.225),support=clamp((9.81*.25+(compression-.18)*32+compressionSpeed*3.8+stop*200+Math.min(1,stop/.02)*Math.max(0,compressionSpeed)*2)*m,0,m*9.81*.8);apply(normal.clone().multiplyScalar(support),mount);
  const damaged=broken&&axle<0&&wheelSide===clamp(num(c.axleSide),-1,1),angle=(axle<0?t.steer:0)+(damaged?wheelSide*.24:0),tf=f.clone().applyAxisAngle(up,angle);tf.addScaledVector(normal,-tf.dot(normal)).normalize();const tr=tf.clone().cross(normal),offset=new V(wx,-.15,wz).applyQuaternion(q),vel=velocityAt(offset),long=vel.dot(tf),lat=vel.dot(tr),tireLimit=support*grip*(1-(axle>0?.82:.15)*t.drift)/9.81*(damaged?.3:1),brakeForce=Math.min(m*brake*.25,Math.abs(long)*m*.25/dt),combined=contact(t,i,long,-lat*m*2.3,m*drive*.25,brakeForce,support,tireLimit,grip,m*.25,dt,tcs);apply(tf.multiplyScalar(combined[0]).addScaledVector(tr,combined[1]),offset);
 }
 for(let i=0;i<4;i++)if(!t.contacts[i]){const old=t.angularSpeeds[i],r=t.radii[i],torque=(tcs?0:m*drive*.25*r)*clamp((t.freeSpeed-Math.abs(old*r))/10,0,1);t.angularSpeeds[i]=approach(old+torque/2*dt,0,m*brake*.25*r/2*dt);t.angles[i]+=(old+t.angularSpeeds[i])*.5*dt;t.tcsActive[i]=tcs&&Math.abs(m*drive*.25)>.01;}
 if(ps>.001)force.addScaledVector(planar.normalize(),-m*Math.min(resistance,ps/dt));
 if(t.supportCount&&up.y>.65&&airState?.mode==='road'){let down=Math.min(2,ps*ps*.0014)*(airState.wing??0);if(airState.trim==='performance'&&num(c.condition,100)>0&&num(c.battery,100)>0&&ps>4)down+=.45;force.y-=m*down;}
 return{force,torque};
}
