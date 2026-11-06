import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldPreloadEngine} from '../godot-physics.js';

test('engine preload defers on known slow or constrained devices',()=>{
 for(const effectiveType of ['slow-2g','2g','3g'])assert.equal(shouldPreloadEngine({connection:{effectiveType}}),false);
 for(const downlink of [.2,1,1.5])assert.equal(shouldPreloadEngine({connection:{effectiveType:'4g',downlink}}),false);
 assert.equal(shouldPreloadEngine({connection:{saveData:true,effectiveType:'4g',downlink:100}}),false);
 for(const deviceMemory of [1,2,4])assert.equal(shouldPreloadEngine({deviceMemory,connection:{effectiveType:'4g',downlink:100}}),false);
});
test('normal or unknown network information preserves preload behavior',()=>{
 for(const nav of [undefined,{}, {connection:{}}, {deviceMemory:8,connection:{effectiveType:'4g',downlink:20}}, {connection:{downlink:0}}, {connection:{downlink:NaN}}])assert.equal(shouldPreloadEngine(nav),true);
});
