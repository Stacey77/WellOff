/**
 * WellOff AI Platform - Web Server
 * 
 * Serves the GUI for the WellOff AI Platform
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url);
  
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              WellOff AI Platform - Web GUI                     ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Open the URL above in your browser to access the GUI.');
  console.log('');
  console.log('Press Ctrl+C to stop the server.');
  console.log('═══════════════════════════════════════════════════════════════');
});

export default server;
