// Ridgebound terrain and forgiving, fixed-step off-road vehicle simulation.
// Coordinates: +Y up, yaw 0 faces +Z. No renderer or browser dependency.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const sq = x => x * x;

export function routeX(z) { return Math.sin(z / 40) * 13 + Math.sin(z / 95) * 19; }
function headingAt(z) { return Math.atan((routeX(z + 0.5) - routeX(z - 0.5))); }

export function heightAt(x, z, region = 'forest') {
  const road = 2.4 + z * 0.026 + Math.sin(z * 0.033) * 2.7
    + 6 * Math.exp(-sq((z - 145) / 32)) + 9 * Math.exp(-sq((z - 277) / 48));
  const offroad = Math.sin(x * 0.059 + z * 0.015) * 3.4
    + Math.cos(z * 0.044 - x * 0.02) * 2.2
    + 21 * Math.exp(-sq((x + 73) / 32) - sq((z - 222) / 54))
    + 26 * Math.exp(-sq((x - 86) / 37) - sq((z - 150) / 61));
  let h = road + offroad * smooth(3.5, 23, Math.abs(x - routeX(z)))
    + 0.09 * Math.sin(z * 1.3) * Math.sin(x * 0.7);
  if (region === 'snow') h += 7.5 * Math.exp(-sq((z - 145) / 31));
  const lakeDistance = Math.hypot(x + 55, z - 100);
  if (lakeDistance < 32) h = mix(region === 'snow' ? 0.7 : -2 + Math.sin(x * 0.1) * 0.08, h, smooth(21, 32, lakeDistance));
  return h;
}

export function surfaceAt(x, z, region = 'forest') {
  if (region === 'snow') {
    if (Math.hypot(x + 55, z - 100) < 24) return 'ice';
    if (Math.abs(x - routeX(z)) < 6.2 && ((z > 45 && z < 78) || (z > 178 && z < 207))) return 'ice';
    return 'snow';
  }
  if (Math.hypot(x + 55, z - 100) < 24 && heightAt(x, z) < 0.8) return 'water';
  const offroad = Math.abs(x - routeX(z));
  if (offroad < 6.2 && ((z > 45 && z < 78) || (z > 178 && z < 207))) return 'mud';
  if (offroad < 5.2) return 'trail';
  if ((x > 57 && z > 107 && z < 197) || (x < -51 && z > 183 && z < 265)) return 'rock';
  return 'grass';
}

export const checkpoints = [
  { x: routeX(70), z: 70, name: '松林营地' },
  { x: routeX(150), z: 150, name: '云杉山口' },
  { x: routeX(240), z: 240, name: '风息草甸' },
  { x: routeX(330), z: 330, name: '山顶观景台' },
];

export function createState(region = 'forest', snowTires = false) {
  const x = routeX(0), z = 0;
  return { x, y: heightAt(x, z, region) + 0.65, z, yaw: headingAt(z), speed: 0, region, snowTires,
    pitch: 0, roll: 0, tilt: 0, lowGear: false, awd: true, winch: null,
    checkpoint: 0, completed: false, time: 0, distance: 0, surface: surfaceAt(x, z, region),
    slip: 0, stuck: 0, wheelRotation: 0, collision: false, steering: 0 };
}

export function attachWinch(state, anchor) {
  if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.z)) return false;
  const distance = Math.hypot(anchor.x - state.x, anchor.z - state.z);
  if (distance > 24 || distance < 1.6) return false;
  state.winch = { anchor: { ...anchor }, length: distance, tension: 0 };
  return true;
}
export function detachWinch(state) { state.winch = null; }

export function recover(state) {
  const checkpoint = checkpoints[Math.min(checkpoints.length, state.checkpoint) - 1];
  state.z = checkpoint ? checkpoint.z + 1.8 : 0;
  state.x = routeX(state.z);
  state.y = heightAt(state.x, state.z, state.region) + 0.65;
  state.yaw = headingAt(state.z);
  state.speed = 0; state.pitch = 0; state.roll = 0;
  state.tilt = 0; state.stuck = 0; state.slip = 0;
  state.winch = null; state.collision = false;
  state.surface = surfaceAt(state.x, state.z, state.region);
  return state;
}

