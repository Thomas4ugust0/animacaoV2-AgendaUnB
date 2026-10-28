import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { args, executable, exists, root, run } from './lib.mjs';

const options=args();
try {
  const input=path.resolve(String(options.input??path.join(root,'reference/original.mp4')));
  if(!await exists(input))throw new Error('Vídeo original não encontrado. Informe --input caminho/video.mp4.');
  const out=path.join(root,'public/reference');await mkdir(out,{recursive:true});
  const ffmpeg=await executable('ffmpeg');
  await run(ffmpeg,['-hide_banner','-loglevel','error','-i',input,'-c:v','libx264','-preset','medium','-crf','10','-pix_fmt','yuv420p','-an','-movflags','+faststart','-y',path.join(out,'preview.mp4')]);
  await run(ffmpeg,['-hide_banner','-loglevel','error','-i',input,'-frames:v','1','-y',path.join(out,'reference.png')]);
  const destination=path.join(root,'reference/original.mp4');
  if(path.resolve(input)!==path.resolve(destination)){await mkdir(path.dirname(destination),{recursive:true});await copyFile(input,destination);}
  console.log('Referência H.264 e quadro inicial preparados em public/reference/. A cena procedural não usa estes arquivos.');
}catch(error){console.error(error.message);process.exitCode=1;}
