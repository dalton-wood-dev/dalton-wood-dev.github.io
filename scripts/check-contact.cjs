const assert=require('node:assert/strict');
(async()=>{const p=await(await fetch('http://127.0.0.1:9224/json/new?http://localhost:4200',{method:'PUT'})).json();process.env.BROWSER_PAGE_ID=p.id;const b=await require('./browser-client.cjs').connect();try{
await b.send('Page.bringToFront');await b.send('Page.navigate',{url:'http://localhost:4200'});await b.pause(700);
await b.evaluate(`(()=>{window.__sent=0;window.__mode='success';const original=window.fetch;window.fetch=async(url,options)=>{if(!String(url).startsWith('https://formsubmit.co/'))return original(url,options);window.__sent++;window.__payload=JSON.parse(options.body);if(window.__mode==='network')throw new TypeError('offline');if(window.__mode==='pending')return new Promise(resolve=>{window.__finish=()=>resolve({ok:true,json:async()=>({success:'true'})})});return {ok:true,json:async()=>({success:window.__mode==='success'?'true':'false'})}}})()`);
const fill=()=>b.evaluate(`(()=>{for(const [name,value] of Object.entries({name:'Test visitor',email:'visitor@example.com',message:'Test draft'})){document.querySelector('[name="'+name+'"]').value=value}})()`);
const submit=()=>b.evaluate("document.querySelector('form').requestSubmit()");
const status=()=>b.evaluate("document.querySelector('.submission-status').textContent.trim()");
await submit();assert.equal(await b.evaluate('window.__sent'),0,'invalid form must not send');
await fill();await submit();await b.pause(100);assert.match(await status(),/submitted/);
for(const mode of ['reject','network']){await b.evaluate(`window.__mode='${mode}'`);await submit();await b.pause(100);assert.match(await status(),/could not be confirmed/);assert.equal(await b.evaluate("document.querySelector('[name=message]').value"),'Test draft');}
await b.evaluate("window.__mode='pending'");await submit();await b.pause(100);assert.equal(await b.evaluate("document.querySelector('button[type=submit]').disabled"),true);const sent=await b.evaluate('window.__sent');await submit();assert.equal(await b.evaluate('window.__sent'),sent);await b.evaluate('window.__finish()');await b.pause(100);
assert.equal(await b.evaluate("document.querySelector('form').hasAttribute('target')"),false);
console.log('PASS: contact validation, success, provider rejection, network failure, preserved draft, duplicate protection; no real submissions');
}finally{await b.send('Page.navigate',{url:'http://localhost:4200'});b.close()}})().catch(e=>{console.error(e);process.exitCode=1});