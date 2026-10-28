from pathlib import Path
from PIL import Image
import numpy as np,json
ps=['reference/first-frame.png','reference/exact-1.png','reference/exact-2.png']; samples=[]
for t,p in enumerate(ps):
 a=np.array(Image.open(p)).astype(float);blue=np.maximum(a[:,:,2]-a[:,:,0]*.6-5,0)
 for x in [0,200,400,600,1200,1400,1600,1840]:
  q=blue[450:700,max(0,x-14):min(1860,x+15)].mean(axis=1); q=np.convolve(q,np.ones(7)/7,'same');peaks=[]
  for z in np.argsort(q)[::-1]:
   if q[z]<2:break
   if all(abs(z-y)>12 for y in peaks):peaks.append(z)
   if len(peaks)==3:break
  samples.append({'time':t,'x':x,'peaks':[{'y':int(z+450),'strength':round(float(q[z]),2)} for z in peaks]})
Path('reference/ribbon-samples.json').write_text(json.dumps({'description':'Measured intensity peaks; unlabeled peaks, not persistent trajectory IDs. Hourglass center excluded.','samples':samples},indent=2),encoding='utf-8')
p=Path('reference/reference-analysis.json');d=json.loads(p.read_text());d['ribbons']['approximateMainFit']={'formula':'u=(x-930)/930; a=0.00472*x-0.964*t; y=569-5.5*u+(8.6-9*u)*sin(a)+(76.6-15.4*u)*cos(a)','rmsErrorPixels':13,'wavelengthPixels':1332,'phaseVelocityPixelsPerSecond':204,'status':'approximate fit to manual samples, not exact motion extraction'};d['hourglass']['highlightRegions']=[{'name':'upper left corner','bounds':[785,216,825,238]},{'name':'upper right corner','bounds':[1045,216,1085,238]},{'name':'upper left side','bounds':[808,257,842,334]},{'name':'upper right side','bounds':[1018,269,1055,355]},{'name':'lower left side','bounds':[812,625,852,710]},{'name':'lower right side','bounds':[1026,647,1057,739]},{'name':'lower left corner','bounds':[770,774,799,805]},{'name':'lower right corner','bounds':[1068,774,1090,805]}];p.write_text(json.dumps(d,indent=2),encoding='utf-8');Path('public/reference/metadata.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
