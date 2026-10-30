import {updateMotorcycleVisuals} from './motorcycle-asset.js';
import {applyStructuralWheelVisuals} from './structural-wheels.js';
import {nativeRoadsterWheelAngle} from './roadster-tire-telemetry.js';
import {parkingBrakeControls} from './touch-transmission.js';
import {cargoEffects} from './cargo-career.js';
import {stepAxleFault,axleFaultEffects,updateAxleFaultVisuals} from './axle-fault.js';
import {updateRoadsterVisuals,resetRoadsterControls} from './roadster-controls.js';
import {stepBrakeFault} from './brake-fault.js';
// Shared by manual driving, traffic and Pilot. Angles are road-wheel radians;
// positive steering turns toward the vehicle's left, whose forward axis is -Z.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const approach = (current, target, amount) => current + clamp(target - current, -amount, amount);
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

export const MAX_BRAKE_DECELERATION = 8.4;
export function coastingDrag(speed) {
  const s=Math.abs(speed);
  return .14*Math.tanh(2*s)+.0004*s*s;
}
export function effectiveBrakeDeceleration(v) {
  return Math.min(MAX_BRAKE_DECELERATION,(v.lateralGrip??9.8)*.96)*cargoEffects(v).brakeScale;
}
export function vehicleLongitudinalForces(v,speed=v.speed) {
  return {dragDeceleration:coastingDrag(speed),serviceBrakeDeceleration:effectiveBrakeDeceleration(v),handbrakeDeceleration:5.2};
}
export function resetVehicleDynamics(v) {
  resetRoadsterControls(v);
  v.physicsResetSerial=(v.physicsResetSerial??0)+1;if(v.physicsQuaternion){v.physicsQuaternion.set(0,Math.sin(v.yaw/2),0,Math.cos(v.yaw/2));v.root?.quaternion.copy(v.physicsQuaternion);}
  delete v.collisionPrevious; // Teleports must not sweep across the old world position.
  v.slipVelocityX=0;v.slipVelocityZ=0;v.lateralSpeed=0;v.slipAngle=0;
  v.driftAmount=0;v.manualBrakePressure=0;v.longitudinalAcceleration=0;
}

function pressureStep(previous,target,dt) {
  // A physical pedal should bite promptly: full pressure builds in 42 ms and
  // releases in 33 ms. This changes actuator response, never the bounded tire
  // force below. Pilot/AEB still use their independent electronic actuator.
  const rate=target>previous?24:30,next=approach(previous,target,rate*dt);
  const end=Math.abs(target-next)<1e-9?target:next;
  const rampTime=Math.min(dt,Math.abs(target-previous)/rate);
  // Integrate the ramp itself, including a target reached part-way through a
  // step. Braking distance should not depend on a 30/60/120 Hz update rate.
  const average=dt>0?(previous+end)*.5*rampTime/dt+target*(1-rampTime/dt):end;
  return {end,average};
}

