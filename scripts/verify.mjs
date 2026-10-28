import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { exportApiPlugin } from './export-api.mjs';
import { args, executable, launchBrowser, root, run } from './lib.mjs';

const options = args();
let server;
let browser;
const report = { checks: [], output: null };
const check = (name) => { report.checks.push(name); console.log(`PASS ${name}`); };
try {
  server = await createServer({ root, configFile: false, logLevel: 'error', plugins: [exportApiPlugin()], server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 620, height: 320 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${url}?capture=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.ampulheta?.ready === true, undefined, { timeout: 30000 });
  const config = await page.evaluate(() => window.ampulheta.getConfig());
  assert.equal(typeof config, 'object');
  check('A API da cena fica pronta e retorna configuração.');
  const captures = [];
  for (const time of [0.25, 1.5, 0.25]) {
    captures.push(await page.evaluate(async (time) => {
      await window.ampulheta.resize(620, 320);
      await window.ampulheta.renderAt(time);
      return await window.ampulheta.capture();
    }, time));
  }
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  assert.equal(hash(captures[0]), hash(captures[2]), 'O mesmo instante deve produzir exatamente os mesmos pixels.');
  assert.notEqual(hash(captures[0]), hash(captures[1]), 'Instantes diferentes devem mostrar movimento.');
  check('Captura determinística e animação observável.');
  const bytes = Buffer.from(captures[0].split(',')[1], 'base64');
  assert.equal(bytes.readUInt32BE(16), 620);
  assert.equal(bytes.readUInt32BE(20), 320);
  check('PNG exportado na resolução solicitada.');
  const pixels = await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    let active = 0;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.max(data[i], data[i + 1], data[i + 2]);
      if (value > 10) active++;
      max = Math.max(max, value);
    }
    return { active, max, total: image.width * image.height };
  }, captures[0]);
  assert(pixels.active > 100, 'A cena deve conter pontos visíveis.');
  assert(pixels.active / pixels.total < 0.5, 'A composição deve preservar espaço preto.');
  check('A captura contém a cena pontilhada e fundo escuro.');
  assert.deepEqual(errors, [], `Erros no navegador: ${errors.join('; ')}`);
  check('Nenhuma exceção JavaScript na cena.');

  const endpoint = `${url}api/export`;
  const invalid = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ width: -1 }) });
  assert.equal(invalid.status, 400);
  const crossOrigin = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://invalid.example' }, body: '{}' });
  assert.equal(crossOrigin.status, 403);
  check('API rejeita dimensões inválidas e requisições de outra origem.');

  if (!options['skip-video']) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config, width: 620, height: 320, fps: 10, duration: 0.3 }) });
    assert.equal(response.status, 202, await response.clone().text());
    const { id } = await response.json();
    const busy = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(busy.status, 409);
    let state;
    const deadline = Date.now() + 180000;
    do {
      await new Promise((resolve) => setTimeout(resolve, 500));
      state = await (await fetch(`${endpoint}/${id}`)).json();
      if (state.status === 'failed') throw new Error(state.error);
    } while (state.status !== 'complete' && Date.now() < deadline);
    assert.equal(state.status, 'complete', 'A exportação deve terminar em até três minutos.');
    assert.equal(state.progress, 1);
    const download = await fetch(new URL(state.downloadUrl, url));
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'video/mp4');
    const videoBytes = Buffer.from(await download.arrayBuffer());
    assert(videoBytes.length > 1000);
    const videoPath = path.join(root, 'output/jobs', id, 'ampulheta.mp4');
    const probed = JSON.parse((await run(await executable('ffprobe'), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', videoPath])).stdout);
    const video = probed.streams.find((stream) => stream.codec_type === 'video');
    assert.equal(video.width, 620);
    assert.equal(video.height, 320);
    assert.equal(Number(video.nb_frames), 3);
    assert.equal(Number(video.duration), 0.3);
    const manifest = JSON.parse(await readFile(path.join(root, 'output/jobs', id, 'manifest.json'), 'utf8'));
    assert.equal(manifest.frameCount, 3);
    assert.equal(manifest.completedFrames, 3);
    check('Exportação real: três PNGs, MP4 de 0,3 s, progresso, exclusão mútua e download.');
    report.output = videoPath;
  }
  await mkdir(path.join(root, 'output/verification'), { recursive: true });
  await writeFile(path.join(root, 'output/verification/frame.png'), bytes);
  await writeFile(path.join(root, 'output/verification/report.json'), JSON.stringify(report, null, 2));
  console.log('Verificação concluída.');
} catch (error) { console.error(error.stack ?? error.message); process.exitCode = 1; }
finally { await browser?.close(); await server?.close(); }
