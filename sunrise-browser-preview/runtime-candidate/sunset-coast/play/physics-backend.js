import {browserWorldRequest} from './browser-world-policy.js';
const request=browserWorldRequest();
export const browserPhysicsRequested=true;
export async function loadPhysicsBackend(){if(!request)throw Error('请从日出独立存档页进入');const {BrowserPhysicsSystem}=await import('./browser-physics.js');return {PhysicsSystem:BrowserPhysicsSystem,preloadPhysics:async()=>{}};}
