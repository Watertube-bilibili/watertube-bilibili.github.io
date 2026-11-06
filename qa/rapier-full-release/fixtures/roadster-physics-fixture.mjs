import {cityFixture,vehicle,loadOriginalModels,THREE,R} from './roadster-city-fixture.mjs';
import {roadsterPlayerInput,requestRoadsterManeuver} from '../../../sunset-coast/rapier/play/roadster-controls.js';
export {THREE,R,roadsterPlayerInput,requestRoadsterManeuver};
export const coast={throttle:0,steer:0,brake:0},hold={...coast,brake:1};
export async function rocketFixture({position={x:6880,z:1600,y:12.02},id='roadster_rocket',units=1000,extra={},cars=[]}={}){
 await loadOriginalModels();const v=vehicle({id,...position,roadsterAirUnits:units,...extra}),f=await cityFixture({cars:[v,...cars],position});
 f.g.keys={};f.g.touch={};f.g.roadsterTouch={};f.g.ui.isPhoneOpen=()=>false;
 f.run(2,hold);
 // This invokes the original production input mapper every tick, including its
 // source-release latch and snapshot-driven air request. No pose/velocity writes.
 const input=()=>roadsterPlayerInput(f.g,{...coast,...f.g.baseInput});
 const step=(seconds=1/60)=>f.run(seconds,input);
 const action=(kind='spin')=>requestRoadsterManeuver(f.g,kind);
 const until=(predicate,limit=31)=>{for(let i=0;i<Math.ceil(limit*60);i++){step();if(predicate())return(i+1)/60;}throw Error('Condition not reached: '+JSON.stringify(v.roadsterState));};
 const sync=()=>{f.physics.world.timestep=0;f.physics.world.step(f.physics.events);f.physics.events.clear();f.physics.world.timestep=1/60;};
 return{...f,v,step,action,until,sync,input};
}
