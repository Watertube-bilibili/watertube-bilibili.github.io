import * as THREE from './vendor/three.module.js';

// A single bounded screen-space edge pass, AFTER the normal renderer has applied
// exposure, tone mapping, output colour space and native canvas MSAA. Copying the
// resolved framebuffer avoids an HDR target, a second scene render, double tone
// mapping and any changes to the photo/sensor/vehicle-camera render pipelines.
// FXAA edge-direction filtering follows Timothy Lottes' FXAA approach:
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
export const GAMEPLAY_AA_FRAGMENT = `
 uniform sampler2D frame;
 uniform vec2 inverseSize;
 uniform float span;
 varying vec2 vUv;
 float luma(vec3 c) { return dot(c,vec3(0.299,0.587,0.114)); }
 void main() {
  vec4 center=texture2D(frame,vUv);
  vec3 nw=texture2D(frame,vUv+vec2(-1.,1.)*inverseSize).rgb;
  vec3 ne=texture2D(frame,vUv+vec2(1.,1.)*inverseSize).rgb;
  vec3 sw=texture2D(frame,vUv+vec2(-1.,-1.)*inverseSize).rgb;
  vec3 se=texture2D(frame,vUv+vec2(1.,-1.)*inverseSize).rgb;
  float m=luma(center.rgb),a=luma(nw),b=luma(ne),c=luma(sw),d=luma(se);
  float lo=min(m,min(min(a,b),min(c,d))),hi=max(m,max(max(a,b),max(c,d)));
  // Preserve flat areas, subtle textures and low-contrast material detail. HUD
  // text is DOM, outside this pass altogether. Five taps on these pixels.
  if(hi-lo<max(0.035,hi*0.125)){gl_FragColor=center;return;}
  vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));
  float reduction=max((a+b+c+d)*0.03125,0.0078125);
  direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduction),vec2(-span),vec2(span))*inverseSize;
  vec3 narrow=0.5*(texture2D(frame,vUv-direction/6.).rgb+texture2D(frame,vUv+direction/6.).rgb);
  vec3 wide=narrow*0.5+0.25*(texture2D(frame,vUv-direction*0.5).rgb+texture2D(frame,vUv+direction*0.5).rgb);
  float value=luma(wide);
  gl_FragColor=vec4(value<lo||value>hi?narrow:wide,center.a);
 }`;

// GLSL1-compatible shader and RGBA8 texture: no derivatives, float targets,
// multisample render targets or WebGL2-only AA feature. The bundled Three engine
// itself requires WebGL2; do not confuse this fallback with WebGL1 game support.
export function gameplayAACapabilities(renderer){
 let attributes=null,samples=0,gl;
 try{gl=renderer.getContext?.();attributes=gl?.getContextAttributes?.();samples=Number(gl?.getParameter?.(gl.SAMPLES))||0;}catch{}
 return Object.freeze({native:!!attributes?.antialias&&samples>0,nativeSamples:samples,
  webgl2:renderer.capabilities?.isWebGL2===true,
  postprocess:typeof renderer.copyFramebufferToTexture==='function',
  maxTextureSize:Math.max(1,Number(renderer.capabilities?.maxTextureSize)||2048)});
}

