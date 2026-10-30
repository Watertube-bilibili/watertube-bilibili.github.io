import {createWorldSlot,listWorldSlots} from './browser-world-slots.js';
import {validateSave} from './save-validation.js';
const status=document.getElementById('status'),root=document.getElementById('worlds');
const url=(map,id)=>'./play/?runtime=browser&world='+map+'&browserSlot='+encodeURIComponent(id);
async function render(){root.replaceChildren();for(const [map,name] of [['estuary','海岸 ESTUARY'],['crescent','弧湾 CRESCENT']]){
 const section=document.createElement('section'),title=document.createElement('h2'),create=document.createElement('button');title.textContent=name;create.textContent='创建新的独立进度';section.append(title,create);root.append(section);
 create.onclick=async()=>{create.disabled=true;try{const entry=await createWorldSlot(localStorage,map,validateSave);location.assign(url(map,entry.id));}catch(e){status.textContent=e.message;create.disabled=false;}};
 for(const entry of await listWorldSlots(localStorage,map,validateSave)){const item=document.createElement(entry.error?'p':'a');item.textContent=entry.error?entry.id+'：'+entry.error:'继续 · $'+entry.save.money.toLocaleString()+' · '+entry.id.slice(-8);if(entry.error)item.className='error';else item.href=url(map,entry.id);section.append(item);}
 }}render().catch(e=>status.textContent=e.message);
