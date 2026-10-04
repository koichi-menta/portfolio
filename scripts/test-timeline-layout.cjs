const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const events=require('../src/timeline.json');
const out=process.env.TIMELINE_SCREENSHOTS||'/tmp/portfolio-timeline-qa';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/chromium'),headless:process.env.TIMELINE_HEADED!=='1'});
 const errors=[];
 async function enter(options){
  const context=await browser.newContext(options),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TIMELINE_BASE_URL||'http://127.0.0.1:3004/');
  const logo=page.locator('.card img[alt="ロゴ"]');for(let i=0;i<6;i++)await logo.click({force:true});
  await page.getByRole('button',{name:'音を消す',exact:true}).click();await logo.click();await page.locator('a[href="/timeline"]').click();
  await page.getByRole('button',{name:'スキップ ≫',exact:true}).waitFor();
  return {context,page};
 }
 async function check(page,index){
  const event=events[index];await page.locator('.eventCard .title').filter({hasText:event.title}).waitFor();await page.waitForTimeout(750);
  assert.equal(await page.locator('.eventCard .date').innerText(),event.date);
  assert.equal(await page.locator('.eventCard .description').innerText(),event.description);
  assert.equal(await page.locator('.eventCard time').getAttribute('datetime'),event.date.split('/').map((p,i)=>i?String(p).padStart(2,'0'):p).join('-'));
  const geometry=await page.locator('.eventCard').evaluate(el=>{
   const card=el.getBoundingClientRect(),date=el.querySelector('.date').getBoundingClientRect(),title=el.querySelector('.title').getBoundingClientRect(),node=document.querySelector('.node.focused').getBoundingClientRect(),hud=document.querySelector('.ending')?.getBoundingClientRect();
   return {dateGap:title.top-date.bottom,nodeGap:card.top-node.bottom,top:card.top,bottom:card.bottom,limit:hud?.top||innerHeight-72,horizontal:el.scrollWidth<=el.clientWidth,hiddenDate:getComputedStyle(document.querySelector('.node.focused .nodeDate')).visibility};
  });
  assert.ok(geometry.dateGap>=0&&geometry.dateGap<=8,JSON.stringify(geometry));
  assert.ok(geometry.nodeGap>=8&&geometry.nodeGap<=16,JSON.stringify(geometry));
  assert.ok(geometry.top>=64&&geometry.bottom<geometry.limit&&geometry.horizontal,JSON.stringify(geometry));
  assert.equal(geometry.hiddenDate,'hidden');
  console.log(`Aligned date and event: ${page.viewportSize().width}px ${event.date}`);
 }
 for(const options of [{viewport:{width:1440,height:900}},{viewport:{width:390,height:844},isMobile:true,hasTouch:true},{viewport:{width:320,height:640},isMobile:true,hasTouch:true,reducedMotion:'reduce'}]){
  const {context,page}=await enter(options),width=options.viewport.width;
  await page.getByRole('button',{name:'スキップ ≫',exact:true}).click();await page.getByRole('button',{name:'もう一度見る',exact:true}).waitFor();
  for(let index=events.length-1;index>=0;index--){
   await page.keyboard.press('ArrowDown');await check(page,index);
   if(width===1440&&index===5) await page.screenshot({path:path.join(out,'timeline-pc-latest.png')});
   if(width===1440&&index===0) await page.screenshot({path:path.join(out,'timeline-pc-earliest.png')});
   if(width===390&&index===4) await page.screenshot({path:path.join(out,'timeline-mobile-long.png')});
   if(width===390&&index===0) await page.screenshot({path:path.join(out,'timeline-mobile-earliest.png')});
   if(width===320&&index===4){
    await page.locator('.eventCard').evaluate(el=>el.scrollTop=el.scrollHeight);
    assert.equal(await page.locator('.eventCard').evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1),true,'Long mobile event remains readable through card scrolling');
   }
  }
  await page.keyboard.press('ArrowDown');await page.waitForTimeout(750);assert.equal(await page.locator('.eventCard').count(),0,'Mountain overview has no focused card');
  await page.keyboard.press('ArrowUp');await check(page,0);
  await page.getByRole('button',{name:'もう一度見る',exact:true}).click();
  await page.getByRole('button',{name:'スキップ ≫',exact:true}).waitFor();
  await page.getByRole('button',{name:'正気に戻る',exact:true}).click();
  assert.equal(await page.locator('.world').count(),0,'Normal mode exits mountain');
  await context.close();
 }
 const sequence=await enter({viewport:{width:1440,height:900}});
 const order=await sequence.page.evaluate(()=>new Promise(resolve=>{
  const dates=[];const observer=new MutationObserver(()=>{const date=document.querySelector('.eventCard .date')?.textContent;if(date&&dates.at(-1)!==date)dates.push(date);if(document.querySelector('.ending')){observer.disconnect();resolve(dates);}});observer.observe(document.body,{childList:true,subtree:true});
 }));
 assert.deepEqual(order,events.map(event=>event.date),'Automatic mountain journey preserves event order');
 await sequence.context.close();await browser.close();assert.deepEqual(errors,[]);console.log(`PASS: all dates/events aligned, PC/mobile/small reduced motion, overview, replay, normal exit and automatic order. Screenshots: ${out}`);
})().catch(e=>{console.error(e);process.exit(1)});
