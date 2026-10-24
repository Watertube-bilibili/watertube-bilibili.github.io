import {supportsOffroadLock,offroadDriveStatus} from './offroad-drive.js';

// Display only: never requests, enables or resets the native differential lock.
export function mobileLockStatus(game){
 const v=game?.vehicle;
 if(!game?.inCar||!supportsOffroadLock(v)||game.aircraft?.active||game.flight?.active||game.robotaxi?.passenger||game.isRoadsterFlying?.())return null;
 const detail=offroadDriveStatus(v,{manual:!game.autopilot,driver:true});
 if(detail==='关闭')return{text:'差速锁 · 关闭',detail,state:'off'};
 if(detail==='已接合')return{text:'差速锁 · 已接合',detail,state:'active'};
 const reason=detail.includes('50 km/h')?'待命 ≤50':detail.includes('Pilot')?'Pilot 暂停':detail.includes('维修')?'待维修':'待接合';
 return{text:'差速锁 · '+reason,detail,state:'pending'};
}
export function syncMobileLockStatus(game,node,body){
 const status=mobileLockStatus(game),visible=!!status;
 body?.classList.toggle('mobile-lock-visible',visible);
 if(!node)return status;
 node.hidden=!visible;
 const text=status?.text??'',detail=status?'电控差速锁：'+status.detail:'';
 if(node.textContent!==text)node.textContent=text;
 if(node.getAttribute('aria-label')!==detail)node.setAttribute('aria-label',detail);
 node.title=detail;node.dataset.state=status?.state??'';
 return status;
}
