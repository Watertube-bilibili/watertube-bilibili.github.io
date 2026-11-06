import{RawCCDSolver}from"../raw.js";export class CCDSolver{free(){if(!!this.raw){this.raw.free();}this.raw=undefined;}constructor(raw){this.raw=raw||new RawCCDSolver;}}
