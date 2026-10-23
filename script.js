
const canvas = document.getElementById("art");
const ctx = canvas.getContext("2d");
const music = document.getElementById("music");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const audioProgress = document.getElementById("audioProgress");
const lyrics = document.getElementById("lyrics");

const SONG_START = 143;
const SONG_END = 197;
const SONG_LENGTH = SONG_END - SONG_START;
const SCENES = [
  { start: 143, end: 156.3, name: "01 · Two worlds, one heart", lines: [
    "Even if we're worlds apart",
    "Still in my heart, it will always be",
    "You and me, yeah"
  ]},
  { start: 156.3, end: 168.3, name: "02 · The space between", lines: [
    "And you can find me in the space between",
    "Where two worlds come to meet",
    "I'll never be out of reach (I'll never be out of reach)",
    "No, 'cause you're a part of me"
  ]},
  { start: 168.3, end: 188.3, name: "03 · Across the distance", lines: [
    "So, you can find me in the space between",
    "You'll never be alone",
    "No matter where you go",
    "We can meet in the space between, yeah"
  ]},
  { start: 188.3, end: 197, name: "04 · White lilies", lines: [
    "No matter where you go (no matter where you go)",
    "We can meet in the space between"
  ]}
];

let w = 0, h = 0, dpr = 1, particles = [], sceneIndex = -1;
let running = true, previous = 0, elapsed = 0, dissolve = 0, previousScene = 0, sceneChangedAt = 0, lastFrame = 0;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function resize() {
  const r = canvas.getBoundingClientRect();
  dpr = 1;
  w = r.width; h = r.height;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStars();
}
function seedStars() {
  particles = Array.from({ length: Math.floor(w * h / 1800) }, () => ({
    x: rand(0, w), y: rand(0, h), r: rand(.55, 2.05), phase: rand(0, 7), speed: rand(.7, 2.2), vx: rand(-5, 5), vy: rand(2, 10), glow: rand(2, 9)
  }));
}
function dot(x, y, color, r = 1.7, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function lineDots(x1, y1, x2, y2, gap, color, r = 1.5, alpha = 1) {
  const len = Math.hypot(x2-x1, y2-y1), n = Math.max(2, Math.floor(len/gap));
  for (let i=0;i<=n;i++) { const t=i/n; dot(x1+(x2-x1)*t, y1+(y2-y1)*t, color, r, alpha); }
}
function polyDots(points, gap, color, r=1.5, alpha=1) {
  for (let i=0;i<points.length-1;i++) lineDots(points[i][0], points[i][1], points[i+1][0], points[i+1][1], gap, color, r, alpha);
}
function circleDots(cx, cy, radius, gap, color, r=1.4, alpha=1, start=0, end=Math.PI*2) {
  const n = Math.max(12, Math.floor(radius*(end-start)/gap));
  for (let i=0;i<=n;i++) { const a=start+(end-start)*i/n; dot(cx+Math.cos(a)*radius, cy+Math.sin(a)*radius, color, r, alpha); }
}
function fillCircleDots(cx, cy, radius, spacing, color, alpha=1) {
  for (let y=-radius;y<=radius;y+=spacing) {
    for (let x=-radius;x<=radius;x+=spacing) {
      if (x*x+y*y <= radius*radius) dot(cx+x, cy+y, color, rand(1,1.7), alpha*rand(.6,1));
    }
  }
}
function textLabel(text, x, y, size, color, align="center") {
  ctx.save(); ctx.font = `500 ${size}px "Space Grotesk", sans-serif`;
  ctx.textAlign = align; ctx.fillStyle = color; ctx.shadowColor = "#070817"; ctx.shadowBlur = 9;
  ctx.fillText(text, x, y); ctx.restore();
}
function drawStars(t) {
  for (const p of particles) {
    // Todas las estrellas flotan lentamente y pulsan desde apagadas hasta muy brillantes.
    const x = (p.x + t * p.vx + w) % w;
    const y = (p.y + t * p.vy) % h;
    const pulse = .5 + .5 * Math.sin(t * p.speed + p.phase);
    const a = .025 + .95 * Math.pow(pulse, 2.2);
    const radius = p.r * (.72 + pulse * .62);
    if (p.r > 1.25) {
      ctx.save();
      ctx.globalAlpha = a * .8;
      ctx.shadowColor = p.phase > 3.5 ? "#9a70ff" : "#5ceaff";
      ctx.shadowBlur = p.glow * pulse;
      dot(x, y, p.phase > 3.5 ? "#d9c1ff" : "#b8f5ff", radius, a);
      ctx.restore();
    } else {
      dot(x, y, "#e8e5ff", radius, a);
    }
    if (p.r > 1.65 && p.phase > 5.3) {
      ctx.save();
      ctx.globalAlpha = a * .85;
      ctx.fillStyle = p.phase > 6.1 ? "#d9c1ff" : "#9cecff";
      ctx.font = `${p.r * 4.2}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(p.phase > 6.1 ? "✦" : "+", x, y);
      ctx.restore();
    }
  }
}
function drawHeart(cx, cy, scale, t) {
  const pts = [];
  for (let i=0;i<=130;i++) {
    const a = Math.PI*2*i/130;
    const x = 16*Math.pow(Math.sin(a),3);
    const y = 13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a);
    pts.push([cx+x*scale, cy-y*scale]);
  }
  for (let i=0;i<pts.length-1;i++) {
    const midX = (pts[i][0]+pts[i+1][0])/2;
    lineDots(...pts[i], ...pts[i+1], 4.3, midX < cx ? "#b46aff" : "#27c9ff", 2, .95);
  }
  for (let i=0;i<35;i++) {
    const a = i/35*Math.PI*2;
    dot(cx+Math.cos(a)*scale*.09, cy+Math.sin(a)*scale*.09, i%2 ? "#b46aff" : "#27c9ff", 1.4, .9);
  }
}
function drawGirl(cx, cy, color, hairColor, side, t) {
  const s = Math.min(w/850, h/480);
  const bob = Math.sin(t*1.05+side)*1.1*s;
  const headX = cx + side*4*s;
  const headY = cy-61*s+bob;
  circleDots(headX,headY-7*s,23*s,3.2*s,hairColor,1.55*s,.95,Math.PI*1.02,Math.PI*1.98);
  polyDots([[headX-21*s,headY-13*s],[headX-24*s,headY+2*s],[headX-19*s,headY+14*s],[headX-12*s,headY+19*s]],2.6*s,hairColor,1.6*s,.95);
  polyDots([[headX+20*s,headY-13*s],[headX+23*s,headY+1*s],[headX+17*s,headY+13*s],[headX+11*s,headY+18*s]],2.6*s,hairColor,1.6*s,.95);
  circleDots(headX,headY,17*s,3*s,"#f3dff7",1.35*s,.9,side<0?-.95:Math.PI-.95,side<0?Math.PI+1.12:Math.PI*2+.95);
  lineDots(headX+side*3*s,headY-2*s,headX+side*8*s,headY+1*s,2.5*s,"#f3dff7",1.2*s,.9);
  dot(headX-side*4*s,headY-2*s,"#f5f0ff",1.25*s,.85);
  lineDots(headX-4*s,headY+14*s,cx-7*s,cy-27*s,2.7*s,"#f3dff7",1.35*s,.85);
  lineDots(headX+5*s,headY+14*s,cx+7*s,cy-26*s,2.7*s,"#f3dff7",1.35*s,.85);
  const torso = side<0
    ? [[cx+4*s,cy-29*s],[cx-14*s,cy-23*s],[cx-28*s,cy-3*s],[cx-37*s,cy+28*s],[cx-31*s,cy+49*s],[cx+19*s,cy+49*s],[cx+25*s,cy+18*s],[cx+17*s,cy-10*s],[cx+4*s,cy-29*s]]
    : [[cx-4*s,cy-29*s],[cx+14*s,cy-23*s],[cx+28*s,cy-3*s],[cx+37*s,cy+28*s],[cx+31*s,cy+49*s],[cx-19*s,cy+49*s],[cx-25*s,cy+18*s],[cx-17*s,cy-10*s],[cx-4*s,cy-29*s]];
  polyDots(torso,2.7*s,color,1.8*s,.95);
  for(let row=0;row<9;row++) {
    const yy=cy-16*s+row*6*s;
    for(let col=-3;col<=3;col++) {
      const xx=cx+col*5*s;
      if(Math.abs(xx-cx)<(18+row*.9)*s) dot(xx,yy,color,1.05*s,.42);
    }
  }
}
function drawHug(t) {
  const s = Math.min(w/850, h/480);
  const cy = h*.49;
  const leftX = w*.455, rightX = w*.545;
  for(let ring=0;ring<3;ring++) {
    const rx=(94+ring*17)*s, ry=(48+ring*11)*s;
    for(let a=0;a<Math.PI*2;a+=.095) {
      const angle=a+t*.045+ring*.7;
      dot(w*.5+Math.cos(angle)*rx,cy+Math.sin(angle)*ry,
        ring%2 ? "#27c9ff" : "#a56bff",1.05*s,.32);
    }
  }
  drawGirl(leftX, cy, "#a54dff", "#dcb8ff", -1, t);
  drawGirl(rightX, cy+1*s, "#13c8ff", "#83e9ff", 1, t);
  polyDots([[leftX-24*s,cy-9*s],[leftX-19*s,cy+13*s],[w*.47,cy+34*s],[w*.535,cy+32*s],[rightX+23*s,cy+13*s]],2.5*s,"#bd83ff",1.9*s,.95);
  polyDots([[rightX+24*s,cy-8*s],[rightX+18*s,cy+15*s],[w*.53,cy+39*s],[w*.465,cy+34*s],[leftX-21*s,cy+17*s]],2.5*s,"#4cddff",1.9*s,.95);
  drawHeart(w*.5,cy-94*s,.72*s,t);
  for(let i=0;i<20;i++) {
    const a=t*.28+i*2.4, r=(67+(i%5)*11)*s;
    dot(w*.5+Math.cos(a)*r,cy-5*s+Math.sin(a)*r*.55,i%2?"#a56bff":"#27c9ff",1.4*s,.62);
  }
}
function drawGalaxy(t) {
  const cx=w*.5, cy=h*.405, m=Math.min(w,h);
  ctx.save();
  const bg=ctx.createRadialGradient(cx,cy,2,cx,cy,m*.62);
  bg.addColorStop(0,"#17102d"); bg.addColorStop(.28,"#090b1d"); bg.addColorStop(1,"#02030a");
  ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
  for(let i=0;i<280;i++){
    const x=((i*127.1)%997)/997*w;
    const y=((i*311.7)%991)/991*h;
    const twinkle=.25+.55*(.5+.5*Math.sin(t*1.8+i*2.17));
    ctx.globalAlpha=twinkle;
    ctx.fillStyle=i%7===0?"#b9a1ff":(i%5===0?"#8deaff":"#f5f0ff");
    ctx.fillRect(x,y,i%13===0?1.8:1,i%13===0?1.8:1);
  }
  ctx.globalAlpha=1;
  for(let cloud=0;cloud<7;cloud++){
    const a=t*.07+cloud*1.256;
    for(let i=0;i<75;i++){
      const p=i/95, rr=m*(.045+p*.27);
      const ang=a+p*7.8+Math.sin(i*.12+t)*.16;
      const x=cx+Math.cos(ang)*rr;
      const y=cy+Math.sin(ang)*rr*.55;
      const c=(cloud+i)%3===0?"#f4c6ff":((cloud+i)%2?"#5de6ff":"#9b6bff");
      dot(x,y,c,.65+(i%4)*.25,.12+p*.48);
    }
  }
  for(let arm=0;arm<4;arm++){
    for(let i=0;i<270;i++){
      const p=i/330, a=p*9.1+arm*Math.PI/2+t*.21;
      const rr=5+p*m*.43;
      const jitter=Math.sin(i*1.7+arm*8)*m*.004;
      const x=cx+Math.cos(a)*rr+jitter;
      const y=cy+Math.sin(a)*rr*.52+jitter*.5;
      const color=p<.2?"#fff1ff":(arm%2?"#42d9ff":"#b57aff");
      dot(x,y,color,1.0+p*1.0,.34+p*.66);
    }
  }
  for(let i=0;i<160;i++){
    const a=i*2.39996, rr=Math.sqrt(i)*m*.0035;
    dot(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,"#fff5ff",1.2+(i%3)*.45,.75);
  }
  const planets=[
    {r:m*.16,speed:.82,size:5.4,color:"#61eaff",tilt:.38},
    {r:m*.245,speed:-.48,size:7.2,color:"#b18aff",tilt:-.28},
    {r:m*.32,speed:.29,size:4.6,color:"#ffb7e9",tilt:.18}
  ];
  planets.forEach((p,i)=>{
    ctx.save();ctx.translate(cx,cy);ctx.rotate(p.tilt);
    circleDots(0,0,p.r,4.5,"#c5c9ff",.8,.27);
    const a=t*p.speed+i*2.2, px=Math.cos(a)*p.r, py=Math.sin(a)*p.r*.53;
    for(let ring=3;ring>=1;ring--) fillCircleDots(px,py,p.size+ring*2,3.5,p.color,.07);
    fillCircleDots(px,py,p.size,2.8,p.color,.98);
    dot(px-p.size*.25,py-p.size*.3,"#ffffff",1.3,.8);
    ctx.restore();
  });
  ctx.restore();
}
function drawFlag(x,y,ww,hh,type) {
  for(let px=0;px<=ww;px+=5) { dot(x+px,y,"#e6e5ff",1.1,.8); dot(x+px,y+hh,"#e6e5ff",1.1,.8); }
  for(let py=0;py<=hh;py+=5) { dot(x,y+py,"#e6e5ff",1.1,.8); dot(x+ww,y+py,"#e6e5ff",1.1,.8); }
  for(let py=5;py<hh;py+=5) for(let px=5;px<ww;px+=5) {
    let color="#f5f4ff";
    if(type==="uk") {
      const dx=px/ww, dy=py/hh;
      if(Math.abs(dx-dy)<.085 || Math.abs(dx-(1-dy))<.085) color="#e7e5ff";
      if(Math.abs(dx-.5)<.11 || Math.abs(dy-.5)<.14) color="#e84b76";
      if(Math.abs(dx-.5)<.045 || Math.abs(dy-.5)<.06) color="#f4f2ff";
      if(Math.abs(dx-dy)<.035 || Math.abs(dx-(1-dy))<.035) color="#e84b76";
    } else {
      const nx=(px-ww/2)/(ww*.18), ny=(py-hh/2)/(hh*.24);
      if(nx*nx+ny*ny<1 && ny<0) color="#e84b76";
      if(nx*nx+ny*ny<1 && ny>=0) color="#278cff";
      const corners=[[.18,.23],[.82,.23],[.18,.77],[.82,.77]];
      if(corners.some(([cx,cy])=>Math.abs(px/ww-cx)<.07 && Math.abs(py/hh-cy)<.11)) color="#232b45";
    }
    dot(x+px,y+py,color,1.15,.95);
  }
}
function drawPlane(x,y,t) {
  polyDots([[x-15,y+4],[x+17,y-7],[x+5,y+13],[x+1,y+3],[x-15,y+4]],2.8,"#f8f7ff",1.6);
  lineDots(x+1,y+3,x+17,y-7,3,"#8be5ff",1.3);
  for(let i=1;i<8;i++) dot(x-17-i*7,y+5+Math.sin(t*2-i)*2,"#80dfff",1.1,.7-i*.06);
}
function drawTravel(t) {
  const fw=Math.min(w*.23,180), fh=fw*.61, y=h*.32;
  const lx=w*.16, rx=w*.61;
  drawFlag(lx,y,fw,fh,"kr");
  drawFlag(rx,y,fw,fh,"uk");
  const progress=(t%7)/7;
  const px=lx+fw+35+progress*(rx-lx-fw-60);
  const py=y+fh*.5-Math.sin(progress*Math.PI)*h*.12;
  drawPlane(px,py,t);
  for(let i=0;i<=70;i++) {
    const p=i/70, x=lx+fw+25+p*(rx-lx-fw-50), yy=y+fh*.5-Math.sin(p*Math.PI)*h*.12;
    dot(x,yy,p<progress?"#65e5ff":"#9e8cff",1.25,p<progress?.62:.34);
  }
  for(let i=0;i<22;i++) {
    const x=(i*67+t*9)%w, yy=h*.15+(i%5)*13;
    dot(x,yy,i%2?"#a56bff":"#27c9ff",1.3,.55);
  }
}
function drawLily(cx, baseY, scale, t, sway, color) {
  const swayX=Math.sin(t*.75+sway)*4*scale;
  const topY=baseY-78*scale;
  lineDots(cx,baseY,cx+swayX,topY+9*scale,2.5*scale,"#3fba8a",1.25*scale,.92);
  polyDots([[cx+swayX*.2,baseY-22*scale],[cx-14*scale,baseY-36*scale],[cx-31*scale,baseY-33*scale],[cx-18*scale,baseY-23*scale],[cx+swayX*.2,baseY-22*scale]],2.5*scale,"#48c99a",1.3*scale,.8);
  polyDots([[cx+swayX*.4,baseY-40*scale],[cx+14*scale,baseY-53*scale],[cx+29*scale,baseY-49*scale],[cx+18*scale,baseY-39*scale],[cx+swayX*.4,baseY-40*scale]],2.5*scale,"#48c99a",1.3*scale,.8);
  for(let petal=0;petal<5;petal++){
    const a=-Math.PI/2+petal*Math.PI*2/5+Math.sin(t*.6+sway)*.035;
    const spread=.65, length=31*scale, width=15*scale;
    const bx=cx+swayX, by=topY;
    const ex=bx+Math.cos(a)*length, ey=by+Math.sin(a)*length;
    const nx=-Math.sin(a), ny=Math.cos(a);
    const pts=[];
    for(let j=0;j<=34;j++){
      const u=j/34;
      const bulge=Math.sin(u*Math.PI)*width;
      pts.push([bx+(ex-bx)*u+nx*bulge,by+(ey-by)*u+ny*bulge]);
    }
    polyDots(pts,2.5*scale,color,1.45*scale,.95);
    const inner=[];
    for(let j=0;j<=24;j++){
      const u=.12+j/24*.72;
      const bulge=Math.sin(u*Math.PI)*width*.48;
      inner.push([bx+(ex-bx)*u+nx*bulge,by+(ey-by)*u+ny*bulge]);
    }
    polyDots(inner,3*scale,"#ffffff",.9*scale,.65);
  }
  for(let k=0;k<5;k++){
    const a=-Math.PI/2+k*.45;
    lineDots(cx+swayX,topY,cx+swayX+Math.cos(a)*12*scale,topY+Math.sin(a)*12*scale,2.5*scale,"#f4d47b",1*scale,.9);
    dot(cx+swayX+Math.cos(a)*12*scale,topY+Math.sin(a)*12*scale,"#ffe9a0",1.6*scale,.95);
  }
}
function drawLilies(t) {
  for(let x=0;x<w;x+=5) {
    const y=h*.69+Math.sin(x*.013+t*.2)*7;
    dot(x,y,"#315b75",1.3,.65);
  }
  const lilies=10;
  for(let i=0;i<lilies;i++) {
    const x=(i/(lilies-1))*w+Math.sin(t*.6+i)*5;
    const base=h*(.92-(i%4)*.035);
    const scale=(.45+(i%6)*.12)*(w<600?.75:1);
    drawLily(x,base,scale,t,Math.sin(t+i),i%3===0?"#cfc5ff":"#f2f0ff");
  }
  for(let i=0;i<42;i++) {
    const x=(i*83+t*(7+(i%4)*2))%w;
    const y=h*.35+((i*37)%Math.floor(h*.58));
    const a=.35+.65*(.5+.5*Math.sin(t*2+i));
    dot(x,y,i%3===0?"#b68cff":"#b4f3ff",rand(1,2),a);
  }
}

function drawCueStars(audioTime) {
  // Destellos de transición recuperados del estilo anterior, ahora en cada cambio de escena.
  const cues = [
    { start: 155.65, end: 157.15, seed: 11 },
    { start: 167.65, end: 169.15, seed: 29 },
    { start: 187.65, end: 189.15, seed: 47 }
  ];
  for (const cue of cues) {
    if (audioTime < cue.start || audioTime > cue.end) continue;
    const age = audioTime - cue.start;
    const life = cue.end - cue.start;
    const fade = Math.min(1, age / 0.22, (life - age) / 0.32);
    const alpha = Math.max(0, fade);
    for (let i = 0; i < 34; i++) {
      const seed = i * 12.9898 + cue.seed;
      const px = (Math.sin(seed * 1.71) * 0.5 + 0.5) * w;
      const py = (Math.sin(seed * 2.37 + 1.2) * 0.5 + 0.5) * h * 0.78;
      const twinkle = 0.62 + 0.38 * Math.sin(age * 3.4 + i * 1.8);
      const size = i % 7 === 0 ? 2.0 : (i % 3 === 0 ? 1.25 : 0.8);
      const color = i % 3 === 0 ? '#b78cff' : (i % 3 === 1 ? '#72eaff' : '#f4efff');
      dot(px, py, color, size, alpha * twinkle);
      if (i % 7 === 0) {
        dot(px - 3, py, color, 0.65, alpha * 0.45);
        dot(px + 3, py, color, 0.65, alpha * 0.45);
        dot(px, py - 3, color, 0.65, alpha * 0.45);
        dot(px, py + 3, color, 0.65, alpha * 0.45);
      }
    }
  }
}

function setScene(index) {
  if(index===sceneIndex) return;
  previousScene = sceneIndex < 0 ? index : sceneIndex;
  sceneIndex=index;
  sceneChangedAt = performance.now()/1000;
  const scene=SCENES[index];
  lyrics.classList.add("fade");
  lyrics.innerHTML=scene.lines.map(line=>`<p>${escapeHtml(line)}</p>`).join("");
  requestAnimationFrame(()=>lyrics.classList.remove("fade"));
}
function escapeHtml(s) {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
function sceneForTime(time) {
  if(time < SONG_START) return 0;
  for(let i=SCENES.length-1;i>=0;i--) if(time>=SCENES[i].start) return i;
  return 0;
}
function render(timestamp) {
  if(!running) return;
  if (timestamp - lastFrame < 41) { requestAnimationFrame(render); return; }
  lastFrame = timestamp;
  const t=timestamp/1000;
  ctx.clearRect(0,0,w,h);
  drawStars(t);
  const audioTime=music.currentTime || SONG_START;
  if (audioProgress) audioProgress.value = String(clamp(((audioTime - SONG_START) / SONG_LENGTH) * 1000, 0, 1000));
  const idx=sceneForTime(audioTime);
  if(idx!==sceneIndex) setScene(idx);
  const remaining=(SCENES[idx]?.end ?? SONG_END)-audioTime;
  const transitionDuration=.45;
  const morph=clamp((transitionDuration-remaining)/transitionDuration,0,1);
  dissolve = morph>0 ? Math.sin(morph*Math.PI)*.9 + morph*.12 : 0;
  const transitionIn=clamp((t-sceneChangedAt)/.42,0,1);
  const drawScene=(which)=>{
    if(which===0) drawHug(t);
    else if(which===1) drawGalaxy(t);
    else if(which===2) drawTravel(t);
    else drawLilies(t);
  };
  ctx.save();
  if (transitionIn < 1 && previousScene !== idx) {
    ctx.globalAlpha=(1-transitionIn)*.42;
    drawScene(previousScene);
  }
  ctx.globalAlpha=(transitionIn*.9+.1)*(morph>0?1-morph*.12:1);
  drawScene(idx);
  ctx.restore();
  drawCueStars(audioTime);
  if (morph > 0.015 && idx < 3) {
    const count=Math.floor(90*morph);
    for(let i=0;i<count;i++){
      const seed=i*2.3999632297;
      const phase=(i%47)/47;
      const edge=(i%2===0?-.5:.5);
      const baseX=w*.5+Math.cos(seed+t*.16)*(w*(.12+phase*.34));
      const baseY=h*.48+Math.sin(seed*1.31+t*.14)*(h*(.1+phase*.29));
      const flow= morph*18;
      const curl=Math.sin(t*.65+seed)*7*morph;
      const x=baseX*(1-morph*.25)+w*.5*morph+Math.cos(seed+t*.28)*flow+curl;
      const y=baseY*(1-morph*.25)+h*.48*morph+Math.sin(seed*1.2+t*.24)*flow-curl*.45;
      const color=i%3===0?"#e8ddff":(i%2?"#32d9ff":"#a56bff");
      dot(x,y,color,rand(.65,1.8),.18+.72*morph);
    }
    for(let i=0;i<55;i++){
      const a=i*.47+t*.48, r=(18+(i%19)*7)*(0.35+morph);
      const x=w*.5+Math.cos(a)*r*(.7+morph);
      const y=h*.48+Math.sin(a*1.17)*r*.72;
      dot(x,y,i%2?"#72eaff":"#c7a1ff",.7+morph*.7,morph*.75);
    }
  }
  requestAnimationFrame(render);
}
startBtn.addEventListener("click", async()=>{
  if (!music.paused) {
    music.pause();
    startBtn.textContent = "▶ Play";
    startBtn.setAttribute("aria-pressed", "false");
    return;
  }
  try {
    if(music.readyState===0) music.load();
    if(music.currentTime<SONG_START || music.currentTime>=SONG_END) music.currentTime=SONG_START;
    await music.play();
    startBtn.textContent = "Ⅱ Pausa";
    startBtn.setAttribute("aria-pressed", "true");
  } catch(err) {
    alert("No se encontró Space_Between.mp3. Colócalo junto a index.html.");
    console.error(err);
  }
});
audioProgress.addEventListener("input", () => {
  if (Number.isFinite(music.duration) && music.duration > 0) music.currentTime = SONG_START + (Number(audioProgress.value) / 1000) * SONG_LENGTH;
});
restartBtn.addEventListener("click",()=>{
  music.pause();
  music.currentTime=SONG_START;
  setScene(0);
  startBtn.textContent = "▶ Play";
  startBtn.setAttribute("aria-pressed", "false");
});
music.addEventListener("pause",()=>{ if(music.currentTime<SONG_END){ startBtn.textContent="▶ Play"; startBtn.setAttribute("aria-pressed","false"); } });
music.addEventListener("play",()=>{ startBtn.textContent="Ⅱ Pausa"; startBtn.setAttribute("aria-pressed","true"); });
music.addEventListener("ended",()=>{
  startBtn.textContent = "▶ Play";
  startBtn.setAttribute("aria-pressed", "false");
  setScene(3);
});
window.addEventListener("resize",resize);
resize();
setScene(0);
requestAnimationFrame(render);
