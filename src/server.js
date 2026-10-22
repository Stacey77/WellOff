/**
 * WellOff AI Platform - Web Server
 * 
 * Serves the GUI for the WellOff AI Platform
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

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
  const url = `http://localhost:${PORT}`;
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              WellOff AI Platform - Web GUI                     ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`🌐 Server running at ${url}`);
  console.log('');
  console.log('Opening browser automatically...');
  console.log('');
  console.log('Press Ctrl+C to stop the server.');
  console.log('═══════════════════════════════════════════════════════════════');

  // Auto-open the browser based on the OS
  const openCmd =
    process.platform === 'win32' ? `start ${url}` :
    process.platform === 'darwin' ? `open ${url}` :
    `xdg-open ${url}`;

  exec(openCmd, (err) => {
    if (err) {
      console.log(`\n⚠️  Could not open browser automatically.`);
      console.log(`   Please open ${url} in your browser manually.\n`);
    }
  });
});

export default server;
