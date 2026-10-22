import {nearestRoad} from './world.js';
import {getActorFootOffset} from './ground-contact.js';
import {getVehicleCollider,vehicleVerticalOverlap,resolvePedestrianVehicle} from './vehicle-dynamics.js';
import {PedestrianSpeech} from './pedestrian-speech.js';

const RADIUS=.3,LOOK_AHEAD=.65,SKIN=.008;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const walkingPlayer=game=>!game.inCar&&!game.transition&&!game.aircraft?.active&&!game.flight?.active&&!game.robotaxi?.passenger&&game.playerPos;
const playerVehicle=game=>!game.aircraft?.active&&!game.flight?.active&&game.vehicle;
const sameLevel=(a,b)=>!Number.isFinite(a.y)||!Number.isFinite(b.y)||Math.abs(a.y-b.y)<1.5;

// Uses the existing authored/model collision envelope, not visual proximity or RNG.
export function vehicleBlocksPath(position,direction,vehicle,lookAhead=LOOK_AHEAD){
 if(!vehicle||vehicle.root?.visible===false||!vehicleVerticalOverlap(position,vehicle))return false;
 const b=getVehicleCollider(vehicle),dx=position.x-b.x,dz=position.z-b.z;
 const x=dx*b.right.x+dz*b.right.z,z=dx*b.back.x+dz*b.back.z;
 const vx=direction.x*b.right.x+direction.z*b.right.z,vz=direction.x*b.back.x+direction.z*b.back.z;
 const nearX=Math.max(-b.halfWidth,Math.min(b.halfWidth,x)),nearZ=Math.max(-b.halfLength,Math.min(b.halfLength,z));
 const nx=x-nearX,nz=z-nearZ;
 // Do not blame a car behind the actor, or one they are walking alongside/away from.
 if(Math.hypot(nx,nz)>1e-6?(nx*vx+nz*vz>=-.01):(x*vx+z*vz>=0))return false;
 let enter=0,exit=lookAhead;
 for(const [origin,velocity,extent] of [[x,vx,b.halfWidth+RADIUS+.04],[z,vz,b.halfLength+RADIUS+.04]]){
  if(Math.abs(velocity)<1e-8){if(Math.abs(origin)>extent)return false;continue;}
  let a=(-extent-origin)/velocity,c=(extent-origin)/velocity;if(a>c)[a,c]=[c,a];
  enter=Math.max(enter,a);exit=Math.min(exit,c);if(enter>exit)return false;
 }
 return exit>=0&&enter<=lookAhead;
}
export function personBlocksPath(position,direction,player,radius=RADIUS){
 if(!player||!sameLevel(position,player))return false;
 const dx=player.x-position.x,dz=player.z-position.z,forward=dx*direction.x+dz*direction.z;
 if(forward<=.02)return false;
 const lateral=Math.abs(dx*direction.z-dz*direction.x),sum=RADIUS+radius+.06;
 return lateral<sum&&forward-Math.sqrt(Math.max(0,sum*sum-lateral*lateral))<=LOOK_AHEAD;
}

// Swept circle contact adds the missing walking-player/NPC contact, using only
// measured movement. Standing nearby, NPC motion, and teleports are not impacts.
export function walkingPlayerContact(npcPrevious,npcPosition,previous,player,dt,radius=RADIUS){
 if(!previous||!player||dt<=0||!sameLevel(npcPosition,player))return null;
 const px=player.x-previous.x,pz=player.z-previous.z,playerTravel=Math.hypot(px,pz);
 if(playerTravel<1e-5||playerTravel>3)return null;
 const x=npcPrevious.x-previous.x,z=npcPrevious.z-previous.z;
 const vx=npcPosition.x-npcPrevious.x-px,vz=npcPosition.z-npcPrevious.z-pz;
 const sum=RADIUS+radius,a=vx*vx+vz*vz,b=2*(x*vx+z*vz),c=x*x+z*z-sum*sum;
 let t=0;
 if(c>0){const discriminant=b*b-4*a*c;if(a<1e-10||discriminant<0)return null;t=(-b-Math.sqrt(discriminant))/(2*a);if(t<0||t>1)return null;}
 let nx=x+vx*t,nz=z+vz*t,length=Math.hypot(nx,nz);
 if(length<1e-6){nx=px; nz=pz; length=playerTravel;}
 nx/=length;nz/=length;
 const impactSpeed=(px*nx+pz*nz)/dt;if(impactSpeed<.35)return null;
 return {normal:{x:nx,z:nz},time:t,impactSpeed,depth:Math.max(0,sum-distance(npcPosition,player))};
}
function reactions(game){return game.pedestrianReactions??=new PedestrianSpeech();}
function ground(game,p){p.root.position.y=(game.groundContact?.heightAt(p.root.position.x,p.root.position.z,{radius:.2})??game.world.groundHeight?.(p.root.position.x,p.root.position.z)??0)+.012-getActorFootOffset(p,{posed:true});}

