from pathlib import Path
import sys
p=(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[2]/'jelly-godot-web')/'index.js';s=p.read_text()
old='function _godot_js_pwa_cb(p_update_cb){if("serviceWorker"in navigator){try{const cb=GodotRuntime.get_func(p_update_cb);navigator.serviceWorker.getRegistration().then(GodotPWA.updateState.bind(null,cb))}catch(e){GodotRuntime.error("Failed to assign PWA callback",e)}}}'
new='function _godot_js_pwa_cb(p_update_cb){let sw;try{sw=navigator.serviceWorker}catch(e){return}if(!sw)return;const cb=GodotRuntime.get_func(p_update_cb);sw.getRegistration().then(GodotPWA.updateState.bind(null,cb))}'
if old in s:s=s.replace(old,new)
else:assert new in s,'Godot runtime changed: review sandbox PWA guard'
p.write_text(s)
