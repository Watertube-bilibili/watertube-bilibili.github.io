const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const screenshots=process.env.RIDGEBOUND_SCREENSHOTS;
if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
const root=process.argv[2]||process.env.RIDGEBOUND_TEST_URL||'http://127.0.0.1:9018/ridgebound/';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const tab=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const errors=[];
    tab.on('pageerror',e=>errors.push(String(e)));
    await tab.goto(root);
    await tab.waitForFunction(()=>window.ridgebound?.status.ready,null,{timeout:90000});
    await tab.locator('#start').tap();
    await tab.waitForFunction(()=>window.ridgeboundInput.active);
    const report=async()=>{
      const boxes=await tab.evaluate(()=>Object.fromEntries(['.touch-wheel','.pedals','.dashboard','.equipment','.winch-toggle','.winch-panel','.map-panel','.mission'].map(selector=>{
        const el=document.querySelector(selector),r=el.getBoundingClientRect();
        return [selector,{x:r.x,y:r.y,w:r.width,h:r.height,visible:r.width>0&&r.height>0&&getComputedStyle(el).visibility==='visible'}];
      })));
      const intersect=(a,b)=>a.visible&&b.visible&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      for(const el of ['.dashboard','.equipment','.winch-toggle','.winch-panel','.map-panel','.mission']){
        assert(!intersect(boxes['.touch-wheel'],boxes[el]),'wheel overlay '+el);
        assert(!intersect(boxes['.pedals'],boxes[el]),'pedal overlay '+el);
      }
      assert(!intersect(boxes['.touch-wheel'],boxes['.pedals']));
      return boxes;
    };
    assert.equal(await tab.locator('[data-control=left],[data-control=right]').count(),0);
    let boxes=await report();
    assert(boxes['.touch-wheel'].w>=100);
    const cdp=await tab.context().newCDPSession(tab);
    const w=boxes['.touch-wheel'],g=await tab.locator('[data-control=throttle]').boundingBox();
    const cx=w.x+w.w/2,cy=w.y+w.h/2,d=w.w*.425;
    const gas={x:g.x+g.width/2,y:g.y+g.height/2,id:12};
    await tab.evaluate(()=>document.querySelector('#touch-wheel').addEventListener('pointerdown',e=>window.wheelTestPointer=e.pointerId,{once:true}));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy-d,id:11},gas]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+d,y:cy,id:11},gas]});
    await tab.waitForFunction(()=>ridgeboundInput.throttle===1&&ridgeboundInput.steer>.70);
    await tab.evaluate(()=>document.querySelector('#touch-wheel').dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.wheelTestPointer,bubbles:true})));
    await tab.waitForFunction(()=>ridgeboundInput.throttle===1&&ridgeboundInput.steer===0);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await tab.waitForFunction(()=>ridgeboundInput.throttle===0&&ridgeboundInput.steer===0);
    if(screenshots)await tab.screenshot({path:path.join(screenshots,'mobile-wheel-390.png')});
    await tab.locator('#winch-toggle').tap();
    await report();
    await tab.locator('#winch-close').tap();
    await tab.setViewportSize({width:320,height:568});
    await report();
    await tab.setViewportSize({width:844,height:390});
    await report();
    if(screenshots)await tab.screenshot({path:path.join(screenshots,'mobile-wheel-844.png')});
    await tab.keyboard.down('ArrowLeft');
    await tab.waitForFunction(()=>ridgeboundInput.steer===-1);
    await tab.keyboard.up('ArrowLeft');
    await tab.waitForFunction(()=>ridgeboundInput.steer===0);
    assert.deepEqual(errors,[]);
    console.log('PASS real Godot and two-finger input; wheel/cancel/keyboard; portrait 390×844 and 320×568; landscape 844×390');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})