import {ROADSTER_BRAND} from './roadster-vehicle.js';

// Original fictional vehicle designs. IDs are stable for existing saves.
export const VEHICLE_BRANDS = [
  {id:'volt',name:'VOLT',tagline:'纯电，从容向前',color:'#a6cfca'},
  {id:'mira',name:'MIRA',tagline:'把城市变小',color:'#c6d69f'},
  {id:'terran',name:'TERRAN',tagline:'道路之外，也有方向',color:'#c5b894'},
  {id:'aurelia',name:'AURELIA',tagline:'优雅，自有分寸',color:'#d0a786'},
  {id:'nord',name:'NORD',tagline:'为生活留出空间',color:'#a4bdcf'},
  {id:'ravel',name:'RAVEL',tagline:'空气，成为线条',color:'#e4a58b'},
  {id:'solace',name:'SOLACE',tagline:'每段旅途都有温度',color:'#c5b4d1'},
  {id:'chenjing',name:'CHENJING 宸境',tagline:'从容，另有境界',color:'#d8c8ac'},
  {id:'yunqiao',name:'YUNQIAO 云峤',tagline:'远行，心有余地',color:'#cad1df'},
  {id:'lindao',name:'LINDAO 林岛',tagline:'装下每一天',color:'#e4bd85'},
  {id:'xiangjie',name:'享界 STELATO',tagline:'比豪华更硬派，比硬派更豪华',color:'#87aa96'},
  ROADSTER_BRAND
];

