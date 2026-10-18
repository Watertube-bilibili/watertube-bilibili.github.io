import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {sampleVehiclePose} from '../render-motion.js';
import {installCameraControls} from '../camera-controls.js';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
// Exercise the actual production camera rig without booting WebGL, assets or
// Godot. Only the unrelated interior-visibility side effect is stubbed out.
const cameraMethod = source.slice(source.indexOf(' updateCamera('), source.indexOf('\n updateWorld('));
const updateCamera = new Function('THREE', 'clamp', 'sampleVehiclePose', 'setVehicleInteriorView', 'wrap',
  `return ({${cameraMethod}}).updateCamera;`)(THREE, THREE.MathUtils.clamp,
  sampleVehiclePose, () => {}, value => Math.atan2(Math.sin(value), Math.cos(value)));
globalThis.innerWidth = 390;
globalThis.innerHeight = 844;

function setup(overrides = {}) {
  const listeners = new Map(), captures = new Set();
  const state = {phone: false, drawer: false};
  const canvas = {
    ownerDocument: {body: {classList: {contains: () => state.drawer}}},
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) ?? []), fn]); },
    setPointerCapture(id) { captures.add(id); },
    hasPointerCapture(id) { return captures.has(id); },
    releasePointerCapture(id) { captures.delete(id); },
  };
  const game = {
    inCar: true, cameraMode: 0, cameraYaw: 0, cameraPitch: 0, time: 15,
    paused: false, transition: null, cameraRecentering: true,
    effectiveInputMode: 'touch', ui: {isPhoneOpen: () => state.phone},
    vehicle: {pos: new THREE.Vector3(), yaw: 0, root: new THREE.Group()},
    playerYaw: 0, position: new THREE.Vector3(),
    camera: new THREE.PerspectiveCamera(58, 390 / 844, .1, 1300),
    sun: new THREE.DirectionalLight(), sunDisc: new THREE.Object3D(),
    shoots: 0, shoot() { this.shoots++; },
    ...overrides,
  };
  installCameraControls(game, canvas);
  const emit = (type, extra = {}) => {
    const event = {target: canvas, pointerId: 1, pointerType: 'touch', button: 0,
      clientX: 200, clientY: 200, preventDefault() { this.prevented = true; }, ...extra};
    for (const fn of listeners.get(type) ?? []) fn(event);
    return event;
  };
  const swipe = (dx, pointerType = 'touch', dy = 0) => {
    emit('pointerdown', {pointerType});
    emit('pointermove', {pointerType, clientX: 200 + dx, clientY: 200 + dy});
    emit('pointerup', {pointerType});
  };
  const forward = () => {
    updateCamera.call(game, 1 / 60);
    const result = game.camera.getWorldDirection(new THREE.Vector3());
    result.y = 0;
    return result.normalize();
  };
  return {game, canvas, state, captures, emit, swipe, forward};
}

for (const view of ['walking', 'chase', 'cabin']) {
  for (const dx of [-80, 80]) {
    test(`${view}: touch ${dx < 0 ? 'left' : 'right'} swipe looks ${dx < 0 ? 'left' : 'right'} at four headings`, () => {
      for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const h = setup({inCar: view !== 'walking', cameraMode: view === 'cabin' ? 1 : 0});
        h.game.vehicle.yaw = heading;
        if (view === 'walking') h.game.cameraYaw = heading;
        const right = h.forward().cross(new THREE.Vector3(0, 1, 0));
        h.swipe(dx);
        assert.equal(Math.sign(h.forward().dot(right)), Math.sign(dx));
        assert.equal(h.game.manualCameraTime, 15);
        assert.equal(h.game.cameraRecentering, false);
      }
    });
  }
}

test('desktop mouse orbit keeps its original sign in either UI mode', () => {
  for (const effectiveInputMode of ['keyboard', 'touch']) {
    const h = setup({effectiveInputMode});
    h.swipe(80, 'mouse');
    assert.equal(h.game.cameraYaw, .32);
    h.swipe(-80, 'mouse');
    assert.equal(h.game.cameraYaw, 0);
  }
});

