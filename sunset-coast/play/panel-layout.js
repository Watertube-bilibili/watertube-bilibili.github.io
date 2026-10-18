const layouts=new WeakMap();
const styleKeys=['position','left','top','right','bottom','transform','width','height','max-width','max-height','margin','overflow','translate','rotate','scale','animation','transition','--vc-left','--vc-top'];
export function constrainPanelRect(rect,viewport,{minWidth=160,minHeight=100,inset=8}={}){
 const finite=(v,f)=>Number.isFinite(v)?v:f;
 const availableWidth=Math.max(44,finite(viewport.width,320)-inset*2),availableHeight=Math.max(44,finite(viewport.height,480)-inset*2);
 const width=Math.min(Math.max(minWidth,finite(rect.width,minWidth)),availableWidth),height=Math.min(Math.max(minHeight,finite(rect.height,minHeight)),availableHeight);
 return{width,height,left:Math.max(inset,Math.min(finite(rect.left,inset),availableWidth+inset-width)),top:Math.max(inset,Math.min(finite(rect.top,inset),availableHeight+inset-height))};
}
// Only explicit handles capture pointers. Content remains available for touch scrolling.
export function installPanelLayout(panel,{id,handle=null,resize=false,resetControl=true,minWidth=160,minHeight=100,enabled=()=>true}={}){
 if(layouts.has(panel))return layouts.get(panel);
 const key='neon-panel-layout:'+id,original=Object.fromEntries(styleKeys.map(k=>[k,[panel.style.getPropertyValue(k),panel.style.getPropertyPriority(k)]]));
 let saved=null,gesture=null,applied=false;const grips=[];
 try{const value=JSON.parse(localStorage.getItem(key));if(value&&['left','top'].every(k=>Number.isFinite(value[k])))saved={left:value.left,top:value.top};}catch{}
 const restore=()=>{for(const [name,[value,priority]]of Object.entries(original)){if(value)panel.style.setProperty(name,value,priority);else panel.style.removeProperty(name);}panel.classList.remove('panel-position-custom');applied=false;};
 const apply=rect=>{
  if(!enabled()){if(applied)restore();return;}
  // Recover responsive CSS dimensions; old persisted width/height are ignored.
  restore();const natural=panel.getBoundingClientRect();
  if(!natural.width||!natural.height)return;
  const bounded=constrainPanelRect({...rect,width:natural.width,height:natural.height},{width:innerWidth,height:innerHeight},{minWidth:1,minHeight:1});
  Object.assign(panel.style,{position:'fixed',left:bounded.left+'px',top:bounded.top+'px',right:'auto',bottom:'auto',transform:'none',maxWidth:'calc(100vw - 16px)',maxHeight:'calc(100dvh - 16px)',margin:'0'});
  // The cockpit's positioned CSS uses these variables with !important. Keep
  // resize and native drag in the same viewport coordinate system.
  if(panel.id==='vehicle-cockpit'){panel.style.setProperty('--vc-left',bounded.left+'px');panel.style.setProperty('--vc-top',bounded.top+'px');}
  saved={left:bounded.left,top:bounded.top};applied=true;panel.classList.add('panel-position-custom');panel.dispatchEvent(new Event('panelresize'));
 };
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(saved));}catch{}};
 const finish=()=>{const g=gesture;gesture=null;if(g?.element.hasPointerCapture?.(g.id))g.element.releasePointerCapture(g.id);if(g)save();};
 const reset=()=>{finish();saved=null;restore();try{localStorage.removeItem(key);}catch{}panel.dispatchEvent(new Event('panelresize'));};
 const bind=(element,mode)=>{
  element.classList.add(mode==='move'?'panel-layout-move':'panel-layout-grip');
  element.addEventListener('pointerdown',e=>{if(e.button!==0||gesture||!enabled()||mode==='move'&&e.target.closest('button,input,select,textarea,a'))return;e.preventDefault();e.stopPropagation();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,rect:panel.getBoundingClientRect(),mode,element};element.setPointerCapture(e.pointerId);});
  element.addEventListener('pointermove',e=>{if(gesture?.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const g=gesture,dx=e.clientX-g.x,dy=e.clientY-g.y;apply({left:g.rect.left+(mode==='move'?dx:0),top:g.rect.top+(mode==='move'?dy:0),width:g.rect.width+(mode==='resize'?dx:0),height:g.rect.height+(mode==='resize'?dy:0)});});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,e=>{if(gesture?.id===e.pointerId)finish();});
  element.addEventListener('keydown',e=>{if(e.target!==element||!enabled())return;const delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.code];if(e.code==='Home'){e.preventDefault();e.stopPropagation();reset();return;}if(!delta)return;e.preventDefault();e.stopPropagation();const r=panel.getBoundingClientRect();apply({left:r.left+(mode==='move'?delta[0]:0),top:r.top+(mode==='move'?delta[1]:0),width:r.width+(mode==='resize'?delta[0]:0),height:r.height+(mode==='resize'?delta[1]:0)});save();});
  element.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.code))e.stopPropagation();});
 };
 if(handle){handle.tabIndex=0;handle.title='拖动移动 · 方向键微调 · Home 重置';handle.setAttribute('aria-label',handle.title);bind(handle,'move');}
 if(resetControl){const resetButton=document.createElement('button');resetButton.type='button';resetButton.className='panel-layout-reset';resetButton.textContent='↺';resetButton.title='恢复默认位置';resetButton.setAttribute('aria-label',resetButton.title);resetButton.addEventListener('click',e=>{e.stopPropagation();reset();});(handle??panel).append(resetButton);grips.push(resetButton);}
 const reflow=()=>{const active=enabled();for(const el of grips)el.hidden=!active;if(saved&&active)apply(saved);else if(!active&&applied)restore();};
 window.addEventListener('resize',()=>{finish();reflow();});window.addEventListener('controlsizechange',()=>{finish();reflow();});window.addEventListener('blur',finish);document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
 const controller={reset,reflow};layouts.set(panel,controller);reflow();return controller;
}
