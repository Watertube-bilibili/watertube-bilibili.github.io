const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
 const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  headless:true, args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
 });
 try {
  const page = await browser.newPage({ viewport:{width:1280,height:800}});
  const problems = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', event => { if(event.type()==='error') problems.push(event.text()); });
  await page.goto(process.argv[2]);
  await page.waitForFunction(() => window.ridgebound?.status.ready, null, {timeout:110000});
  await page.locator('#start').click();
  await page.locator('#garage-button').click();
  await page.locator('#map-import-file').setInputFiles({name:'broken.zip',mimeType:'application/zip',buffer:Buffer.from('this is not a ZIP')});
  await page.waitForFunction(() => window.ridgebound.state.importResult?.ok === false, null, {timeout:18000});
  assert.equal(await page.evaluate(() => window.ridgebound.state.region),'forest');
  await page.locator('#map-import-file').setInputFiles('ridgebound/downloads/ridgebound-map-example.zip');
  await page.waitForFunction(() => window.ridgebound.state.region==='custom' && window.ridgebound.state.importResult?.ok===true, null, {timeout:30000});
  const state = await page.evaluate(() => window.ridgebound.state);
  assert(state.customMap?.bounds.maxX > state.customMap?.bounds.minX && state.streaming.groundReady);
  await page.waitForFunction(() => document.querySelector('body').classList.contains('playing'));
  await page.keyboard.down('w');
  await page.waitForTimeout(2200);
  await page.keyboard.up('w');
  assert(await page.evaluate(() => window.ridgebound.state.distance>0));
  await page.locator('#help').click();
  await page.locator('#graphics-quality').selectOption('quality');
  await page.waitForFunction(() => window.ridgebound.state.graphicsProfile==='quality');
  await page.locator('#resume').click();
  if(process.env.RIDGEBOUND_SCREENSHOTS) {
   fs.mkdirSync(process.env.RIDGEBOUND_SCREENSHOTS,{recursive:true});
   await page.screenshot({path:path.join(process.env.RIDGEBOUND_SCREENSHOTS,'imported-map.png')});
  }
  assert.deepEqual(problems,[]);
  console.log('MAP_UPLOAD_BROWSER_OK',state.customMap.name);
 } finally {
  await browser.close();
 }
})().catch(error => {console.error(error);process.exitCode=1;});
