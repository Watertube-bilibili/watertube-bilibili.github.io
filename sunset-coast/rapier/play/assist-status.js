// Stable status presentation: identical physics/HUD ticks never rewrite a live
// region. A disabled AEB is a quiet status; FCW remains visible, not an alert.
export function updateAssistStatus(node,game,{cockpit=false}={}){
 if(!node)return;
 const status=game.assistTelemetry,off=game.assistSettings?.aebEnabled===false||game.aebEnabled===false;
 const emergency=!!status?.aeb&&!off,warning=!!status?.fcw;
 const text=emergency?'AEB · 紧急电子制动':warning?(cockpit?(off?'碰撞预警 · AEB 关闭':'前方碰撞风险'):(off?'⚠ 碰撞风险 · AEB 关闭':'⚠ 前方碰撞风险')):off?'AEB 已关闭':'';
 const hidden=game.inCar===false||!(emergency||warning||off),live=off?'off':'polite';
 if(node.getAttribute('aria-live')!==live)node.setAttribute('aria-live',live);
 if(node.hidden!==hidden)node.hidden=hidden;
 if(node.textContent!==text)node.textContent=text;
 for(const [name,on] of [['aeb',emergency],['assist-off',off&&!warning]])if(node.classList.contains(name)!==on)node.classList.toggle(name,on);
}
