uniform float uTime;
uniform float uScale;
uniform float uSandFlow;
uniform float uRibbonAmplitude;
uniform float uRibbonWidth;
uniform float uHourglass;
uniform float uRibbons;
uniform float uDotSize;
uniform float uPixelScale;
varying float vIntensity;
varying float vSeed;
varying float vFootprint;

/* MASK_FUNCTIONS */

float hash(vec2 p) { return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }

void main() {
  vec2 p = position.xy;
  vec2 local = (p-vec2(930.0,510.0))/uScale+vec2(930.0,510.0);
  float shape = hourglass(local,uTime)*uHourglass;
  float bands = ribbons(p,uTime)*uRibbons;
  vSeed = hash(p);
  float variation = 0.65+0.35*vSeed;
  vIntensity = max(shape,bands)*variation;
  vFootprint = shape > bands ? 1.55 : 1.0;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
  gl_PointSize = max(1.0,uDotSize*1.8*vFootprint*uPixelScale*(0.86+0.28*vSeed));
}
