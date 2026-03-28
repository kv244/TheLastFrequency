// canvas.js — The Last Frequency
// Canvas globals, draw functions, renderLoop

const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
let W,H;
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
window.addEventListener('resize',resize);resize();

function fl(t,s=7.1){return .88+.07*Math.sin(t*s)+.04*Math.sin(t*13.3)+.02*Math.sin(t*29);}
function rng(s){let x=Math.sin(s+1)*43758.5453;return x-Math.floor(x);}
function grain(a){const id=ctx.getImageData(0,0,W,H),d=id.data;for(let i=0;i<d.length;i+=4){const g=(Math.random()-.5)*52*a;d[i]=Math.max(0,Math.min(255,d[i]+g));d[i+1]=d[i];d[i+2]=d[i];}ctx.putImageData(id,0,0);}
const photoCache={};
function getPhoto(k){if(photoCache[k])return photoCache[k];const i=new Image();i.src=IMAGES[k];photoCache[k]=i;return i;}
const KB=[{x:-.02,y:-.01,sc:1.08},{x:.01,y:.01,sc:1.0},{x:.0,y:-.01,sc:1.06},{x:.02,y:.0,sc:1.04},{x:-.01,y:.02,sc:1.05},{x:.02,y:-.02,sc:1.07}];
let kbIdx=0,kbStart=null,kbFrom={},kbTo={};
function startKB(){kbStart=null;kbFrom={...KB[kbIdx%KB.length]};kbTo={...KB[(kbIdx+1)%KB.length]};kbIdx++;}
function drawPhoto(key,ts){
  const img=getPhoto(key);if(!img.complete||!img.naturalWidth){ctx.fillStyle='#050403';ctx.fillRect(0,0,W,H);return;}
  if(!kbStart)kbStart=ts;
  const p=Math.min(1,(ts-kbStart)/16000),e=p<.5?2*p*p:-1+(4-2*p)*p;
  const sc=kbFrom.sc+(kbTo.sc-kbFrom.sc)*e,ox=kbFrom.x+(kbTo.x-kbFrom.x)*e,oy=kbFrom.y+(kbTo.y-kbFrom.y)*e;
  ctx.filter='grayscale(15%) contrast(1.1) brightness(0.72)';
  ctx.drawImage(img,(W-W*sc)/2+ox*W,(H-H*sc)/2+oy*H,W*sc,H*sc);ctx.filter='none';
}
const SS=[[.52,.30],[.48,.38],[.55,.42],[.44,.44],[.60,.48],[.50,.52],[.57,.56],[.43,.58],[.53,.62],[.47,.67],[.62,.35],[.58,.28],[.40,.50],[.65,.60],[.38,.40]];
const SL=[[0,1],[1,2],[1,3],[2,4],[3,5],[4,6],[5,6],[5,7],[6,8],[7,9],[0,10],[10,11],[3,12],[4,13],[7,14]];
function drawTrapdoor(t){ctx.fillStyle='#0d0b08';ctx.fillRect(0,0,W,H);const cx=W*.5,cy=H*.48,f=fl(t),pw=W/11;const gr=ctx.createRadialGradient(cx,cy-60,0,cx,cy,W*.55);gr.addColorStop(0,`rgba(180,120,40,${.18*f})`);gr.addColorStop(.4,`rgba(120,70,20,${.1*f})`);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);for(let i=0;i<=11;i++){const x=i*pw,sh=18+(i%2)*8;ctx.fillStyle=`rgb(${sh},${sh-2},${sh-4})`;ctx.fillRect(x,H*.35,pw-1,H*.65);}const tw=Math.min(W,H)*.22,tx=cx-tw/2,ty=cy-tw*.3;const ag=ctx.createRadialGradient(cx,cy+tw*.8,0,cx,cy+tw*.8,tw*1.2);ag.addColorStop(0,'rgba(30,15,5,1)');ag.addColorStop(1,'rgba(0,0,0,1)');ctx.fillStyle=ag;ctx.fillRect(tx,ty+tw*.1,tw,tw*1.4);ctx.save();ctx.translate(cx,ty);ctx.transform(1,0,0,.35,0,0);ctx.fillStyle='#1a1208';ctx.strokeStyle='#3a2a10';ctx.lineWidth=2;ctx.fillRect(-tw/2,-tw*.6,tw,tw);ctx.strokeRect(-tw/2,-tw*.6,tw,tw);ctx.strokeStyle=`rgba(140,60,20,${.7*f})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-tw*.1,tw*.14,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-tw*.14,-tw*.1);ctx.lineTo(tw*.14,-tw*.1);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-tw*.24);ctx.lineTo(0,tw*.04);ctx.stroke();ctx.restore();for(let s=0;s<5;s++){ctx.fillStyle=`rgba(60,35,10,${(.35-s*.06)*f})`;ctx.fillRect(cx-tw*.32+s*4,ty+tw*.1+s*14,tw*.64-s*8,4);}const bg=ctx.createRadialGradient(cx,ty+tw*.8,0,cx,ty+tw*.8,tw*.7);bg.addColorStop(0,`rgba(200,130,30,${.25*f})`);bg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);}
function drawStaircase(t){ctx.fillStyle='#060504';ctx.fillRect(0,0,W,H);const cx=W*.5,f=fl(t),steps=14,vpY=H*.15,bw=W*.55,sh=(H-vpY)/(steps+3);for(let s=steps;s>=0;s--){const p=s/steps,y=vpY+s*sh+sh,w=bw*(1-p*.75),x=cx-w/2,br=12+p*35*f,wm=p*15;ctx.fillStyle=`rgb(${(br+wm)|0},${br|0},${Math.max(0,br-5)|0})`;ctx.fillRect(x,y,w,sh*.55);ctx.fillStyle=`rgb(${(br*.4)|0},${(br*.35)|0},${(br*.3)|0})`;ctx.fillRect(x+2,y+sh*.55,w-4,sh*.45);}const bg=ctx.createRadialGradient(cx,H,0,cx,H,W*.4);bg.addColorStop(0,`rgba(180,100,20,${.4*f})`);bg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);const tg=ctx.createLinearGradient(0,0,0,vpY+sh*2);tg.addColorStop(0,'rgba(0,0,0,0.95)');tg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=tg;ctx.fillRect(0,0,W,H);}
function drawChamber(t){ctx.fillStyle='#070605';ctx.fillRect(0,0,W,H);const cx=W*.5,cy=H*.45,f=fl(t);const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,W*.5);gr.addColorStop(0,`rgba(160,90,20,${.35*f})`);gr.addColorStop(.35,`rgba(80,40,10,${.18*f})`);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);const syms=[(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();},(x,y,r)=>{for(let i=0;i<5;i++){const a1=i*4*Math.PI/5-Math.PI/2,a2=(i+2)*4*Math.PI/5-Math.PI/2;ctx.beginPath();ctx.moveTo(x+r*Math.cos(a1),y+r*Math.sin(a1));ctx.lineTo(x+r*Math.cos(a2),y+r*Math.sin(a2));ctx.stroke();}},(x,y,r)=>{ctx.beginPath();ctx.moveTo(x-r,y);ctx.quadraticCurveTo(x,y-r*.8,x+r,y);ctx.quadraticCurveTo(x,y+r*.8,x-r,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*.25,0,Math.PI*2);ctx.fill();},(x,y,r)=>{ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.86,y+r*.5);ctx.lineTo(x-r*.86,y+r*.5);ctx.closePath();ctx.stroke();}];[[W*.15,H*.2],[W*.22,H*.45],[W*.18,H*.68],[W*.82,H*.25],[W*.78,H*.5],[W*.85,H*.72],[W*.35,H*.12],[W*.65,H*.15],[W*.5,H*.08],[W*.28,H*.82],[W*.72,H*.78],[W*.5,H*.85],[W*.12,H*.35],[W*.88,H*.6],[W*.42,H*.22]].forEach(([px,py],i)=>{const a=(0.15+.1*Math.sin(t*.3+i))*f;ctx.strokeStyle=`rgba(110,60,18,${a})`;ctx.fillStyle=`rgba(110,60,18,${a})`;ctx.lineWidth=.7+(i%3)*.3;syms[i%syms.length](px,py,10+(i%4)*6);});}
function drawRadio(t){ctx.fillStyle='#060504';ctx.fillRect(0,0,W,H);const cx=W*.5,cy=H*.44,f=fl(t),rw=Math.min(W,H)*.32,rh=rw*.55,rx=cx-rw/2,ry=cy-rh/2;const tg=ctx.createLinearGradient(0,cy+80,0,H);tg.addColorStop(0,'rgb(22,14,6)');tg.addColorStop(1,'rgb(10,6,3)');ctx.fillStyle=tg;ctx.fillRect(cx-W*.28,cy+75,W*.56,H-cy-75);const dg=ctx.createRadialGradient(cx,cy,0,cx,cy,W*.35);dg.addColorStop(0,`rgba(200,140,20,${.22*f})`);dg.addColorStop(.5,`rgba(120,70,10,${.1*f})`);dg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=dg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#1a1a0e';ctx.strokeStyle='#2e2c18';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(rx,ry,rw,rh,6);ctx.fill();ctx.stroke();for(let i=0;i<7;i++){ctx.strokeStyle='rgba(40,38,20,0.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(rx+10,ry+rh*.2+i*(rh*.65/7));ctx.lineTo(rx+rw*.42,ry+rh*.2+i*(rh*.65/7));ctx.stroke();}const dx=cx+rw*.2,dy=cy-rh*.08,dr=rh*.28;const gg=ctx.createRadialGradient(dx,dy,0,dx,dy,dr*1.5);gg.addColorStop(0,`rgba(220,150,20,${.7*f})`);gg.addColorStop(.5,`rgba(180,100,10,${.4*f})`);gg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gg;ctx.fillRect(0,0,W,H);ctx.fillStyle=`rgba(200,130,15,${.9*f})`;ctx.beginPath();ctx.arc(dx,dy,dr,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(255,200,60,${.5*f})`;ctx.lineWidth=1;ctx.stroke();const na=-Math.PI*.4+Math.PI*.8*(.6+.05*Math.sin(t*.7));ctx.strokeStyle='rgba(40,20,5,0.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(dx+Math.cos(na)*dr*.75,dy+Math.sin(na)*dr*.75);ctx.stroke();ctx.strokeStyle=`rgba(160,100,15,${.15*f})`;ctx.lineWidth=0.8;ctx.beginPath();for(let x=rx;x<rx+rw;x++){const amp=6*Math.sin((x-rx)/rw*Math.PI)*Math.sin((x-rx)*.15+t*4);if(x===rx)ctx.moveTo(x,cy-rh*.8+amp);else ctx.lineTo(x,cy-rh*.8+amp);}ctx.stroke();}
function drawLogbook(t){ctx.fillStyle='#070604';ctx.fillRect(0,0,W,H);const cx=W*.5,cy=H*.44,f=fl(t),bw=Math.min(W,H)*.38,bh=bw*.65,bx=cx-bw/2,by=cy-bh/2;const lg=ctx.createRadialGradient(cx,cy-H*.15,0,cx,cy,W*.4);lg.addColorStop(0,`rgba(170,100,20,${.28*f})`);lg.addColorStop(.45,`rgba(90,50,10,${.12*f})`);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx+8,by+8,bw,bh);ctx.fillStyle='#1c0e05';ctx.strokeStyle='#3a2010';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();ctx.stroke();ctx.fillStyle='#e8d8b8';ctx.beginPath();ctx.roundRect(bx+bw*.07,by+bh*.04,bw*.88,bh*.92,2);ctx.fill();const ls=bh*.12,ly=by+bh*.14;for(let i=0;i<14;i++){ctx.strokeStyle=`rgba(80,50,20,${i<12?.2:.5})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(bx+bw*.1,ly+i*ls);ctx.lineTo(bx+bw*.93,ly+i*ls);ctx.stroke();}ctx.fillStyle='rgba(30,15,5,0.85)';ctx.font=`italic ${bh*.055}px 'Cormorant Garamond',serif`;ctx.textAlign='left';["6 March \u2014 arrived Harrow\u2019s Crossing","followed the signal as before","14 steps. The room unchanged.","the radio still warm.","I understand now.","I am not the one who finds","this place.","I am the one who builds it."].forEach((l,i)=>ctx.fillText(l,bx+bw*.11,by+bh*.17+i*ls+Math.sin(i*3.7)*1.2));ctx.fillStyle=`rgba(140,80,20,${.5*f})`;ctx.font=`${bh*.05}px 'Cormorant Garamond',serif`;ctx.textAlign='right';ctx.fillText('6 iii \u00b7 dawn',bx+bw*.93,by+bh*.1);}
function drawSignalCh8(t){ctx.fillStyle='#050404';ctx.fillRect(0,0,W,H);const cx=W*.5,cy=H*.5,f=fl(t);for(let r=0;r<12;r++){const ph=(t*.8+r*.5)%6,ra=ph*W*.09+r*8,a=Math.max(0,(1-ph/6)*.12*f);ctx.strokeStyle=`rgba(160,100,20,${a})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,ra,0,Math.PI*2);ctx.stroke();}[{freq:1.2,amp:30,phase:0},{freq:1.7,amp:22,phase:.5},{freq:.9,amp:35,phase:1.1},{freq:2.1,amp:18,phase:1.8},{freq:1.4,amp:26,phase:2.5},{freq:.7,amp:40,phase:.3}].forEach((v,i)=>{ctx.strokeStyle=`rgba(180,110,20,${(i===5?.7:.25)*f})`;ctx.lineWidth=i===5?1.5:.8;ctx.beginPath();for(let x=0;x<W;x++){const n=(x-cx)/(W*.4),env=Math.max(0,1-n*n),wave=v.amp*env*Math.sin(n*20*v.freq+t*3+v.phase);if(x===0)ctx.moveTo(x,cy+wave);else ctx.lineTo(x,cy+wave);}ctx.stroke();});}
function drawOutsider(t){ctx.fillStyle='#0b0a08';ctx.fillRect(0,0,W,H);const f=fl(t,4.2),tw=Math.min(W,H)*.42,th=tw*.65,tx=W*.5-tw/2,ty=H*.28;for(let i=0;i<800;i++){const b=12+rng(i)*18;ctx.fillStyle=`rgba(${b|0},${(b-2)|0},${(b-4)|0},0.6)`;ctx.fillRect(rng(i)*W,rng(i+5000)*H,rng(i+20000)*4+1,rng(i+30000)*2+.5);}ctx.fillStyle='rgb(28,22,14)';ctx.strokeStyle='rgba(60,45,22,0.7)';ctx.lineWidth=1.5;ctx.fillRect(tx,ty,tw,th);ctx.strokeRect(tx,ty,tw,th);ctx.fillStyle=`rgba(160,120,50,${.65*f})`;ctx.font=`bold ${tw*.072}px 'Cormorant Garamond',serif`;ctx.textAlign='center';['TOYNBEE IDEA','IN MOVIE 2001','RESURRECT DEAD','ON PLANET','JUPITER'].forEach((l,i)=>ctx.fillText(l,W*.5,ty+th*.22+i*(th*.15)));ctx.fillStyle=`rgba(15,12,7,${.4*(.7+.3*Math.sin(t*.3))})`;ctx.fillRect(tx,ty,tw,th);ctx.fillStyle=`rgba(100,78,35,${.4*f})`;ctx.font=`italic ${tw*.042}px 'Cormorant Garamond',serif`;ctx.textAlign='center';ctx.fillText('I am here. I have been here. I will be here.',W*.5,ty+th+38);}
const CANVAS_SCENES={trapdoor:drawTrapdoor,staircase:drawStaircase,chamber:drawChamber,radio:drawRadio,logbook:drawLogbook,signal_ch8:drawSignalCh8,outsider:drawOutsider,survey_field:drawSurveyField,survey_descent:drawSurveyDescent,cartograph_desk:drawCartographDesk,cartograph_descent:drawCartographDescent,radio_shack:drawRadioShack,radio_descent:drawRadioDescent,photo_field:drawPhotoField,photo_impossible:drawPhotoImpossible,library_desk:drawLibraryDesk,library_descent:drawLibraryDescent,archive_room:drawArchiveRoom,archive_passing:drawArchivePassing};
function renderLoop(ts){T=ts/1000;const beat=BEATS[cur];if(beat.type==='photo'){ctx.clearRect(0,0,W,H);drawPhoto(beat.scene,ts);}else if(CANVAS_SCENES[beat.scene])CANVAS_SCENES[beat.scene](T);if(Math.random()<.35)grain(.2);requestAnimationFrame(renderLoop);}
requestAnimationFrame(renderLoop);

