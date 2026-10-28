/*
 * Servidor estático para revisar la landing en local, con gzip como un hosting real.
 * Uso: node tools/servidor-local.cjs [carpeta] [puerto]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const raiz = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const puerto = Number(process.argv[3]) || 5540;
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8'
};
const comprimibles = new Set(['.html', '.css', '.js', '.svg', '.txt']);

http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split('?')[0]);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = path.join(raiz, ruta);
  if (!archivo.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(archivo).toLowerCase();
    const cabeceras = { 'Content-Type': tipos[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    if (comprimibles.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      cabeceras['Content-Encoding'] = 'gzip';
      datos = zlib.gzipSync(datos);
    }
    res.writeHead(200, cabeceras);
    res.end(datos);
  });
}).listen(puerto, () => console.log('http://localhost:' + puerto));
