const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
async function run(){
  let period={ok:true,state:'choose',serverNow:Math.floor(Date.now()/1000)}, posts=[];
  const server=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/api/platform-period'){
      if(req.method==='POST'){
        let raw='';for await(const part of req)raw+=part;const body=JSON.parse(raw);posts.push(body);
        if(period.state==='expired'&&body.code!=='browser-fixture-key'){res.writeHead(403,{'Content-Type':'application/json'});res.end('{"ok":false,"error":"Clave de renovación incorrecta."}');return;}
        period={ok:true,state:'active',days:body.days,expiresAt:Math.floor(Date.now()/1000)+(period.state==='expired'?60:2),serverNow:Math.floor(Date.now()/1000)};
      }
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify(period));return;
    }
    if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end('{"ok":true,"files":[]}');return;}
    if(pathname==='/'){
      res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/components/center-empty-state.bundle.css"></head><body><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer><script src="/components/center-empty-state.bundle.js"></script></body></html>');return;
    }
    const file=path.resolve(root,'.'+pathname);
    if(!pathname.startsWith('/components/')||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!['.js','.css'].includes(path.extname(file))){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.css')?'text/css':'text/javascript');fs.createReadStream(file).pipe(res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [1280,390]){
      period={ok:true,state:'choose',serverNow:Math.floor(Date.now()/1000)};
      const page=await browser.newPage({viewport:{width,height:820},reducedMotion:'reduce'});
      await page.goto('http://127.0.0.1:'+server.address().port);
      const card=page.locator('#d5RecommendationCard');
      await card.getByRole('button',{name:'Alternatives',exact:true}).click();
      await card.locator('[data-option="20"]').click();
      await card.getByRole('button',{name:'Aceptar',exact:true}).click();
      await page.waitForSelector('#d5RecommendationCard[data-accepted="true"]');
      period={...period,state:'expired'};
      await page.waitForSelector('#hpaGatePortal');
      assert(await page.locator('main').evaluate(n=>n.inert));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'hpa-code');
      const box=await page.locator('.hpa-dialog').boundingBox();assert(box.x>=0&&box.x+box.width<=width);
      await page.locator('#hpa-code').fill('incorrect');await page.getByRole('button',{name:'Renovar acceso'}).click();
      await page.locator('#hpaGatePortal [role="alert"]').waitFor();
      await page.locator('#hpa-code').fill('browser-fixture-key');await page.locator('#hpa-days').selectOption('30');
      await page.getByRole('button',{name:'Renovar acceso'}).click();await page.waitForSelector('#hpaGatePortal',{state:'detached'});
      assert.equal(posts.at(-1).days,30);
      assert(!(await page.locator('main').evaluate(n=>n.inert)));
      await page.reload();await page.waitForSelector('#d5RecommendationCard[data-selected="30"][data-accepted="true"]');
      await page.close();
    }
    console.log('Chromium desktop and phone: timed access, protected renewal, focus, sizing and reload OK');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
