import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { number, root } from './lib.mjs';

const BODY_LIMIT = 32768;

function json(response, status, data) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let content = '';
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > BODY_LIMIT) throw Object.assign(new Error('Configuração muito grande. Limite de 32 KB.'), { status: 413 });
    content += chunk.toString('utf8');
  }
  try { return JSON.parse(content); }
  catch { throw new Error('Envie uma configuração JSON válida.'); }
}

function validateConfig(config, depth = 0) {
  if (!config || typeof config !== 'object' || Array.isArray(config) || depth > 3) throw new Error('Configuração inválida.');
  if (Object.keys(config).length > 100) throw new Error('Configuração tem campos demais.');
  for (const [key, value] of Object.entries(config)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Campo de configuração inválido.');
    if (typeof value === 'object') validateConfig(value, depth + 1);
    else if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Número inválido na configuração.');
    else if (typeof value === 'string' && value.length > 200) throw new Error('Texto de configuração muito longo.');
    else if (!['number', 'string', 'boolean'].includes(typeof value)) throw new Error('Valor de configuração inválido.');
  }
  return config;
}

export function exportApiPlugin() {
  const jobs = new Map();
  let active = null;
  let closing = false;
  return {
    name: 'ampulheta-local-export',
    configureServer(server) {
      server.httpServer?.once('close', () => {
        closing = true;
        if (active?.child && active.status === 'running') {
          if (process.platform === 'win32') {
            // Only the worker PID created by this plugin, including its browser children.
            spawn('taskkill', ['/pid', String(active.child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('error', () => active?.child?.kill());
          } else active.child.kill('SIGTERM');
        }
      });

      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/api/export')) return next();
        let localHost = false;
        try { localHost = ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(`http://${request.headers.host}`).hostname); } catch { /* reject malformed Host */ }
        if (!localHost) return json(response, 403, { error: 'A exportação está disponível apenas no endereço local do estúdio.' });
        if (request.headers.origin) {
          let sameOrigin = false;
          try { sameOrigin = new URL(request.headers.origin).host === request.headers.host; } catch { /* reject */ }
          if (!sameOrigin) return json(response, 403, { error: 'A exportação só pode ser iniciada pelo estúdio local.' });
        }
        try {
          if (pathname === '/api/export' && request.method === 'POST') {
            if (closing) return json(response, 503, { error: 'O servidor está encerrando.' });
            if (active?.status === 'running') return json(response, 409, { error: 'Já existe uma exportação em andamento.' });
            if (!request.headers['content-type']?.includes('application/json')) return json(response, 415, { error: 'Envie application/json.' });
            const body = await readBody(request);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Requisição inválida.');
            const width = number(body.width, 1860, 320, 3840, 'Largura', true);
            const height = number(body.height, 962, 180, 2160, 'Altura', true);
            const fps = number(body.fps, 60, 1, 60, 'FPS', true);
            const duration = number(body.duration, 9.933333333, 0.05, 60, 'Duração');
            if (width % 2 || height % 2) throw new Error('A largura e a altura do MP4 devem ser pares.');
            const config = validateConfig(body.config ?? {});
            // Recheck after awaiting the request body, preventing simultaneous POSTs.
            if (active?.status === 'running') return json(response, 409, { error: 'Já existe uma exportação em andamento.' });
            const id = randomUUID();
            const dir = path.join(root, 'output/jobs', id);
            const job = { id, status: 'running', progress: 0, child: null, error: undefined, file: path.join(dir, 'ampulheta.mp4') };
            active = job;
            jobs.set(id, job);
            try {
              await mkdir(dir, { recursive: true });
              const configPath = path.join(dir, 'preset.json');
              await writeFile(configPath, JSON.stringify(config));
              const child = spawn(process.execPath, [path.join(root, 'scripts/render-frames.mjs'), '--width', String(width), '--height', String(height), '--fps', String(fps), '--duration', String(duration), '--out', dir, '--config', configPath, '--encode'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
              job.child = child;
              let log = '';
              let stdout = '';
              child.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
                const lines = stdout.split('\n');
                stdout = lines.pop() ?? '';
                for (const line of lines) {
                  const progress = line.match(/PROGRESS (\d+)\/(\d+)/);
                  if (progress) job.progress = Math.min(0.9, 0.9 * Number(progress[1]) / Number(progress[2]));
                  if (line.includes('ENCODING')) job.progress = 0.94;
                }
              });
              child.stderr.on('data', (chunk) => { log = (log + chunk.toString()).slice(-4000); });
              child.on('error', (error) => { job.status = 'failed'; job.error = `Não foi possível iniciar a exportação: ${error.message}`; });
              child.on('close', async (code) => {
                if (code === 0) {
                  try {
                    await stat(job.file);
                    job.status = 'complete';
                    job.progress = 1;
                  } catch { job.status = 'failed'; job.error = 'O processo terminou sem gerar o MP4.'; }
                } else {
                  job.status = 'failed';
                  job.error = log.trim() || job.error || `Exportação interrompida (código ${code}).`;
                }
                job.child = null;
              });
              return json(response, 202, { id });
            } catch (error) {
              job.status = 'failed';
              job.error = error.message;
              throw error;
            }
          }
          const match = pathname.match(/^\/api\/export\/([a-f0-9-]{36})(\/download)?$/);
          if (match && request.method === 'GET') {
            const job = jobs.get(match[1]);
            if (!job) return json(response, 404, { error: 'Exportação não encontrada. O servidor pode ter sido reiniciado.' });
            if (match[2]) {
              if (job.status !== 'complete') return json(response, 409, { error: 'O vídeo ainda não está pronto.' });
              const info = await stat(job.file);
              response.statusCode = 200;
              response.setHeader('Content-Type', 'video/mp4');
              response.setHeader('Content-Length', info.size);
              response.setHeader('Content-Disposition', 'attachment; filename="ampulheta.mp4"');
              response.setHeader('Cache-Control', 'no-store');
              const stream = createReadStream(job.file);
              stream.on('error', () => response.destroy());
              response.on('close', () => stream.destroy());
              stream.pipe(response);
              return;
            }
            return json(response, 200, { id: job.id, status: job.status, progress: job.progress, ...(job.error ? { error: job.error } : {}), ...(job.status === 'complete' ? { downloadUrl: `/api/export/${job.id}/download` } : {}) });
          }
          return json(response, 405, { error: 'Rota ou método não disponível.' });
        } catch (error) { return json(response, error.status ?? 400, { error: error.message }); }
      });
    },
  };
}
