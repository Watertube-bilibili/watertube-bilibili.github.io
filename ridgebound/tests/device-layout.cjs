const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2] || 'http://127.0.0.1:9018/ridgebound/';
const shots = process.env.RIDGEBOUND_SCREENSHOTS;

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN || undefined,
    args: ['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  });
  try {
    const tab = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const errors = [];
    tab.on('pageerror', error => errors.push(String(error)));
    await tab.goto(root);
    await tab.waitForFunction(() => ridgebound.status.ready, null, {timeout:90000});
    const cdp = await tab.context().newCDPSession(tab);
    async function rotate(width, height, type, angle) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor:1, mobile:true, screenOrientation:{type,angle},
      });
      await tab.waitForFunction(([w,h,a]) => innerWidth===w && innerHeight===h && screen.orientation.angle===a, [width, height, angle]);
      await tab.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }

    const devices = await tab.evaluate(async () => (await (await fetch('./device-profiles.json')).json()).models);
    const preset = devices.find(model => model.cutout !== 'none' && model.top > .06 && model.bottom > 0);
    assert(preset, 'expected at least one inset preset for the screen tests');
    const setup = async () => {
      await tab.locator('#pause').tap();
      await tab.locator('#dialog-controllers').tap();
      assert(await tab.locator('#controllerDialog').evaluate(el => el.open));
      await tab.waitForFunction(() => !document.querySelector('#device-profile').disabled);
    };
    const close = async () => {
      await tab.locator('#close-controllers').tap();
      await tab.waitForFunction(() => ridgeboundInput.active);
    };
    const inset = edge => tab.evaluate(name => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--device-' + name)) || 0, edge);
    async function assertSafe(selectors) {
      const labels = await tab.evaluate(names => {
        const css = getComputedStyle(document.documentElement);
        const insets = Object.fromEntries(['top','right','bottom','left'].map(edge => [
          edge, (parseFloat(css.getPropertyValue('--device-' + edge)) || 0) + (parseFloat(css.getPropertyValue('--device-padding')) || 0),
        ]));
        return names.flatMap(name => {
          const element = document.querySelector(name);
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (!box.width || !box.height || style.display === 'none' || style.visibility === 'hidden') return [];
          return box.x >= insets.left - 1 && box.y >= insets.top - 1
            && box.right <= innerWidth - insets.right + 1 && box.bottom <= innerHeight - insets.bottom + 1
            ? [] : [{name, box:box.toJSON(), insets, width:innerWidth, height:innerHeight}];
        });
      }, selectors);
      assert.deepEqual(labels, [], 'visible controls leave the safe margins clear');
    }
    const hud = ['.topbar','.mission','.map-panel','.dashboard','.equipment','.touch-wheel','.pedals','#winch-toggle','#winch-panel'];
    await tab.locator('#start').tap();
    await tab.waitForFunction(() => ridgeboundInput.active);
    await rotate(390, 844, 'portraitPrimary', 0);
    await setup();
    assert.equal(await tab.locator('#device-profile').inputValue(), 'auto');
    await tab.locator('#device-profile').selectOption(preset.id);
    await tab.locator('#device-padding').evaluate(el => {
      el.value = '12';
      el.dispatchEvent(new Event('input', {bubbles:true}));
    });
    assert.equal(await inset('top'), Math.ceil(preset.top * 390));
    assert.equal(await inset('bottom'), Math.ceil(preset.bottom * 390));
    await assertSafe(['#controllerDialog','#close-controllers']);
    await close();
    await assertSafe(hud);
    if(shots) await tab.screenshot({path:path.join(shots,'safe-portrait.png')});

    await rotate(844, 390, 'landscapePrimary', 90);
    assert.equal(await inset('left'), Math.ceil(preset.top * 390));
    assert.equal(await inset('right'), 0);
    await assertSafe(hud);
    await tab.locator('#winch-toggle').tap();
    await assertSafe(hud);
    await tab.locator('#winch-close').tap();
    if(shots) await tab.screenshot({path:path.join(shots,'safe-landscape-left.png')});

    await rotate(844, 390, 'landscapeSecondary', 270);
    assert.equal(await inset('left'), 0);
    assert.equal(await inset('right'), Math.ceil(preset.top*390));
    await assertSafe(hud);
    await setup();
    await assertSafe(['#controllerDialog','#close-controllers']);
    await tab.locator('#cutout-side').selectOption('left');
    assert.equal(await inset('left'), Math.ceil(preset.top * 390));
    await assertSafe(['#controllerDialog','#close-controllers']);
    await close();
    await assertSafe(hud);
    await tab.reload();
    await tab.waitForFunction(() => ridgebound.status.ready, null, {timeout:90000});
    await tab.locator('#start').tap();
    await setup();
    assert.equal(await tab.locator('#device-profile').inputValue(), preset.id);
    assert.equal(await tab.locator('#cutout-side').inputValue(), 'left');
    assert.equal(await tab.locator('#device-padding').inputValue(), '12');
    await tab.locator('#cutout-side').selectOption('right');
    assert.equal(await inset('right'), Math.ceil(preset.top*390));
    await close();
    await assertSafe(hud);
    if(shots) await tab.screenshot({path:path.join(shots,'safe-landscape-right.png')});
    await tab.locator('#pause').tap();
    await assertSafe(['#pauseDialog','#close-dialog']);
    await tab.locator('#dialog-map').tap();
    await assertSafe(['#garage','#close-garage']);
    assert.deepEqual(errors,[]);
    console.log('PASS screen presets, padding persistence, portrait, both landscape directions, manual cutout side, controls and safe dialogs');
  } finally {
    await browser.close();
  }
}
if(shots)fs.mkdirSync(shots, {recursive:true});
main().catch(error => { console.error(error); process.exitCode=1; });
