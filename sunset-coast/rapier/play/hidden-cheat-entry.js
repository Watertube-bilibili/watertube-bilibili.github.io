// Session-only discovery. Delegate from the stable phone root so rerenders do
// not lose taps. Only save navigation counts, never save/load/import/export actions.
export function installHiddenCheatEntry(phone,onReveal){
 let taps=0,revealed=false;
 const click=event=>{
  const button=event.target?.closest?.('button[data-interface-page="save"],button[data-page="save"]');
  if(revealed||!button||!phone.contains(button)||button.disabled)return;
  if(++taps!==10)return;
  revealed=true;
  // Run before ordinary navigation so the tenth tap cannot overwrite the terminal.
  event.preventDefault();
  event.stopPropagation();
  onReveal();
 };
 // A touch generates one click. Listening to pointer/touch events too would double count.
 phone?.addEventListener('click',click,true);
 return()=>phone?.removeEventListener('click',click,true);
}
