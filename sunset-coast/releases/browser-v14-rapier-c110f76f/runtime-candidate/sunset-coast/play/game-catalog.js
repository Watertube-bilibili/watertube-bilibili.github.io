// Save validation and selection need metadata, never a renderer or asset loader.
// Every rendering module reexports these same objects; IDs/order/values remain v13.
import {MODELS as DESIGNED_MODELS} from './vehicle-catalog.js';
import {ROADSTER_MODELS} from './roadster-vehicle.js';
import {SEMI_MODEL} from './semi-vehicle.js';

export const ASSET_MODEL = Object.freeze({
  id:'vision', brand:'LUCENT', name:'LUCENT VISION', trim:'CONCEPT ONE',
  desc:'中置驾驶概念超跑 · 精密座舱与金属清漆',
  previewImage:'./assets/lucent-preview.svg', price:158000, power:22, max:68, range:510, color:0x709ca9
});

export const G9_MODEL=Object.freeze({
  id:'g9',brand:'xiangjie',name:'享界 G9',trim:'WILDERNESS LUXURY · 2+3',category:'豪华越野',
  desc:'硬派豪华 SUV · 方正车身、双圆环灯、尾门储物箱与三联屏座舱',
  price:128000,power:14.8,max:47,range:520,color:0x17483e,mass:2944,tireGrip:9.3,
  reference:'https://hima.auto/xiangjie/g9/',previewImage:new URL('./assets/g9/preview.jpg',import.meta.url).href
});

export const MOTORCYCLE_MODELS=Object.freeze([
 {id:'mica_scooter',assetKey:'scooter',previewImage:'./assets/motorcycle-scooter-review.png',brand:'coast_moto',name:'MICA 配送踏板',trim:'ELECTRIC COURIER',category:'摩托',desc:'原创纯电踏板 · 双轮物理与配送箱',price:3800,power:4.2,max:16.7,range:100,color:0x68a397,mass:185,tireGrip:8.4,powertrain:'electric',seatY:.80},
 {id:'ember_street',assetKey:'street',previewImage:'./assets/motorcycle-street-review.png',brand:'coast_moto',name:'EMBER 街道摩托',trim:'PETROL STREET',category:'摩托',desc:'原创燃油街车 · 后轮驱动与机械发动机',price:6800,power:6.8,max:27.8,range:250,color:0xb26848,mass:230,tireGrip:9.0,powertrain:'combustion',seatY:.84},
 {id:'ridge_dual',assetKey:'dual',previewImage:'./assets/motorcycle-dual-review.png',brand:'coast_moto',name:'RIDGE 双用途摩托',trim:'PETROL TRAIL',category:'摩托',desc:'原创燃油双用途摩托 · 高离地与辐条轮',price:8200,power:6.0,max:25,range:280,color:0x8a9369,mass:215,tireGrip:8.6,powertrain:'combustion',seatY:.93}
]);

export const CHARACTERS=[{id:'alex',name:'林 Alex',role:'自由车手',color:0xddd6b4,description:'从海岸出发，驾驶探索整座城市。'},{id:'maya',name:'叶 Maya',role:'城市信使',color:0x8a8e9b,description:'熟悉每一条街道，也喜欢新的冒险。'},{id:'nico',name:'周 Nico',role:'夜班司机',color:0x476c74,description:'城市入夜，旅程才刚刚开始。'},{id:'mochi',name:'Mochi',role:'城市猫咪',color:0xdaab79,description:'四只爪子，一座城市。跑、跳、探索，也能搭车。'}];

export const MODELS=[...DESIGNED_MODELS,ASSET_MODEL,G9_MODEL,...ROADSTER_MODELS,SEMI_MODEL,...MOTORCYCLE_MODELS];
