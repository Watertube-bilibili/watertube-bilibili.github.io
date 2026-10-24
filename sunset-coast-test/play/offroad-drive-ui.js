import {supportsOffroadLock,setOffroadDiffLock,offroadDriveStatus,offroadChassisSpeed} from './offroad-drive.js';

// Kept inside the existing settings sheet: no new mobile HUD obstruction or
// keyboard binding. The selection is transient and never alters a saved car.
export function appendOffroadDriveControls(game,body){
 const v=game.vehicle;if(!supportsOffroadLock(v)||!body)return null;
 const doc=body.ownerDocument??document,section=doc.createElement('section');section.className='offroad-drive-settings';
 const heading=doc.createElement('h3');heading.textContent='电控差速锁 · 游戏限滑模拟';
 const note=doc.createElement('p');note.className='phone-note';note.textContent='G9 / NOMAD / B7 / CYBR 游戏电控限滑：将相同总驱动力分配给仍有抓地的轮胎，不增加动力、轮胎抓地或攀爬极限。可随时预选，50 km/h 及以下接合；超过 60 km/h 暂停，降至 50 km/h 自动恢复。Pilot 暂停接合，手动关闭才取消预选。速度门槛为游戏设定，按车身实际速度判定；不是机械三把锁，也不是陡坡缓降或自动刹车。普通小坡无需开启。';
 const button=doc.createElement('button');button.type='button';button.className='secondary-action';button.id='offroad-diff-lock';button.style.minHeight='44px';
 const status=doc.createElement('p');status.className='phone-note';status.id='offroad-diff-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const refresh=()=>{button.textContent=v.offroadDiffLockRequested?'关闭电控差速锁':'预选电控差速锁';button.setAttribute('aria-pressed',String(!!v.offroadDiffLockRequested));button.disabled=!game.inCar||game.vehicle!==v;status.textContent=game.inCar?`当前：${offroadDriveStatus(v,{manual:!game.autopilot,driver:game.inCar})} · 车身 ${Math.round(offroadChassisSpeed(v)*3.6)} km/h`:'请先坐进这辆车。';};
 button.onclick=()=>{
  if(!game.inCar||game.vehicle!==v)return;
  const result=setOffroadDiffLock(v,!v.offroadDiffLockRequested,{manual:!game.autopilot});refresh();status.textContent=result.reason;
 };
 section.append(heading,note,button,status);body.querySelector('#apply-assist-settings')?.before(section);if(!section.parentNode)body.append(section);refresh();return section;
}
