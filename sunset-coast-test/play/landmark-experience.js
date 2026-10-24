import {LANDMARKS} from './landmark-models.js';
export const ACTIVITIES=Object.freeze({telescope:{id:'telescope',name:'全景望远镜',price:12,seconds:8},cafe:{id:'cafe',name:'云端茶点',price:35,seconds:6},photo:{id:'photo',name:'观景纪念照',price:20,seconds:4}});
/** Adapter uses the existing game money and transaction API; never creates a wallet,
 * payment provider, currency exchange, account, or real-money checkout. */
export function gameEconomyAdapter(game){
 if(!game||typeof game.addMoney!=='function')throw new TypeError('game.addMoney required');
 return{balance:()=>game.money,change:(amount,label)=>game.addMoney(amount,label)};
}
export class LandmarkExperience{
 constructor({id,economy,onState=()=>{},travelSeconds=5}){
  if(!LANDMARKS[id])throw new Error('Unknown landmark');if(!economy?.balance||!economy?.change)throw new TypeError('Existing economy adapter required');
  this.meta=LANDMARKS[id];this.economy=economy;this.onState=onState;this.travelSeconds=travelSeconds;this.state='outside';this.floor='ground';this.pending=null;this.completed=[];this.sequence=0;this.clock=0;this.cooldownUntil=0;
 }
 get snapshot(){return{id:this.meta.id,state:this.state,floor:this.floor,balance:this.economy.balance(),pending:this.pending?{...this.pending}:null,completed:this.completed.map(x=>({...x}))};}
 emit(){this.onState(this.snapshot);}
 enter(){if(this.state!=='outside')return{ok:false,reason:'already-inside'};this.state='lobby';this.floor='ground';this.emit();return{ok:true};}
 leave(){if(this.pending)return{ok:false,reason:'busy'};if(this.state!=='lobby')return{ok:false,reason:'return-by-elevator'};this.state='outside';this.emit();return{ok:true};}
 debit(price,label){const before=this.economy.balance();if(!Number.isFinite(before)||before<price)return{ok:false,reason:'insufficient-funds',required:price,balance:before};
  try{this.economy.change(-price,label);}catch(error){const after=this.economy.balance();if(after===before-price){this.economy.change(price,`${label} · 未启动退款`);}return{ok:false,reason:'economy-error'};}
  if(this.economy.balance()!==before-price)throw new Error('Economy adapter must apply exact synchronous transaction');return{ok:true};
 }
 ride(direction='up'){
  if(this.pending||this.clock<this.cooldownUntil)return{ok:false,reason:'busy'};
  const up=direction==='up';if(!up&&direction!=='down')return{ok:false,reason:'invalid-direction'};
  if(this.state!==(up?'lobby':'observation'))return{ok:false,reason:'wrong-floor'};
  const price=up?this.meta.ticket:0;if(price){const paid=this.debit(price,`${this.meta.name} · 观景往返票`);if(!paid.ok)return paid;}
  this.pending={id:++this.sequence,type:'elevator',direction,price,elapsed:0,duration:this.travelSeconds,startState:this.state,startFloor:this.floor,refunded:false};this.state='riding';this.emit();return{ok:true,id:this.pending.id,price};
 }
 activity(id){
  if(this.pending||this.clock<this.cooldownUntil)return{ok:false,reason:'busy'};if(this.state!=='observation')return{ok:false,reason:'observation-only'};const a=ACTIVITIES[id];if(!a)return{ok:false,reason:'unknown-activity'};
  const paid=this.debit(a.price,`${this.meta.name} · ${a.name}`);if(!paid.ok)return paid;
  this.pending={id:++this.sequence,type:'activity',activity:id,price:a.price,elapsed:0,duration:a.seconds,startState:'observation',startFloor:'observation',refunded:false};this.state='activity';this.emit();return{ok:true,id:this.pending.id,price:a.price};
 }
 update(dt){if(!Number.isFinite(dt)||dt<0)return;this.clock+=dt;const p=this.pending;if(!p)return;p.elapsed=Math.min(p.duration,p.elapsed+dt);if(p.elapsed>=p.duration){this.pending=null;this.completed.push({id:p.id,type:p.type,activity:p.activity,price:p.price});this.completed=this.completed.slice(-18);if(p.type==='elevator'){this.floor=p.direction==='up'?'observation':'ground';this.state=p.direction==='up'?'observation':'lobby';}else{this.state='observation';}this.cooldownUntil=this.clock+.35;this.emit();}}
 cancel(reason='cancelled'){
  const p=this.pending;if(!p)return{ok:false,reason:'nothing-pending'};
  // Claim cancellation before invoking external economy code; repeat clicks cannot refund twice.
  this.pending=null;this.state=p.startState;this.floor=p.startFloor;this.cooldownUntil=this.clock+.35;
  if(p.price&&!p.refunded){p.refunded=true;this.economy.change(p.price,`${this.meta.name} · 未完成退款`);}
  this.emit();return{ok:true,refunded:p.price,reason};
 }
 dispose(){return this.cancel('scene-unload');}
}
