/** Required 2.0 interface view. Render synchronously with the owning game action. */
const $=id=>document.getElementById(id);
const create=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
function disclosure(node,title){if(!node||node.parentElement?.matches('details'))return;const d=create('details','interface-disclosure'),s=create('summary','',title);node.before(d);d.append(s,node);}
function searchControl(id,label,placeholder){const wrap=create('div','interface-search'),l=create('label','',label),input=create('input');l.htmlFor=id;input.id=id;input.type='search';input.placeholder=placeholder;input.autocomplete='off';wrap.append(l,input);return{wrap,input};}
function enhancePhone(){
 const content=$('phone-content'),phone=$('phone');if(!content||!phone)return;
 const home=$('phone-home');if(home&&!home.textContent)home.textContent='返回全部应用';
 if(!phone.querySelector('.interface-phone-nav')){
  const nav=create('nav','interface-phone-nav');nav.setAttribute('aria-label','手机常用应用');
  for(const [page,label] of [['home','全部'],['nav','导航'],['jobs','工作'],['garage','车库'],['save','存档']]){
   const b=create('button','',label);b.type='button';b.dataset.interfacePage=page;
   // GameUI delegates navigation from the phone root, without synthetic clicks.
   nav.append(b);
  }
  phone.querySelector('.phone-top')?.after(nav);
 }
 const title=$('phone-title')?.textContent||'',page=({'coastOS':'home','城市导航':'nav','城市工作':'jobs','我的车库':'garage','游戏存档':'save'})[title];
 for(const button of phone.querySelectorAll('[data-interface-page]')){
  const current=button.dataset.interfacePage===page?'page':'false';if(button.getAttribute('aria-current')!==current)button.setAttribute('aria-current',current);
 }
 const grid=content.querySelector('.phone-app-grid');
 if(grid&&!grid.dataset.organized){
  grid.dataset.organized='true';
  const groups=[['出行与探索',['nav','rides','flights']],['城市生活',['jobs','garage','bank','characters','inventory']],['游戏与进度',['save','settings','cheats']]];
  for(const[label,ids]of groups){const section=create('section','interface-app-group'),heading=create('h4','',label),items=create('div','interface-app-items');section.append(heading,items);for(const id of ids){const app=grid.querySelector(`[data-page="${id}"]`);if(app)items.append(app);}grid.append(section);}
 }
 // Label the existing select without replacing it or its onchange callback.
 for(const select of content.querySelectorAll('select'))if(!select.hasAttribute('aria-label')&&!content.querySelector(`label[for="${select.id}"]`))select.setAttribute('aria-label',select.id==='ride-brand'?'接送品牌':'选择选项');
}
let garageSearchQuery='';
function enhanceGarage(body){
 const grid=body.querySelector('.garage-grid');if(!grid||body.querySelector('#interface-garage-search'))return;
 const{wrap,input}=searchControl('interface-garage-search','查找车型','搜索品牌或车型名称');
 input.value=garageSearchQuery;
 body.querySelector('.garage-filters').before(wrap);
 const empty=create('p','interface-empty','没有匹配的车型。试试其他名称，或切换到全部品牌。');empty.hidden=true;empty.setAttribute('role','status');grid.after(empty);
 const apply=()=>{
  const brand=body.querySelector('[data-garage-filter][aria-pressed="true"]')?.dataset.garageFilter||'';
  garageSearchQuery=input.value;const query=garageSearchQuery.trim().toLocaleLowerCase();let visible=0;
  for(const card of grid.querySelectorAll('[data-garage-brand]')){card.hidden=!!(brand&&card.dataset.garageBrand!==brand)||!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)visible++;}
  const result=body.querySelector('.garage-results');if(result)result.textContent=`${brand||'全部品牌'} · ${visible} 款车型${query?' · 搜索结果':''}`;
  empty.hidden=visible>0;
 };
 input.addEventListener('input',apply);
 body.querySelector('.garage-filters').addEventListener('click',()=>queueMicrotask(apply));
 apply();
}
function enhanceMap(body){
 const places=body.querySelector('.world-map-places');if(!places||body.querySelector('#interface-map-search'))return;
 const{wrap,input}=searchControl('interface-map-search','查找目的地','搜索地点名称');places.before(wrap);
 const empty=create('p','interface-empty','没有匹配地点。也可以直接点击地图选择位置。');empty.hidden=true;empty.setAttribute('role','status');places.after(empty);
 input.addEventListener('input',()=>{const q=input.value.trim().toLocaleLowerCase();let count=0;for(const b of places.querySelectorAll('[data-map-place]')){b.hidden=!b.textContent.toLocaleLowerCase().includes(q);if(!b.hidden)count++;}empty.hidden=count>0;});
}
let modalPageSignature='';
function enhanceModal(){
 const body=$('modal-body'),modal=$('modal');if(!body||!modal)return;
 const surface=body.querySelector('.garage-grid')?'garage':body.querySelector('.world-map-layout')?'map':body.querySelector('.settings-grid')?'settings':body.querySelector('#assist-max-speed')?'assist':body.querySelector('.character-grid')?'characters':body.querySelector('.release-entry')?'release':'general';
 const signature=surface+'|'+($('modal-title')?.textContent||'');
 if(signature!==modalPageSignature){modal.scrollTop=0;body.scrollTop=0;modalPageSignature=signature;}
 if(modal.dataset.surface!==surface)modal.dataset.surface=surface;
 enhanceGarage(body);enhanceMap(body);
 const settings=body.querySelector('.settings-grid');
 if(settings&&!settings.dataset.organized){settings.dataset.organized='true';for(const[col,title]of [[settings.children[0],'驾驶与环境'],[settings.children[1],'继续与管理']])col?.prepend(create('h3','interface-section-title',title));}
 disclosure(body.querySelector('.help-grid'),'键盘操作说明');disclosure(body.querySelector('.about-note'),'游戏机制与模型说明');
 // Existing selections remain native and immediately effective.
 const labels={'quality-select':'画面质量','weather-select':'天气','time-select':'时间'};
 for(const[id,label]of Object.entries(labels))$(id)?.setAttribute('aria-label',label);
}
export function renderPhoneInterface(){enhancePhone();}
export function renderModalInterface(){enhanceModal();}
export function installInterfaceSystem(){
 document.documentElement.dataset.interfaceSystem='2';
 renderPhoneInterface();renderModalInterface();
}
