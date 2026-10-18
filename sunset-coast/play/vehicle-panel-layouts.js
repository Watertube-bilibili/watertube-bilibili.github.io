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
// Registry retained for layout coverage; no gameplay editing chrome is installed.
export function installVehiclePanelLayouts(game){}
