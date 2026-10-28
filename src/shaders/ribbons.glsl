float ribbon(vec2 p, float center, float width) {
  return 1.0-smoothstep(width*0.52, width, abs(p.y-center));
}

float ribbons(vec2 p, float time) {
  float x = p.x;
  float t = time * 1.0;
  float a = uRibbonAmplitude;
  float w = uRibbonWidth;
  float u = (x-930.0)/930.0;
  float phase = 0.00472*x-0.964*t;
  float y1 = 569.0-5.5*u+a*((8.6-9.0*u)*sin(phase)+(76.6-15.4*u)*cos(phase));
  float y2 = 573.0 + a*(54.0*sin(x*0.0058+t*0.95-0.35));
  float y3 = 589.0 + a*(40.0*sin(x*0.0074-t*1.42+0.6));
  float shade1 = 0.56 + 0.24*sin(x*0.003-t*0.6);
  float shade2 = 0.26 + 0.22*sin(x*0.004+t*0.8+2.0);
  float shade3 = 0.12 + 0.12*cos(x*0.005-t+1.0);
  // Several lattice rows give the ribbons width without a solid stroke.
  float r1 = ribbon(p,y1,(7.0+3.0*sin(x*0.004+t))*w)*shade1;
  float r2 = ribbon(p,y2,10.0*w)*shade2;
  float r3 = ribbon(p,y3,7.5*w)*shade3;
  return max(r1, max(r2,r3));
}
