import * as THREE from 'three';
import { DEFAULT_CONFIG, REFERENCE, sanitizeConfig, type SceneConfig } from './config';
import { createDotGrid } from './geometry/dot-grid';
import vertex from './shaders/dots.vert.glsl?raw';
import fragment from './shaders/dots.frag.glsl?raw';
import hourglass from './shaders/hourglass.glsl?raw';
import ribbons from './shaders/ribbons.glsl?raw';

function rgb(hex: string): THREE.Vector3 {
  return new THREE.Vector3(...([1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as [number,number,number]));
}

export class AmpulhetaScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0,REFERENCE.width,0,REFERENCE.height,-10,10);
  private config: SceneConfig = { ...DEFAULT_CONFIG };
  private points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:false, preserveDrawingBuffer:true, powerPreference:'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.material = new THREE.ShaderMaterial({
      vertexShader:vertex.replace('/* MASK_FUNCTIONS */',`${hourglass}\n${ribbons}`),
      fragmentShader:fragment,
      transparent:true, depthTest:false, depthWrite:false, toneMapped:false,
      uniforms:{
        uTime:{value:0}, uScale:{value:1}, uSandFlow:{value:1},
        uRibbonAmplitude:{value:1}, uRibbonWidth:{value:1},
        uHourglass:{value:1}, uRibbons:{value:1}, uDotSize:{value:2.3},
        uPixelScale:{value:1}, uColor:{value:rgb(DEFAULT_CONFIG.color)}, uBrightness:{value:1},
      },
    });
    this.points = new THREE.Points(createDotGrid(this.config.spacing),this.material);
    this.points.frustumCulled=false;
    this.scene.add(this.points);
    this.setConfig(DEFAULT_CONFIG);
    this.resize(REFERENCE.width,REFERENCE.height);
  }

  getConfig() { return {...this.config}; }
  get pointCount() { return this.points.geometry.getAttribute('position').count; }

  setConfig(partial: unknown) {
    const next = sanitizeConfig(partial,this.config);
    if(next.spacing!==this.config.spacing) {
      const old = this.points.geometry;
      this.points.geometry = createDotGrid(next.spacing);
      old.dispose();
    }
    this.config=next;
    const u=this.material.uniforms;
    u.uScale.value=next.hourglassScale;
    u.uDotSize.value=next.dotSize;
    u.uBrightness.value=next.brightness;
    u.uSandFlow.value=next.sandFlow;
    u.uRibbonAmplitude.value=next.ribbonAmplitude;
    u.uRibbonWidth.value=next.ribbonWidth;
    u.uHourglass.value=Number(next.showHourglass);
    u.uRibbons.value=Number(next.showRibbons);
    u.uColor.value=rgb(next.color);
    this.renderer.setClearColor(new THREE.Color(next.background),1);
    this.renderAt(this.time);
  }

  resize(width:number,height:number) {
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width>7680||height>4320) throw new Error('Resolução inválida.');
    const w=Math.round(width), h=Math.round(height);
    this.renderer.setSize(w,h,false);
    const scale=Math.min(w/REFERENCE.width,h/REFERENCE.height);
    const vw=Math.round(REFERENCE.width*scale), vh=Math.round(REFERENCE.height*scale);
    this.renderer.setViewport(Math.round((w-vw)/2),Math.round((h-vh)/2),vw,vh);
    this.material.uniforms.uPixelScale.value=scale;
    this.renderAt(this.time);
  }

  renderAt(time:number) {
    this.time=Number.isFinite(time)?Math.max(0,time):0;
    this.material.uniforms.uTime.value=this.time*this.config.speed;
    this.renderer.render(this.scene,this.camera);
  }

  capture() { return this.renderer.domElement.toDataURL('image/png'); }
  dispose() { this.points.geometry.dispose();this.material.dispose();this.renderer.dispose(); }
}
