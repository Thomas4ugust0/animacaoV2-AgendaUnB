uniform vec3 uColor;
uniform float uBrightness;
varying float vIntensity;
varying float vSeed;
varying float vFootprint;

void main() {
  if (vIntensity < 0.012) discard;
  float spriteRadius = length(gl_PointCoord-vec2(0.5));
  float radius = spriteRadius*vFootprint;
  float tight = 0.82*exp(-18.0*radius*radius)+0.18*exp(-4.0*radius*radius);
  float fringe = (vFootprint-1.0)*0.23*exp(-5.0*spriteRadius*spriteRadius)*(1.0-exp(-24.0*radius*radius));
  float edge = (tight+fringe)*(1.0-smoothstep(0.4,0.5,spriteRadius));
  float core = 1.0-smoothstep(0.0,0.24,radius);
  vec3 tint = mix(uColor,vec3(0.31,0.40,0.64),vSeed*0.22);
  // Values are authored in display sRGB; this material deliberately bypasses
  // lighting, tone mapping and a second output conversion.
  gl_FragColor = vec4(tint*(0.9+0.20*core),clamp(edge*vIntensity*uBrightness*1.65,0.0,1.0));
}