// ── New scene draw functions for Chapters I–VI ───────────────────────────────

// Chapter I: survey field — grid lines, triangulation markers
function drawSurveyField(t){
  ctx.fillStyle='#060504';ctx.fillRect(0,0,W,H);
  const f=fl(t,3.1),cx=W*.5,cy=H*.5;
  ctx.strokeStyle=`rgba(180,140,80,${.12*f})`;ctx.lineWidth=.5;
  const gs=Math.min(W,H)/18;
  for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // triangulation markers
  const pts=[[.25,.35],[.5,.28],[.73,.42],[.38,.6],[.62,.55],[.5,.5]];
  pts.forEach(([px,py],i)=>{
    const x=px*W,y=py*H,r=7+rng(i+t*.01)*4;
    ctx.strokeStyle=`rgba(200,155,70,${.55*f})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-r*1.8,y);ctx.lineTo(x+r*1.8,y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y-r*1.8);ctx.lineTo(x,y+r*1.8);ctx.stroke();
  });
  // connecting lines between markers
  [[0,1],[1,2],[0,3],[1,4],[2,4],[3,4],[4,5]].forEach(([a,b])=>{
    ctx.strokeStyle=`rgba(180,130,60,${.18*f})`;ctx.lineWidth=.7;
    ctx.setLineDash([4,8]);
    ctx.beginPath();ctx.moveTo(pts[a][0]*W,pts[a][1]*H);ctx.lineTo(pts[b][0]*W,pts[b][1]*H);ctx.stroke();
  });
  ctx.setLineDash([]);
  // anomaly marker at centre — slow pulse
  const pr=18+8*Math.sin(t*1.1);
  ctx.strokeStyle=`rgba(220,180,80,${.7*f})`;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(cx,cy,pr,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=`rgba(220,180,80,${.2*f})`;ctx.lineWidth=.7;
  ctx.beginPath();ctx.arc(cx,cy,pr*2.4,0,Math.PI*2);ctx.stroke();
}

// Chapter I descent / Chapter III descent: minimal staircase variant
function drawSurveyDescent(t){
  ctx.fillStyle='#070605';ctx.fillRect(0,0,W,H);
  const f=fl(t),cx=W*.5,steps=14;
  const vpY=H*.12,bw=W*.48,sh=(H-vpY)/(steps+3);
  for(let s=steps;s>=0;s--){
    const p=s/steps,y=vpY+s*sh+sh,w=bw*(1-.55*p),x=cx-w/2;
    const lum=Math.round(18+s*3.5);
    ctx.fillStyle=`rgb(${lum},${Math.round(lum*.9)},${Math.round(lum*.7)})`;
    ctx.fillRect(x,y,w,sh+1);
    ctx.strokeStyle=`rgba(120,90,40,${.5*f*p})`;ctx.lineWidth=.5;
    ctx.strokeRect(x,y,w,sh);
  }
  // glow at bottom
  const gr=ctx.createRadialGradient(cx,vpY,0,cx,vpY+sh*.5,W*.18);
  gr.addColorStop(0,`rgba(180,120,40,${.3*f})`);gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
}

// Chapter II: cartographer's desk — map sheets, compass rose
function drawCartographDesk(t){
  ctx.fillStyle='#070604';ctx.fillRect(0,0,W,H);
  const f=fl(t,2.7),cx=W*.5,cy=H*.46;
  // desk surface
  const dg=ctx.createLinearGradient(0,H*.3,0,H);
  dg.addColorStop(0,'rgba(35,28,18,.0)');dg.addColorStop(1,'rgba(22,17,10,.9)');
  ctx.fillStyle=dg;ctx.fillRect(0,0,W,H);
  // map sheets — overlapping rectangles
  [[.35,.3,.42,.3],[.42,.32,.44,.28],[.38,.34,.46,.32]].forEach(([ox,oy,mw,mh],i)=>{
    ctx.strokeStyle=`rgba(195,165,110,${.35*f})`;ctx.lineWidth=.8;
    ctx.strokeRect(cx-W*mw/2+W*(ox-.4),H*oy,W*mw,H*mh);
    // faint grid on map
    ctx.strokeStyle=`rgba(180,150,100,${.1*f})`;ctx.lineWidth=.4;
    for(let gx=1;gx<5;gx++){
      ctx.beginPath();
      ctx.moveTo(cx-W*mw/2+W*(ox-.4)+gx*W*mw/5,H*oy);
      ctx.lineTo(cx-W*mw/2+W*(ox-.4)+gx*W*mw/5,H*oy+H*mh);ctx.stroke();
    }
  });
  // compass rose
  const cr=Math.min(W,H)*.055,crx=cx+W*.18,cry=H*.38;
  [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(a=>{
    ctx.strokeStyle=`rgba(210,170,90,${.7*f})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(crx,cry);
    ctx.lineTo(crx+Math.sin(a)*cr,cry-Math.cos(a)*cr);ctx.stroke();
  });
  ctx.strokeStyle=`rgba(210,170,90,${.35*f})`;ctx.lineWidth=.6;
  ctx.beginPath();ctx.arc(crx,cry,cr*.4,0,Math.PI*2);ctx.stroke();
  // pencil mark — the blank space
  ctx.strokeStyle=`rgba(230,200,130,${.8*f})`;ctx.lineWidth=2;
  ctx.setLineDash([2,6]);
  ctx.beginPath();ctx.moveTo(cx-W*.06,cy+H*.06);ctx.lineTo(cx+W*.06,cy+H*.06);ctx.stroke();
  ctx.setLineDash([]);
}