function simulate(state, input, dt, world) {
  const throttle = clamp(Number(input.throttle) || 0, 0, 1);
  const reverse = clamp(Number(input.reverse) || 0, 0, 1);
  const steer = clamp(Number(input.steer) || 0, -1, 1);
  const snowy = state.region === 'snow';
  const winterGrip = snowy && !state.snowTires ? 0.44 : 1;
  state.steering += (steer - state.steering) * (1 - Math.exp(-dt * (snowy && !state.snowTires ? 3.2 : 10)));
  state.surface = surfaceAt(state.x, state.z, state.region);
  const mud = state.surface === 'mud', water = state.surface === 'water';
  const fx = Math.sin(state.yaw), fz = Math.cos(state.yaw);
  const slope = (heightAt(state.x + fx, state.z + fz, state.region) - heightAt(state.x - fx, state.z - fz, state.region)) / 2;
  const maxSpeed = state.lowGear ? 4.4 : 10;
  const snowGrip = state.surface === 'ice' ? (state.snowTires ? 0.77 : 0.22) : (state.snowTires ? 0.96 : 0.46);
  const grip = (state.awd ? 1 : 0.62) * (snowy ? snowGrip : mud ? (state.lowGear ? 0.72 : 0.24) : water ? 0.22 : state.surface === 'grass' ? 0.86 : 1);
  let drive = throttle - reverse;
  const directionBrake = (drive < 0 && state.speed > 0.3) || (drive > 0 && state.speed < -0.3);
  const braking = input.brake || directionBrake || (throttle > 0 && reverse > 0);
  if (braking) drive = 0;
  const terminal = drive < 0 ? maxSpeed * 0.54 : maxSpeed;
  const torque = (state.lowGear ? 8.6 : 5.7) * grip;
  const engine = drive * torque * Math.max(0, 1 - Math.abs(state.speed) / terminal);
  const rolling = (mud ? 1.0 : water ? 3.6 : 0.35) + Math.abs(state.speed) * (mud ? 0.7 : water ? 2.0 : 0.12);
  const slopeForce = slope * 7.5;
  let acceleration = engine - slopeForce;
  // Static friction and gentle hill hold keep a parked car from drifting immediately.
  if (Math.abs(state.speed) < 0.04 && !drive && !input.reel) {
    state.speed = 0;
    acceleration = 0;
  } else {
    const friction = rolling + (braking ? 17 : 0);
    if (Math.abs(state.speed) < friction * dt && Math.abs(acceleration) < friction) state.speed = 0;
    else acceleration -= Math.sign(state.speed || drive) * friction;
  }
  const oldSpeed = state.speed;
  state.speed = clamp(state.speed + acceleration * dt, -maxSpeed * 0.6, maxSpeed * 1.16);
  if (braking && Math.sign(state.speed) !== Math.sign(oldSpeed)) state.speed = 0;
  if (drive && Math.abs(state.speed) < 0.06 && Math.sign(state.speed) !== Math.sign(drive) && Math.abs(slopeForce) < torque + rolling) state.speed = 0;
  const steerRate = state.steering * winterGrip * state.speed / 3.35 * (0.82 / (1 + Math.abs(state.speed) * 0.08));
  state.yaw += steerRate * dt;
  const forwardX = Math.sin(state.yaw), forwardZ = Math.cos(state.yaw);
  const oldX = state.x, oldZ = state.z;
  state.x += forwardX * state.speed * dt;
  state.z += forwardZ * state.speed * dt;
  if (snowy && Math.abs(state.speed) > 0.08) {
    const sideX = Math.cos(state.yaw), sideZ = -Math.sin(state.yaw);
    const sideSlope = (heightAt(state.x + sideX, state.z + sideZ, state.region)
      - heightAt(state.x - sideX, state.z - sideZ, state.region)) / 2;
    const downhillSlide = sideSlope * (state.snowTires ? 0.3 : 2.4) * dt;
    state.x -= sideX * downhillSlide; state.z -= sideZ * downhillSlide;
  }
  if (state.winch) {
    const w = state.winch;
    let dx = w.anchor.x - state.x, dz = w.anchor.z - state.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 29) { state.winch = null; }
    else {
      if (input.reel) w.length = Math.max(2.2, w.length - dt * 2.8);
      const stretch = Math.max(0, dist - w.length);
      w.tension = clamp(stretch / 0.8 + (input.reel ? 0.2 : 0), 0, 1);
      if (stretch > 0 && dist > 0.01) {
        // Rope constraint supplies both longitudinal and lateral recovery motion.
        const pull = Math.min(stretch, dt * (input.reel ? 3.4 : 5.0));
        state.x += dx / dist * pull; state.z += dz / dist * pull;
        const alignment = (dx * forwardX + dz * forwardZ) / dist;
        if (alignment * state.speed < 0) state.speed *= Math.exp(-dt * 5);
      }
    }
  }
  state.collision = false;
  for (const obstacle of world?.obstacles || []) {
    const minDistance = (obstacle.r ?? 0.5) + 0.92;
    const dx = state.x - obstacle.x, dz = state.z - obstacle.z;
    const dist = Math.hypot(dx, dz);
    if (dist < minDistance) {
      const nx = dist > 0.0001 ? dx / dist : -forwardX;
      const nz = dist > 0.0001 ? dz / dist : -forwardZ;
      state.x = obstacle.x + nx * minDistance;
      state.z = obstacle.z + nz * minDistance;
      state.speed *= 0.18;
      state.collision = true;
    }
  }
  if (state.x < -139 || state.x > 139 || state.z < -79 || state.z > 429) {
    state.x = clamp(state.x, -139, 139); state.z = clamp(state.z, -79, 429); state.speed *= 0.2;
  }
  const targetHeight = heightAt(state.x, state.z, state.region) + 0.65;
  const groundPitch = Math.atan((heightAt(state.x + forwardX * 1.45, state.z + forwardZ * 1.45, state.region)
    - heightAt(state.x - forwardX * 1.45, state.z - forwardZ * 1.45, state.region)) / 2.9);
  const rightX = Math.cos(state.yaw), rightZ = -Math.sin(state.yaw);
  const groundRoll = Math.atan((heightAt(state.x + rightX * 0.9, state.z + rightZ * 0.9, state.region)
    - heightAt(state.x - rightX * 0.9, state.z - rightZ * 0.9, state.region)) / 1.8);
  const settle = 1 - Math.exp(-dt * 13);
  state.y = mix(state.y, targetHeight, settle);
  // THREE Euler vehicle body uses rotation.x = -pitch, rotation.z = roll.
  state.pitch = mix(state.pitch, groundPitch - acceleration * 0.009, settle);
  state.roll = mix(state.roll, groundRoll - steerRate * state.speed * 0.012, settle);
  state.tilt = Math.max(Math.abs(state.pitch), Math.abs(state.roll)) * 180 / Math.PI;
  state.slip = clamp((snowy ? (1 - snowGrip) : mud ? (state.lowGear ? 0.23 : 0.78) : water ? 0.9 : state.awd ? 0.04 : 0.17) * Math.abs(drive), 0, 1);
  state.stuck = Math.abs(state.speed) < 0.45 && (throttle || reverse) ? state.stuck + dt : Math.max(0, state.stuck - dt * 2);
  const movement = Math.hypot(state.x - oldX, state.z - oldZ);
  state.distance += movement;
  state.wheelRotation += (state.speed * dt + state.slip * drive * dt * 2) / 0.54;
  state.time += dt;
  if (state.checkpoint < checkpoints.length) {
    const target = checkpoints[state.checkpoint];
    if (Math.hypot(state.x - target.x, state.z - target.z) < 13) {
      state.checkpoint += 1;
      if (state.checkpoint === checkpoints.length) state.completed = true;
    }
  }
}

export function step(state, input = {}, dt = 1 / 60, world = {}) {
  if (!Number.isFinite(dt) || dt <= 0) return state;
  const total = Math.min(dt, 0.15);
  const count = Math.ceil(total / (1 / 60));
  for (let i = 0; i < count; i++) simulate(state, input, total / count, world);
  return state;
}
