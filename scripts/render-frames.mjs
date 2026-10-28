import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { args, isMain, launchBrowser, number, root } from './lib.mjs';
import { encodeVideo } from './encode-video.mjs';

export async function renderFrames(options = {}) {
  const width = number(options.width, 1860, 64, 7680, 'Largura', true);
  const height = number(options.height, 962, 64, 4320, 'Altura', true);
  const fps = number(options.fps, 60, 1, 120, 'FPS');
  const duration = number(options.duration, 9.933333333, 0.001, 600, 'Duração');
  const start = number(options.start, 0, 0, 36000, 'Tempo inicial');
  const frameCount = number(options.frames, Math.ceil(duration * fps - 1e-6), 1, 72000, 'Número de quadros', true);
  if (options.encode && (width % 2 || height % 2)) throw new Error('A exportação MP4 requer dimensões pares.');
  const out = path.resolve(root, String(options.out ?? 'output/render'));
  const inputConfig = options.config ? JSON.parse(await readFile(path.resolve(String(options.config)), 'utf8')) : undefined;
  const config = inputConfig?.config ?? inputConfig;
  if (config && (typeof config !== 'object' || Array.isArray(config))) throw new Error('O arquivo de configuração deve conter um objeto JSON.');
  await mkdir(out, { recursive: true });
  let server;
  let browser;
  let manifest;
  try {
    let url = options.url ? String(options.url) : undefined;
    if (!url) {
      const { createServer } = await import('vite');
      server = await createServer({ root, configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
      await server.listen();
      url = server.resolvedUrls.local[0];
    }
    const target = new URL(url);
    target.searchParams.set('capture', '1');
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(target.href, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForFunction(() => window.ampulheta?.ready === true, undefined, { timeout: 30000 }).catch(() => {
      throw new Error(`Renderizador não ficou pronto. ${errors.join('; ') || 'Verifique o suporte a WebGL2 e os erros no navegador.'}`);
    });
    await page.evaluate(async ({ width, height, config }) => {
      if (config) await window.ampulheta.setConfig(config);
      await window.ampulheta.resize(width, height);
    }, { width, height, config });
    const effectiveConfig = await page.evaluate(() => window.ampulheta.getConfig());
    manifest = { version: 1, width, height, fps, duration: frameCount / fps, requestedDuration: duration, start, frameCount, completedFrames: 0, config: effectiveConfig, status: 'rendering', sequence: 'frame-%06d.png' };
    await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`Renderizando ${frameCount} quadros • ${width} × ${height} • ${fps} FPS`);
    const progressStep = Math.max(1, Math.floor(frameCount / 20));
    for (let index = 0; index < frameCount; index++) {
      const time = start + index / fps;
      const data = await page.evaluate(async (time) => {
        await window.ampulheta.renderAt(time);
        return await window.ampulheta.capture();
      }, time);
      if (typeof data !== 'string' || !data.startsWith('data:image/png;base64,')) throw new Error('capture() deve retornar PNG como data URL.');
      await writeFile(path.join(out, `frame-${String(index).padStart(6, '0')}.png`), Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
      manifest.completedFrames = index + 1;
      if (index % progressStep === 0 || index + 1 === frameCount) console.log(`PROGRESS ${index + 1}/${frameCount}`);
    }
    if (errors.length) throw new Error(`Erros na cena: ${errors.join('; ')}`);
    manifest.status = 'complete';
    await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  } catch (error) {
    if (manifest) {
      manifest.status = 'failed';
      manifest.error = error.message;
      await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }
    throw error;
  } finally {
    await browser?.close();
    await server?.close();
  }
  console.log(`PNG salvos: ${out}`);
  if (options.encode) {
    console.log('ENCODING');
    await encodeVideo({ input: out, fps, output: options.output, crf: options.crf });
  }
  return manifest;
}

if (isMain(import.meta)) {
  const options = args();
  if (options.help) console.log('npm run render -- --width 1860 --height 962 --fps 60 --duration 9.933333333 --out output/render [--config preset.json] [--frames 6] [--start 0] [--encode]');
  else renderFrames(options).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