function drawCartographDescent(t){drawSurveyDescent(t);}

// Chapter III: radio shack — equipment rack, signal waves
function drawRadioShack(t){
  ctx.fillStyle='#060504';ctx.fillRect(0,0,W,H);
  const f=fl(t,3.8),cx=W*.5,cy=H*.44;
  // equipment rack
  const rw=W*.22,rh=H*.52,rx=cx-rw/2,ry=cy-rh/2;
  ctx.strokeStyle=`rgba(140,120,80,${.6*f})`;ctx.lineWidth=1.2;
  ctx.strokeRect(rx,ry,rw,rh);
  // rack units
  for(let u=1;u<8;u++){
    ctx.strokeStyle=`rgba(120,100,60,${.35*f})`;ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(rx,ry+u*rh/8);ctx.lineTo(rx+rw,ry+u*rh/8);ctx.stroke();
  }
  // dial glow
  const dg=ctx.createRadialGradient(cx,cy,0,cx,cy,W*.12);
  dg.addColorStop(0,`rgba(200,140,30,${.45*f})`);dg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=dg;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=`rgba(220,160,40,${.8*f})`;
  ctx.beginPath();ctx.arc(cx,cy,8,0,Math.PI*2);ctx.fill();
  // signal waves emanating
  for(let r=1;r<7;r++){
    const rad=r*W*.06,phase=(t*1.3+r*.7)%1,a=Math.max(0,(1-phase)*.22*f);
    ctx.strokeStyle=`rgba(0,180,210,${a})`;ctx.lineWidth=.8;
    ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.stroke();
  }
  // direction indicator
  const ang=-Math.PI*.35+Math.sin(t*.4)*.05;
  ctx.strokeStyle=`rgba(220,180,80,${.9*f})`;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(cx,cy);
  ctx.lineTo(cx+Math.cos(ang)*W*.14,cy+Math.sin(ang)*H*.14);ctx.stroke();
}

