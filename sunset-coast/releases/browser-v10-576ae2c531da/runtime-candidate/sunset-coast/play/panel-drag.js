// Position only: no resize UI, no saved coordinates, and no gameplay-storage access.
const installations=new WeakMap();
const positionProperties=['position','left','top','right','bottom','transform','translate','rotate','scale','animation','transition'];
export function installPanelDrag(panel,{handle}={}){
 if(installations.has(panel))return installations.get(panel);
 if(!handle)throw new TypeError('A dedicated panel handle is required');
 const doc=panel.ownerDocument,view=doc.defaultView,original=new Map(positionProperties.map(name=>[name,[panel.style.getPropertyValue(name),panel.style.getPropertyPriority(name)]]));
 let position=null,drag=null;const listeners=[];
 const listen=(target,type,fn)=>{if(target?.addEventListener){target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));}};
 const blocked=()=>panel.hidden||!!panel.closest('[hidden],[inert]');
 const place=(left,top)=>{
  const viewport=view.visualViewport,rect=panel.getBoundingClientRect(),padding=view.getComputedStyle?.(panel.parentElement);
  const edge=side=>Math.max(12,parseFloat(padding?.[side])||0);
  const minX=(viewport?.offsetLeft??0)+edge('paddingLeft'),minY=(viewport?.offsetTop??0)+edge('paddingTop');
  const maxX=Math.max(minX,(viewport?.offsetLeft??0)+(viewport?.width??view.innerWidth)-edge('paddingRight')-rect.width);
  const maxY=Math.max(minY,(viewport?.offsetTop??0)+(viewport?.height??view.innerHeight)-edge('paddingBottom')-rect.height);
  position={left:Math.max(minX,Math.min(left,maxX)),top:Math.max(minY,Math.min(top,maxY))};
  const values={position:'fixed',left:position.left+'px',top:position.top+'px',right:'auto',bottom:'auto',transform:'none',translate:'none',rotate:'none',scale:'none',animation:'none',transition:'none'};
  for(const[name,value]of Object.entries(values))if(panel.style.getPropertyValue(name)!==value)panel.style.setProperty(name,value,'important');
 };
 const finish=event=>{if(!drag||(event?.pointerId!==undefined&&event.pointerId!==drag.id))return;const id=drag.id;drag=null;handle.classList.remove('is-dragging');if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id);};
 const reflow=()=>{if(position&&!blocked())place(position.left,position.top);};
 const reset=()=>{finish();position=null;for(const[name,[value,priority]]of original){if(value)panel.style.setProperty(name,value,priority);else panel.style.removeProperty(name);}};
 handle.tabIndex=0;handle.setAttribute('role','button');handle.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Home');handle.title='拖动移动 · 方向键微调 · Home 归位';
 listen(handle,'pointerdown',event=>{
  if(drag||event.button!==0||blocked()||event.target.closest('button,a,input,select,textarea,[contenteditable=true]'))return;
  const rect=panel.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};
  event.preventDefault();event.stopPropagation();handle.setPointerCapture(event.pointerId);
 });
 listen(handle,'pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;if(blocked()){finish();return;}
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<4)return;
  drag.moved=true;handle.classList.add('is-dragging');event.preventDefault();event.stopPropagation();place(drag.left+dx,drag.top+dy);
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(handle,type,finish);
 listen(handle,'keydown',event=>{
  if(event.target!==handle||blocked())return;const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(!direction&&event.key!=='Home')return;event.preventDefault();event.stopPropagation();if(event.key==='Home'){reset();return;}
  const rect=panel.getBoundingClientRect(),step=event.shiftKey?40:10;place(rect.left+direction[0]*step,rect.top+direction[1]*step);
 });
 // Keyup bubbles so a key held before handle focus cannot get stuck in gameplay.
 listen(handle,'contextmenu',event=>event.preventDefault());
 listen(view,'blur',()=>finish());listen(doc,'visibilitychange',()=>{if(doc.hidden)finish();});
 const resize=()=>{finish();reflow();};listen(view,'resize',resize);listen(view.visualViewport,'resize',resize);listen(view.visualViewport,'scroll',resize);
 const observer=view.ResizeObserver?new view.ResizeObserver(()=>{if(blocked())finish();else reflow();}):null;observer?.observe(panel);
 const api={reflow,reset,get hasCustomPosition(){return !!position;},destroy(){reset();observer?.disconnect();listeners.forEach(remove=>remove());installations.delete(panel);}};
 installations.set(panel,api);return api;
}
