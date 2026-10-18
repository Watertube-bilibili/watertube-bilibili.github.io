// All numbers below are bounded GAME BALANCING, not manufacturer specifications.
export const SEMI_MODEL=Object.freeze({id:'semi',name:'TESLA SEMI',brand:'tesla',category:'电动牵引车',trim:'货运原型 · 2.0 Beta',desc:'完整中心驾驶室和专属双屏。六轮视觉，当前四接地点物理原型，独立三轴悬架与真实挂车尚未接入。',previewImage:'./assets/semi-preview.jpg',color:0xe4e8ed,price:180000,power:7,max:30,mass:11500,tireGrip:9.0,range:550,semi:true});
export const isSemiModel=value=>(typeof value==='string'?value:value?.id)==='semi';