export function updatePedestrians(game,dt){
 const speech=reactions(game),cars=game.allVehicles(),player=walkingPlayer(game),ownedCar=playerVehicle(game),previousPlayer=game.pedestrianPreviousPlayer;
 for(const p of game.pedestrians){
  speech.sync(p);const previous=p.root.position.clone();
  p.root.userData.characterDistance=distance(previous,game.position??game.playerPos);
  if(p.dead||p.removed||p.root.visible===false||(Number.isFinite(p.health)&&p.health<=0)){speech.clear(p);continue;}
  if(p.knocked>0){speech.blocked(p,dt,false,game.time);p.knocked-=dt;
   const animated=!!p.setAnimationState?.('death');p.root.rotation.z=animated?0:1.4;p.animate(game.time+p.phase,0);ground(game,p);
   if(p.knocked<=0){p.setAnimationState?.('walk');p.root.rotation.z=0;p.root.position.set(p.origin.x,0,p.origin.z);ground(game,p);speech.clear(p);}continue;
  }
  p.nextCross-=dt;
  if(p.nextCross<0&&!p.crossing){p.crossing=true;p.target={x:p.root.position.x+(p.root.position.x-nearestRoad(p.root.position).x>0?-32:32),z:p.root.position.z};p.nextCross=20+Math.random()*40;}
  let direction={x:0,z:p.dir},speed=p.speed;
  if(p.crossing){const dx=p.target.x-p.root.position.x;if(Math.abs(dx)<.5){p.crossing=false;speed=0;}else{direction={x:Math.sign(dx),z:0};speed*=1.7;p.root.rotation.y=dx>0?-Math.PI/2:Math.PI/2;}}
  else p.root.rotation.y=p.dir>0?Math.PI:0;
  const blocked=speed>0&&(personBlocksPath(previous,direction,player,game.character==='mochi'?.24:RADIUS)||vehicleBlocksPath(previous,direction,ownedCar));
  speech.blocked(p,dt,blocked,game.time);
  if(!blocked){p.root.position.x+=direction.x*speed*dt;p.root.position.z+=direction.z*speed*dt;if(!p.crossing&&Math.abs(p.root.position.z-p.origin.z)>55)p.dir*=-1;}
  p.setAnimationState?.(!blocked&&speed>0?'walk':'idle');p.animate(game.time+p.phase,!blocked&&speed>0?1:0);ground(game,p);
  if(player){const hit=walkingPlayerContact(previous,p.root.position,previousPlayer,player,dt,game.character==='mochi'?.24:RADIUS);
   if(hit){const separation=RADIUS+(game.character==='mochi'?.24:RADIUS)+SKIN;p.root.position.x=player.x+hit.normal.x*separation;p.root.position.z=player.z+hit.normal.z*separation;speech.say(p,'footImpact',game.time);}
  }
  for(const car of cars){
   const movement=car.collisionPrevious?distance(car.pos,car.collisionPrevious):0;
   if(distance(p.root.position,car.pos)>Math.max(10,getVehicleCollider(car).radius+RADIUS)+movement)continue;
   const hit=resolvePedestrianVehicle(p.root.position,RADIUS,car,previous,{previousVehicle:car.collisionPrevious});
   if(hit&&car===ownedCar&&hit.impactSpeed>.35)speech.say(p,'vehicleImpact',game.time);
   if(hit&&Math.abs(car.speed)>2){p.knocked=10;car.speed-=Math.sign(car.speed)*Math.min(.3,Math.abs(car.speed));if(car===game.vehicle){game.addWanted(1);game.ui.toast('行人碰撞','error');}break;}
  }
  ground(game,p);
 }
 game.pedestrianPreviousPlayer=player?{x:player.x,y:player.y,z:player.z}:null;
 speech.prune(game.pedestrians,game.time);
}
export function updatePedestrianSpeech(game){game.pedestrianReactions?.render(game);}
