const byId = id => document.getElementById(id);
const canvas = byId('canvas');
const controls = byId('controls');
const keys = new Set();
const holds = new Map();
const sticks = { move: {x:0,y:0}, tilt: {x:0,y:0} };
let ready = false, starting = false, fatal = false;
let stopped = false;
const controlledKeys = new Set(['KeyW','KeyS','KeyA','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyQ','KeyE','PageUp','PageDown','Space','KeyX','KeyH','KeyR','KeyP','KeyC']);
const pressed = key => keys.has(key) ? 1 : 0;
const held = name => [...holds.values()].includes(name) ? 1 : 0;
const clamp = value => Math.max(-1, Math.min(1, value));

function syncInputs() {
    Object.assign(hub, {
        moveX: clamp(sticks.move.x + pressed('KeyD') - pressed('KeyA')),
        moveY: clamp(sticks.move.y + pressed('KeyW') - pressed('KeyS')),
        tiltX: clamp(sticks.tilt.x + pressed('ArrowRight') - pressed('ArrowLeft')),
        tiltY: clamp(sticks.tilt.y + pressed('ArrowUp') - pressed('ArrowDown')),
        yawCmd: clamp(pressed('KeyE') - pressed('KeyQ') + held('yaw-right') - held('yaw-left')),
        adjust: clamp(pressed('PageUp') - pressed('PageDown') + held('more') - held('less')),
        boost: Boolean(pressed('Space'))
    });
    for (const id of ['more','less','yaw-left','yaw-right']) byId(id).classList.toggle('held', Boolean(held(id)));
}
function clear() {
    keys.clear(); holds.clear();
    for (const name of ['move','tilt']) {
        sticks[name] = {x:0,y:0};
        byId(name+'-stick').firstElementChild.style.transform = '';
    }
    syncInputs();
    hub.cut = false; hub.trim = false;
}
function setPause(value) {
    if (!ready || stopped) return;
    clear();
    hub.paused = value;
    byId('pause').textContent = value ? '继续' : '暂停';
    byId('pause').setAttribute('aria-pressed', String(value));
    controls.disabled = value;
    byId('stop-overlay').hidden = !value;
    if (value) {
        byId('stop-title').textContent = '已暂停';
        byId('stop-action').textContent = '继续试飞';
    }
}
function reset() {
    if (!ready) return;
    clear(); hub.paused = false; hub.resetRequested = true; stopped = false;
    byId('pause').textContent = '暂停'; byId('pause').setAttribute('aria-pressed','false');
    byId('stop-overlay').hidden = true; controls.disabled = false;
    canvas.focus({preventScroll:true});
}
function toggleCamera() {
    if (!ready) return;
    hub.chase = !hub.chase;
    byId('camera').setAttribute('aria-pressed', String(hub.chase));
}
function update(json) {
    const state = JSON.parse(json);
    window.roadsterStatus = state;
    const metrics = {alt:state.altitude.toFixed(1), speed:Math.round(state.speed*3.6), vertical:state.verticalSpeed.toFixed(1),
        gas:state.gas.toFixed(1), power:Math.round(state.lift*100), time:state.remaining<0?'—':state.remaining.toFixed(1),
        angle:'俯仰 '+Math.round(state.pitch)+'° · 横滚 '+Math.round(state.roll)+'° · 航向 '+Math.round(state.yaw)+'°',
        phase:state.paused?'暂停':state.phase};
    for (const [id,value] of Object.entries(metrics)) {
        const el = byId(id); if (el.textContent !== String(value)) el.textContent = value;
    }
    byId('gasbar').style.transform = 'scaleX('+Math.max(0,state.gas/250)+')';
    if (state.stopped && !stopped) {
        stopped = true; clear(); controls.disabled = true;
        byId('stop-title').textContent = state.phase; byId('stop-action').textContent='复位补气，再试一次';
        byId('stop-overlay').hidden = false;
    }
}
function markReady() {
    ready = true; starting = false;
    byId('cockpit').classList.add('live');
    byId('preflight').hidden = true; byId('overlay').hidden = false;
    for (const id of ['pause','camera','reset']) byId(id).disabled = false;
    controls.disabled = false;
    canvas.focus({preventScroll:true}); resizeCanvas();
}
const hub = window.flightHub = {clear,update,markReady,resetRequested:false,paused:false,chase:false,cut:false,trim:false};
clear();
function resizeCanvas() {
    const rect = byId('runway').getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1,1.5, 1550/rect.width, 890/rect.height);
    const width = Math.max(1, Math.round(rect.width*scale));
    const height = Math.max(1, Math.round(rect.height*scale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width=width; canvas.height=height; }
}
new ResizeObserver(resizeCanvas).observe(byId('runway'));
function loadRuntime() {
    if (typeof window.Engine === 'function') return Promise.resolve();
    return new Promise((resolve,reject)=>{
        const script = document.createElement('script');
        script.src = 'engine/lab.js';
        script.onload = resolve; script.onerror = () => reject(new Error('无法下载引擎，请检查连接后重试。'));
        document.head.append(script);
    });
}
function showFailure(error) {
    console.warn('Rocket Web',error);
    fatal = true; starting = false; ready = false; clear(); controls.disabled = true;
    byId('cockpit').classList.remove('live'); byId('overlay').hidden = true;
    byId('preflight').hidden = false; byId('stop-overlay').hidden = true;
    for (const id of ['pause','camera','reset']) byId(id).disabled = true;
    byId('launch').disabled=false; byId('launch').textContent='重新加载';
    byId('load-note').textContent=error?.message?.includes('WebGL') ? '此浏览器需要可用的 WebGL 2。请开启硬件加速或更换浏览器。' : '加载中断。请检查网络或重新加载试飞场。';
}
async function launch() {
    if (fatal) { location.reload(); return; }
    if (ready || starting) return;
    starting = true; byId('launch').disabled=true; byId('launch').textContent='加载中…';
    byId('load-note').textContent='正在载入 Godot 引擎与车辆';
    try {
        await loadRuntime();
        const missing=Engine.getMissingFeatures({threads:false});
        if (missing.length) throw new Error(missing.join('、'));
        const runtime = new Engine({
            canvas, canvasResizePolicy:0, focusCanvas:false, executable:'engine/lab', mainPack:'lab.pck',
            onProgress:(current,total)=>{
                if (!ready && current>0 && total>0) byId('load-note').textContent='已载入 '+Math.min(100,Math.round(current/total*100))+'%';
            },
            onExit:()=>{ if (ready || starting) showFailure(new Error('引擎已退出')); }
        });
        resizeCanvas();
        await Promise.all([runtime.init('engine/lab'), runtime.preloadFile('engine/lab.pck','lab.pck')]);
        await runtime.start({args:['--main-pack','lab.pck']});
    } catch (error) {showFailure(error);}
}
byId('launch').addEventListener('click',launch);
byId('reset').addEventListener('click',reset);
byId('pause').addEventListener('click',()=>setPause(!hub.paused));
byId('camera').addEventListener('click',toggleCamera);
byId('stop-action').addEventListener('click',()=>{if (stopped) reset(); else setPause(false);});
byId('cut').addEventListener('click',()=>{hub.cut=true;});
byId('trim').addEventListener('click',()=>{hub.trim=true;});
document.querySelector('.title a').addEventListener('click',()=>{byId('method').open=true;});

