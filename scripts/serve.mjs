import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 3000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2'};
http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  // Serve only website files; keep the source presentations and working directory private.
  if (!['index.html','styles.css','app.js'].includes(relative) && !relative.startsWith('assets/')) { res.writeHead(404).end('Not found'); return; }
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(filename,(err,stat) => {
    if(err || !stat.isFile()){res.writeHead(404).end('Not found');return;}
    const headers = {'Content-Type':types[path.extname(filename)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    let start=0,end=stat.size-1,status=200;
    if(match){
      if(match[1]) {start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;}
      else if(match[2])start=Math.max(0,stat.size-Number(match[2]));
      if(start>end || start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=end-start+1;
    res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=fs.createReadStream(filename,{start,end});stream.pipe(res);res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());
  });
}).listen(port,'0.0.0.0',()=>console.log(`TartanMatch preview: http://localhost:${port}`));
