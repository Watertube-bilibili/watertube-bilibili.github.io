// Presentation reads the simulated camera output, never the world's entity list.
// Road paint is semantic camera pixels, not neural FSD or invented lane geometry.
export function sensorFresh(data,time,inCar=true){
 return !!(inCar&&data?.frames&&Number.isFinite(data.timestamp)&&Number.isFinite(time)&&time-data.timestamp<=1.2&&time>=data.timestamp-.1);
}
export function cameraDetections(data,time,inCar=true){
 if(!sensorFresh(data,time,inCar))return [];
 const source=Array.isArray(data.tracks)?data.tracks:data.boxes??[];
 return source.map(d=>({...d,cls:d.cls==='vehicle'?3:d.cls==='person'||d.cls==='pedestrian'?4:d.cls}))
  .filter(d=>(d.cls===3||d.cls===4)&&Number.isFinite(d.distance)&&Number.isFinite(d.lateral)&&d.distance>1.5&&d.distance<85&&Math.abs(d.lateral)<Math.tan(41*Math.PI/180)*d.distance+1.5&&d.visible!==false&&(d.age??0)<1.2&&(d.confidence??1)>=.1)
  .sort((a,b)=>a.distance-b.distance).slice(0,18);
}
export function cameraRoad(data,time,inCar=true){
 if(!sensorFresh(data,time,inCar))return [];
 return (data.road??[]).filter(p=>[p.distance,p.left,p.right].every(Number.isFinite)&&p.distance>.5&&p.distance<85&&p.left<p.right&&Math.abs(p.left)<55&&Math.abs(p.right)<55&&(p.confidence??1)>=.1)
  .sort((a,b)=>a.distance-b.distance).slice(0,16);
}
export function cameraRoadPaint(sensor,vehicle,time,inCar=true){
 if(!sensorFresh(sensor?.data,time,inCar)||!sensor.classes||!sensor.ground||!vehicle)return [];
 const points=[];
 for(let y=38;y<sensor.h;y+=2)for(let x=0;x<sensor.w;x++){
  if(sensor.classes[y*sensor.w+x]!==2)continue;
  const p=sensor.ground(x+.5,y+.5,vehicle);
  if(p&&Number.isFinite(p.distance)&&Number.isFinite(p.lateral)&&p.distance>.5&&p.distance<85&&Math.abs(p.lateral)<55)points.push(p);
  if(points.length===512)return points;
 }
 return points;
}
// The displayed ego is the same catalog asset, with actual articulated states.
export function syncCockpitEgo(ego,vehicle){
 const q=vehicle.root?.quaternion;
 if(ego.root&&q){
  // Remove only world heading; retain measured pitch/roll in the ego display.
  const angle=-Number(vehicle.yaw||0)/2,c=Math.cos(angle),s=Math.sin(angle);
  ego.root.quaternion.set(c*q.x+s*q.z,c*q.y+s*q.w,c*q.z-s*q.x,c*q.w-s*q.y);
 }
 if(ego.chassis&&vehicle.chassis){ego.chassis.position.copy(vehicle.chassis.position);ego.chassis.quaternion.copy(vehicle.chassis.quaternion);}
 for(const[items,source]of [[ego.wheels,vehicle.wheels],[ego.doors,vehicle.doors]])(items??[]).forEach((item,i)=>{
  if(item.pivot&&source?.[i]?.pivot)item.pivot.quaternion.copy(source[i].pivot.quaternion);
  if(item.spin&&source?.[i]?.spin)item.spin.quaternion.copy(source[i].spin.quaternion);
 });
 for(const key of ['wingLift','wingPitch','frontAero','hoodAero']){
  const target=ego.roadsterRig?.[key],source=vehicle.roadsterRig?.[key];
  if(target&&source){target.position.copy(source.position);target.quaternion.copy(source.quaternion);}
 }
 for(const key of ['wingSupports','sideAero'])(ego.roadsterRig?.[key]??[]).forEach((target,i)=>{
  const source=vehicle.roadsterRig?.[key]?.[i];if(source){target.position.copy(source.position);target.quaternion.copy(source.quaternion);}
 });
}