export const MODELS = [
  {id:'s',brand:'volt',name:'VOLT S',trim:'LONG RANGE',category:'轿车',desc:'纯电快背轿车 · 水滴座舱与矩阵灯组',price:0,power:11,max:47,range:420,color:0x9eabb9},
  {id:'x',brand:'volt',name:'VOLT X',trim:'DUAL MOTOR',category:'SUV',desc:'全能纯电 SUV · 全景车顶与双电机四驱',price:38000,power:13,max:44,range:390,color:0x315857},
  {id:'r',brand:'volt',name:'VOLT R',trim:'PERFORMANCE',category:'跑车',desc:'纯电双门跑车 · 低矮宽体与双弧日行灯',price:72000,power:19,max:65,range:340,color:0xb9392a},
  {id:'cybr',brand:'volt',name:'VOLT CYBR',trim:'ALL TERRAIN',category:'皮卡',desc:'电动探险皮卡 · 缎面银车身与实用货厢',price:58000,power:12,max:40,range:450,color:0xa0a8ad},
  {id:'m',brand:'mira',name:'MIRA M',trim:'CITY EDITION',category:'掀背',desc:'都市五门掀背 · 悬浮车顶与圆角光环灯',price:24000,power:10.5,max:39,range:325,color:0xb5b99b},
  {id:'nomad',brand:'terran',name:'TERRAN NOMAD',trim:'TRAIL AWD',category:'越野',desc:'全地形越野车 · 轮拱护板、行李架与备胎',price:64000,power:14,max:43,range:465,color:0x6b7261},
  {id:'gt',brand:'aurelia',name:'AURELIA GT',trim:'GRAND TOURING',category:'GT',desc:'长头双门 GT · 流线车肩与铜色精工细节',price:98000,power:20,max:64,range:480,color:0x653849},
  {id:'vela',brand:'aurelia',name:'AURELIA VELA',trim:'EXECUTIVE',category:'轿车',desc:'旗舰豪华轿车 · 修长车身与珠光金属漆',price:86000,power:16,max:54,range:520,color:0xb6afa0},
  {id:'estate',brand:'nord',name:'NORD E6',trim:'TOURING AWD',category:'旅行车',desc:'北欧纯电旅行车 · 大空间与立体尾灯',price:56000,power:14,max:48,range:490,color:0x496775},
  {id:'apex',brand:'ravel',name:'RAVEL APEX',trim:'STRADA',category:'超跑',desc:'中置超跑 · 空气通道与锻造分叉轮辐',price:168000,power:24,max:73,range:360,color:0xd37636},
  {id:'aria',brand:'solace',name:'SOLACE ARIA',trim:'GRAND LOUNGE',category:'MPV',desc:'豪华电动 MPV · 宽敞座舱与水晶灯组',price:69000,power:12.5,max:42,range:470,color:0x4e455e},
  {id:'coupe',brand:'solace',name:'SOLACE C2',trim:'HERITAGE',category:'双门',desc:'复古电动双门 · 圆形灯组与溜背车顶',price:48000,power:14,max:52,range:375,color:0xc6c8b5},
  {id:'c800',brand:'chenjing',name:'CHENJING 宸境 C800',trim:'SOVEREIGN · 2+2+2',category:'MPV',desc:'原创旗舰高顶 MPV · 香槟双色车身、三排六座与独立礼宾座椅',price:128000,power:15,max:46,range:560,color:0x23323d},
  // Original fictional marques and bodywork. Values are bounded gameplay
  // specifications, not claims about a real manufacturer's road vehicles.
  {id:'s800',brand:'yunqiao',name:'YUNQIAO 云峤 S800',trim:'GRAND HORIZON · 2+2',category:'豪华轿车',desc:'原创旗舰豪华轿车 · 修长三厢、银顶双色、折翼灯组与四席独立座舱',price:146000,power:17,max:56,range:610,color:0x253b50,mass:2650,tireGrip:9.7},
  {id:'v6',brand:'lindao',name:'LINDAO 林岛 V6',trim:'DAILY VAN · 2+2+2',category:'微面',desc:'实用小面包车 · 窄车身、高车顶、前置座舱与三排六座',price:16000,power:7.6,max:34,range:285,color:0xc4cec3,mass:1320,tireGrip:8.3},
  {id:'q3',brand:'lindao',name:'LINDAO 林岛 Q3',trim:'CITY POP',category:'掀背',desc:'灵巧都市掀背 · 短前后悬、悬浮深色车顶与像素方灯',price:22000,power:9.2,max:39,range:350,color:0xe0a75e,mass:1430,tireGrip:9.5},
  {id:'t9',brand:'yunqiao',name:'YUNQIAO 云峤 T9',trim:'CROSS TOURING',category:'旅行车',desc:'跨界长顶旅行车 · 抬高底盘、贯穿车肩与实用行李架',price:62000,power:14.5,max:49,range:510,color:0x507165,mass:2060,tireGrip:9.3},
  // Coastline collection: original bodies, existing fictional marques, stable save IDs.
  {id:'h4',brand:'mira',name:'MIRA H4',trim:'SURF',category:'掀背',desc:'圆润都市掀背 · 深蓝悬浮顶、胶囊灯与四座浅色座舱',price:28000,power:10.2,max:41,range:365,color:0x73b9ad,mass:1490,tireGrip:9.6},
  {id:'w8',brand:'nord',name:'NORD W8',trim:'COAST LINER',category:'旅行车',desc:'低顶长途旅行车 · 修长平顶、双层横灯与实用后备厢',price:67000,power:15,max:51,range:545,color:0x3d6387,mass:2100,tireGrip:9.9},
  {id:'b7',brand:'terran',name:'TERRAN B7',trim:'RIDGE',category:'越野',desc:'短轴全地形 SUV · 高离地、沙色车顶、分体灯与防护踏板',price:59000,power:13.8,max:41,range:440,color:0xb77446,mass:2070,tireGrip:8.8},
  {id:'k2',brand:'ravel',name:'RAVEL K2',trim:'ARC',category:'双门',desc:'轻巧双座运动轿跑 · 短尾溜背、弧线灯与低重心座舱',price:79000,power:18,max:61,range:385,color:0x9e465b,mass:1570,tireGrip:11.1},
  {id:'y9',brand:'yunqiao',name:'YUNQIAO 云峤 Y9',trim:'GRAND TOUR · 2+2+2',category:'SUV',desc:'原创大型六座 SUV · 银顶双色、星环灯带与全景座舱；快速反复急转含虚构断轴彩蛋',price:112000,power:16,max:49,range:590,color:0x35545c,mass:2580,tireGrip:9.2}
];
