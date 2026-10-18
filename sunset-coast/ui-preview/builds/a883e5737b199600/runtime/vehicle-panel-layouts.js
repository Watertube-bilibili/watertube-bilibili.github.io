import {installPanelLayout} from './panel-layout.js';
const installed=new WeakSet();let watched=false;
export const VEHICLE_PANEL_LAYOUTS=Object.freeze([
 ['#mobile-driving-tools','header','mobile-driving-tools',180,160],
 ['#mobile-drawer','header','mobile-management',240,220],
 ['#mobile-gears',null,'mobile-gears',110,90],
 ['#mobile-pedal-signals',null,'mobile-turn-signals',130,90],
 ['#modal','.modal-top','management-dialog',280,220],
 ['#phone','.phone-top','phone-management',240,240],
 ['#sensor-panel','.sensor-header','vehicle-camera',180,150],
 ['#brake-closeup','header','brake-inspection',180,150],
 ['#touch-steering',null,'touch-steering',120,110],
 ['.touch-actions',null,'touch-pedals',130,160],
 ['.drive-hud','.car-label','driving-status',220,180],
 ['.map-panel','.map-heading','driving-minimap',180,160],
 ['#mission-card','.mission-label','mission-status',220,150],
 ['.roadster-flight-left',null,'roadster-steering',120,140],
 ['.roadster-flight-right',null,'roadster-lift',100,140],
 ['.roadster-attitude',null,'roadster-attitude',120,140],
 ['.aircraft-readout','strong','aircraft-instruments',220,120],
 ['.aircraft-utility',null,'aircraft-vehicle',160,100],
 ['.aircraft-left',null,'aircraft-steering',120,140],
 ['.aircraft-right',null,'aircraft-throttle',100,140]
]);
export function installVehiclePanelLayouts(game){
 for(const[selector,handleSelector,id,minWidth,minHeight]of VEHICLE_PANEL_LAYOUTS){
  const panel=document.querySelector(selector);if(!panel||installed.has(panel))continue;installed.add(panel);
  let handle=handleSelector?panel.querySelector(handleSelector):null;
  if(!handle){handle=document.createElement('div');handle.className='vehicle-panel-dragbar';handle.textContent='⠿ 移动';panel.prepend(handle);}
  installPanelLayout(panel,{id,handle,minWidth,minHeight});
 }
 // The Roadster vehicle button keeps its compact default when collapsed.
 const root=document.getElementById('roadster-controls');
 if(root&&!installed.has(root)){installed.add(root);const controller=installPanelLayout(root.querySelector('.roadster-status'));const observer=new MutationObserver(()=>controller.reflow());observer.observe(root,{attributes:true,attributeFilter:['class']});}
 if(!watched){watched=true;const selector=VEHICLE_PANEL_LAYOUTS.map(p=>p[0]).join(',');const observer=new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches(selector)||node.querySelector(selector)))))installVehiclePanelLayouts(game);});observer.observe(document.body,{childList:true,subtree:true});}
}
