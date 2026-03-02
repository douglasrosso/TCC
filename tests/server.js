/**
 * Servidor HTTP estático mínimo para servir a aplicação durante os testes.
 * Não depende de pacotes externos.
 */
import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
};

/**
 * Inicia um servidor de arquivos estáticos.
 * @param {string} rootDir  Caminho absoluto da pasta a servir.
 * @param {number} port     Porta TCP (padrão 3050).
 * @returns {Promise<import('http').Server>}
 */
export function startServer(rootDir, port = 3050) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath  = req.url.split('?')[0];
      const filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);
      const ext      = path.extname(filePath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}
