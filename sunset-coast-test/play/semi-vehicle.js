// All numbers below are bounded GAME BALANCING, not manufacturer specifications.
export const SEMI_MODEL=Object.freeze({id:'semi',name:'TESLA SEMI',brand:'tesla',category:'电动牵引车',trim:'货运原型 · 1.0 Beta',desc:'官方最高驱动功率参考 800 kW；游戏加速为模拟值，非实车复现。中心驾驶室和专属双屏。六轮视觉，当前四接地点物理原型，空货箱可选，载货自动显示；货箱门停稳后独立手动开关；独立三轴悬架、挂车碰撞/铰接物理尚未接入。',previewImage:'./assets/semi-preview.jpg',color:0xe4e8ed,price:180000,power:7,max:30,mass:11500,tireGrip:9.0,range:550,semi:true});
export const isSemiModel=value=>(typeof value==='string'?value:value?.id)==='semi';

