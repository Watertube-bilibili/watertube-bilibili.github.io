/**
 * SUNSET COAST — hand-built gallery study after the internet meme 奶蛙 (Naiwa).
 * Not an original character, an official collaboration or a downloaded model.
 * All mesh coordinates in this file are authored locally; no image textures,
 * third-party models, network fetches or AI design service are used at runtime.
 * Reference provenance: NAIWA-REFERENCE-NOTES.md (reference images not shipped).
 * Front is +Z. Local ground is Y=0. Statue-only height is 2.58 m at scale=1.
 */
import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

export const NAIWA_SCULPTURE_VERSION = 'naiwa-gallery-study-20261024-v1';
export const NAIWA_REFERENCE = Object.freeze({
  name: '奶蛙 / NAIWA',
  interpretation: 'yellow pear-shaped meme with green circular eyes; not original Nailong',
  article: 'https://www.sohu.com/a/1073003874_398212',
  traceVideo: 'https://www.bilibili.com/video/BV1ndMk65EwM/',
  creatorStatus: 'Starry AI avatar attribution to 纲手[百豪] is second-hand screenshot evidence, not independently verified',
  modelSource: 'locally authored procedural geometry; character adaptation',
});

// Smooth, continuous crown-to-belly silhouette. No separate head/egg primitives.
const PROFILE = [
  [0,.17],[.40,.17],[.64,.24],[.80,.42],[.88,.71],[.90,.94],
  [.85,1.17],[.73,1.41],[.56,1.65],[.46,1.86],[.43,2.08],
  [.40,2.29],[.33,2.46],[.17,2.56],[0,2.58],
];
const DEPTH = .73;
function makeProfile() {
  return new THREE.SplineCurve(PROFILE.map(([r,y])=>new THREE.Vector2(r,y)))
    .getPoints(52).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));
}
function radiusAt(y, profile) {
  for(let i=1;i<profile.length;i++) {
    const a=profile[i-1], b=profile[i];
    if(y<=b.y) return THREE.MathUtils.lerp(a.x,b.x,THREE.MathUtils.clamp((y-a.y)/(b.y-a.y||1),0,1));
  }
  return 0;
}
function frontAt(x,y,profile,offset=0) {
  const r=radiusAt(y,profile);
  return Math.sqrt(Math.max(0,r*r-x*x))*DEPTH+offset;
}
function bellyGeometry(profile) {
  // Cream glaze follows the actual torso surface. The patch cannot float,
  // intersect as an oval sphere, or become a cream-coloured egg from the side.
  const positions=[], indices=[], rings=14, segments=48;
  const sample=(r,a)=>{
    const y=.94+Math.sin(a)*.61*r;
    const angle=Math.cos(a)*.99*r;
    const radius=radiusAt(y,profile);
    return [Math.sin(angle)*radius,y,Math.cos(angle)*radius*DEPTH+.007];
  };
  positions.push(...sample(0,0));
  for(let k=1;k<=rings;k++)for(let j=0;j<segments;j++)positions.push(...sample(k/rings,j/segments*Math.PI*2));
  for(let j=0;j<segments;j++)indices.push(0,1+j,1+(j+1)%segments);
  for(let k=1;k<rings;k++)for(let j=0;j<segments;j++) {
    const a=1+(k-1)*segments+j,b=1+(k-1)*segments+(j+1)%segments,c=1+k*segments+j,d=1+k*segments+(j+1)%segments;
    indices.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  return g;
}
function roundedBox(w,h,d,r=.03) {
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:2,curveSegments:3,steps:1});
  g.translate(0,0,-(d-2*r)/2);return g;
}

