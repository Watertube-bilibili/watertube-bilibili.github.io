// HUD route coordinates shared with the Godot terrain generator.
export const routeX=z=>Math.sin(z/40)*13+Math.sin(z/95)*19;
export const checkpoints=[70,150,240,330].map((z,i)=>({x:routeX(z),z,name:['松林营地','云杉山口','风息草甸','山顶观景台'][i]}));
export function emptyState(region='forest',snowTires=false){return{x:0,y:3.05,z:0,yaw:.48,speed:0,pitch:0,roll:0,region,snowTires,checkpoint:0,completed:false,time:0,distance:0,lowGear:false,awd:true,winch:null,surface:region==='snow'?'snow':'trail',slip:0,stuck:0,steering:0,damage:{body:100,tires:100,suspension:100},repairAvailable:false,anchors:[],streaming:{},cameraMode:0};}