function drawRadioDescent(t){drawSurveyDescent(t);}

// Chapter IV: photo field — camera viewfinder
function drawPhotoField(t){
  ctx.fillStyle='#060504';ctx.fillRect(0,0,W,H);
  const f=fl(t,2.2),cx=W*.5,cy=H*.46;
  // viewfinder frame
  const fw=W*.55,fh=H*.48,fx=cx-fw/2,fy=cy-fh/2;
  ctx.strokeStyle=`rgba(200,170,110,${.5*f})`;ctx.lineWidth=1.5;
  ctx.strokeRect(fx,fy,fw,fh);
  // corner brackets
  const bc=28;
  [[fx,fy],[fx+fw,fy],[fx,fy+fh],[fx+fw,fy+fh]].forEach(([bx,by],i)=>{
    const sx=i%2===0?1:-1,sy=i<2?1:-1;
    ctx.strokeStyle=`rgba(220,185,100,${.85*f})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(bx+sx*bc,by);ctx.lineTo(bx,by);ctx.lineTo(bx,by+sy*bc);ctx.stroke();
  });
  // reticle
  ctx.strokeStyle=`rgba(200,170,110,${.3*f})`;ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(cx-W*.035,cy);ctx.lineTo(cx+W*.035,cy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy-H*.04);ctx.lineTo(cx,cy+H*.04);ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,W*.04,0,Math.PI*2);ctx.stroke();
  // distant building — the one at the edge of town
  const bw=W*.07,bh=H*.12;
  ctx.strokeStyle=`rgba(160,130,80,${.45*f})`;ctx.lineWidth=1;
  ctx.strokeRect(cx-bw/2,cy+H*.06,bw,bh);
}

// Chapter IV: the impossible photograph
function drawPhotoImpossible(t){
  ctx.fillStyle='#080705';ctx.fillRect(0,0,W,H);
  const f=fl(t,1.8),cx=W*.5,cy=H*.48;
  // Polaroid frame
  const pw=Math.min(W,H)*.5,ph=pw*1.22,px=cx-pw/2,py=cy-ph*.42;
  ctx.fillStyle=`rgba(245,240,230,${.92*f})`;
  ctx.fillRect(px,py,pw,ph);
  // photo area inside polaroid
  const ipad=pw*.06,iph=pw*.78;
  ctx.fillStyle=`#0d0c0a`;
  ctx.fillRect(px+ipad,py+ipad,pw-ipad*2,iph);
  // inside the photo: the impossible perspective — walls converging wrong
  const ic={x:px+ipad,y:py+ipad,w:pw-ipad*2,h:iph};
  ctx.save();ctx.beginPath();ctx.rect(ic.x,ic.y,ic.w,ic.h);ctx.clip();
  // walls
  const vx=ic.x+ic.w*.72,vy=ic.y+ic.h*.38; // vanishing point — off-centre
  [[ic.x,ic.y],[ic.x+ic.w,ic.y],[ic.x,ic.y+ic.h],[ic.x+ic.w,ic.y+ic.h]].forEach(([ex,ey])=>{
    ctx.strokeStyle=`rgba(130,100,65,${.4*f})`;ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(ex,ey);ctx.stroke();
  });
  // figure — small, distant, facing away
  const fx2=ic.x+ic.w*.68,fy2=ic.y+ic.h*.55,fh2=ic.h*.18;
  ctx.strokeStyle=`rgba(200,170,110,${.9*f})`;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(fx2,fy2-fh2*.45,fh2*.14,0,Math.PI*2);ctx.stroke(); // head
  ctx.beginPath();ctx.moveTo(fx2,fy2-fh2*.31);ctx.lineTo(fx2,fy2+fh2*.35);ctx.stroke(); // body
  ctx.restore();
  // caption area: empty — like the entry
  ctx.fillStyle=`rgba(120,100,70,${.35*f})`;
  ctx.fillRect(px+ipad,py+ipad+iph+ipad*.4,pw-ipad*2,ipad*.08);
}

// Chapter V: library desk — bookshelves, card catalog
function drawLibraryDesk(t){
  ctx.fillStyle='#060504';ctx.fillRect(0,0,W,H);
  const f=fl(t,2.5),cx=W*.5;
  // bookshelves — horizontal lines
  const shelves=6,sw=W*.7,sh=H*.06,sx=cx-sw/2;
  for(let i=0;i<shelves;i++){
    const sy=H*.1+i*(H*.72/shelves);
    ctx.strokeStyle=`rgba(130,100,65,${.55*f})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sx,sy+sh);ctx.lineTo(sx+sw,sy+sh);ctx.stroke();
    // book spines
    let bx=sx+4;
    while(bx<sx+sw-8){
      const bw=12+rng(bx*i+t*.01)*20,bh=sh*(0.6+rng(bx+i)*0.35);
      const lum=80+rng(bx*2+i)*60;
      ctx.fillStyle=`rgba(${lum},${Math.round(lum*.8)},${Math.round(lum*.5)},${.6*f})`;
      ctx.fillRect(bx,sy+sh-bh,bw-1,bh);
      bx+=bw+1;
    }
  }
  // lamp glow
  const lg=ctx.createRadialGradient(cx+W*.15,H*.38,0,cx+W*.15,H*.38,W*.22);
  lg.addColorStop(0,`rgba(210,165,80,${.35*f})`);lg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
  // card catalog drawer — slightly open
  ctx.strokeStyle=`rgba(160,130,80,${.65*f})`;ctx.lineWidth=1;
  ctx.strokeRect(cx-W*.18,H*.72,W*.36,H*.09);
  ctx.strokeStyle=`rgba(190,155,90,${.4*f})`;ctx.lineWidth=.6;
  ctx.beginPath();ctx.moveTo(cx-W*.08,H*.765);ctx.lineTo(cx+W*.08,H*.765);ctx.stroke();
}

function drawLibraryDescent(t){drawSurveyDescent(t);}

// Chapter VI: archive room — filing cabinets, cross-references
function drawArchiveRoom(t){
  ctx.fillStyle='#050403';ctx.fillRect(0,0,W,H);
  const f=fl(t,2.0),cx=W*.5,cy=H*.46;
  // filing cabinets — tall, flanking
  [[.18,.16,.14,.62],[.68,.16,.14,.62]].forEach(([ox,oy,cw,ch])=>{
    ctx.strokeStyle=`rgba(120,100,65,${.5*f})`;ctx.lineWidth=1;
    ctx.strokeRect(cx-W*.5+W*ox,H*oy,W*cw,H*ch);
    for(let d=1;d<5;d++){
      ctx.strokeStyle=`rgba(100,80,50,${.3*f})`;ctx.lineWidth=.5;
      ctx.beginPath();
      ctx.moveTo(cx-W*.5+W*ox,H*oy+d*H*ch/5);
      ctx.lineTo(cx-W*.5+W*ox+W*cw,H*oy+d*H*ch/5);ctx.stroke();
      // drawer pull
      ctx.strokeStyle=`rgba(170,140,80,${.6*f})`;ctx.lineWidth=1;
      const dy=H*oy+d*H*ch/5-H*ch*.08;
      ctx.strokeRect(cx-W*.5+W*ox+W*cw*.3,dy+H*ch*.02,W*cw*.4,H*ch*.04);
    }
  });
  // desk with scattered pages
  ctx.strokeStyle=`rgba(130,105,65,${.45*f})`;ctx.lineWidth=.8;
  const pw=W*.5,ph=H*.04;
  [[-.08,0],[.02,.02],[-.04,.01]].forEach(([ox,oy])=>{
    ctx.strokeRect(cx-pw/2+W*ox,cy+H*.1+H*oy,pw,ph);
  });
  // string connecting papers — the thread
  ctx.strokeStyle=`rgba(160,120,50,${.35*f})`;ctx.lineWidth=.7;
  ctx.setLineDash([3,9]);
  ctx.beginPath();
  ctx.moveTo(cx-W*.24,cy+H*.12);
  ctx.bezierCurveTo(cx-W*.1,cy,cx+W*.1,cy+H*.1,cx+W*.22,cy+H*.12);ctx.stroke();
  ctx.setLineDash([]);
}

// Chapter VI: the passing — table edge, two cups, hands
function drawArchivePassing(t){
  ctx.fillStyle='#050403';ctx.fillRect(0,0,W,H);
  const f=fl(t,1.6),cx=W*.5,cy=H*.5;
  // table surface — horizontal dark band
  const tg=ctx.createLinearGradient(0,H*.38,0,H*.72);
  tg.addColorStop(0,'rgba(30,23,14,.0)');tg.addColorStop(.3,'rgba(28,21,12,.85)');tg.addColorStop(1,'rgba(18,14,8,.95)');
  ctx.fillStyle=tg;ctx.fillRect(0,H*.38,W,H*.34);
  // two coffee cups
  [cx-W*.12,cx+W*.12].forEach((x,i)=>{
    const cr=Math.min(W,H)*.048,cy2=H*.52;
    ctx.strokeStyle=`rgba(160,130,80,${.7*f})`;ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(x-cr*.7,cy2-cr*.6);ctx.lineTo(x-cr*.8,cy2+cr*.5);
    ctx.lineTo(x+cr*.8,cy2+cr*.5);ctx.lineTo(x+cr*.7,cy2-cr*.6);ctx.closePath();ctx.stroke();
    // steam
    for(let s=0;s<3;s++){
      const sx=x+W*(s-1)*.02,sy=cy2-cr*.8;
      const phase=(t*1.2+s*.7)%1;
      ctx.strokeStyle=`rgba(200,170,110,${.18*f*(1-phase)})`;ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+5,sy-H*.03,sx-5,sy-H*.05,sx,sy-H*.08);ctx.stroke();
    }
  });
  // two hands — on either side of the cups
  // Left hand (Kwame): older, reaching forward
  const lhx=cx-W*.25,lhy=H*.54;
  ctx.strokeStyle=`rgba(180,145,85,${.6*f})`;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(lhx,lhy+H*.06);ctx.bezierCurveTo(lhx+W*.04,lhy,lhx+W*.12,lhy-H*.01,lhx+W*.16,lhy);ctx.stroke();
  // Right hand (Mara): still, listening
  const rhx=cx+W*.09,rhy=H*.54;
  ctx.strokeStyle=`rgba(190,160,100,${.5*f})`;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(rhx,rhy+H*.06);ctx.bezierCurveTo(rhx+W*.04,rhy+H*.01,rhx+W*.1,rhy,rhx+W*.14,rhy);ctx.stroke();
  // the name — suggested, not shown: a very faint bloom of light between them
  const ng=ctx.createRadialGradient(cx,cy+H*.04,0,cx,cy+H*.04,W*.06);
  const pulse=.5+.5*Math.sin(t*1.8);
  ng.addColorStop(0,`rgba(220,180,100,${.22*f*pulse})`);ng.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ng;ctx.fillRect(0,0,W,H);
}
