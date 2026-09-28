const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;
const loading=document.getElementById("loading"),start=document.getElementById("start"),end=document.getElementById("end"),music=document.getElementById("music");
const bg=new Image(); bg.src="pink_princess_world.png";
const keys={}; let started=false, hearts=0, won=false, cam=0, tick=0;
const WORLD=5200, BASE=820;
const P={x:180,y:650,w:62,h:100,vx:0,vy:0,on:false,crouch:false,face:1,jumpLock:false};
const platforms=[
 [0,820,900,204],[1020,820,780,204],[1930,820,860,204],[2920,820,850,204],[3900,820,650,204],[4670,820,530,204],
 [520,675,230,30],[820,565,210,30],[1190,690,250,30],[1500,550,210,30],[2040,680,220,30],[2350,545,240,30],
 [3030,675,250,30],[3380,555,220,30],[3970,680,240,30],[4310,545,220,30],[4740,665,230,30]];
const heartPos=[[310,735],[590,610],[890,500],[1110,745],[1270,625],[1570,485],[2010,740],[2110,615],[2430,480],[2720,740],[3000,740],[3120,610],[3450,490],[3720,740],[3970,740],[4050,615],[4380,480],[4550,740],[4740,600],[4920,740],[5050,690],[5160,610]];
const H=heartPos.map((p,i)=>({x:p[0],y:p[1],got:false,i}));
const bunnies=Array.from({length:18},(_,i)=>({x:250+i*280+(i%3)*45,base:785,phase:i*.83,flip:i%2}));
function resizePlayerBox(){return {x:P.x,y:P.y+(P.crouch?35:0),w:P.w,h:P.crouch?65:P.h}}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function heart(cx,cy,s,fill,stroke="#8e2d61"){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(0,22);ctx.bezierCurveTo(-40,-3,-33,-43,0,-28);ctx.bezierCurveTo(33,-43,40,-3,0,22);ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=stroke;ctx.stroke();ctx.restore()}
function drawBackground(){
 const scale=Math.max(canvas.width/bg.width,canvas.height/bg.height);
 const sw=canvas.width/scale, sh=canvas.height/scale;
 const par=(cam*.055)%(Math.max(1,bg.width-sw));
 ctx.drawImage(bg,par,Math.max(0,(bg.height-sh)/2),sw,sh,0,0,canvas.width,canvas.height);
 // pink atmospheric veil keeps foreground readable
 ctx.fillStyle="rgba(255,191,220,.08)";ctx.fillRect(0,0,canvas.width,canvas.height);
}
function drawTilePlatform(p){
 const [px,py,pw,ph]=p; ctx.fillStyle="#6e2d54";ctx.fillRect(px,py,pw,ph);
 ctx.fillStyle="#a94372";ctx.fillRect(px+5,py+12,pw-10,ph-12);
 ctx.fillStyle="#ef6da8";ctx.fillRect(px,py,pw,18);
 ctx.fillStyle="#ffacd0";ctx.fillRect(px,py,pw,8);
 // foliage pixels
 for(let q=8;q<pw;q+=26){ctx.fillStyle=(q/26)%2<1?"#f78dbd":"#d95091";ctx.fillRect(px+q,py-8,18,12);ctx.fillStyle="#ffd4e6";ctx.fillRect(px+q+6,py-10,5,5)}
 // rock texture
 for(let yy=py+38;yy<py+ph;yy+=42)for(let xx=px+18;xx<px+pw;xx+=58){ctx.fillStyle="#84365f";ctx.fillRect(xx,yy,16,7)}
}
function drawBunny(b){
 const hop=Math.abs(Math.sin(tick*.035+b.phase))*20, bx=b.x, by=b.base-hop;
 ctx.save();ctx.translate(bx,by);if(b.flip)ctx.scale(-1,1);
 ctx.fillStyle="#fff6fb";ctx.strokeStyle="#87335f";ctx.lineWidth=3;
 // ears
 for(const ex of [-9,9]){ctx.beginPath();ctx.ellipse(ex,-30,7,19,ex*.008,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#f7a5c8";ctx.beginPath();ctx.ellipse(ex,-30,3,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff6fb"}
 ctx.beginPath();ctx.ellipse(0,-7,22,19,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.ellipse(19,7,18,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle="#5f2948";ctx.fillRect(7,-10,4,4);ctx.fillStyle="#ef76a8";ctx.fillRect(18,-2,5,4);
 ctx.restore();
}
function drawPrincess(){
 const crouch=P.crouch, px=P.x+31, py=P.y+(crouch?32:0), bob=P.on&&!crouch?Math.sin(tick*.22)*2:0;
 ctx.save();ctx.translate(px,py+bob);if(P.face<0)ctx.scale(-1,1);
 // back hair
 ctx.fillStyle="#54273f";ctx.strokeStyle="#2f1826";ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,27,29,38,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 // skirt
 ctx.fillStyle="#e95698";ctx.strokeStyle="#8e2d61";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-12,48);ctx.quadraticCurveTo(-34,74,-38,92);ctx.quadraticCurveTo(0,108,38,92);ctx.quadraticCurveTo(34,74,12,48);ctx.closePath();ctx.fill();ctx.stroke();
 // layered pastel skirt
 ctx.fillStyle="#ff9dc7";ctx.beginPath();ctx.moveTo(-10,55);ctx.quadraticCurveTo(-27,75,-30,88);ctx.quadraticCurveTo(0,99,30,88);ctx.quadraticCurveTo(27,75,10,55);ctx.closePath();ctx.fill();
 ctx.fillStyle="#ffd7e8";ctx.fillRect(-29,84,58,7);ctx.fillStyle="#fff2f8";for(let i=-23;i<=23;i+=12){ctx.beginPath();ctx.arc(i,90,6,0,Math.PI);ctx.fill()}
 // bodice
 ctx.fillStyle="#f47bae";ctx.fillRect(-16,36,32,28);ctx.strokeRect(-16,36,32,28);ctx.fillStyle="#fff0f7";ctx.fillRect(-4,38,8,25);
 // puff sleeves
 ctx.fillStyle="#ffb2d1";for(const a of [-22,22]){ctx.beginPath();ctx.arc(a,44,10,0,Math.PI*2);ctx.fill();ctx.stroke()}
 // face
 ctx.fillStyle="#ffd5c6";ctx.beginPath();ctx.arc(0,17,22,0,Math.PI*2);ctx.fill();ctx.stroke();
 // bangs
 ctx.fillStyle="#54273f";ctx.beginPath();ctx.arc(0,8,22,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-21,5,8,18);ctx.fillRect(14,4,7,18);
 // eyes / blush
 ctx.fillStyle="#3b2130";ctx.fillRect(-9,17,4,5);ctx.fillRect(7,17,4,5);ctx.fillStyle="#ee8eaa";ctx.fillRect(-15,25,7,3);ctx.fillRect(9,25,7,3);
 // bow
 ctx.fillStyle="#ff82b5";ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(-25,-12);ctx.lineTo(-22,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(5,-2);ctx.lineTo(25,-12);ctx.lineTo(22,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#ffd5e7";ctx.beginPath();ctx.arc(0,-2,7,0,7);ctx.fill();ctx.stroke();
 ctx.restore();
}
function drawWorld(){
 ctx.save();ctx.translate(-cam,0);
 platforms.forEach(drawTilePlatform);
 // harmless decorative bunnies
 bunnies.forEach(drawBunny);
 // collectibles
 for(const h of H)if(!h.got){const bob=Math.sin(tick*.08+h.i)*7;heart(h.x,h.y+bob,.62,"#ff4f9a");ctx.fillStyle="#fff";ctx.fillRect(h.x-7,h.y-17+bob,8,5)}
 // flowers
 for(let q=80;q<WORLD;q+=115){ctx.fillStyle="#ffd7e7";ctx.fillRect(q,800,5,20);ctx.fillStyle="#fff1f7";ctx.fillRect(q-7,790,18,8);ctx.fillStyle="#f05b9c";ctx.fillRect(q-2,787,7,7)}
 // castle gate marker at end
 ctx.fillStyle="#7c315a";ctx.fillRect(5080,690,100,130);ctx.fillStyle="#f7a3c8";ctx.fillRect(5090,700,80,120);heart(5130,735,.6,"#ff5b9f");
 drawPrincess();ctx.restore();
}
function drawHUD(){
 ctx.fillStyle="rgba(255,245,251,.92)";ctx.fillRect(24,22,245,78);ctx.strokeStyle="#7f315c";ctx.lineWidth=4;ctx.strokeRect(24,22,245,78);
 heart(61,61,.55,"#ff5c9f");ctx.fillStyle="#8e2d61";ctx.font="bold 31px Arial";ctx.fillText(`${hearts} / 22`,96,72);
 ctx.fillStyle="rgba(255,245,251,.9)";ctx.fillRect(canvas.width-270,22,245,78);ctx.strokeRect(canvas.width-270,22,245,78);
 ctx.font="bold 20px Arial";ctx.fillText("ESHAl'S WORLD ♡",canvas.width-245,69);
}
function update(){
 if(!started||won)return;tick++;
 const L=keys.a||keys.arrowleft,R=keys.d||keys.arrowright,J=keys.w||keys.arrowup||keys[" "],D=keys.s||keys.arrowdown;
 P.crouch=!!D&&P.on;let accel=P.crouch?.35:.8,max=P.crouch?2.3:6.3;
 if(L){P.vx=Math.max(-max,P.vx-accel);P.face=-1}if(R){P.vx=Math.min(max,P.vx+accel);P.face=1}if(!L&&!R)P.vx*=.8;
 if(J&&P.on&&!P.crouch&&!P.jumpLock){P.vy=-14.6;P.on=false;P.jumpLock=true}if(!J)P.jumpLock=false;
 P.vy=Math.min(17,P.vy+.78);let old=P.y;P.x+=P.vx;P.y+=P.vy;P.x=Math.max(0,Math.min(WORLD-P.w,P.x));P.on=false;
 let pb=resizePlayerBox();
 for(const p of platforms){const b={x:p[0],y:p[1],w:p[2],h:p[3]};if(overlap(pb,b)&&P.vy>=0&&old+(P.crouch?65:100)<=p[1]+14){if(D&&p[1]<800){P.y=p[1]+22;P.vy=3}else{P.y=p[1]-(P.crouch?65:100);P.vy=0;P.on=true}}}
 if(P.y>1080){P.x=Math.max(60,P.x-300);P.y=600;P.vx=P.vy=0}
 for(const h of H)if(!h.got&&Math.hypot(P.x+31-h.x,P.y+50-h.y)<62){h.got=true;hearts++}
 if(P.x>5030&&hearts===22){won=true;setTimeout(()=>end.classList.remove("hidden"),500)}
 const target=Math.max(0,Math.min(WORLD-canvas.width,P.x-canvas.width*.36));cam+=(target-cam)*.09;
}
function frame(){if(bg.complete&&bg.naturalWidth){drawBackground();drawWorld();drawHUD()}update();requestAnimationFrame(frame)}
bg.onload=()=>{loading.classList.add("hidden");start.classList.remove("hidden");frame()};
bg.onerror=()=>{loading.querySelector("h1").textContent="Missing world artwork";};
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault()});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
document.getElementById("play").onclick=()=>{start.classList.add("hidden");started=true;music.volume=.25;music.play().catch(()=>{})};
document.getElementById("again").onclick=()=>{P.x=180;P.y=650;P.vx=P.vy=0;hearts=0;won=false;cam=0;H.forEach(h=>h.got=false);end.classList.add("hidden");started=true;music.currentTime=0;music.play().catch(()=>{})};
