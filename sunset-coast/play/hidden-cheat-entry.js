// Session-only discovery; count click once, never both pointerup and click.
export function installHiddenCheatEntry(element,onReveal){
 let taps=0,revealed=false;
 element?.addEventListener('click',()=>{if(revealed)return;if(++taps===10){revealed=true;onReveal();}});
}
