const http = require('http');
const fs = require('fs');
const path = require('path');

// Port 3000 is standard and highly reliable on Windows local environments
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // We only serve index.html as the application is a fully integrated SPA
  if (req.url === '/' || req.url === '/index.html' || req.url === '/index') {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro interno do servidor ao carregar o arquivo index.html. Certifique-se de que ele está na mesma pasta.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  } else {
    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Caminho não encontrado no painel VexMaker.');
  }
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log('      VEXMAKER — GESTÃO DE IMPRESSÕES 3D');
  console.log('==================================================');
  console.log(` Servidor rodando com sucesso!`);
  console.log(` Acesse em: http://localhost:${PORT}`);
  console.log(' Pressione Ctrl+C para encerrar o servidor.');
  console.log('==================================================');
});
