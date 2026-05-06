/**
 * COBOL CGI Runner  EExpress server on port 8081
 *
 * Replaces Apache httpd for local development.
 * Handles MySQL queries directly and delegates business logic
 * (validation, JSON formatting) to compiled COBOL programs via
 * stdin/stdout pipes.
 *
 * Start: node cobol/cgi-runner/server.js   (from project root)
 *
 * Architecture:
 *   Node.js API :3000  ↁE CobolGateway HTTP  ↁE this server :8081
 *   This server  ↁE MySQL (queries)  ↁE COBOL stdin  ↁE JSON stdout
 */
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COBOL_BUILD = path.resolve(__dirname, '..', 'build');
const EXE = process.platform === 'win32' ? '.exe' : '';

const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'app_db',
  dateStrings: true,       // Return DATE/DATETIME as strings
  decimalNumbers: false,   // Return DECIMAL as strings to preserve precision
};

const PORT = parseInt(process.env.COBOL_CGI_PORT || '8081', 10);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Helpers ────────────────────────────────────────────────────────────────

/** Spawn a COBOL program, pipe stdinData, collect stdout */
function runCobol(program, stdinData) {
  return new Promise((resolve, reject) => {
    const exePath = path.join(COBOL_BUILD, program + EXE);
    // GnuCOBOL runtime requires MinGW64 DLLs and COB_CONFIG_DIR
    const cobEnv = {
      ...process.env,
      PATH: `C:\\msys64\\mingw64\\bin;${process.env.PATH || ''}`,
      COB_CONFIG_DIR: 'C:\\msys64\\mingw64\\share\\gnucobol\\config',
    };
    const proc = spawn(exePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: cobEnv,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
    proc.on('close', code => {
      if (code !== 0 && code !== null) {
        reject(new Error(`COBOL ${program} exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
    proc.on('error', err => reject(new Error(`Failed to start ${exePath}: ${err.message}`)));
    proc.stdin.write(stdinData, 'utf8');
    proc.stdin.end();
  });
}

/** Parse multi-line key|value output from write COBOL programs */
function parseCobolKV(output) {
  const result = {};
  for (const line of output.trim().split('\n')) {
    const pipeIdx = line.indexOf('|');
    if (pipeIdx === -1) continue;
    const key = line.slice(0, pipeIdx).trim();
    const val = line.slice(pipeIdx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

/** Build error JSON when COBOL reports a validation failure */
function cobolErrorResponse(kv) {
  const code    = kv.CODE    || 'VALIDATION_ERROR';
  const field   = kv.FIELD   || '';
  const message = kv.MESSAGE || 'Validation failed';
  const statusMap = {
    NOT_FOUND:       404,
    DUPLICATE_CODE:  409,
    DUPLICATE_EMAIL: 409,
    VALIDATION_ERROR: 400,
    DB_ERROR:        502,
  };
  return { httpStatus: statusMap[code] || 400, body: { status: 'ERROR', code, field, message } };
}

/** Format a MySQL row as the pipe-delimited RECORD line COBOL expects */
function rowToCobolRecord(row) {
  const f = v => (v == null ? '' : String(v).replace(/\|/g, ' '));
  return [
    'RECORD',
    f(row.id),
    f(row.employee_code),
    f(row.full_name),
    f(row.email),
    f(row.phone),
    f(row.department),
    f(row.position),
    f(row.salary),
    f(row.hire_date),
    f(row.status),
    f(row.created_at),
    f(row.updated_at),
  ].join('|');
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /cgi-bin/emp-list.cgi
 * Query params: page, limit, search, department, status
 */
app.get('/cgi-bin/emp-list.cgi', async (req, res) => {
  let conn;
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params     = [];

    if (req.query.search) {
      conditions.push('(full_name LIKE ? OR employee_code LIKE ? OR email LIKE ?)');
      const like = `%${req.query.search}%`;
      params.push(like, like, like);
    }
    if (req.query.department) { conditions.push('department = ?'); params.push(req.query.department); }
    if (req.query.status)     { conditions.push('status = ?');     params.push(req.query.status);     }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    conn = await mysql.createConnection(dbConfig);

    const [[{ total }]] = await conn.execute(
      `SELECT COUNT(*) AS total FROM employees ${where}`, params,
    );
    const pages = Math.ceil(total / limit);

    const [rows] = await conn.execute(
      `SELECT * FROM employees ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    await conn.end();
    conn = null;

    // Build stdin for COBOL
    const lines = [`HEADER|${page}|${limit}|${total}|${pages}`];
    for (const row of rows) lines.push(rowToCobolRecord(row));
    lines.push('EOF');
    const stdin = lines.join('\n') + '\n';

    const output = await runCobol('emp-list', stdin);
    const parsed = JSON.parse(output.trim());
    res.json(parsed);
  } catch (err) {
    if (conn) await conn.end().catch(() => {});
    console.error('[emp-list]', err.message);
    res.status(500).json({ status: 'ERROR', code: 'DB_ERROR', message: err.message });
  }
});

/**
 * GET /cgi-bin/emp-detail.cgi?id=:id
 */
app.get('/cgi-bin/emp-detail.cgi', async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.query.id || '0', 10);
    if (!id || id <= 0) {
      return res.status(400).json({ status: 'ERROR', code: 'VALIDATION_ERROR', message: 'id must be a positive integer' });
    }
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM employees WHERE id = ?', [id]);
    await conn.end();
    conn = null;

    const stdin = rows.length === 0
      ? 'NOT_FOUND\n'
      : rowToCobolRecord(rows[0]) + '\nEOF\n';

    const output = await runCobol('emp-detail', stdin);
    const parsed = JSON.parse(output.trim());
    const httpStatus = parsed.status === 'ERROR' && parsed.code === 'NOT_FOUND' ? 404 : 200;
    res.status(httpStatus).json(parsed);
  } catch (err) {
    if (conn) await conn.end().catch(() => {});
    console.error('[emp-detail]', err.message);
    res.status(500).json({ status: 'ERROR', code: 'DB_ERROR', message: err.message });
  }
});

/**
 * POST /cgi-bin/emp-create.cgi
 * Body: { employee_code, full_name, email, phone, department, position, salary, hire_date, status }
 */
app.post('/cgi-bin/emp-create.cgi', async (req, res) => {
  let conn;
  try {
    const body = req.body || {};

    // Build stdin for COBOL validation
    const lines = [
      `EMPLOYEE_CODE|${body.employee_code || ''}`,
      `FULL_NAME|${body.full_name || ''}`,
      `EMAIL|${body.email || ''}`,
      `PHONE|${body.phone || ''}`,
      `DEPARTMENT|${body.department || ''}`,
      `POSITION|${body.position || ''}`,
      `SALARY|${body.salary ?? ''}`,
      `HIRE_DATE|${body.hire_date || ''}`,
      `STATUS|${body.status || ''}`,
      'END',
    ];
    const stdin = lines.join('\n') + '\n';

    const output = await runCobol('emp-create', stdin);
    const kv     = parseCobolKV(output);

    if (kv.RESULT !== 'VALID') {
      const { httpStatus, body: errBody } = cobolErrorResponse(kv);
      return res.status(httpStatus).json(errBody);
    }

    // COBOL validation passed  Echeck uniqueness then insert
    conn = await mysql.createConnection(dbConfig);

    const [[codeRow]] = await conn.execute(
      'SELECT COUNT(*) AS cnt FROM employees WHERE employee_code = ?', [kv.EMPLOYEE_CODE],
    );
    if (codeRow.cnt > 0) {
      await conn.end(); conn = null;
      return res.status(409).json({ status: 'ERROR', code: 'DUPLICATE_CODE', message: 'Employee code already exists' });
    }

    const [[emailRow]] = await conn.execute(
      'SELECT COUNT(*) AS cnt FROM employees WHERE email = ?', [kv.EMAIL],
    );
    if (emailRow.cnt > 0) {
      await conn.end(); conn = null;
      return res.status(409).json({ status: 'ERROR', code: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }

    const [insertResult] = await conn.execute(
      `INSERT INTO employees (employee_code, full_name, email, phone, department, position, salary, hire_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kv.EMPLOYEE_CODE, kv.FULL_NAME, kv.EMAIL,
        kv.PHONE || null, kv.DEPARTMENT, kv.POSITION,
        parseFloat(kv.SALARY), kv.HIRE_DATE, kv.STATUS || 'active',
      ],
    );

    const [[newRow]] = await conn.execute('SELECT * FROM employees WHERE id = ?', [insertResult.insertId]);
    await conn.end();
    conn = null;

    // Use EMP-DETAIL to format the response
    const detailStdin = rowToCobolRecord(newRow) + '\nEOF\n';
    const detailOut   = await runCobol('emp-detail', detailStdin);
    const detail      = JSON.parse(detailOut.trim());
    res.status(201).json({ status: 'CREATED', data: detail.data });
  } catch (err) {
    if (conn) await conn.end().catch(() => {});
    console.error('[emp-create]', err.message);
    res.status(500).json({ status: 'ERROR', code: 'DB_ERROR', message: err.message });
  }
});

/**
 * PUT /cgi-bin/emp-update.cgi?id=:id
 * Body: { full_name, email, phone, department, position, salary, hire_date, status }
 */
app.put('/cgi-bin/emp-update.cgi', async (req, res) => {
  let conn;
  try {
    const id = parseInt(req.query.id || '0', 10);
    if (!id || id <= 0) {
      return res.status(400).json({ status: 'ERROR', code: 'VALIDATION_ERROR', message: 'id must be a positive integer' });
    }

    const body = req.body || {};

    // Build stdin for COBOL validation
    const lines = [
      `EMPLOYEE_ID|${id}`,
      `FULL_NAME|${body.full_name || ''}`,
      `EMAIL|${body.email || ''}`,
      `PHONE|${body.phone || ''}`,
      `DEPARTMENT|${body.department || ''}`,
      `POSITION|${body.position || ''}`,
      `SALARY|${body.salary ?? ''}`,
      `HIRE_DATE|${body.hire_date || ''}`,
      `STATUS|${body.status || ''}`,
      'END',
    ];
    const stdin = lines.join('\n') + '\n';

    const output = await runCobol('emp-update', stdin);
    const kv     = parseCobolKV(output);

    if (kv.RESULT !== 'VALID') {
      const { httpStatus, body: errBody } = cobolErrorResponse(kv);
      return res.status(httpStatus).json(errBody);
    }

    conn = await mysql.createConnection(dbConfig);

    // Check record exists
    const [[existRow]] = await conn.execute('SELECT id FROM employees WHERE id = ?', [id]);
    if (!existRow) {
      await conn.end(); conn = null;
      return res.status(404).json({ status: 'ERROR', code: 'NOT_FOUND', message: 'Employee not found' });
    }

    // Check email uniqueness (excluding self)
    const [[emailRow]] = await conn.execute(
      'SELECT COUNT(*) AS cnt FROM employees WHERE email = ? AND id != ?', [kv.EMAIL, id],
    );
    if (emailRow.cnt > 0) {
      await conn.end(); conn = null;
      return res.status(409).json({ status: 'ERROR', code: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }

    await conn.execute(
      `UPDATE employees SET full_name=?, email=?, phone=?, department=?, position=?, salary=?, hire_date=?, status=?
       WHERE id=?`,
      [
        kv.FULL_NAME, kv.EMAIL, kv.PHONE || null,
        kv.DEPARTMENT, kv.POSITION, parseFloat(kv.SALARY),
        kv.HIRE_DATE, kv.STATUS, id,
      ],
    );

    const [[updatedRow]] = await conn.execute('SELECT * FROM employees WHERE id = ?', [id]);
    await conn.end();
    conn = null;

    const detailStdin = rowToCobolRecord(updatedRow) + '\nEOF\n';
    const detailOut   = await runCobol('emp-detail', detailStdin);
    const detail      = JSON.parse(detailOut.trim());
    res.json({ status: 'OK', data: detail.data });
  } catch (err) {
    if (conn) await conn.end().catch(() => {});
    console.error('[emp-update]', err.message);
    res.status(500).json({ status: 'ERROR', code: 'DB_ERROR', message: err.message });
  }
});

/**
 * DELETE /cgi-bin/emp-delete.cgi?id=:id
 */
app.delete('/cgi-bin/emp-delete.cgi', async (req, res) => {
  let conn;
  try {
    const idStr = req.query.id || '';

    // COBOL validates the ID
    const stdin  = `EMPLOYEE_ID|${idStr}\nEND\n`;
    const output = await runCobol('emp-delete', stdin);
    const kv     = parseCobolKV(output);

    if (kv.RESULT !== 'VALID') {
      const { httpStatus, body: errBody } = cobolErrorResponse(kv);
      return res.status(httpStatus).json(errBody);
    }

    const id = parseInt(kv.EMPLOYEE_ID, 10);
    conn = await mysql.createConnection(dbConfig);

    const [[existRow]] = await conn.execute('SELECT id FROM employees WHERE id = ?', [id]);
    if (!existRow) {
      await conn.end(); conn = null;
      return res.status(404).json({ status: 'ERROR', code: 'NOT_FOUND', message: 'Employee not found' });
    }

    await conn.execute('DELETE FROM employees WHERE id = ?', [id]);
    await conn.end();
    conn = null;

    res.json({ status: 'OK', message: 'Employee deleted successfully' });
  } catch (err) {
    if (conn) await conn.end().catch(() => {});
    console.error('[emp-delete]', err.message);
    res.status(500).json({ status: 'ERROR', code: 'DB_ERROR', message: err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`COBOL CGI Runner listening on http://localhost:${PORT}/cgi-bin/`);
  console.log(`COBOL build directory: ${COBOL_BUILD}`);
});
