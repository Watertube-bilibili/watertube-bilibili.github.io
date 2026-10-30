import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {solarState,skyBudget,CLOCK_MINUTES_PER_SECOND,NIGHT_CLOCK_MINUTES_PER_SECOND,advanceClock,SKY_EFFECT_LAYER} from '../source/runtime-candidate/sunset-coast/play/sky-cycle.js';

test('solar trajectory is periodic, finite and travels from east to west',()=>{
 for(let m=-1440;m<2880;m+=1){const s=solarState(m);assert(Math.abs(s.direction.length()-1)<1e-12);for(const k of ['sun','ambient','exposure','fog','environment','day'])assert(Number.isFinite(s[k]));}
 assert(solarState(8*60).direction.x>0);assert(solarState(18*60).direction.x<0);
 assert(solarState(13*60).altitude>.8);assert(solarState(1*60).altitude<-.8);
 assert.deepEqual(solarState(0),solarState(1440));
});
test('night has no direct sunlight and sunrise is continuous',()=>{
 assert.equal(solarState(0).sun,0);assert.equal(solarState(22*60).direct,0);
 assert(solarState(12*60).ambient>solarState(0).ambient*3);
 for(let m=0;m<1440;m+=.25){const a=solarState(m),b=solarState(m+.01);assert(Math.abs(a.sun-b.sun)<.003);assert(Math.abs(a.day-b.day)<.002);}
});
test('quality reduces expensive effects without disabling the day/night cycle',()=>{
 assert.equal(skyBudget('low',true).flare,false);assert.equal(skyBudget('medium').ghosts,false);
 assert.equal(skyBudget('high').ghosts,true);assert.equal(skyBudget('high',true).environmentSize,64);
 assert.equal(720/CLOCK_MINUTES_PER_SECOND+720/NIGHT_CLOCK_MINUTES_PER_SECOND,32*60);assert.equal(advanceClock(480,32*60),480);assert.equal(SKY_EFFECT_LAYER,1);
});
test('main camera and sensor remain isolated, Godot and saved clock contracts are kept',()=>{
 const g=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/game.js',import.meta.url),'utf8'),s=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/sky-cycle.js',import.meta.url),'utf8');
 assert(g.includes('sunDisc.visible=false')); assert(g.includes('this.clockMinutes=advanceClock(this.clockMinutes,dt)'));
 assert(g.includes('this.skyCycle?.update();this.nightLighting?.update(delta);this.updateVehicleLighting(delta);try{this.browserWorldLifecycle?.checkpoint();}catch{return;}this.renderer.render(this.scene,this.camera)'));
 assert(s.includes('flare.layers.set(SKY_EFFECT_LAYER)'));assert(s.includes('game.camera.layers.enable(SKY_EFFECT_LAYER)'));
 assert(!s.includes('physics.'));assert(s.includes('previous?.dispose()'));
});
test('clock crosses sunset/sunrise with exact durations and never advances on pause delta',()=>{assert.equal(advanceClock(7*60,1440),19*60);assert.equal(advanceClock(19*60,480),7*60);assert.equal(advanceClock(1139.5,2),1141.5);assert.equal(advanceClock(419.25,1),420.25);assert.equal(advanceClock(700,0),700);assert.equal(advanceClock(700,-1),700);assert.equal(advanceClock(700,NaN),700);assert.equal(advanceClock(NaN,0),480);assert.equal(advanceClock(480,1920*10),480)});
test('night/rain/fog preserve finite bounded sun state',()=>{for(const weather of ['clear','rain','fog'])for(const m of [0,420,480,780,1140,1380]){const s=solarState(m,weather);assert.ok(s.sun>=0&&s.sun<=2.8);assert.ok(s.ambient>=.16&&s.ambient<=.72);assert.ok(s.environment>=.15&&s.environment<=.81);assert.ok(Number.isFinite(s.fog));}});
