/**
 * cobol/cgi-runner/server.js
 * Node.js CGI runner - spawns COBOL .exe files as CGI processes.
 * Replaces Apache httpd for Windows development environment.
 *
 * Usage: node cobol/cgi-runner/server.js
 * Port:  8081 (matches COBOL_CGI_URL in .env)
 *
 * CGI routing:
 *   GET  /cgi-bin/emp-list.exe    → build/emp-list.exe
 *   GET  /cgi-bin/emp-detail.exe  → build/emp-detail.exe
 *   POST /cgi-bin/emp-create.exe  → build/emp-create.exe
 *   PUT  /cgi-bin/emp-update.exe  → build/emp-update.exe
 *   DELETE /cgi-bin/emp-delete.exe → build/emp-delete.exe
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = parseInt(process.env.COBOL_CGI_PORT || '8081', 10);
const BUILD_DIR = path.resolve(__dirname, '..', 'build');

// Map URL path → executable name
const CGI_MAP = {
  '/cgi-bin/emp-list.exe':   'emp-list.exe',
  '/cgi-bin/emp-detail.exe': 'emp-detail.exe',
  '/cgi-bin/emp-create.exe': 'emp-create.exe',
  '/cgi-bin/emp-update.exe': 'emp-update.exe',
  '/cgi-bin/emp-delete.exe': 'emp-delete.exe',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  const exeName = CGI_MAP[pathname];
  if (!exeName) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ERROR', code: 'NOT_FOUND', message: `CGI not found: ${pathname}` }));
    return;
  }

  const exePath = path.join(BUILD_DIR, exeName);
  if (!fs.existsSync(exePath)) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ERROR', code: 'CGI_NOT_BUILT', message: `Executable not found: ${exePath}. Run: cd cobol && make all` }));
    return;
  }

  // Prepare CGI environment variables
  const env = {
    ...process.env,
    REQUEST_METHOD: req.method,
    QUERY_STRING: parsed.query ? url.format({ query: parsed.query }).slice(1) : '',
    PATH_INFO: pathname,
    CONTENT_TYPE: req.headers['content-type'] || '',
    CONTENT_LENGTH: req.headers['content-length'] || '0',
    SERVER_NAME: 'localhost',
    SERVER_PORT: String(PORT),
    GATEWAY_INTERFACE: 'CGI/1.1',
    SERVER_PROTOCOL: 'HTTP/1.1',
    SCRIPT_NAME: pathname,
    HTTP_HOST: req.headers['host'] || `localhost:${PORT}`,
    // Pass DB config to COBOL via environment
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '3306',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'app_db',
    // Add MariaDB DLL to PATH so COBOL exe can find it
    PATH: `C:\\msys64\\mingw64\\bin;${process.env.PATH || ''}`,
  };

  // Collect request body (for POST/PUT)
  const bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(bodyChunks);

    const cgiProcess = spawn(exePath, [], { env, stdio: ['pipe', 'pipe', 'pipe'] });

    // Send request body to CGI stdin
    if (body.length > 0) {
      cgiProcess.stdin.write(body);
    }
    cgiProcess.stdin.end();

    const outputChunks = [];
    const errorChunks = [];

    cgiProcess.stdout.on('data', chunk => outputChunks.push(chunk));
    cgiProcess.stderr.on('data', chunk => errorChunks.push(chunk));

    cgiProcess.on('close', (code) => {
      const output = Buffer.concat(outputChunks).toString('utf8');
      const errorOutput = Buffer.concat(errorChunks).toString('utf8');

      if (errorOutput) {
        console.error(`[CGI STDERR] ${exeName}:`, errorOutput.trim());
      }

      if (!output) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ERROR', code: 'EMPTY_RESPONSE', message: 'CGI produced no output' }));
        return;
      }

      // Parse CGI output: headers + blank line (possibly whitespace-only) + body
      // COBOL DISPLAY "" may emit a space before newline, so match \n[ \t]*\n
      const splitMatch = output.match(/\r?\n[ \t]*\r?\n/);
      const splitIdx = splitMatch ? output.indexOf(splitMatch[0]) : -1;

      let headers = {};
      let responseBody = output;

      if (splitIdx !== -1) {
        const headerSection = output.substring(0, splitIdx);
        responseBody = output.substring(splitIdx + splitMatch[0].length);

        headerSection.split(/\r?\n/).forEach(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim().toLowerCase();
            const val = line.substring(colonIdx + 1).trim();
            headers[key] = val;
          }
        });
      }

      // Determine HTTP status from JSON body if no Status header
      let httpStatus = 200;
      const statusHeader = headers['status'];
      if (statusHeader) {
        httpStatus = parseInt(statusHeader, 10) || 200;
      } else {
        try {
          const bodyJson = JSON.parse(responseBody);
          if (bodyJson.status === 'CREATED') httpStatus = 201;
          else if (bodyJson.status === 'ERROR') {
            const errCode = bodyJson.code;
            if (errCode === 'NOT_FOUND')       httpStatus = 404;
            else if (errCode === 'DUPLICATE_CODE' || errCode === 'DUPLICATE_EMAIL') httpStatus = 409;
            else if (errCode === 'VALIDATION_ERROR') httpStatus = 400;
            else httpStatus = 500;
          }
        } catch (_) { /* not JSON */ }
      }

      res.writeHead(httpStatus, {
        'Content-Type': headers['content-type'] || 'application/json',
        'Content-Length': Buffer.byteLength(responseBody, 'utf8'),
      });
      res.end(responseBody);
    });

    cgiProcess.on('error', (err) => {
      console.error(`[CGI ERROR] Failed to spawn ${exeName}:`, err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ERROR', code: 'SPAWN_FAILED', message: err.message }));
    });
  });
});

server.listen(PORT, () => {
  console.log(`COBOL CGI Runner listening on http://localhost:${PORT}`);
  console.log(`Build dir: ${BUILD_DIR}`);
  console.log('Available CGI endpoints:');
  Object.keys(CGI_MAP).forEach(route => {
    const exists = fs.existsSync(path.join(BUILD_DIR, CGI_MAP[route]));
    console.log(`  ${route} → ${exists ? 'READY' : 'NOT BUILT (run: cd cobol && make all)'}`);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down CGI runner...');
  server.close(() => process.exit(0));
});
