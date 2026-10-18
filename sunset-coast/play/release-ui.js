import {renderModalInterface} from './interface-view.js';
import {RELEASE_READ_KEY,SAVE_SCOPE_NOTE} from './storage-keys.js';
import {DISPLAY_RELEASE as CURRENT_RELEASE,RELEASE_HISTORY,RELEASE_IS_PREVIEW as RELEASE_CANDIDATE,RELEASE_ACK_VERSION} from './release-notes.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function releaseAcknowledged(storage,version=RELEASE_ACK_VERSION){try{return storage.getItem(RELEASE_READ_KEY)===version;}catch{return false;}}
export function acknowledgeRelease(storage,version=RELEASE_ACK_VERSION){try{storage.setItem(RELEASE_READ_KEY,version);return true;}catch{return false;}}
export function installReleaseUI(game){
 const badge=document.createElement('button');badge.id='release-badge';badge.type='button';badge.textContent='版本 '+CURRENT_RELEASE+(RELEASE_CANDIDATE?' · 候选':'');badge.setAttribute('aria-label','版本 '+CURRENT_RELEASE+'，查看更新记录');document.body.append(badge);
 const open=()=>{game.ui.openModal('更新记录','SUNSET COAST / VERSION '+CURRENT_RELEASE);const body=document.getElementById('modal-body');body.innerHTML=RELEASE_HISTORY.map(r=>`<section class="release-entry"><small>${r.version.startsWith('历史')?'': '版本 '}${escape(r.version)} · ${escape(r.date)}</small><h3>${escape(r.title)}</h3><ul>${r.items.map(i=>`<li>${escape(i)}</li>`).join('')}</ul></section>`).join('')+`<p class="phone-note">${CURRENT_RELEASE} 为当前游戏版本${RELEASE_CANDIDATE?'的候选构建，网页及手机体验仍待验收':''}；早期“历史发布”数字仅是网站发布顺序。点击“确认已读”后，此版本不会因刷新重复弹出；仍可从左下角或设置打开记录。</p>${SAVE_SCOPE_NOTE?`<p class="phone-note candidate-storage-note">${SAVE_SCOPE_NOTE}</p>`:''}<button class="primary-action" id="release-acknowledge">确认已读 · 继续游戏</button>`;renderModalInterface();document.getElementById('release-acknowledge').onclick=()=>{const stored=acknowledgeRelease(localStorage);game.ui.closeModal();if(!stored)game.ui.toast('浏览器未允许保存已读状态','error');};};
 badge.onclick=open;game.openReleaseNotes=open;
 if(!releaseAcknowledged(localStorage)){const wait=()=>{if(!document.getElementById('modal').open&&!game.ui.isPhoneOpen()){open();return;}setTimeout(wait,500);};setTimeout(wait,800);}
}
