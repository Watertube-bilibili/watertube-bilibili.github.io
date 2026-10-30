import {createWorldSlot,listWorldSlots} from './browser-world-slots.js';
import {validateSave} from './save-validation.js';
const url=(map,id)=>'./play/?runtime=browser&world='+map+'&browserSlot='+encodeURIComponent(id);
export function installBrowserWorldChooser({document=globalThis.document,window=globalThis.window,location=globalThis.location,storage=globalThis.localStorage,createSlot=createWorldSlot,listSlots=listWorldSlots,validate=validateSave}={}){
 const status=document.getElementById('status'),root=document.getElementById('worlds');
 let generation=0,disposed=false;
 const current=token=>!disposed&&token===generation;
 async function render(){
  if(disposed)return false;
  const token=++generation;root.replaceChildren();status.textContent='';
  try{for(const [map,name] of [['estuary','海岸 ESTUARY'],['crescent','弧湾 CRESCENT']]){
   if(!current(token))return false;
   const section=document.createElement('section'),title=document.createElement('h2'),create=document.createElement('button');title.textContent=name;create.textContent='创建新的独立进度';create.disabled=false;section.append(title,create);root.append(section);
   create.onclick=async()=>{
    if(!current(token)||create.disabled)return false;
    create.disabled=true;
    try{const entry=await createSlot(storage,map,validate);if(!current(token))return false;location.assign(url(map,entry.id));return true;}
    catch(error){if(current(token)){status.textContent=error.message;create.disabled=false;}return false;}
   };
   const entries=await listSlots(storage,map,validate);
   if(!current(token))return false;
   for(const entry of entries){const item=document.createElement(entry.error?'p':'a');item.textContent=entry.error?entry.id+'：'+entry.error:'继续 · $'+entry.save.money.toLocaleString()+' · '+entry.id.slice(-8);if(entry.error)item.className='error';else item.href=url(map,entry.id);section.append(item);}
  }return true;}catch(error){if(current(token))status.textContent=error.message;return false;}
 }
 // A cached hub retains its DOM, including the disabled create button. Re-read
 // durable slots on return; late work from the old page/render must not redirect
 // or write into the newly restored UI.
 const onHide=()=>{generation++;};
 const onShow=event=>{if(event.persisted)void render();};
 window.addEventListener('pagehide',onHide);window.addEventListener('pageshow',onShow);
 return {render,ready:render(),dispose(){if(disposed)return;disposed=true;generation++;window.removeEventListener('pagehide',onHide);window.removeEventListener('pageshow',onShow);}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')installBrowserWorldChooser();
