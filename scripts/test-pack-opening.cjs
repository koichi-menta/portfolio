// Run against an existing local dev server: node scripts/test-pack-opening.cjs
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
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/chromium"),
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  async function setup(options = {}) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1000 },
      ...options,
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseURL);
    const logo = page.locator('.card img[alt="ロゴ"]');
    for (let i = 0; i < 6; i++) await logo.click({ force: true });
    await page.getByRole("button", { name: "音を消す", exact: true }).click();
    await logo.click(); // Open the menu after the six-click activation.
    await page.waitForTimeout(600); // Let the existing menu unfold.
    // Use Next's client-side link so the in-memory dopamine mode is retained.
    await page.locator('a[href="/works"]').first().click({ force: true });
    await page.locator('section[data-phase="intro"]').waitFor();
    assert.equal(await page.locator('dialog').evaluate(el => el.matches(':modal')), true);
    assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
    assert.equal(await page.locator('dialog').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.width === innerWidth && rect.height === innerHeight && rect.x === 0 && rect.y === 0;
    }), true, 'Opening scene fills the viewport');
    assert.equal((await page.locator('.guarantee h2').textContent()).replace(/\s/g, ''), 'SSR確定');
    await page.screenshot({path: path.join(out, `intro-${options.reducedMotion || options.viewport?.width || 'desktop'}.png`)});
    await page.locator('section[data-phase="sealed"]').waitFor();
    return { context, page, pack: page.locator("section[data-phase]") };
  }
  async function phase(pack, value) {
    await pack.locator(`xpath=self::*[@data-phase="${value}"]`).waitFor();
  }
  const { page, pack, context } = await setup();
  await page.screenshot({
    path: path.join(out, "desktop-sealed.png"),
    fullPage: true,
  });
  const seam = page.locator(".tearZone");
  await seam.scrollIntoViewIfNeeded();
  let bounds = await seam.boundingBox();
  let x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  assert.equal(await page.locator('.swipeGuide').count(), 1);
  await page.mouse.down();
  assert.equal(await page.locator('.swipeGuide').count(), 0, 'Guide hides during actual dragging');
  await page.mouse.move(x + 35, y);
  await page.mouse.up();
  assert.equal(
    await pack.getAttribute("data-phase"),
    "sealed",
    "Short tear must reset",
  );
  assert.match(await page.locator(".pack").getAttribute("style"), /--tear: 0%/);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 125, y, { steps: 8 });
  await page.mouse.up();
  await phase(pack, "charging");
  await phase(pack, "burst");
  assert.equal(await page.locator('.flyingCard').count(), 4);
  await page.waitForTimeout(420);
  assert.equal(await page.locator('.flyingCard').evaluateAll(cards => {
    const origin = document.querySelector('.packScene').getBoundingClientRect().top;
    return cards.every(card => card.getBoundingClientRect().top < origin);
  }), true, 'Every work card launches upwards out of the pack');
  await page.screenshot({ path: path.join(out, "desktop-burst.png") });
  await phase(pack, "reveal");
  await page.locator(".heroCard").waitFor();
  await page.waitForTimeout(650);
  await page.screenshot({
    path: path.join(out, "desktop-reveal.png"),
    fullPage: true,
  });
  assert.equal(
    await page
      .getByRole("button", { name: "次のカード →", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  const firstTitle = await page.locator(".heroCard h4").innerText();
  await page.getByRole("button", { name: "次のカード →", exact: true }).click();
  await page.waitForTimeout(650);
  assert.notEqual(await page.locator(".heroCard h4").innerText(), firstTitle);
  await page
    .getByRole("button", { name: "すべて見る ↗", exact: true })
    .click();
  await phase(pack, "collection");
  const total = await page.locator(".resultCard").count();
  assert.equal(total, 4);
  assert.equal(await page.locator(".resultCard .workLink").count(), total);
  await page
    .getByRole("button", { name: "もう一度パックを開ける ↻", exact: true })
    .click();
  await phase(pack, "intro");
  await page.keyboard.press("Escape");
  await phase(pack, "collection");
  await page.waitForTimeout(2500);
  await phase(pack, "collection"); // canceled intro cannot restart
  await page.getByRole('button', {name: 'もう一度パックを開ける ↻', exact: true}).click();
  await phase(pack, "sealed");
  await page.getByRole("button", { name: "ボタンでパックを開ける ↗", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await phase(pack, "collection");
  await page.waitForTimeout(2500);
  await phase(pack, "collection"); // stale timers must not reopen the sequence
  assert.equal(await page.evaluate(() => document.body.style.position), '');
  assert.equal(await page.getByRole('button', {name: 'もう一度パックを開ける ↻', exact: true}).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', {name: 'もう一度パックを開ける ↻', exact: true}).click();
  await phase(pack, "sealed");
  await page
    .getByRole("button", { name: "ボタンでパックを開ける ↗", exact: true })
    .click();
  await page.locator("dialog").getByRole("button", { name: "正気に戻る", exact: true }).click();
  await page.waitForTimeout(1400);
  assert.equal(await page.locator("section[data-phase]").count(), 0);
  assert.equal(await page.evaluate(() => document.body.style.position), "");
  assert.ok(
    (await page.locator('a[href^="/works/"]').count()) > 0,
    "Normal works list remains",
  );
  await context.close();

  const auto = await setup();
  await auto.page.mouse.move(5, 5);
  await auto.page.evaluate(() => {
    window.packEvents = [];
    const observer = new MutationObserver(() => {
      const phase = document.querySelector('section[data-phase]')?.dataset.phase;
      const title = phase === 'reveal' ? document.querySelector('.heroCard h4')?.textContent : phase === 'collection' ? 'collection' : null;
      if (title && window.packEvents.at(-1)?.title !== title) window.packEvents.push({title, time: performance.now()});
    });
    observer.observe(document.body, {subtree: true, childList: true, attributes: true});
  });
  await auto.page.getByRole('button', {name: 'ボタンでパックを開ける ↗', exact: true}).click();
  await phase(auto.pack, 'collection');
  const events = await auto.page.evaluate(() => window.packEvents);
  assert.equal(events.length, 5, 'Four works followed by the collection, without clicks');
  assert.equal(new Set(events.slice(0,4).map(event => event.title)).size, 4);
  for (let i = 1; i < 4; i++) assert.ok(events[i].time - events[i-1].time >= 850 && events[i].time - events[i-1].time < 1350, 'One-second automatic work cadence');
  assert.ok(events[4].time - events[3].time >= 1000, 'Last work remains for at least a second');
  await auto.page.getByRole('button', {name: 'もう一度パックを開ける ↻', exact: true}).click();
  await phase(auto.pack, 'sealed');
  await auto.page.getByRole('button', {name: 'ボタンでパックを開ける ↗', exact: true}).click();
  await phase(auto.pack, 'reveal');
  await auto.page.locator('.heroCard .workLink').focus();
  const heldTitle = await auto.page.locator('.heroCard h4').innerText();
  await auto.page.waitForTimeout(1500);
  assert.equal(await auto.page.locator('.heroCard h4').innerText(), heldTitle, 'Link keyboard focus pauses automatic changes');
  await auto.page.getByRole('button', {name:'一時停止', exact:true}).click();
  await auto.page.waitForTimeout(1300);
  assert.equal(await auto.page.locator('.heroCard h4').innerText(), heldTitle, 'Explicit pause protects reading');
  await auto.page.getByRole('button', {name:'自動送りを再開', exact:true}).click();
  await auto.page.waitForTimeout(1100);
  assert.notEqual(await auto.page.locator('.heroCard h4').innerText(), heldTitle);
  await auto.page.keyboard.press('Escape');
  await phase(auto.pack, 'collection');
  await auto.page.waitForTimeout(1500);
  await phase(auto.pack, 'collection');
  await auto.context.close();

  const mobile = await setup({
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await mobile.page.locator(".tearZone").scrollIntoViewIfNeeded();
  bounds = await mobile.page.locator(".tearZone").boundingBox();
  x = bounds.x + bounds.width / 2;
  y = bounds.y + bounds.height / 2;
  const cdp = await mobile.context.newCDPSession(mobile.page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x - 35, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await phase(mobile.pack, "sealed");
  assert.match(
    await mobile.page.locator(".pack").getAttribute("style"),
    /--tear: 0%/,
  );
  await mobile.page.screenshot({
    path: path.join(out, "mobile-sealed.png"),
    fullPage: true,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let d = 15; d <= 120; d += 15)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - d, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await phase(mobile.pack, "reveal");
  await mobile.page.waitForTimeout(650);
  assert.equal(
    await mobile.page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
    "No horizontal mobile overflow",
  );
  await mobile.page.screenshot({
    path: path.join(out, "mobile-reveal.png"),
    fullPage: true,
  });
  await mobile.context.close();

  const reduced = await setup({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  assert.equal(
    await reduced.page
      .locator(".foil")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.equal(await reduced.page.locator('.swipeGuide').evaluate(el => getComputedStyle(el).animationName), 'none');
  await reduced.page
    .getByRole("button", { name: "ボタンでパックを開ける ↗", exact: true })
    .click();
  assert.equal(await reduced.pack.getAttribute("data-phase"), "reveal");
  assert.equal(await reduced.page.locator(".flyingCards").count(), 0);
  assert.equal(
    await reduced.page
      .locator(".revealHalo")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  const reducedTitle = await reduced.page.locator('.heroCard h4').innerText();
  await reduced.page.waitForTimeout(1100);
  assert.notEqual(await reduced.page.locator('.heroCard h4').innerText(), reducedTitle, 'Reduced motion retains sequential works');
  await reduced.page.goBack();
  assert.equal(await reduced.page.evaluate(() => document.body.style.position), '', 'Back navigation unlocks scrolling');
  assert.equal(await reduced.page.locator('dialog:modal').count(), 0);
  await reduced.context.close();
  await browser.close();
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    `PASS: swipe guide hides on drag, all 4 cards launch upwards, automatic 1000ms cadence/last card dwell/link pause/reading pause, fullscreen SSR intro, modal focus, scroll lock/recovery, mouse/touch tearing, short/canceled gestures, reveal/next/collection (${total} cards), replay, keyboard Escape, timer cleanup, mode disable, mobile overflow, reduced motion. Screenshots: ${out}`,
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