export function stepVehicleMotion(vehicle, input, dt) {
 input = parkingBrakeControls(vehicle, input);
  const v = vehicle;
  const oldSpeed = v.speed;
  stepAxleFault(v,input,dt);const axle=axleFaultEffects(v);
  let throttle = clamp(input.throttle, -1, 1);
  // Pilot commands the electronic brake actuator, never the physical pedal.
  // A snapped manual pedal leaves electronic braking and handbrake available.
  const requested = typeof input.brake === 'number'
    ? clamp(Number.isFinite(input.brake) ? input.brake : 0, 0, 1)
    : input.brake ? 1 : 0;
  const electronic = input.brakeSource === 'pilot';
  let pedalAmount = electronic ? 0 : requested;
  let electronicAmount = Math.max(electronic ? requested : 0,
    clamp(Number.isFinite(input.electronicBrake)?input.electronicBrake:0,0,1));
  if (throttle < 0 && v.speed > 1.2) {
    if(electronic)electronicAmount=Math.max(electronicAmount,-throttle);
    else pedalAmount=Math.max(pedalAmount,-throttle);
    throttle=0;
  }
  v.requestedBrakeAmount = pedalAmount;
  const manualAmount = stepBrakeFault(v, pedalAmount, dt);
  const manualPressure=pressureStep(v.brakeFault?.broken?0:(v.manualBrakePressure??0),manualAmount,dt);
  // Fracture cuts the manual circuit immediately, including pressure that had
  // already built. The separate electronic actuator is still available.
  v.manualBrakePressure=v.brakeFault?.broken?0:manualPressure.end;
  const brakeAmount = Math.max(v.manualBrakePressure,electronicAmount);
  const averageBrakeAmount=Math.max(v.brakeFault?.broken?0:manualPressure.average,electronicAmount);
  v.manualBrakeAmount=manualAmount;
  v.electronicBrakeAmount=electronicAmount;
  v.brakeSource=electronic?'pilot':'manual';
  const handbrake = input.handbrake ? 1 : 0;
  v.handbrake = !!handbrake;
  // A wreck can coast and be braked, but neither driver nor Pilot can power it.
  v.propulsionDisabled = Number.isFinite(v.condition) && v.condition <= 0;
  const power = v.propulsionDisabled ? 0 : v.model.power * cargoEffects(v).driveScale * axle.powerScale * (v.battery > 0 ? 1 : .05);
  const forces=vehicleLongitudinalForces(v),grip=v.lateralGrip??9.8;
  const brakeForce=Math.max(averageBrakeAmount*forces.serviceBrakeDeceleration,handbrake*forces.handbrakeDeceleration);
  // A brake takes priority over propulsion. Forces are bounded accelerations,
  // not a percentage of speed removed every frame: high-speed stops take room.
  const driveForce=brakeForce>0||(Math.abs(v.speed)>=axle.maxSpeed&&Math.sign(throttle)===Math.sign(v.speed))?0:clamp(throttle*power,-grip*.9,grip*.9);
  v.speed += driveForce*dt;
  const drag=coastingDrag((Math.abs(oldSpeed)+Math.abs(v.speed))*.5)+axle.drag*Math.tanh(Math.abs(v.speed)*2);
  v.speed=approach(v.speed,0,(drag+brakeForce)*dt);
  v.speed = clamp(v.speed, -9, v.model.max);
  if (Math.abs(v.speed) < .04 && Math.abs(throttle) < .01 && brakeForce === 0) v.speed = 0;

  const speed = Math.abs(v.speed);
  v.driftAmount=approach(v.driftAmount??0,handbrake&&speed>2?1:0,(handbrake?5:2.2)*dt);
  // Keep lateral acceleration within tire grip, instead of allowing the
  // full parking angle at motorway speeds (previously >400 degrees/sec).
  const tireLongitudinal=Math.max(brakeForce,Math.abs(driveForce));
  v.longitudinalTireAcceleration=tireLongitudinal;
  const lateralGrip=Math.sqrt(Math.max(.25,grip*grip-Math.min(tireLongitudinal,grip)**2));
  v.availableLateralGrip=lateralGrip;
  const gripAngle = Math.atan(lateralGrip * v.wheelBase / Math.max(1, speed * speed));
  const limit = Math.min(v.maxSteer, gripAngle);
  const target = clamp(input.steer*axle.steeringScale+axle.side*.045, -limit, limit);
  const centering = Math.abs(target) < .005 || Math.sign(target) !== Math.sign(v.steer);
  v.steer = approach(v.steer, target, (centering ? 2.6 : 1.65) * dt);
  v.steer = clamp(v.steer, -limit, limit);

  // Kinematic bicycle at the body centre, using the actual axle spacing.
  // The rear axle follows the heading; the centre follows a small slip angle.
  const beta = Math.atan(v.rearAxle / v.wheelBase * Math.tan(v.steer));
  let meanSpeed = (oldSpeed + v.speed) * .5;
  v.yawRate = meanSpeed / v.wheelBase * Math.cos(beta) * Math.tan(v.steer)*(1+.45*v.driftAmount);
  const oldSlipX=v.slipVelocityX??0,oldSlipZ=v.slipVelocityZ??0;
  let lateral=oldSlipX*Math.cos(v.yaw)-oldSlipZ*Math.sin(v.yaw);
  if(v.driftAmount>0||Math.abs(lateral)>1e-6){
    // Retain part of the old velocity direction while the locked rear axle
    // rotates the body. Rotating this vector transfers longitudinal momentum
    // into side-slip without creating kinetic energy.
    const delta=v.yawRate*dt*v.driftAmount,c=Math.cos(delta),s=Math.sin(delta),forward=v.speed;
    v.speed=forward*c-lateral*s;lateral=forward*s+lateral*c;
    const sideGrip=grip*(1-.86*v.driftAmount);
    lateral=approach(lateral,0,sideGrip*dt);
    meanSpeed=(oldSpeed+v.speed)*.5;
  }
  const endYaw=wrap(v.yaw+v.yawRate*dt);
  v.lateralSpeed=lateral;v.slipAngle=Math.atan2(lateral,Math.max(.1,Math.abs(v.speed)));
  v.slipVelocityX=lateral*Math.cos(endYaw);v.slipVelocityZ=-lateral*Math.sin(endYaw);
  const middleHeading = v.yaw + v.yawRate * dt * .5 + beta*(1-v.driftAmount);
  v.travelDistance = meanSpeed * dt;
  v.pos.x -= Math.sin(middleHeading) * v.travelDistance;
  v.pos.z -= Math.cos(middleHeading) * v.travelDistance;
  v.pos.x+=(oldSlipX+v.slipVelocityX)*.5*dt;
  v.pos.z+=(oldSlipZ+v.slipVelocityZ)*.5*dt;
  v.yaw = endYaw;
  v.longitudinalAcceleration=dt>0?(v.speed-oldSpeed)/dt:0;
  v.brake = brakeAmount > .025;
  v.brakeAmount = brakeAmount;
}