/** Build the self-contained static exhibit. Dispose only its own resources. */
export function createNaiwaSculpture({scale=.86,plinth=true,plaque=true,quality='standard',batch=true}={}) {
  if(!Number.isFinite(scale)||scale<=0)throw new RangeError('Naiwa scale must be finite and positive');
  const root=new THREE.Group();root.name='gallery-exhibit/naiwa-meme-study';
  root.userData={semantic:5,architecture:true,exhibit:'naiwa',version:NAIWA_SCULPTURE_VERSION,characterAdaptation:true,official:false,reference:NAIWA_REFERENCE};
  const bodyRoot=new THREE.Group();bodyRoot.name='naiwa/figure';bodyRoot.scale.setScalar(scale);bodyRoot.position.y=plinth?.83:0;root.add(bodyRoot);
  const glaze=(color,roughness=.40)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.02});
  const mats={yellow:glaze(0xf5ca37),cream:glaze(0xffedbc,.45),eye:glaze(0x89b95e,.28),pupil:glaze(0x101b10,.18),mouth:glaze(0x755028,.59),glint:glaze(0xf8f3d7,.15),stone:glaze(0xd7d3c6,.82),edge:glaze(0x445b59,.60),bronze:new THREE.MeshStandardMaterial({color:0xb79b5c,metalness:.65,roughness:.37})};
  const resources=new Set(Object.values(mats));
  const mesh=(name,g,mat,parent=bodyRoot)=>{resources.add(g);const m=new THREE.Mesh(g,mat);m.name='naiwa/'+name;m.castShadow=true;m.receiveShadow=true;m.userData.semantic=5;m.userData.architecture=true;parent.add(m);return m;};
  const sphere=new THREE.SphereGeometry(1,quality==='low'?12:20,quality==='low'?8:14);resources.add(sphere);
  const ellipsoid=(name,pos,size,mat,parent=bodyRoot)=>{const m=mesh(name,sphere,mat,parent);m.position.set(...pos);m.scale.set(...size);return m;};
  const profile=makeProfile(),torso=new THREE.LatheGeometry(profile,quality==='low'?28:40);torso.scale(1,1,DEPTH);
  mesh('continuous-pear-body',torso,mats.yellow);
  mesh('surface-conformal-cream-belly',bellyGeometry(profile),mats.cream);
  // Small flattened feet, not a pair of balls or an invisible base.
  for(const side of [-1,1]) {
    const foot=ellipsoid(`foot-${side}`, [side*.43,.13,.15],[.27,.13,.36],mats.yellow);foot.rotation.y=side*-.12;
    // Slight asymmetry in a relaxed pose; slender arms turn inward at the palms.
    const arm=new THREE.CatmullRomCurve3([
      new THREE.Vector3(side*.50,1.48,.08),new THREE.Vector3(side*.76,1.32,.20),
      new THREE.Vector3(side*.86,1.04,.28),new THREE.Vector3(side*.80,.82,.36),
      new THREE.Vector3(side*.70,.72,.45),
    ]);
    mesh(`slender-arm-${side}`,new THREE.TubeGeometry(arm,18,.095,8,false),mats.yellow);
    ellipsoid(`palm-${side}`,[side*.705,.727,.45],[.125,.145,.085],mats.yellow);
    for(let k=0;k<3;k++){
      const finger=ellipsoid(`finger-${side}-${k}`,[side*(.644+k*.052),.657-k*.008,.486],[.030,.083,.033],mats.yellow);
      finger.rotation.z=side*-.19;
    }
  }
  // The green eye surround is deliberately round and protruding. Not dragon
  // horns, white cartoon sclera, stalk eyes, frog skin or a reptile snout.
  for(const side of [-1,1]) {
    const x=side*.268,y=2.205,z=frontAt(x,y,profile,.031);
    const eye=ellipsoid(`green-round-eye-${side}`,[x,y,z],[.132,.144,.091],mats.eye);eye.rotation.y=side*.23;
    ellipsoid(`black-pupil-${side}`,[x+side*.008,y-.002,z+.078],[.075,.084,.026],mats.pupil);
    ellipsoid(`eye-catchlight-${side}`,[x-.023,y+.031,z+.102],[.013,.016,.008],mats.glint);
  }
  const smile=[];
  for(let i=0;i<=12;i++){
    const x=-.185+i*.37/12,y=1.978+.036*Math.pow(x/.185,2);
    smile.push(new THREE.Vector3(x,y,frontAt(x,y,profile,.010)));
  }
  mesh('quiet-curved-smile',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smile),20,.009,6,false),mats.mouth);
  if(plinth) {
    const base=mesh('stone-display-plinth',roundedBox(2.16,.74,1.78,.04),mats.stone,root);base.position.y=.42;
    const trim=mesh('plinth-shadow-line',new THREE.BoxGeometry(2.18,.045,1.80),mats.edge,root);trim.position.y=.798;
    const foot=mesh('plinth-recessed-foot',new THREE.BoxGeometry(1.99,.12,1.61),mats.edge,root);foot.position.y=.06;
    if(plaque){
      const p=mesh('bronze-caption-holder',roundedBox(.68,.20,.026,.008),mats.bronze,root);p.position.set(0,.53,.902);
      // Optional local canvas text only; node tests and non-DOM export remain valid.
      if(typeof document!=='undefined') {
        const c=document.createElement('canvas');c.width=768;c.height=224;const ctx=c.getContext('2d');
        if(ctx){
          ctx.fillStyle='#b79b5c';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#22352d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 62px sans-serif';ctx.fillText('奶蛙 · NAIWA',384,78);ctx.font='28px sans-serif';ctx.fillText('网络迷因 · 几何雕塑习作',384,154);
          const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;resources.add(texture);
          const mat=new THREE.MeshStandardMaterial({map:texture,roughness:.62});resources.add(mat);
          const label=mesh('caption',new THREE.PlaneGeometry(.64,.186),mat,root);label.position.set(0,.53,.921);
        }
      }
    }
  }
  // Static exhibit parts share material batches: a single statue should not add
  // 20+ draw calls to the city. Landmarks remain available for semantic tests.
  root.userData.parts=[];
  for(const parent of [bodyRoot,root]) {
    const buckets=new Map();
    for(const child of [...parent.children])if(child.isMesh) {
      child.updateMatrix();
      root.userData.parts.push({name:child.name,position:child.position.toArray(),scale:child.scale.toArray(),parent:parent.name});
      if(!batch)continue;
      let list=buckets.get(child.material);if(!list){list=[];buckets.set(child.material,list);}list.push(child);
    }
    if(batch)for(const [mat,children] of buckets) {
      if(children.length<2)continue;
      const geometries=children.map(child=>{const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();g.applyMatrix4(child.matrix);g.deleteAttribute('uv');return g;});
      const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
      if(!merged)throw new Error('Naiwa static geometry merge failed');
      children.forEach(child=>parent.remove(child));
      const m=mesh('material-batch-'+mat.color.getHexString(),merged,mat,parent);m.userData.parts=children.map(child=>child.name);
    }
  }
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  let triangles=0,drawCalls=0;root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;drawCalls++;}});
  root.userData.metrics={triangles,drawCalls,width:size.x,height:size.y,depth:size.z,scale,plinth,quality};
  root.userData.collidableFootprint={width:size.x+.04,depth:size.z+.04,height:size.y};
  root.userData.dispose=()=>{for(const resource of resources)resource.dispose();};
  return root;
}
