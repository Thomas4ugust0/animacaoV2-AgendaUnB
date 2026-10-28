float ellipse(vec2 p, vec2 center, vec2 radius) {
  return 1.0 - smoothstep(0.78, 1.06, length((p-center)/radius));
}

// Cubic Hermite sections traced from the user's outlined silhouette.
// Radius and tangent agree at joins: rounded bowls flow into an open neck.
float profileSegment(float y, float y0, float y1, float r0, float r1, float m0, float m1) {
  float t=clamp((y-y0)/(y1-y0),0.0,1.0);
  float t2=t*t, t3=t2*t;
  return (2.0*t3-3.0*t2+1.0)*r0+(t3-2.0*t2+t)*(y1-y0)*m0
       +(-2.0*t3+3.0*t2)*r1+(t3-t2)*(y1-y0)*m1;
}
float bodyRadius(float y) {
  if(y<320.0)return profileSegment(y,270.0,320.0,123.0,126.0,0.12,0.0);
  if(y<397.0)return profileSegment(y,320.0,397.0,126.0,99.0,0.0,-0.65);
  if(y<478.0)return profileSegment(y,397.0,478.0,99.0,35.0,-0.65,-0.55);
  if(y<512.0)return profileSegment(y,478.0,512.0,35.0,27.0,-0.55,0.0);
  if(y<560.0)return profileSegment(y,512.0,560.0,27.0,53.0,0.0,0.90);
  if(y<651.0)return profileSegment(y,560.0,651.0,53.0,116.0,0.90,0.43);
  return profileSegment(y,651.0,754.0,116.0,135.0,0.43,0.0);
}
float bodyMask(vec2 p) {
  return (1.0-smoothstep(bodyRadius(p.y)-1.0,bodyRadius(p.y)+1.0,abs(p.x-930.0)))
    *smoothstep(267.0,272.0,p.y)*(1.0-smoothstep(752.0,757.0,p.y));
}
float hourglass(vec2 p,float time) {
  float dx=p.x-930.0, ax=abs(dx), y=p.y;
  float radius=bodyRadius(y);
  float body=bodyMask(p);
  float shade=0.0;

  // Faint dotted silhouette, never the white annotation used to trace it.
  float wall=exp(-pow((ax-radius)/3.5,2.0));
  shade+=wall*smoothstep(269.0,278.0,y)*(1.0-smoothstep(748.0,757.0,y))
    *(0.10+0.06*sin(y*0.023+dx*0.01));

  // Wide curved lips, with bowed upper surfaces and rounded ends.
  float capX=ax/158.0;
  float topUpper=216.0+10.0*capX*capX;
  float topLower=251.0+19.0*pow(ax/124.0,2.0);
  float topSide=1.0-smoothstep(148.0,159.0,ax);
  float top=smoothstep(topUpper-1.0,topUpper+2.0,y)*(1.0-smoothstep(topLower-2.0,topLower+1.0,y))*topSide;
  float topLines=exp(-pow((y-topUpper)/3.0,2.0))+0.65*exp(-pow((y-topLower)/3.0,2.0));
  shade+=top*(0.025+0.12*topLines);
  shade+=ellipse(p,vec2(787.0,244.0),vec2(13.0,18.0))*0.15;
  shade+=ellipse(p,vec2(1073.0,244.0),vec2(13.0,18.0))*0.15;
  shade+=ellipse(p,vec2(807.0,227.0),vec2(25.0,10.0))*0.52;
  shade+=ellipse(p,vec2(1060.0,230.0),vec2(23.0,11.0))*0.36;

  float bottomUpper=755.0+15.0*pow(ax/135.0,2.0);
  float bottomLower=805.0-10.0*capX*capX;
  float bottom=smoothstep(bottomUpper-2.0,bottomUpper+2.0,y)*(1.0-smoothstep(bottomLower-2.0,bottomLower+2.0,y))*topSide;
  float bottomLines=exp(-pow((y-bottomLower)/3.0,2.0))+0.6*exp(-pow((y-bottomUpper)/3.0,2.0));
  shade+=bottom*(0.025+0.14*bottomLines);
  shade+=ellipse(p,vec2(782.0,787.0),vec2(12.0,15.0))*0.22;
  shade+=ellipse(p,vec2(1078.0,787.0),vec2(12.0,15.0))*0.25;

  // Broken reflections follow the curved walls rather than floating ellipses.
  float inset=radius-12.0;
  float sideLeft=exp(-pow((dx+inset)/12.0,2.0));
  float sideRight=exp(-pow((dx-inset)/10.5,2.0));
  float upperLeft=exp(-pow((y-296.0)/38.0,4.0));
  float upperRight=exp(-pow((y-313.0)/42.0,4.0));
  float lowerLeft=exp(-pow((y-674.0)/42.0,4.0));
  float lowerRight=exp(-pow((y-699.0)/46.0,4.0));
  shade+=body*(sideLeft*(0.62*upperLeft+0.56*lowerLeft)+sideRight*(0.48*upperRight+0.43*lowerRight));

  float elapsed=clamp(time/9.933333,0.0,1.0);
  float level=365.0+33.0*elapsed*uSandFlow;
  float innerRadius=max(3.0,radius-6.0);
  float inside=1.0-smoothstep(innerRadius-1.0,innerRadius+2.0,ax);
  float sand=smoothstep(level-2.0,level+2.0,y)*(1.0-smoothstep(504.0,523.0,y))*inside;
  float edge=smoothstep(0.22,0.97,ax/innerRadius);
  shade+=sand*(mix(0.18,0.78,edge)+0.15*exp(-pow((y-level)/15.0,2.0)));
  shade+=exp(-pow((y-level)/2.8,2.0))*inside*0.26;

  float pileTop=706.0-elapsed*13.0*uSandFlow;
  float pileEdge=pileTop+0.40*sqrt(dx*dx+32.0)+2.0*sin(dx*0.055);
  float pile=smoothstep(pileEdge-2.0,pileEdge+2.0,y)*(1.0-smoothstep(769.0,778.0,y));
  pile*=1.0-smoothstep(122.0,134.0,ax);
  shade+=pile*(0.59+0.12*cos(dx*0.018));

  float stream=(1.0-smoothstep(1.5,5.3,abs(dx-3.0)))*smoothstep(509.0,528.0,y)*(1.0-smoothstep(pileTop-4.0,pileTop+4.0,y));
  shade+=stream*(0.22+0.28*(0.5+0.5*sin(y*0.16-time*13.0)))*step(0.001,uSandFlow);
  return shade;
}