test('actual touch input stays natural even when keyboard UI is selected', () => {
  const h = setup({effectiveInputMode: 'keyboard'});
  h.swipe(80);
  assert.equal(h.game.cameraYaw, -.32);
});

test('cabin yaw and pitch stay bounded; vertical mapping is unchanged', () => {
  const h = setup({cameraMode: 1});
  h.swipe(100000, 'touch', 100000);
  assert.equal(h.game.cameraYaw, -2.75);
  assert.equal(h.game.cameraPitch, .95);
  h.swipe(-100000, 'touch', -100000);
  assert.equal(h.game.cameraYaw, 2.75);
  assert.equal(h.game.cameraPitch, -.95);
});

test('one camera pointer owns a drag; joystick/second finger cannot steer or release it', () => {
  const h = setup();
  h.emit('pointerdown');
  h.emit('pointerdown', {pointerId: 2, clientX: 50});
  h.emit('pointermove', {pointerId: 2, clientX: 600});
  h.emit('pointerup', {pointerId: 2});
  assert.equal(h.game.cameraYaw, 0);
  assert.deepEqual([...h.captures], [1]);
  h.emit('pointermove', {clientX: 280});
  assert.equal(h.game.cameraYaw, -.32);
});

test('a gesture originating on a UI control never becomes a camera drag', () => {
  const h = setup();
  h.emit('pointerdown', {target: {id: 'joystick'}});
  h.emit('pointermove', {clientX: 400});
  assert.equal(h.game.cameraYaw, 0);
  assert.equal(h.captures.size, 0);
});

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'resetControls']) {
  test(`${type} clears capture and allows a new drag without a jump`, () => {
    const h = setup();
    h.emit('pointerdown');
    h.emit('pointermove', {clientX: 220});
    if (type === 'resetControls') h.game.releaseCameraDrag();
    else h.emit(type);
    assert.equal(h.captures.size, 0);
    h.emit('pointermove', {clientX: 800});
    assert.equal(h.game.cameraYaw, -.08);
    h.emit('pointerdown', {pointerId: 3, clientX: 500});
    h.emit('pointermove', {pointerId: 3, clientX: 480});
    assert.equal(h.game.cameraYaw, 0);
  });
}

for (const blocker of ['paused', 'transition', 'phone', 'drawer', 'overhead']) {
  const block = h => {
    if (['phone', 'drawer'].includes(blocker)) h.state[blocker] = true;
    else if (blocker === 'overhead') h.game.cameraMode = 2;
    else h.game[blocker] = true;
  };
  test(`${blocker} blocks new gestures and cancels an active one`, () => {
    const h = setup();
    h.emit('pointerdown');
    block(h);
    h.emit('pointermove', {clientX: 400});
    assert.equal(h.game.cameraYaw, 0);
    assert.equal(h.captures.size, 0);
    h.swipe(80);
    assert.equal(h.game.cameraYaw, 0);
  });
}

test('right click remains ignored and walking weapon click still shoots', () => {
  const h = setup();
  h.emit('pointerdown', {button: 2, pointerType: 'mouse'});
  h.emit('pointermove', {clientX: 400, pointerType: 'mouse'});
  assert.equal(h.game.cameraYaw, 0);
  h.game.inCar = false;
  h.game.weapon = true;
  h.swipe(80);
  assert.equal(h.game.shoots, 1);
  assert.equal(h.game.cameraYaw, 0);
  assert.equal(h.captures.size, 0);
});

test('game binds the isolated handler and resets its capture with other controls', () => {
  assert.match(source, /import \{installCameraControls\} from '\.\/camera-controls\.js'/);
  assert.match(source, /installCameraControls\(this,\$\('world'\)\)/);
  assert.match(source, /resetControls\(\)\{[^\n]*this\.releaseCameraDrag\?\.\(\)/);
});
