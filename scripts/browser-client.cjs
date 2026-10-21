const fs = require('node:fs');
async function connect() {
  const pages = await (await fetch('http://127.0.0.1:9224/json')).json();
  const page = pages.find(p => p.id === process.env.BROWSER_PAGE_ID) || pages.find(p => p.type === 'page' && p.url.includes('localhost:4200'));
  if (!page) throw new Error('Open http://localhost:4200 in Chrome with --remote-debugging-port=9224 first.');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { ws.onopen=resolve; ws.onerror=reject; });
  let id=0;
  const pending=new Map();
  const errors=[];
  ws.onmessage = e => {
    const m=JSON.parse(e.data);
    if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if(m.method==='Runtime.consoleAPICalled' && m.params.type==='error') errors.push(m.params.args.map(a=>a.description || a.value));
    if(pending.has(m.id)) {
      const p=pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    }
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const next=++id;
    const timer=setTimeout(()=>{pending.delete(next);reject(new Error(method+' timed out'))},15000);
    pending.set(next,{resolve,reject,timer});
    ws.send(JSON.stringify({id:next,method,params}));
  });
  const evaluate=async expression=>{
    const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  return {send,evaluate,errors,pause:ms=>new Promise(r=>setTimeout(r,ms)),close:()=>ws.close(),
    screenshot:async(path,format='png')=>{
      const r=await send('Page.captureScreenshot',{format,fromSurface:true,captureBeyondViewport:false,optimizeForSpeed:true});
      fs.writeFileSync(path,Buffer.from(r.data,'base64'));
    }};
}
module.exports={connect};
