// Run against a local production/dev server: node scripts/test-pack-opening.cjs
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const out = process.env.PACK_SCREENSHOTS || "/tmp/portfolio-pack-qa";
fs.mkdirSync(out, { recursive: true });
const baseURL = process.env.PACK_BASE_URL || "http://127.0.0.1:3000";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "/usr/bin/chromium"),
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  async function setup(options = {}) {
    const context = await browser.newContext({ viewport: {width:1280,height:1000}, ...options });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(baseURL);
    const logo = page.locator('.card img[alt="ロゴ"]');
    for(let i=0;i<6;i++) await logo.click({force:true});
    await page.getByRole('button',{name:'音を消す',exact:true}).click();
    await logo.click();
    await page.waitForTimeout(600);
    await page.locator('a[href="/works"]').click({force:true});
    await phase(page,'intro');
    await cleanUI(page);
    await page.screenshot({path:path.join(out, `intro-${options.viewport?.width || 'desktop'}-${options.reducedMotion || 'normal'}.png`)});
    await phase(page,'sealed');
    await cleanUI(page);
    return {context,page};
  }
  async function phase(page,value) {
    try { await page.locator(`section[data-phase="${value}"]`).waitFor(); }
    catch(error) {
      console.error(await page.evaluate(() => ({phase:document.querySelector('section[data-phase]')?.dataset.phase,hidden:document.hidden,focus:document.activeElement?.tagName,status:Array.from(document.querySelectorAll('[role="status"]')).map(el=>el.textContent)})));
      await page.screenshot({path:path.join(out, 'timeout.png')});
      throw error;
    }
  }
  async function cleanUI(page) {
    assert.deepEqual(await page.locator('dialog button').allTextContents(), ['正気に戻る']);
    assert.equal(await page.locator('.sceneControls,.stageTop,.packHeader,.openFallback,.autoControls,.skip,.reset').count(),0);
    assert.equal(await page.locator('dialog').evaluate(el => el.matches(':modal')),true);
    assert.equal(await page.evaluate(() => document.body.style.position),'fixed');
    assert.equal(await page.locator('dialog').evaluate(el => {
      const r = el.getBoundingClientRect();
      const footer = el.querySelector('.bottomControls').getBoundingClientRect();
      const content = el.querySelector('.sceneContent').getBoundingClientRect();
      return r.width === innerWidth && r.height === innerHeight && r.x === 0 && r.y === 0
        && footer.bottom <= innerHeight && content.bottom <= footer.top;
    }),true,'Fullscreen scene and reserved bottom control area');
  }
  async function normal(page) {
    await page.waitForTimeout(1500);
    assert.equal(await page.locator('dialog:modal').count(),0);
    assert.equal(await page.evaluate(() => document.body.style.position),'');
    assert.equal(await page.locator('a[href^="/works/"]').count(),4);
  }
  const desktop = await setup();
  const {page} = desktop;
  await page.screenshot({path:path.join(out,'desktop-sealed.png')});
  assert.equal(await page.locator('.pack').evaluate(el => el === document.activeElement),true);
  const seam = page.locator('.tearZone');
  const rect = await seam.boundingBox();
  const x = rect.x+rect.width/2, y=rect.y+rect.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  assert.equal(await page.locator('.swipeGuide').count(),0);
  await page.mouse.move(x+35,y);
  await page.mouse.up();
  assert.match(await page.locator('.pack').getAttribute('style'),/--tear: 0%/);
  assert.equal(await page.locator('.swipeGuide').count(),1);
  await page.evaluate(() => {
    window.packEvents=[];
    new MutationObserver(() => {
      const phase = document.querySelector('section[data-phase]')?.dataset.phase;
      const title = phase === 'reveal' ? document.querySelector('.heroCard h4')?.textContent : phase === 'collection' ? 'collection' : null;
      if(title && window.packEvents.at(-1)?.title !== title) window.packEvents.push({title,time:performance.now()});
    }).observe(document.body,{subtree:true,childList:true,attributes:true});
  });
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+125,y,{steps:8});
  await page.mouse.up();
  await phase(page,'burst');
  assert.equal(await page.locator('.flyingCard').count(),4);
  await page.waitForTimeout(300);
  await page.screenshot({path:path.join(out,'desktop-burst.png')});
  assert.equal(await page.locator('.flyingCard').evaluateAll(cards => {
    const origin = document.querySelector('.packScene').getBoundingClientRect().top;
    return cards.every(card => card.getBoundingClientRect().top < origin);
  }),true,'All four cards launch above the pack');
  await phase(page,'reveal');
  await cleanUI(page);
  await page.mouse.move(5,5);
  await phase(page,'collection');
  await cleanUI(page);
  const events = await page.evaluate(() => window.packEvents);
  assert.equal(events.length,5);
  assert.equal(new Set(events.slice(0,4).map(e=>e.title)).size,4);
  for(let i=1;i<4;i++) assert.ok(events[i].time-events[i-1].time >=850 && events[i].time-events[i-1].time <1350);
  assert.ok(events[4].time-events[3].time >=1000);
  assert.equal(await page.locator('.resultCard .workLink').count(),4);
  await page.screenshot({path:path.join(out,'desktop-collection.png')});
  await page.keyboard.press('r');
  await phase(page,'sealed');
  await page.keyboard.press('Space');
  await phase(page,'reveal');
  await page.locator('.heroCard .workLink').focus();
  const heldTitle=await page.locator('.heroCard h4').innerText();
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('.heroCard h4').innerText(),heldTitle,'Link focus protects interaction');
  await page.locator('.heroCard h4').focus();
  await page.keyboard.press('p');
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('.heroCard h4').innerText(),heldTitle,'Keyboard pause');
  await page.keyboard.press('p');
  await page.waitForTimeout(1100);
  assert.notEqual(await page.locator('.heroCard h4').innerText(),heldTitle);
  await page.keyboard.press('Escape');
  await normal(page);
  await desktop.context.close();

  const canceled = await setup();
  await canceled.page.keyboard.press('Enter');
  await phase(canceled.page,'charging');
  await canceled.page.keyboard.press('Escape');
  await normal(canceled.page);
  await canceled.context.close();

  const mobile = await setup({viewport:{width:320,height:640},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await mobile.page.screenshot({path:path.join(out,'mobile-sealed.png')});
  const b=await mobile.page.locator('.tearZone').boundingBox();
  const tx=b.x+b.width/2, ty=b.y+b.height/2;
  const cdp=await mobile.context.newCDPSession(mobile.page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-35,y:ty}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.match(await mobile.page.locator('.pack').getAttribute('style'),/--tear: 0%/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
  for(let d=15;d<=125;d+=15) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-d,y:ty}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await phase(mobile.page,'reveal');
  await cleanUI(mobile.page);
  await mobile.page.screenshot({path:path.join(out,'mobile-reveal.png')});
  await phase(mobile.page,'collection');
  await cleanUI(mobile.page);
  await mobile.page.locator('.sceneContent').evaluate(el => el.scrollTo(0,el.scrollHeight));
  await mobile.page.screenshot({path:path.join(out,'mobile-collection-bottom.png')});
  assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth<=innerWidth),true);
  await mobile.page.locator('dialog button').click();
  await normal(mobile.page);
  await mobile.context.close();

  const reduced=await setup({viewport:{width:390,height:844},reducedMotion:'reduce'});
  assert.equal(await reduced.page.locator('.swipeGuide').evaluate(el=>getComputedStyle(el).animationName),'none');
  await reduced.page.keyboard.press('Enter');
  await phase(reduced.page,'reveal');
  assert.equal(await reduced.page.locator('.flyingCards').count(),0);
  const first=await reduced.page.locator('.heroCard h4').innerText();
  await reduced.page.waitForTimeout(1100);
  assert.notEqual(await reduced.page.locator('.heroCard h4').innerText(),first);
  await reduced.page.goBack();
  assert.equal(await reduced.page.evaluate(()=>document.body.style.position),'');
  await reduced.context.close();

  await browser.close();
  assert.deepEqual(errors,[],'No runtime errors');
  console.log(`PASS: only bottom normal-mode button, no header/fallback/skip/pause UI; full-screen collection; swipe guide, four upward cards, 1000ms automatic sequence, keyboard pack/pause/replay, touch cancel, link pause, Escape cleanup, reduced motion and Back. Screenshots: ${out}`);
})().catch(error=>{console.error(error);process.exit(1);});
