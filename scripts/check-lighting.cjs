const assert = require('node:assert/strict');

(async () => {
  const page = await (await fetch('http://127.0.0.1:9224/json/new?http://localhost:4200', { method: 'PUT' })).json();
  process.env.BROWSER_PAGE_ID = page.id;
  const browser = await require('./browser-client.cjs').connect();
  try {
    await browser.send('Page.bringToFront');
    await browser.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await browser.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.send('Page.reload');
    await browser.pause(800);
    browser.errors.length = 0;
    const colors = () => browser.evaluate("[...document.querySelectorAll('.face')].map(face => face.style.getPropertyValue('--face-fill'))");
    const initial = await colors();
    assert.ok(initial.every(Boolean), 'all eight side faces receive lighting');
    assert.ok(initial.every(fill => fill.includes('radial-gradient')), 'desktop retains the soft sheen');
    assert.equal(initial[0], initial[5], 'same world direction receives the same light across opposing prisms');
    assert.equal(initial[3], initial[4]);
    assert.notEqual(initial[0], initial[3], 'adjacent faces have distinct lighting');
    const caps = await browser.evaluate("[...document.querySelectorAll('.prism')].map(p => ['top','bottom'].map(side => p.style.getPropertyValue('--cap-'+side+'-fill')))");
    assert.ok(caps.flat().every(Boolean));
    assert.notEqual(caps[0][0], caps[0][1], 'upper and lower caps have different lighting');
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1400, y: 100 });
    await browser.pause(750);
    assert.notDeepEqual(await colors(), initial, 'whole-assembly tilt changes face lighting');
    const tilted = await colors();
    await browser.evaluate('scrollTo(0,30)');
    await browser.pause(1200);
    assert.notDeepEqual(await colors(), tilted, 'opposing rotation updates lighting');
    await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await browser.pause(200);
    const staticColors = await colors();
    await browser.pause(300);
    assert.deepEqual(await colors(), staticColors, 'reduced-motion lighting remains static');
    assert.deepEqual(browser.errors, []);
    console.log('PASS: fixed light, matching normals, caps, mouse tilt, opposing rotation, static reduced-motion shading');
  } finally {
    await browser.send('Emulation.clearDeviceMetricsOverride');
    await browser.send('Emulation.setEmulatedMedia', { features: [] });
    await browser.send('Page.navigate', { url: 'http://localhost:4200' });
    browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
