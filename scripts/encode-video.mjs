import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { args, executable, exists, isMain, number, root, run } from './lib.mjs';

export async function encodeVideo(options = {}) {
  const dir = path.resolve(root, String(options.input ?? options.out ?? 'output/render'));
  let manifest = {};
  if (await exists(path.join(dir, 'manifest.json'))) {
    manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
    if (manifest.status !== 'complete' || manifest.completedFrames !== manifest.frameCount) {
      throw new Error('A sequência de quadros está incompleta. Conclua a renderização antes de codificar o vídeo.');
    }
  }
  const fps = number(options.fps, manifest.fps ?? 60, 1, 120, 'FPS');
  const crf = number(options.crf, 16, 0, 35, 'CRF', true);
  const output = path.resolve(root, String(options.output ?? path.join(dir, 'ampulheta.mp4')));
  if (!await exists(path.join(dir, 'frame-000000.png'))) throw new Error(`Nenhum quadro encontrado em ${dir}. Execute npm run render primeiro.`);
  if (manifest.width && (manifest.width % 2 || manifest.height % 2)) throw new Error('O MP4 requer largura e altura pares.');
  await mkdir(path.dirname(output), { recursive: true });
  const frameCount = manifest.frameCount ? number(manifest.frameCount, 1, 1, 72000, 'Número de quadros', true) : undefined;
  const command = ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, 'frame-%06d.png')];
  if (frameCount) command.push('-frames:v', String(frameCount));
  command.push('-an', '-vf', 'scale=in_range=full:out_range=limited:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', output);
  await run(await executable('ffmpeg'), command);
  await writeFile(path.join(dir, 'encoding.json'), JSON.stringify({ output, fps, frameCount, codec: 'libx264', crf, pixelFormat: 'yuv420p', colorSpace: 'bt709', source: 'PNG sRGB', note: 'PNG é a referência sem perdas; MP4 pode alterar detalhes escuros por compressão e subamostragem de cor.' }, null, 2));
  console.log(`MP4 salvo: ${output}`);
  return output;
}

if (isMain(import.meta)) {
  const options = args();
  if (options.help) console.log('npm run encode -- --input output/render --output output/ampulheta.mp4 --fps 60 --crf 16');
  else encodeVideo(options).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
