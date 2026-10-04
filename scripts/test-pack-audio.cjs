const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/chromium'),headless:true});
 for(const muted of [false,true]) {
  console.log(`Checking audio: muted=${muted}`);
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.addInitScript(()=>{
   window.audioProof={notes:[],launches:[],ends:[],stops:[]};
   const proto=AudioContext.prototype,create=proto.createOscillator;
   proto.createOscillator=function(){
    const node=create.call(this),start=node.start.bind(node),stop=node.stop.bind(node);
    let frequency=0; const set=node.frequency.setValueAtTime.bind(node.frequency);
    node.frequency.setValueAtTime=(value,time)=>{frequency=value;return set(value,time);};
    node.start=(time)=>{window.audioProof.notes.push({frequency,time:performance.now(),phase:document.querySelector('section[data-phase]')?.dataset.phase});return start(time);};
    node.stop=(time)=>{window.audioProof.stops.push({frequency,remaining:time-this.currentTime,phase:document.querySelector('section[data-phase]')?.dataset.phase});return stop(time);};
    return node;
   };
   document.addEventListener('animationstart',e=>{if(e.animationName==='cardLaunch') window.audioProof.launches.push(performance.now());},true);
   document.addEventListener('animationend',e=>{if(e.animationName==='cardLaunch') window.audioProof.ends.push(e.target.getBoundingClientRect().bottom);},true);
  });
  console.log('Chrome context ready');
  await page.goto(process.env.PACK_BASE_URL||'http://127.0.0.1:3004');
  const logo=page.locator('.card img[alt="ロゴ"]');
  for(let i=0;i<6;i++) await logo.click({force:true});
  if(muted) await page.getByRole('button',{name:'音を消す',exact:true}).click();
  await logo.click(); await page.waitForTimeout(600);
  await page.locator('a[href="/works"]').click();
  console.log('Works entered');
  await page.locator('section[data-phase="sealed"]').waitFor();
  await page.keyboard.press('Enter');
  await page.locator('section[data-phase="reveal"]').waitFor();
  const proof=await page.evaluate(()=>window.audioProof);
  const impacts=proof.notes.filter(n=>n.phase==='burst'&&[120,127,134,141].includes(n.frequency));
  assert.equal(impacts.length,muted?0:4,'Mute or four low impacts');
  assert.equal(proof.ends.length,4);assert.ok(proof.ends.every(y=>y<0));
  if(!muted){
   assert.equal(proof.notes.filter(n=>n.phase==='intro').length,6,'SSR chord and bass');
   impacts.forEach((n,i)=>assert.ok(Math.abs(n.time-proof.launches[i])<25,'Impact aligned with CSS launch'));
   for(let i=1;i<4;i++) assert.ok(impacts[i].time-impacts[i-1].time>120 && impacts[i].time-impacts[i-1].time<250,'Sequential impacts');
  }
  await page.locator('section[data-phase="collection"]').waitFor();
  await page.keyboard.press('r');
  await page.locator('section[data-phase="intro"]').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  if(!muted) assert.ok((await page.evaluate(()=>window.audioProof.stops)).some(n=>n.frequency===1318.5&&n.remaining<.05),'Exit cancels future intro notes');
  console.log(`Audio checks passed: muted=${muted}`);
  await page.close();
 }
 await browser.close(); console.log('PASS: SSR chord, four CSS-synchronized impacts, actual viewport exit, mute, and scheduled-audio cancellation.');
})().catch(e=>{console.error(e);process.exit(1)});
