const assert = require('node:assert/strict');

(async () => {
  const page = await (await fetch('http://127.0.0.1:9224/json/new?http://localhost:4200', { method: 'PUT' })).json();
  process.env.BROWSER_PAGE_ID = page.id;
  const browser = await require('./browser-client.cjs').connect();
  try {
    await browser.send('Page.bringToFront');
    for (const width of [320, 390, 768, 1440]) {
      await browser.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 700 });
      await browser.send('Page.navigate', { url: 'http://localhost:4200' });
      await browser.pause(800);
      const state = await browser.evaluate(`({
        overflow: document.documentElement.scrollWidth > innerWidth,
        broken: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash),
        small: [...document.querySelectorAll('p,a,small,figcaption')].filter(e => parseFloat(getComputedStyle(e).fontSize) < 12).length
      })`);
      assert.equal(state.overflow, false, `overflow at ${width}px`);
      assert.deepEqual(state.broken, []);
      assert.equal(state.small, 0);
      await browser.evaluate("document.querySelector('a.nav-link').click()");
      await browser.pause(150);
      assert.equal(await browser.evaluate('location.hash'), '#expApp');
      assert.ok(await browser.evaluate("document.getElementById('expApp').getBoundingClientRect().top >= document.querySelector('app-site-header').getBoundingClientRect().bottom"));
    }
    await browser.send('Emulation.clearDeviceMetricsOverride');
    await browser.send('Page.navigate', { url: 'http://localhost:4200' });
    await browser.pause(800);
    const rotation = () => browser.evaluate("getComputedStyle(document.querySelector('.prism-top')).transform");
    const initial = await rotation();
    await browser.evaluate('scrollTo(0, 30)');
    await browser.pause(1400);
    assert.notEqual(await rotation(), initial, 'down scroll starts independent rotation');
    await browser.evaluate('scrollTo(0, 0)');
    await browser.pause(1800);
    const reversed = await rotation();
    const values = text => text.match(/-?[\d.]+(?:e[+-]?\d+)?/g).slice(1).map(Number);
    assert.ok(values(initial).every((value, index) => Math.abs(value - values(reversed)[index]) < 0.005), 'up scroll returns to starting pose');
    console.log('PASS: responsive layouts, internal navigation, readable supporting text, scroll starts/reverses rotation');
  } finally {
    await browser.send('Emulation.clearDeviceMetricsOverride');
    await browser.send('Page.navigate', { url: 'http://localhost:4200' });
    browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
