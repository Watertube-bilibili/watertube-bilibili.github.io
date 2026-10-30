import {browserWorldRequest,BROWSER_WORLD_ROADSTER_MODELS} from './browser-world-policy.js';
const request=browserWorldRequest();
export const browserPhysicsRequested=true;
export async function loadPhysicsBackend(){if(!request)throw Error('请从日出独立存档页进入');const {BrowserPhysicsSystem}=await import('./browser-physics.js');class BrowserWorldPhysics extends BrowserPhysicsSystem{constructor(game){super(game,{motorcycles:true,roadsters:true,roadsterModels:BROWSER_WORLD_ROADSTER_MODELS});}}return {PhysicsSystem:BrowserWorldPhysics,preloadPhysics:async()=>{}};}
