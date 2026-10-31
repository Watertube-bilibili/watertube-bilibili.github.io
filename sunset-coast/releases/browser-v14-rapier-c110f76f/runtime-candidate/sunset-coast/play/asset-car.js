import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {registerVehicleAsset} from './vehicle-asset-registry.js';
import {decodedModelProgress} from './loading-progress.js';

// CC-BY-4.0 adaptation. See THIRD_PARTY_ASSETS.md for the artist and changes.
import {ASSET_MODEL} from './game-catalog.js';
export {ASSET_MODEL} from './game-catalog.js';

let template = null, loading = null;
const dimensions = {};

export function carAssetReady() { return !!template; }

// Load only for active saved Lucent vehicles or an explicit selection.
// The shared registry keeps restore/purchase transactional until the real model is ready.
export function loadCarAsset(onProgress) {
  if (template) return Promise.resolve(true);
  if (!loading) loading = new GLTFLoader()
    .loadAsync(new URL('./assets/lucent-vision.glb', import.meta.url).href, event => onProgress?.(decodedModelProgress(event)))
    .then(gltf => { template = prepare(gltf.scene); return true; })
    .catch(error => {
      loading = null;
      console.warn('Lucent Vision model could not load; retry available.', error);
      return false;
    });
  return loading;
}

function prepare(source) {
  const root = new THREE.Group(); root.name = 'LucentVision';
  const chassis = new THREE.Group(); chassis.name = 'asset-chassis'; root.add(chassis);
  const normalization = new THREE.Group(); normalization.name = 'asset-normalization';
  normalization.rotation.y = Math.PI; normalization.add(source); chassis.add(normalization);
  root.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(source,true);
  const length = bounds.max.z - bounds.min.z;
  normalization.scale.setScalar(4.85 / length);
  root.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(source,true);
  normalization.position.set(-(bounds.min.x + bounds.max.x) / 2, -bounds.min.y, -(bounds.min.z + bounds.max.z) / 2);
  root.updateMatrixWorld(true);

  // The source is a posed show car: the front wheels are initially turned 30°.
  // Put the steering and rolling axes back into the game's X/Y/Z convention.
  const wheelInfo = [];
  for (const [name,side,front] of [
    ['WheelFrontL',-1,true], ['WheelRearL',-1,false],
    ['WheelFrontR',1,true], ['WheelRearR',1,false]
  ]) {
    const mesh = source.getObjectByName(name);
    if (!mesh) throw new Error(`Missing wheel ${name}`);
    const centre = mesh.getWorldPosition(new THREE.Vector3());
    const axle = new THREE.Vector3(1,0,0).transformDirection(mesh.matrixWorld);
    // Axles pointing left or right represent the same rolling axis.
    let showSteer = Math.atan2(-axle.z, axle.x);
    if (showSteer > Math.PI/2) showSteer -= Math.PI;
    if (showSteer < -Math.PI/2) showSteer += Math.PI;
    const pivot = new THREE.Group(); pivot.name = `asset-pivot-${name}`;
    pivot.position.copy(centre); root.add(pivot);
    const spin = new THREE.Group(); spin.name = `asset-spin-${name}`; pivot.add(spin);
    root.updateMatrixWorld(true); spin.attach(mesh);
    const neutral = new THREE.Group(); neutral.rotation.y = -showSteer;
    spin.remove(mesh); neutral.add(mesh); spin.add(neutral);
    root.updateMatrixWorld(true);
    // Brake calipers steer with the wheel but never roll with the tire.
    const calipers = [];
    mesh.traverse(part => { if (/BrakePad/.test(part.name)) calipers.push(part); });
    for (const caliper of calipers) pivot.attach(caliper);
    const wheelBounds = new THREE.Box3().setFromObject(spin,true);
    const radius = (wheelBounds.max.y - wheelBounds.min.y) / 2;
    pivot.userData.wheel = {side,front,radius};
    wheelInfo.push({side,front,radius,x:centre.x,y:centre.y,z:centre.z});
  }

  // Keep real door apertures, glass, mirrors and trim together around the
  // original hinges; the game's existing Y-axis animation opens these outwards.
  for (const [name,side] of [['BodyDoorLColor1',-1],['BodyDoorRColor1',1]]) {
    const mesh = source.getObjectByName(name);
    if (!mesh) throw new Error(`Missing door ${name}`);
    const pivot = new THREE.Group(); pivot.name = `asset-door-${side}`;
    pivot.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
    chassis.add(pivot); root.updateMatrixWorld(true); pivot.attach(mesh);
    pivot.userData.doorSide = side;
  }
  const steeringSource = source.getObjectByName('InteriorSteeringCylinder');
  if (steeringSource) {
    const steering = new THREE.Group(); steering.name = 'asset-steering-wheel';
    // Rotate the actual rim about its centre, not the end of the steering
    // column. Keep the column fixed and undo the source's 15° display pose.
    const rim=source.getObjectByName('InteriorSteeringWheel01');
    new THREE.Box3().setFromObject(rim,true).getCenter(steering.position);
    steering.rotation.x = -.38;
    chassis.add(steering); root.updateMatrixWorld(true);
    const moving=[...steeringSource.children];
    for(const part of moving)steering.attach(part);
    const neutral=new THREE.Group();neutral.rotation.z=Math.PI/12;
    for(const part of moving){steering.remove(part);neutral.add(part);}
    steering.add(neutral);
  }

  root.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(root,true);
  const frontZ = wheelInfo.filter(w=>w.front).reduce((sum,w)=>sum+w.z,0)/2;
  const rearZ = wheelInfo.filter(w=>!w.front).reduce((sum,w)=>sum+w.z,0)/2;
  dimensions.wheelBase = rearZ-frontZ;
  dimensions.rearAxle = rearZ;
  dimensions.track = wheelInfo.filter(w=>w.front).reduce((sum,w)=>sum+Math.abs(w.x),0);
  dimensions.height = bounds.max.y;
  dimensions.halfWidth = (bounds.max.x-bounds.min.x)/2;
  // This original concept uses a single centre driving seat.
  dimensions.driverPosition = new THREE.Vector3(0,.34,.03);
  dimensions.driverCamera = new THREE.Vector3(0,1.12,-.1);
  dimensions.exitPosition = new THREE.Vector3(-dimensions.halfWidth-.8,0,.05);
  root.traverse(part => {
    if (part.isMesh) {
      part.userData.semantic = 3;
      part.castShadow = true; part.receiveShadow = true;
      // Materials remain physically based, with source normal/AO detail,
      // transparent glazing, metal flakes, and the layered clearcoat intact.
    }
  });
  return root;
}

