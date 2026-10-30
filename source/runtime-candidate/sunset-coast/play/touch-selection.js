// Prevent native text selection/callouts only on dedicated game controls.
// Touch listeners suppress browser defaults, not game input: Pointer Events
// remain the sole held-button state machine, including multitouch/cancellation.
const installed=new WeakSet();
const editable=target=>{
 const node=target?.nodeType===3?target.parentElement:target;
 return !!node&&(node.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName??'')||!!node.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'));
};
export function installControlSelectionGuard(node,{continuous=false}={}){
 if(!node?.addEventListener||installed.has(node))return;
 installed.add(node);
 const prevent=event=>{if(!editable(event.target)&&event.cancelable)event.preventDefault();};
 for(const type of ['contextmenu','selectstart','dragstart'])node.addEventListener(type,prevent,{passive:false});
 // Do not add these to click-driven entry/fire buttons: canceling touchstart
 // can suppress their synthesized click on iOS. Continuous controls use only
 // pointerdown/up/cancel for their actions and need no synthetic click.
 if(continuous)for(const type of ['touchstart','touchmove'])node.addEventListener(type,prevent,{passive:false});
}
