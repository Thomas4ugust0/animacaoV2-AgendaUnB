import './style.css';
import { AmpulhetaScene } from './scene';
import { DEFAULT_CONFIG, REFERENCE, sanitizeConfig, type SceneConfig } from './config';

declare global {
  interface Window {
    ampulheta: { ready: boolean; renderAt:(t:number)=>void; resize:(w:number,h:number)=>void; setConfig:(c:unknown)=>void; getConfig:()=>SceneConfig; capture:()=>string; duration:number };
  }
}

const captureMode=new URLSearchParams(location.search).has('capture');
const app=document.querySelector<HTMLDivElement>('#app')!;
const icon=(name:string)=>{
  const paths:Record<string,string>={
    play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',
    reset:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
    expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??''}</svg>`;
};

function slider(key:keyof SceneConfig,label:string,min:number,max:number,step:number,unit='') {
  const value=DEFAULT_CONFIG[key];
  return `<label class="parameter" for="${key}"><span>${label}</span><output id="${key}-value">${value}${unit}</output><input id="${key}" data-param="${key}" data-unit="${unit}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"/></label>`;
}

app.innerHTML=captureMode?'<canvas id="scene" aria-label="Ampulheta procedural"></canvas>':`
  <header class="app-header">
    <div class="identity"><svg class="mark" viewBox="0 0 24 30" fill="none" aria-hidden="true"><path d="M4 3h16M4 27h16M6 3c0 6 1 8 6 12-5 4-6 6-6 12M18 3c0 6-1 8-6 12 5 4 6 6 6 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><div><h1>Ampulheta</h1><p>Estúdio de movimento</p></div></div>
    <div class="header-actions"><span class="local-status">Projeto local</span><button id="save-preset" class="quiet">Salvar ajustes</button><button id="cinema" class="quiet" aria-label="Modo cinema">${icon('expand')}<span>Modo cinema</span></button></div>
  </header>
  <main class="workspace">
    <section class="viewer" aria-label="Prévia da composição">
      <div class="viewer-toolbar"><div class="tabs" role="group" aria-label="Visualização"><button id="scene-tab" class="active" aria-pressed="true">Composição</button><button id="compare-tab" aria-pressed="false">Comparar referência</button></div><span class="dimensions">1860 × 962 <span>·</span> 60 fps</span></div>
      <div class="stage-surround"><div class="stage" id="stage">
        <canvas id="scene" aria-label="Ampulheta azul pontilhada com faixas onduladas"></canvas>
        <div class="reference-layer" id="reference-layer" hidden><video id="reference-video" src="/reference/preview.mp4" preload="auto" muted playsinline></video><span class="comparison-label reference-label">Original</span></div>
        <div class="compare-line" id="compare-line" hidden></div><span class="comparison-label reconstruction-label" id="reconstruction-label" hidden>Reconstrução</span>
        <button id="exit-cinema" class="quiet">Sair do cinema <kbd>Esc</kbd></button>
      </div></div>
      <div class="compare-controls" id="compare-controls" hidden><label for="comparison-split">Divisão da comparação</label><input id="comparison-split" type="range" min="0" max="100" value="50"/><output id="split-value">50%</output></div>
      <div class="transport"><button id="play" class="icon-button" aria-label="Pausar">${icon('pause')}</button><button id="restart" class="icon-button" aria-label="Voltar ao início">${icon('reset')}</button><output id="time-display">00:00.00</output><input id="timeline" type="range" min="0" max="${REFERENCE.duration}" step="${1/60}" value="0" aria-label="Tempo da animação"/><span class="duration">00:09.93</span><label class="loop-control"><input id="loop" type="checkbox" checked/>Repetir</label></div>
      <div class="viewer-foot"><p>Estudo procedural a partir do vídeo original.</p><span id="point-count"></span></div>
    </section>
    <aside class="inspector" aria-label="Ajustes da composição">
      <div class="inspector-heading"><h2>Ajustes</h2><button class="text-button" id="reset">Restaurar</button></div>
      <details open><summary>Pontos e cor</summary><div class="settings-group">
        ${slider('brightness','Luminosidade',.2,4,.05,'×')}
        ${slider('dotSize','Tamanho do ponto',.8,5,.1,' px')}
        ${slider('spacing','Espaçamento',4,14,.5,' px')}
        <div class="color-row"><label for="color">Cor dos pontos</label><div><output id="color-value">#36549c</output><input id="color" type="color" value="#36549c" aria-label="Cor dos pontos"/></div></div>
        <div class="color-row"><label for="background">Fundo</label><div><output id="background-value">#000102</output><input id="background" type="color" value="#000102" aria-label="Cor do fundo"/></div></div>
      </div></details>
      <details open><summary>Forma e movimento</summary><div class="settings-group">
        ${slider('hourglassScale','Escala da ampulheta',.6,1.4,.01,'×')}
        ${slider('ribbonAmplitude','Ondulação das faixas',0,2,.05,'×')}
        ${slider('ribbonWidth','Largura das faixas',.25,3,.05,'×')}
        ${slider('speed','Velocidade',0,2,.05,'×')}
        ${slider('sandFlow','Fluxo de areia',0,2,.05,'×')}
        <div class="layer-toggles"><label><input id="showHourglass" type="checkbox" checked/>Ampulheta</label><label><input id="showRibbons" type="checkbox" checked/>Faixas</label></div>
      </div></details>
      <details class="export-settings" open><summary>Exportar</summary><div class="settings-group">
        <label class="select-label" for="resolution">Resolução<select id="resolution"><option value="1860,962">Original · 1860 × 962</option><option value="1280,662">Compacta · 1280 × 662</option><option value="1920,994">Ampliada · 1920 × 994</option></select></label>
        <div class="export-row"><label class="select-label" for="fps">Quadros / segundo<select id="fps"><option value="60">60 fps</option><option value="30">30 fps</option><option value="24">24 fps</option></select></label><label class="select-label" for="export-duration">Duração (s)<input id="export-duration" type="number" min="0.1" max="60" step="0.01" value="9.93"/></label></div>
        <button class="primary-button" id="export-mp4">${icon('download')}Exportar MP4</button><button class="secondary-button" id="save-png">${icon('image')}Salvar quadro PNG</button>
        <div id="export-progress" hidden><progress id="progress-bar" max="1" value="0"></progress><p id="progress-label" role="status">Preparando exportação…</p><a id="download-video" hidden>Baixar MP4</a></div>
        <p class="export-note">O vídeo exporta apenas a composição, desde o início e com os ajustes atuais.</p>
      </div></details>
      <button id="load-preset" class="text-button import-button">Importar ajustes de um arquivo</button><input id="preset-file" type="file" accept=".json,application/json" hidden/>
    </aside>
  </main><div id="notice" class="notice" role="status" hidden></div>`;

if(captureMode) document.body.classList.add('capture-mode');
const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
let scene:AmpulhetaScene;
try { scene=new AmpulhetaScene(canvas); }
catch(error) {
  app.innerHTML='<div class="fatal"><h1>Não foi possível iniciar a prévia.</h1><p>Este projeto precisa de WebGL2. Ative a aceleração de hardware no navegador e recarregue a página.</p></div>';
  throw error;
}

let time=0;
let playing=!captureMode&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
let comparing=false;
let lastTick=performance.now();
let lastReferenceSeek=0;
const get=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const formatTime=(t:number)=>`00:${Math.floor(t).toString().padStart(2,'0')}.${Math.floor((t%1)*100).toString().padStart(2,'0')}`;

function notify(message:string) {
  if(captureMode) return;
  const el=get('notice');el.textContent=message;el.hidden=false;
  window.clearTimeout(Number(el.dataset.timer));
  el.dataset.timer=String(window.setTimeout(()=>el.hidden=true,6000));
}

function syncControls() {
  if(captureMode) return;
  const config=scene.getConfig();
  document.querySelectorAll<HTMLInputElement>('[data-param]').forEach(input=>{
    const key=input.dataset.param as keyof SceneConfig;
    input.value=String(config[key]);get(`${key}-value`).textContent=`${Number(config[key]).toFixed(input.step==='.01'?2:2).replace(/\.?0+$/,'')}${input.dataset.unit}`;
  });
  for(const key of ['color','background'] as const) {get<HTMLInputElement>(key).value=config[key];get(`${key}-value`).textContent=config[key];}
  for(const key of ['showHourglass','showRibbons'] as const) get<HTMLInputElement>(key).checked=config[key];
  get('point-count').textContent=`${scene.pointCount.toLocaleString('pt-BR')} pontos · WebGL2`;
}

function syncTime(forceReference=false) {
  if(captureMode) return;
  get<HTMLOutputElement>('time-display').value=formatTime(time);
  get<HTMLInputElement>('timeline').value=String(time);
  if(comparing&&(forceReference||performance.now()-lastReferenceSeek>130)) {
    const video=get<HTMLVideoElement>('reference-video');
    if(video.readyState>=1&&!video.seeking) video.currentTime=Math.min(time,video.duration||time);
    lastReferenceSeek=performance.now();
  }
}

function setPlaying(value:boolean) {
  playing=value;lastTick=performance.now();
  if(captureMode)return;
  get('play').innerHTML=icon(playing?'pause':'play');get('play').setAttribute('aria-label',playing?'Pausar':'Reproduzir');
}

function download(url:string,name:string) {const a=document.createElement('a');a.href=url;a.download=name;a.click();}

window.ampulheta={
  ready:true,
  renderAt:(t)=>{time=Math.max(0,Number.isFinite(t)?t:0);scene.renderAt(time);syncTime(true);},
  resize:(w,h)=>scene.resize(w,h),
  setConfig:(c)=>{scene.setConfig(c);syncControls();},
  getConfig:()=>scene.getConfig(),capture:()=>scene.capture(),duration:REFERENCE.duration,
};

if(!captureMode) {
  syncControls();setPlaying(playing);
  get('play').addEventListener('click',()=>{if(time>=REFERENCE.duration)time=0;setPlaying(!playing);});
  get('restart').addEventListener('click',()=>{time=0;scene.renderAt(time);syncTime(true);});
  get('timeline').addEventListener('input',event=>{setPlaying(false);time=Number((event.target as HTMLInputElement).value);scene.renderAt(time);syncTime(true);});
  document.querySelectorAll<HTMLInputElement>('[data-param]').forEach(input=>input.addEventListener('input',()=>{scene.setConfig({[input.dataset.param!]:Number(input.value)});syncControls();}));
  for(const key of ['color','background'] as const)get(key).addEventListener('input',()=>{scene.setConfig({[key]:get<HTMLInputElement>(key).value});syncControls();});
  for(const key of ['showHourglass','showRibbons'] as const)get(key).addEventListener('change',()=>scene.setConfig({[key]:get<HTMLInputElement>(key).checked}));
  get('reset').addEventListener('click',()=>{scene.setConfig(DEFAULT_CONFIG);syncControls();notify('Ajustes originais restaurados.');});
  const setComparison=(value:boolean)=>{
    comparing=value;
    for(const id of ['reference-layer','compare-line','reconstruction-label','compare-controls'])get(id).hidden=!value;
    for(const [id,active] of [['scene-tab',!value],['compare-tab',value]] as const){get(id).classList.toggle('active',active);get(id).setAttribute('aria-pressed',String(active));}
    syncTime(true);
  };
  get('compare-tab').addEventListener('click',()=>setComparison(true));get('scene-tab').addEventListener('click',()=>setComparison(false));
  get('comparison-split').addEventListener('input',()=>{
    const split=Number(get<HTMLInputElement>('comparison-split').value);
    get('reference-layer').style.clipPath=`inset(0 ${100-split}% 0 0)`;get('compare-line').style.left=`${split}%`;get('split-value').textContent=`${split}%`;
  });
  get('reference-video').addEventListener('error',()=>notify('Não foi possível reproduzir a referência. Verifique public/reference/preview.mp4; consulte a preparação da referência no README.'));
  get('reference-video').addEventListener('loadedmetadata',()=>syncTime(true));
  get('reference-video').addEventListener('seeked',()=>{const video=get<HTMLVideoElement>('reference-video');if(comparing&&Math.abs(video.currentTime-time)>1/30)syncTime(true);});
  get('cinema').addEventListener('click',()=>document.body.classList.add('cinema-mode'));
  get('exit-cinema').addEventListener('click',()=>document.body.classList.remove('cinema-mode'));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')document.body.classList.remove('cinema-mode');
    if(event.code==='Space'&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLSelectElement)&&!(event.target instanceof HTMLButtonElement)){event.preventDefault();setPlaying(!playing);}
  });
  get('save-preset').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({version:1,config:scene.getConfig()},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);download(url,'ampulheta-ajustes.json');setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Arquivo de ajustes salvo.');
  });
  get('load-preset').addEventListener('click',()=>get<HTMLInputElement>('preset-file').click());
  get('preset-file').addEventListener('change',async()=>{
    const input=get<HTMLInputElement>('preset-file');const file=input.files?.[0];if(!file)return;
    try {
      if(file.size>32768)throw new Error('O arquivo deve ter até 32 KB.');
      const parsed=JSON.parse(await file.text());const config=parsed.config??parsed;
      if(!config||typeof config!=='object'||Array.isArray(config)||!Object.keys(DEFAULT_CONFIG).some(k=>k in config))throw new Error('O arquivo não contém ajustes da ampulheta.');
      scene.setConfig(sanitizeConfig(config));syncControls();notify('Ajustes importados.');
    } catch(error){notify(error instanceof Error?error.message:'Não foi possível ler o arquivo.');}
    input.value='';
  });
  get('save-png').addEventListener('click',()=>{
    const [w,h]=get<HTMLSelectElement>('resolution').value.split(',').map(Number);
    scene.resize(w,h);download(scene.capture(),`ampulheta-${time.toFixed(2)}s.png`);scene.resize(REFERENCE.width,REFERENCE.height);notify('Quadro PNG salvo na resolução selecionada.');
  });
  let exporting=false;
  get('export-mp4').addEventListener('click',async()=>{
    if(exporting)return;
    const duration=Number(get<HTMLInputElement>('export-duration').value);
    if(!Number.isFinite(duration)||duration<0.1||duration>60){notify('Escolha uma duração entre 0,1 e 60 segundos.');return;}
    const [width,height]=get<HTMLSelectElement>('resolution').value.split(',').map(Number);
    const button=get<HTMLButtonElement>('export-mp4');exporting=true;button.disabled=true;
    setPlaying(false);get('export-progress').hidden=false;get('download-video').hidden=true;
    get<HTMLProgressElement>('progress-bar').value=0;get('progress-label').textContent='Preparando exportação…';
    try {
      const response=await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({config:scene.getConfig(),width,height,fps:Number(get<HTMLSelectElement>('fps').value),duration})});
      if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('A exportação MP4 precisa do servidor local. Inicie com npm run dev.');
      const job=await response.json();if(!response.ok)throw new Error(job.error??'Não foi possível iniciar a exportação.');
      let finished=false;
      const start=performance.now();
      while(!finished) {
        await new Promise(resolve=>setTimeout(resolve,1000));
        const result=await fetch(`/api/export/${job.id}`);if(!result.ok)throw new Error('Não foi possível consultar a exportação.');
        const status=await result.json();
        get<HTMLProgressElement>('progress-bar').value=status.progress??0;
        get('progress-label').textContent=`Renderizando · ${Math.round((status.progress??0)*100)}%`;
        if(status.status==='failed')throw new Error(status.error??'A exportação falhou. Tente uma resolução menor.');
        if(status.status==='complete') {
          finished=true;get<HTMLProgressElement>('progress-bar').value=1;get('progress-label').textContent='MP4 pronto para baixar.';
          const link=get<HTMLAnchorElement>('download-video');link.href=status.downloadUrl;link.download='ampulheta.mp4';link.hidden=false;notify('Exportação concluída. O MP4 está pronto para baixar.');
        }
        if(performance.now()-start>30*60*1000)throw new Error('A exportação demorou mais que o esperado. Consulte output/jobs antes de tentar novamente.');
      }
    } catch(error) {const message=error instanceof Error?error.message:'Erro ao exportar.';get('progress-label').textContent=message;notify(message);}
    finally {exporting=false;button.disabled=false;}
  });
  function frame(now:number) {
    const delta=Math.min((now-lastTick)/1000,.1);lastTick=now;
    if(playing) {
      time+=delta;
      if(time>=REFERENCE.duration){if(get<HTMLInputElement>('loop').checked)time%=REFERENCE.duration;else {time=REFERENCE.duration;setPlaying(false);}}
      scene.renderAt(time);syncTime();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('beforeunload',()=>scene.dispose());

