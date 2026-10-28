from PIL import Image
import numpy as np
for p in ['reference/first-frame.png','reference/exact-1.png','reference/exact-2.png']:
 a=np.array(Image.open(p)).astype(float);blue=np.maximum(a[:,:,2]-a[:,:,0]*.6-5,0)
 print(p)
 for x in [0,200,400,600,1200,1400,1600,1840]:
  q=blue[450:700,max(0,x-14):min(1860,x+15)].mean(axis=1); q=np.convolve(q,np.ones(7)/7,'same'); peaks=[]
  for z in np.argsort(q)[::-1]:
   if q[z]<.7:break
   if all(abs(z-y)>12 for y in peaks):peaks.append(z)
   if len(peaks)==5:break
  print(x,[(int(z+450),round(float(q[z]),1)) for z in peaks])