window.addEventListener('keydown',event=>{
    if (!ready || !controlledKeys.has(event.code) || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code==='Space' && ['BUTTON','SUMMARY','A'].includes(event.target.tagName)) return;
    if (['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) return;
    event.preventDefault();
    if (!event.repeat) {
        if (event.code==='KeyP') {setPause(!hub.paused); return;}
        if (event.code==='KeyR') {reset(); return;}
        if (event.code==='KeyC') {toggleCamera(); return;}
        if (!hub.paused && !stopped) {
            if (event.code==='KeyX') hub.cut=true;
            if (event.code==='KeyH') hub.trim=true;
        }
    }
    if (!hub.paused && !stopped) {keys.add(event.code);syncInputs();}
},true);
window.addEventListener('keyup',event=>{if (keys.delete(event.code)) syncInputs();},true);
window.addEventListener('blur',()=>{clear();if (ready && !stopped) setPause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();if(ready&&!stopped)setPause(true);}});
for (const id of ['more','less','yaw-left','yaw-right']) {
    const el=byId(id);
    el.addEventListener('pointerdown',event=>{
        if (controls.disabled || event.button!==0) return;
        event.preventDefault();el.setPointerCapture(event.pointerId);holds.set(event.pointerId,id);syncInputs();
    });
    const release=event=>{if(holds.delete(event.pointerId))syncInputs();};
    for(const type of ['pointerup','pointercancel','lostpointercapture']) el.addEventListener(type,release);
    el.addEventListener('keydown',event=>{
        if(!['Enter',' '].includes(event.key)||controls.disabled)return;
        event.preventDefault();holds.set('key-'+id,id);syncInputs();
    });
    el.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key)){holds.delete('key-'+id);syncInputs();}});
    el.addEventListener('blur',()=>{holds.delete('key-'+id);syncInputs();});
}
for (const name of ['move','tilt']) {
    const el=byId(name+'-stick');let pointer=null;
    const position=event=>{
        const rect=el.getBoundingClientRect();const r=rect.width*.43;
        let x=(event.clientX-rect.x-rect.width/2)/r, y=-(event.clientY-rect.y-rect.height/2)/r;
        const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
        sticks[name]={x:Math.abs(x)<.06?0:x,y:Math.abs(y)<.06?0:y};
        el.firstElementChild.style.transform='translate('+x*r*.75+'px,'+(-y*r*.75)+'px)';syncInputs();
    };
    el.addEventListener('pointerdown',event=>{if(controls.disabled||pointer!==null||event.button!==0)return;
        event.preventDefault();pointer=event.pointerId;el.setPointerCapture(pointer);position(event);});
    el.addEventListener('pointermove',event=>{if(pointer===event.pointerId&&!controls.disabled)position(event);});
    const up=event=>{if(pointer!==event.pointerId)return;pointer=null;sticks[name]={x:0,y:0};el.firstElementChild.style.transform='';syncInputs();};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,up);
}
