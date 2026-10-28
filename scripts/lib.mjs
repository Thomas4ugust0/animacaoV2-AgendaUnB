import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

export function args(argv = process.argv.slice(2)) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error(`Argumento desconhecido: ${argv[i]}`);
    const equal = argv[i].indexOf('=');
    const key = argv[i].slice(2, equal < 0 ? undefined : equal);
    if (equal >= 0) result[key] = argv[i].slice(equal + 1);
    else result[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return result;
}

export function number(value, fallback, min, max, name, integer = false) {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`${name} deve ser ${integer ? 'inteiro ' : ''}entre ${min} e ${max}.`);
  }
  return n;
}

export async function exists(filename) {
  try { await access(filename, constants.F_OK); return true; } catch { return false; }
}

export async function executable(kind) {
  const override = process.env[kind === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'];
  if (override) return override;
  try {
    const installed = require(`${kind}-static`);
    const filename = typeof installed === 'string' ? installed : installed.path;
    if (filename && await exists(filename)) return filename;
  } catch { /* allow system binary */ }
  const fallback = path.join(root, 'analysis/tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
  if (kind === 'ffmpeg' && await exists(fallback)) return fallback;
  return kind;
}

export function run(command, argv, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { cwd: root, windowsHide: true, ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; options.onStdout?.(chunk.toString()); });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-12000); options.onStderr?.(chunk.toString()); });
    child.on('error', (error) => reject(new Error(`Não foi possível iniciar ${command}: ${error.message}`)));
    child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${path.basename(command)} terminou com código ${code}.\n${stderr}`)));
  });
}

export async function launchBrowser() {
  const { chromium } = await import('playwright');
  const errors = [];
  const base = { headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] };
  for (const channel of [process.env.BROWSER_CHANNEL, 'msedge', 'chrome', undefined].filter((value, index, all) => all.indexOf(value) === index)) {
    try { return await chromium.launch({ ...base, ...(channel ? { channel } : {}) }); }
    catch (error) { errors.push(`${channel ?? 'chromium'}: ${error.message.split('\n')[0]}`); }
  }
  throw new Error(`Nenhum navegador compatível disponível. Instale Edge/Chrome ou execute npx playwright install chromium.\n${errors.join('\n')}`);
}

export function isMain(meta) {
  return process.argv[1] && fileURLToPath(meta.url) === path.resolve(process.argv[1]);
}
