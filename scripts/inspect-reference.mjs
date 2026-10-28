import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { args, executable, exists, root, run } from './lib.mjs';

const options = args();
if (options.help) {
  console.log('npm run inspect -- --input "caminho/video.mp4" --out output/reference');
} else {
  try {
    const input = path.resolve(String(options.input ?? 'C:/Users/Thomas/Downloads/ampulheta_minimalista.mp4'));
    const out = path.resolve(root, String(options.out ?? 'output/reference'));
    if (!await exists(input)) throw new Error(`Vídeo não encontrado: ${input}`);
    await mkdir(out, { recursive: true });
    const probe = await run(await executable('ffprobe'), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', input]);
    const raw = JSON.parse(probe.stdout);
    const video = raw.streams.find((stream) => stream.codec_type === 'video');
    if (!video) throw new Error('O arquivo não contém uma faixa de vídeo.');
    const [numerator, denominator] = video.avg_frame_rate.split('/').map(Number);
    const fps = denominator ? numerator / denominator : 0;
    const duration = Number(video.duration ?? raw.format.duration);
    if (!(duration > 0 && fps > 0)) throw new Error('Não foi possível determinar a duração e a taxa de quadros.');
    const times = [0, 0.2, 0.4, 0.6, 0.8, 1].map((fraction) => fraction * Math.max(0, duration - 1 / fps));
    const metadata = {
      input, width: video.width, height: video.height, fps, fpsRational: video.avg_frame_rate,
      duration, codec: video.codec_name, pixelFormat: video.pix_fmt,
      colorSpace: video.color_space ?? null, colorTransfer: video.color_transfer ?? null,
      audio: raw.streams.some((stream) => stream.codec_type === 'audio'),
      frameCount: Number(video.nb_frames) || null,
      frames: times.map((time, index) => ({ time, file: `reference-${String(index).padStart(2, '0')}.png` })),
    };
    const ffmpeg = await executable('ffmpeg');
    for (const frame of metadata.frames) {
      await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', frame.time.toFixed(6), '-i', input, '-frames:v', '1', path.join(out, frame.file)]);
    }
    await writeFile(path.join(out, 'metadata.json'), JSON.stringify(metadata, null, 2));
    console.log(JSON.stringify(metadata, null, 2));
    console.log(`Referências salvas em ${out}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