export function createAssetCar(modelId='vision',simple=false,colorOverride=null,model=ASSET_MODEL) {
  if (modelId !== ASSET_MODEL.id || !template) return null;
  const root = template.clone(true), chassis = root.getObjectByName('asset-chassis');
  root.userData.model = modelId;
  const wheels = [], doors = [], materialClones = new Map();
  const paintColor = colorOverride ?? model.color;
  root.traverse(part => {
    if (part.userData.wheel) {
      const {side,front,radius} = part.userData.wheel;
      wheels.push({pivot:part,spin:part.children.find(c=>c.name.startsWith('asset-spin-')),side,front,radius});
    }
    if (part.userData.doorSide !== undefined) doors.push({pivot:part,side:part.userData.doorSide});
    if (part.isMesh) {
      const tint = material => {
        if (!/^Paint [12]/.test(material.name)) return material;
        if (!materialClones.has(material)) {
          const cloned = material.clone();
          cloned.color.setHex(paintColor);
          // Fine automotive flakes, rather than the source candy finish's
          // coarse sparkles, while preserving its texture and clearcoat.
          cloned.normalScale.multiplyScalar(.24);
          if (material.name.startsWith('Paint 2')) cloned.color.multiplyScalar(.22);
          materialClones.set(material,cloned);
        }
        return materialClones.get(material);
      };
      part.material = Array.isArray(part.material) ? part.material.map(tint) : tint(part.material);
    }
  });
  doors.sort((a,b)=>a.side-b.side);
  return {
    root,chassis,wheels,doors,model,
    steeringWheel:root.getObjectByName('asset-steering-wheel'),
    wheelBase:dimensions.wheelBase,rearAxle:dimensions.rearAxle,track:dimensions.track,
    maxSteer:.58,lateralGrip:11.8,
    driverPosition:dimensions.driverPosition.clone(),driverCamera:dimensions.driverCamera.clone(),
    driverViewPitch:.12,driverFov:68,
    instrumentMesh:root.getObjectByName('InteriorSteeringDash'),
    exitPosition:dimensions.exitPosition.clone(),height:dimensions.height,
    halfWidth:dimensions.halfWidth,
    asset:'CarConcept CC-BY-4.0 / Lucent Vision adaptation'
  };
}

registerVehicleAsset(['vision'],{ready:carAssetReady,load:loadCarAsset});
