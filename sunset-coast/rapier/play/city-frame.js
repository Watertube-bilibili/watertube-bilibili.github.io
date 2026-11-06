import {updateMotorcycleRider} from './motorcycle-rider.js';
import * as THREE from './vendor/three.module.js';
import {PHYSICS_STEP,sampleVehiclePose,applyVehiclePose} from './render-motion.js';
import {streamPopulation} from './population-stream.js';
import {updateVehicleInstruments} from './vehicle-instruments.js';
import {warmVehicleDamage} from './vehicle-damage.js';
const clamp=THREE.MathUtils.clamp;
const $=id=>document.getElementById(id);
export function runCityFrame(now,physicsFrame=false){
 if(this.citySession?.stopped)return;
 this.physics?.advance?.(now);
 if(this.physics?.failed){this.onPhysicsFailure(this.physics.error??Error("Rapier 物理步骤失败"));return;}
 if(this.citySession?.stopped)return;
 // A backend that supplies render frames owns the RAF chain.
 if(this.physics?.drivesRender&&!physicsFrame)return;
 const delta=this.lastFrame===null?PHYSICS_STEP:clamp((now-this.lastFrame)/1000,0,.1);this.lastFrame=now;
 this.fps=THREE.MathUtils.damp(this.fps,1/Math.max(delta,.001),2,delta);
 if(!this.paused){
  if(!this.physics){this.world.update(this.position);streamPopulation(this);this.accumulator+=delta;
  while(this.accumulator+1e-9>=PHYSICS_STEP){this.time+=PHYSICS_STEP;this.beginVehicleStep();this.flight?.update(PHYSICS_STEP);this.robotaxi?.update(PHYSICS_STEP);this.updatePlayer(PHYSICS_STEP);this.updateTraffic(PHYSICS_STEP);this.resolveVehicleContacts();this.updatePedestrians(PHYSICS_STEP);this.updateWorld(PHYSICS_STEP);this.accumulator=Math.max(0,this.accumulator-PHYSICS_STEP);}}
  this.sensorClock+=delta;
  if(this.inCar&&!this.flight?.active&&(this.fcwEnabled!==false||this.aebEnabled!==false||this.autopilot||this.cockpit?.isOpen||!$('sensor-panel').hidden)&&this.sensorClock+.0001>=(this.sensorInterval??.12)){
   this.sensor.capture(this.vehicle,[this.vehicle.root,this.vehicle.trailer?.root,this.person.root,this.routeLine,this.marker,this.pickupBeacon?.root,this.taxiDestinationBeacon?.root].filter(Boolean),this.time);this.sensorClock-=(this.sensorInterval??.12)*Math.max(1,Math.floor((this.sensorClock+.0001)/(this.sensorInterval??.12)));this.ui.updateSensor();
  }
  if(this.time-this.lastSave>45)this.save(false);
  updateVehicleInstruments(this.vehicle,this.time,{autopilot:this.autopilot,game:this});this.ui.updateFrame();
 }
 const alpha=this.physics?this.physics.interpolationAlpha():this.accumulator/PHYSICS_STEP,pose=sampleVehiclePose(this.vehicle,alpha);
 if(!this.paused){if(this.aircraft?.active){const plane=this.aircraft.aircraft,restorePlane=applyVehiclePose(plane,sampleVehiclePose(plane,alpha));try{const camera=this.aircraft.cameraPose(this.cameraMode);if(camera){if(this.cameraRecentering){this.cameraYaw*=Math.exp(-delta*8);if(Math.abs(this.cameraYaw)<.001){this.cameraYaw=0;this.cameraRecentering=false;}}if(this.cameraMode===0&&this.cameraYaw)camera.position.sub(plane.pos).applyAxisAngle(new THREE.Vector3(0,1,0),this.cameraYaw).add(plane.pos);this.camera.position.copy(camera.position);this.camera.up.copy(camera.up);this.camera.lookAt(camera.look);if(this.camera.fov!==camera.fov){this.camera.fov=camera.fov;this.camera.updateProjectionMatrix();}this.cameraLook=camera.look.clone();this.sun.position.copy(plane.pos).add(new THREE.Vector3(-90,120,-170));this.sun.target.position.copy(plane.pos);this.sunDisc.position.copy(plane.pos).add(new THREE.Vector3(-330,125,-680));}}finally{restorePlane();}}else{this.camera.up.set(0,1,0);this.updateCamera(delta,pose);}}
 // Rendering is a transaction: never leave interpolated coordinates in physics,
 // navigation, sensors or saves, even if a render call fails.
 const restores=[];
 try{for(const v of this.physics?this.allVehicles():[this.vehicle])restores.push(applyVehiclePose(v,v===this.vehicle?pose:sampleVehiclePose(v,alpha)));updateMotorcycleRider(this);this.updateVehicleLighting(delta);this.renderer.render(this.scene,this.camera);this.brakeCloseup?.update();this.brakeCloseup?.render(this.renderer);}finally{for(const restore of restores)restore();updateMotorcycleRider(this);}
 this.roadsterUI?.update();this.aircraftUI?.update();this.cockpit?.update(delta);if(!this.paused&&delta<.04)warmVehicleDamage(this.vehicle,{budgetMs:this.performanceProfile?.mobile?1:2,maxSteps:this.performanceProfile?.mobile?4:8});this.frameCount++;if(!this.citySession?.stopped&&!this.physics?.drivesRender)requestAnimationFrame(this.loop);
 }