export function updateVehicleVisuals(v, dt) {
  if(v.kind==='motorcycle'){updateMotorcycleVisuals(v,dt);return;}
  updateRoadsterVisuals(v,dt);
  if(!v.godotPhysics&&!v.browserRoadsterBody){v.root.rotation.set(0, v.yaw, 0);v.root.position.y=.02;}
  else if(v.physicsQuaternion)v.root.quaternion.copy(v.physicsQuaternion);
  const targetRoll = (v.godotPhysics||v.browserRoadsterBody)?0:-clamp(v.speed * v.yawRate * .004, -.045, .045);
  v.bodyRoll = (v.bodyRoll ?? 0) + (targetRoll - (v.bodyRoll ?? 0)) * (1 - Math.exp(-9 * dt));
  v.chassis.rotation.z = v.bodyRoll;

  const turning = Math.abs(v.steer) > .0001;
  const sign = Math.sign(v.steer);
  const radius = turning ? v.wheelBase / Math.abs(Math.tan(v.steer)) : Infinity;
  const centreRadius = Math.hypot(radius, v.rearAxle);
  for (const wheel of v.wheels) {
    if(wheel.pivot.userData.structuralDetached)continue;
    wheel.suspensionRestY ??= wheel.pivot.position.y;
    const axleRadius = radius + wheel.side * sign * v.track / 2;
    // Only the two front steering pivots rotate around Y. Spin has its own
    // child pivot, so rolling can never tip or wobble the steering axis.
    wheel.pivot.rotation.y = wheel.front && turning
      ? sign * Math.atan2(v.wheelBase, axleRadius) : 0;
    const pathRatio = turning
      ? Math.hypot(axleRadius, wheel.front ? v.wheelBase : 0) / centreRadius : 1;
    // Unwrapped travel preserves rolling direction during render interpolation.
    wheel.spinAngle ??= wheel.spin.rotation.x;
    const nativeSpin=nativeRoadsterWheelAngle(v,wheel);
    if(nativeSpin!==null)wheel.spinAngle=nativeSpin;
    else if(dt>0)wheel.spinAngle -= v.travelDistance * pathRatio / (wheel.radius*(wheel.structuralTireScale??1));
    wheel.spin.rotation.x = wrap(wheel.spinAngle);
  }
  updateAxleFaultVisuals(v);
  if((v.godotPhysics||v.browserRoadsterBody)&&Array.isArray(v.wheelCompressions))for(const wheel of v.wheels){
    if(wheel.pivot.userData.structuralDetached)continue;
    // Native order is front-left, front-right, rear-left, rear-right. Render
    // rigs have different array orders; identity, never array index, maps them.
    const index=(wheel.front?0:2)+(wheel.side>0?1:0),compression=(v.wheelVisualCompressions??v.wheelCompressions)[index];
    const travel=Number.isFinite(compression)?Math.max(-(v.suspensionRebound??.08),compression-(v.suspensionRest??.18)):0;
    wheel.pivot.position.y=(wheel.axleRestPosition?.y??wheel.suspensionRestY)+(v.structuralWheelPreview?Math.min(.07,travel):travel)+(wheel.axleToeOffset ? .055 : 0);
  }
  if(v.structuralWheelPreview)applyStructuralWheelVisuals(v);
  if(v.setSteeringAngle)v.setSteeringAngle(v.steer*7);
  else if (v.steeringWheel) v.steeringWheel.rotation.z = v.steer * 7;
}
