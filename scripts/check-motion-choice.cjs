const assert = require('node:assert/strict');

(async () => {
  const page = await (await fetch('http://127.0.0.1:9224/json/new?http://localhost:4200', { method: 'PUT' })).json();
  process.env.BROWSER_PAGE_ID = page.id;
  const browser = await require('./browser-client.cjs').connect();
  let stub;
  try {
    await browser.send('Page.bringToFront');
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await browser.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    stub = await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__permissionRequests=0;DeviceOrientationEvent.requestPermission=async()=>{window.__permissionRequests++;return 'granted'}" });
    await browser.send('Page.reload');
    await browser.pause(800);
    const pressed = () => browser.evaluate("document.querySelector('.motion-toggle').getAttribute('aria-pressed')");
    const transform = () => browser.evaluate("getComputedStyle(document.querySelector('.prism-rig')).transform");
    const tilt = (beta, gamma) => browser.evaluate(`dispatchEvent(new DeviceOrientationEvent('deviceorientation',{beta:${beta},gamma:${gamma}}))`);
    assert.equal(await pressed(), 'false');
    await browser.evaluate("document.querySelector('.motion-toggle').click()");
    await browser.pause(100);
    assert.equal(await pressed(), 'true');
    assert.equal(await browser.evaluate('window.__permissionRequests'), 1, 'single motion click requests tilt permission');
    assert.equal(await browser.evaluate("document.querySelector('.tilt-control').textContent.trim()"), 'Center tilt');
    const prismTransform = () => browser.evaluate("getComputedStyle(document.querySelector('.prism-top')).transform");
    const armedPose = await prismTransform();
    await browser.pause(500);
    assert.equal(await prismTransform(), armedPose, 'enabling motion must wait for a subsequent scroll');
    assert.equal(await browser.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), true, 'device preference remains unchanged');
    await browser.evaluate("document.querySelector('.prism-scene').scrollIntoView({block:'center'})");
    await browser.pause(200);
    assert.notEqual(await prismTransform(), armedPose, 'subsequent scroll starts the rotation');
    await tilt(35, 0);
    await browser.pause(400);
    const centered = await transform();
    await tilt(50, 20);
    await browser.pause(400);
    assert.notEqual(await transform(), centered, 'explicit opt-in enables tilt despite system preference');
    await browser.evaluate("document.querySelector('.motion-toggle').click()");
    await browser.pause(100);
    const stopped = await transform();
    await tilt(10, -20);
    await browser.pause(400);
    assert.equal(await transform(), stopped, 'opting out stops sensor updates');
    assert.equal(await pressed(), 'false');
    await browser.evaluate("document.querySelector('.motion-toggle').click()");
    await browser.send('Page.reload');
    await browser.pause(800);
    assert.equal(await pressed(), 'false', 'opt-in resets on reload');
    console.log('PASS: reduced-motion default, explicit opt-in/out, sensor cleanup, unchanged device preference, reload reset');
  } finally {
    if (stub) await browser.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: stub.identifier });
    await browser.send('Emulation.clearDeviceMetricsOverride');
    await browser.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await browser.send('Emulation.setEmulatedMedia', { features: [] });
    await browser.send('Page.navigate', { url: 'http://localhost:4200' });
    browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