export class GameplayAntialiasing {
 constructor(renderer){
  this.renderer=renderer;this.capabilities=gameplayAACapabilities(renderer);this.enabled=true;this.failure=null;
  this.frames=0;this.texture=null;this.size=new THREE.Vector2();this.width=0;this.height=0;
  this.scene=new THREE.Scene();this.camera=new THREE.Camera();
  this.geometry=new THREE.BufferGeometry();
  this.geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  this.material=new THREE.ShaderMaterial({name:'Gameplay edge AA',depthTest:false,depthWrite:false,blending:THREE.NoBlending,toneMapped:false,
   uniforms:{frame:{value:null},inverseSize:{value:new THREE.Vector2(1,1)},span:{value:4}},
   vertexShader:'varying vec2 vUv; void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position,1.0);}',fragmentShader:GAMEPLAY_AA_FRAGMENT});
  this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;this.scene.add(this.mesh);
  this.onRestore=()=>{this.failure=null;this.capabilities=gameplayAACapabilities(renderer);this.releaseTexture();};
  renderer.domElement?.addEventListener?.('webglcontextrestored',this.onRestore);
 }
 configure(profile){this.profile=profile;this.material.uniforms.span.value=profile?.quality==='high'?6:4;}
 beginFrame(){
  // Photo mode restores its entry DPR. If the window changed size while taking
  // a picture, resume the CURRENT gameplay budget before drawing, not one frame
  // later (which would clear the completed frame). No persistent setting writes.
  const ratio=this.profile?.pixelRatio;
  if(Number.isFinite(ratio)&&ratio>0&&this.renderer.getPixelRatio()!==ratio)this.renderer.setPixelRatio(ratio);
 }
 releaseTexture(){this.texture?.dispose();this.texture=null;this.material.uniforms.frame.value=null;this.width=0;this.height=0;}
 prepare(){
  const r=this.renderer;r.getDrawingBufferSize(this.size);const width=Math.floor(this.size.x),height=Math.floor(this.size.y);
  const budget=this.profile?.renderPixelBudget??(this.profile?.mobile?2200000:4500000);
  if(width<2||height<2||width*height>budget+width+height||Math.max(width,height)>this.capabilities.maxTextureSize){this.releaseTexture();return false;}
  if(width!==this.width||height!==this.height){
   this.releaseTexture();this.texture=new THREE.FramebufferTexture(width,height);
   this.texture.minFilter=this.texture.magFilter=THREE.LinearFilter;this.texture.name='Gameplay resolved colour';
   // NoColorSpace is deliberate: these are already output-encoded pixels.
   // The shader also deliberately omits tone/color-space output chunks.
   this.width=width;this.height=height;this.validateAllocation=true;this.material.uniforms.frame.value=this.texture;
   this.material.uniforms.inverseSize.value.set(1/width,1/height);
  }
  return true;
 }
 apply(){
  const r=this.renderer;
  // Only the main, complete default framebuffer may be filtered. Inset camera,
  // sensor, thumbnail and photo renders stay on their original paths.
  if(!this.enabled||this.failure||!this.capabilities.postprocess||r.getRenderTarget()!==null||r.getScissorTest()||r.xr?.isPresenting||r.getContext?.()?.isContextLost?.())return false;
  const saved={target:r.getRenderTarget(),face:r.getActiveCubeFace(),mip:r.getActiveMipmapLevel(),viewport:r.getViewport(new THREE.Vector4()),scissor:r.getScissor(new THREE.Vector4()),scissorTest:r.getScissorTest(),autoClear:r.autoClear,xr:r.xr.enabled,shadowAuto:r.shadowMap.autoUpdate,shadowNeeds:r.shadowMap.needsUpdate,shaderCheck:r.debug?.checkShaderErrors,shaderError:r.debug?.onShaderError};
  try{
   if(!this.prepare())return false;
   r.copyFramebufferToTexture(this.texture);
   // Allocation checks are once per size, never a synchronizing getError loop.
   if(this.validateAllocation){const gl=r.getContext?.();if(gl?.getError&&gl.getError()!==gl.NO_ERROR)throw Error('AA framebuffer copy unsupported');this.validateAllocation=false;}
   if(r.debug){r.debug.checkShaderErrors=true;r.debug.onShaderError=(...args)=>{saved.shaderError?.(...args);throw Error('AA shader unsupported');};}
   r.autoClear=false;r.xr.enabled=false;r.shadowMap.autoUpdate=false;r.shadowMap.needsUpdate=false;
   r.setViewport(0,0,this.width/r.getPixelRatio(),this.height/r.getPixelRatio());r.setScissorTest(false);
   r.render(this.scene,this.camera);this.frames++;return true;
  }catch(error){
   // Keep the already-rendered native-AA frame and the game alive. Retry only
   // after context restoration rather than reallocating on every failed frame.
   this.failure=error?.message||'Gameplay AA unavailable';this.releaseTexture();
   console.warn('Gameplay AA unavailable; retaining native canvas AA',error);return false;
  }finally{
   if(r.debug){r.debug.checkShaderErrors=saved.shaderCheck;r.debug.onShaderError=saved.shaderError;}
   r.autoClear=saved.autoClear;r.xr.enabled=saved.xr;r.shadowMap.autoUpdate=saved.shadowAuto;r.shadowMap.needsUpdate=saved.shadowNeeds;
   r.setRenderTarget(saved.target,saved.face,saved.mip);r.setViewport(saved.viewport);r.setScissor(saved.scissor);r.setScissorTest(saved.scissorTest);
  }
 }
 get status(){return {enabled:this.enabled,mode:this.failure||!this.capabilities.postprocess?'native-fallback':this.capabilities.native?'native+fxaa':'fxaa',nativeSamples:this.capabilities.nativeSamples,width:this.width,height:this.height,frames:this.frames,failure:this.failure};}
 dispose(){this.renderer.domElement?.removeEventListener?.('webglcontextrestored',this.onRestore);this.releaseTexture();this.geometry.dispose();this.material.dispose();}
}
