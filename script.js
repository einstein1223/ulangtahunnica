// ==========================================
// 1. SETUP CANVAS & CONTEXT (PAS 800x600)
// ==========================================
const canvas = document.getElementById("gameCanvas") || document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const dialogBox = document.getElementById("dialog-box");
const dialogName = document.getElementById("dialog-name");
const dialogText = document.getElementById("dialog-text");
const dialogImage = document.getElementById("dialog-image");
const fadeOverlay = document.getElementById("fade-overlay");

canvas.width = 800;
canvas.height = 600;
ctx.imageSmoothingEnabled = false;

// ==========================================
// 2. PARTICLE SYSTEM (OPENING)
// ==========================================
function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;
  const colors = [
    "rgba(255,159,67,0.5)", "rgba(255,107,129,0.4)",
    "rgba(232,67,147,0.3)", "rgba(255,255,255,0.2)"
  ];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const sz = Math.random() * 5 + 2;
    p.style.cssText = `
      width:${sz}px; height:${sz}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      left:${Math.random()*100}%; bottom:-10px;
      animation-delay:${Math.random()*10}s;
      animation-duration:${Math.random()*8+6}s;
      box-shadow:0 0 ${sz*2}px ${colors[Math.floor(Math.random()*colors.length)]};
    `;
    container.appendChild(p);
  }
}
createParticles();

// ==========================================
// 3. SCENE TRANSITION
// ==========================================
let gameStarted = false;

function startGame() {
  const os = document.getElementById("opening-screen");
  const gc = document.getElementById("game-container");
  const pc = document.getElementById("particles");
  if (os) {
    os.classList.add("fade-out");
    setTimeout(() => {
      os.classList.add("hidden");
      if (pc) pc.style.display = "none";
      if (gc) gc.classList.remove("hidden");
      gameStarted = true;
      requestAnimationFrame(gameLoop);
    }, 1000);
  } else {
    gameStarted = true;
    requestAnimationFrame(gameLoop);
  }
}

function triggerFadeTransition(cb) {
  if (!fadeOverlay) { cb(); return; }
  fadeOverlay.style.opacity = "1";
  setTimeout(() => { cb(); setTimeout(() => { fadeOverlay.style.opacity = "0"; }, 500); }, 500);
}

// ==========================================
// 4. ASSET LOADER
// ==========================================
function loadImg(src) { const i = new Image(); i.src = src; return i; }

const bgImg       = loadImg("assets/bg.png");
const chestImg    = loadImg("assets/chest.png");
const barrelImg   = loadImg("assets/barrel.png");
const flagImg     = loadImg("assets/flag.png");
const helmImg     = loadImg("assets/ship_helm.png");
const swordImg    = loadImg("assets/sword.png");
const palmBackImg = loadImg("assets/palm_back.png");
const terrainImg  = loadImg("assets/terrain.png");
const pohonImg    = loadImg("assets/palm.png");
const kadoImg     = loadImg("assets/coin.png");
const fotoTeman1  = loadImg("assets/npc/teman1.png");
const fotoTeman2  = loadImg("assets/npc/teman2.png");
const fotoTeman3  = loadImg("assets/npc/teman3.png");

const waterTopFrames = [loadImg("assets/1.png"), loadImg("assets/2.png"), loadImg("assets/3.png"), loadImg("assets/4.png")];
const coinFrames     = [loadImg("assets/coin.png")];
const diamondFrames  = [loadImg("assets/barrel.png")];

const playerAnims = {
  idle: [loadImg("assets/player/idle.png")],
  run:  [loadImg("assets/player/run.png")],
  jump: [loadImg("assets/player/jump.png")]
};

const npcAnims = {
  crabby:      [loadImg("assets/npc_crabby.png")],
  pinkStar:    [loadImg("assets/npc_star.png")],
  fierceTooth: [loadImg("assets/npc_tooth.png")],
  teman1: [fotoTeman1], teman2: [fotoTeman2], teman3: [fotoTeman3]
};

const TILE = 32, COLS = 60, ROWS = 19;
const MW = COLS * TILE, MH = ROWS * TILE;

// ==========================================
// 5. MAP DESIGN
// ==========================================
const grid = [];
for (let r = 0; r < ROWS; r++) {
  const row = [];
  for (let c = 0; c < COLS; c++) {
    if (r === 0 || c === 0 || c === COLS - 1) row.push(3);
    else if (r >= 16) row.push(1);
    else if (r === 15) row.push(4);
    else if (
      (r===12&&c>=5&&c<=10)||(r===10&&c>=14&&c<=18)||(r===13&&c>=22&&c<=28)||
      (r===9&&c>=30&&c<=36)||(r===12&&c>=40&&c<=46)||
      (r===8&&c>=47&&c<=55)
    ) row.push(2);
    else row.push(0);
  }
  grid.push(row);
}

const props = [
  {img:helmImg,x:8*TILE,y:12*TILE-32,w:32,h:32},
  {img:barrelImg,x:17*TILE,y:10*TILE-28,w:24,h:28},
  {img:swordImg,x:25*TILE,y:13*TILE-24,w:24,h:24},
  {img:barrelImg,x:35*TILE,y:9*TILE-28,w:24,h:28},
  {img:flagImg,x:54*TILE,y:8*TILE-48,w:36,h:48},
  {img:pohonImg,x:12*TILE,y:16*TILE-64,w:48,h:64}
];

const palms = [
  {x:300,y:384,w:96,h:128},{x:750,y:384,w:96,h:128},
  {x:1250,y:384,w:96,h:128},{x:1650,y:384,w:96,h:128}
];

// ==========================================
// 6. COLLECTIBLES
// ==========================================
let collectibles = [
  {x:7*TILE,y:11*TILE-24,w:20,h:20,type:"coin",collected:false},
  {x:16*TILE,y:9*TILE-24,w:20,h:20,type:"diamond",collected:false},
  {x:24*TILE,y:12*TILE-24,w:20,h:20,type:"coin",collected:false},
  {x:33*TILE,y:8*TILE-24,w:20,h:20,type:"diamond",collected:false},
  {x:42*TILE,y:11*TILE-24,w:20,h:20,type:"coin",collected:false},
  {x:49*TILE,y:7*TILE-24,w:20,h:20,type:"diamond",collected:false},
  {x:28*TILE,y:14*TILE-28,w:28,h:28,type:"coin",collected:false}
];
let collectedCount = 0;

// ==========================================
// 7. EFFECTS — particles, dust, score popup, fireflies
// ==========================================
let fx = [];   
let dust = []; 
let pops = []; 
let flies = []; 

for (let i = 0; i < 25; i++) {
  flies.push({
    x: Math.random() * MW,
    y: Math.random() * 400 + 60,
    phase: Math.random() * Math.PI * 2,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.15,
    size: Math.random() * 2.5 + 1,
    alpha: Math.random() * 0.4 + 0.1,
    pulse: Math.random() * 0.03 + 0.01
  });
}

function spawnBurst(x, y, col, n) {
  for (let i = 0; i < n; i++) {
    fx.push({
      x, y,
      vx: (Math.random()-0.5)*5,
      vy: (Math.random()-0.5)*5-2,
      life: 1, decay: Math.random()*0.03+0.015,
      sz: Math.random()*4+1.5, col
    });
  }
}

function spawnDust(x, y) {
  for (let i = 0; i < 3; i++) {
    dust.push({
      x: x + (Math.random()-0.5)*8,
      y: y,
      vx: (Math.random()-0.5)*1.5,
      vy: -Math.random()*1.2,
      life: 1, decay: 0.04+Math.random()*0.02,
      sz: Math.random()*3+1
    });
  }
}

function spawnPop(x, y, text, col) {
  pops.push({ x, y, text, col, life: 1, vy: -1.2 });
}

function updateFx() {
  for (let i = fx.length-1; i >= 0; i--) {
    const p = fx[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= p.decay;
    if (p.life <= 0) { fx.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = p.life * 0.8;
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y, p.sz * p.life, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  for (let i = dust.length-1; i >= 0; i--) {
    const d = dust[i];
    d.x += d.vx; d.y += d.vy; d.life -= d.decay;
    if (d.life <= 0) { dust.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = d.life * 0.4;
    ctx.fillStyle = "#c9b18c";
    ctx.beginPath();
    ctx.arc(d.x - camX, d.y, d.sz * d.life, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  for (let i = pops.length-1; i >= 0; i--) {
    const p = pops[i];
    p.y += p.vy; p.life -= 0.012;
    if (p.life <= 0) { pops.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.col;
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.text, p.x - camX, p.y);
    ctx.restore();
  }
}

function drawFireflies(frame) {
  for (const f of flies) {
    f.phase += f.pulse;
    f.x += f.speedX;
    f.y += Math.sin(f.phase) * 0.3 + f.speedY;
    if (f.x < 0) f.x = MW;
    if (f.x > MW) f.x = 0;

    const sx = f.x - camX;
    if (sx < -20 || sx > canvas.width + 20) continue;

    const a = f.alpha * (0.5 + 0.5 * Math.sin(f.phase));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffe082";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(255,224,130,0.6)";
    ctx.beginPath();
    ctx.arc(sx, f.y, f.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

// ==========================================
// 8. PLAYER & POSISI NPC
// ==========================================
let player = {
  x:100, y:450, width:44, height:44,
  vx:0, vy:0, speed:3.2, accel:0.4,
  friction:0.82, jumpPow:-11.5, grav:0.48,
  grounded:false, facingLeft:false,
  runTimer: 0
};

let camX = 0;

let npcs = [
  {id:1,  x:200,  y:472, w:40, h:40, anims:npcAnims.teman1,      portrait:"assets/npc/teman1.png", name:"Bintang",  question:"Berapakah hasil dari 7 x 8?", answer:"56",  successMsg:"56! Benar banget!",        interacted:false},
  {id:2,  x:380,  y:472, w:40, h:40, anims:npcAnims.teman2,      portrait:"assets/npc/teman2.png", name:"Annissa",  question:"Berapakah hasil dari 9 x 8?", answer:"72",  successMsg:"72! Pintar banget!",       interacted:false},
  {id:3,  x:550,  y:472, w:40, h:40, anims:npcAnims.teman3,      portrait:"assets/npc/teman3.png", name:"Daniel",   question:"Berapakah hasil dari 6 x 7?", answer:"42",  successMsg:"42! Tepat sekali!",        interacted:false},
  {id:4,  x:720,  y:472, w:40, h:40, anims:npcAnims.crabby,                                        name:"Teman 4",  question:"Berapakah hasil dari 8 x 8?", answer:"64",  successMsg:"64!",                      interacted:false},
  {id:5,  x:880,  y:472, w:40, h:40, anims:npcAnims.pinkStar,                                      name:"Teman 5",  question:"Berapakah hasil dari 9 x 7?", answer:"63",  successMsg:"63!",                      interacted:false},
  {id:6,  x:1050, y:472, w:40, h:40, anims:npcAnims.fierceTooth,                                   name:"Teman 6",  question:"Berapakah hasil dari 7 x 7?", answer:"49",  successMsg:"49!",                      interacted:false},
  {id:7,  x:1200, y:472, w:40, h:40, anims:npcAnims.crabby,                                        name:"Teman 7",  question:"Berapakah hasil dari 12 x 12?",answer:"144", successMsg:"144!",                      interacted:false},
  {id:8,  x:1350, y:472, w:40, h:40, anims:npcAnims.pinkStar,                                      name:"Teman 8",  question:"Berapakah hasil dari 11 x 11?",answer:"121", successMsg:"121!",                      interacted:false},
  {id:9,  x:1500, y:472, w:40, h:40, anims:npcAnims.fierceTooth,                                   name:"Teman 9",  question:"Berapakah hasil dari 13 x 5?", answer:"65",  successMsg:"65!",                      interacted:false},
  {id:10, x:1650, y:472, w:40, h:40, anims:npcAnims.crabby,                                        name:"Teman 10", question:"Berapakah hasil dari 15 x 6?", answer:"90",  successMsg:"90!",                      interacted:false},
  {id:11, x:1750, y:472, w:40, h:40, anims:npcAnims.pinkStar,                                      name:"Teman 11", question:"Berapakah hasil dari 14 x 5?", answer:"70",  successMsg:"70!",                      interacted:false}
];

let specialSurprise = {
  x: 48 * TILE, 
  y: 8 * TILE - 44, 
  width: 44, 
  height: 44,
  img: chestImg, 
  portrait: "assets/chest.png",
  name: "Peti Harta Perkalian",
  question: "TANTANGAN AKHIR: Berapakah hasil dari 14 x 14?",
  answer: "196", 
  successMsg: "196!! SELAMAT ULANG TAHUN SAYANG!",
  active: true 
};

let foundCount = 0;
const totalFriends = npcs.length;

// ==========================================
// 9. INPUT & INTERAKSI (E / ENTER)
// ==========================================
let keys = {}, dialogOpen = false;

window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if ((e.code==="Space"||e.code==="KeyW"||e.code==="ArrowUp") && player.grounded && !dialogOpen && gameStarted) {
    player.vy = player.jumpPow;
    player.grounded = false;
  }
});
window.addEventListener("keyup", e => keys[e.code] = false);

window.addEventListener("keydown", e => {
  if (!gameStarted) return;
  if (e.code === "KeyE" || e.code === "Enter") {
    if (dialogOpen) { tutupDialog(); return; }

    let dxPeti = (player.x + player.width/2) - (specialSurprise.x + specialSurprise.width/2);
    let dyPeti = (player.y + player.height/2) - (specialSurprise.y + specialSurprise.height/2);
    if (Math.hypot(dxPeti, dyPeti) < 110) {
      mulaiDialogKuis(specialSurprise);
      return;
    }

    npcs.forEach(npc => {
      let dx = (player.x + player.width/2) - (npc.x + npc.w/2);
      let dy = (player.y + player.height/2) - (npc.y + npc.h/2);
      if (Math.hypot(dx, dy) < 95) {
        mulaiDialogKuis(npc);
      }
    });
  }
});

// ==========================================
// 10. TYPEWRITER EFFECT
// ==========================================
let twInterval = null;
function typewriter(el, text, speed, cb) {
  if (twInterval) clearInterval(twInterval);
  el.textContent = ""; el.classList.remove("typing-done");
  let i = 0;
  twInterval = setInterval(() => {
    if (i < text.length) { el.textContent += text.charAt(i); i++; }
    else { clearInterval(twInterval); twInterval = null; el.classList.add("typing-done"); if (cb) cb(); }
  }, speed);
}

// ==========================================
// 11. DIALOG KUIS INTERAKTIF
// ==========================================
function mulaiDialogKuis(target) {
  dialogOpen = true; player.vx = 0;

  if (target === specialSurprise && foundCount < totalFriends) {
    if (dialogBox && dialogName && dialogText) {
      dialogName.innerText = target.name;
      dialogBox.classList.remove("hidden");
      typewriter(dialogText, `Eits! Selesaikan dulu kuis dari 11 kru di bawah ya! (Baru ${foundCount}/11)`, 30);
    }
    setTimeout(() => {
      alert(`Peti Harta terkunci! Kamu baru menjawab ${foundCount} dari 11 kuis teman-temanmu di bawah.`);
      tutupDialog();
    }, 500);
    return;
  }

  if (dialogBox && dialogName && dialogText) {
    if (dialogImage && target.portrait) {
      dialogImage.src = target.portrait;
      dialogImage.style.display = "block";
      dialogImage.style.animation = "none";
      dialogImage.offsetHeight;
      dialogImage.style.animation = "";
    } else if (dialogImage) dialogImage.style.display = "none";

    dialogName.innerText = target.name;
    dialogBox.classList.remove("hidden");
    typewriter(dialogText, `Kuis: ${target.question}`, 30);
  }

  setTimeout(() => {
    let ans = prompt(`${target.name} bertanya:\n"${target.question}"\n\nKetik jawabanmu:`);
    if (ans === null) { tutupDialog(); }
    else if (ans.trim() === target.answer) {
      if (!target.interacted && target.id) {
        target.interacted = true; foundCount++;
        const el = document.getElementById("progress-count");
        if (el) el.innerText = foundCount;
        spawnBurst(target.x+target.w/2, target.y+target.h/2, "#2ed573", 20);
        spawnBurst(target.x+target.w/2, target.y+target.h/2, "#ff9f43", 12);
        spawnPop(target.x+target.w/2, target.y-20, "Benar!", "#2ed573");
        tutupDialog();
      } else if (target === specialSurprise) {
        if (dialogText) typewriter(dialogText, `BENAR! ${target.successMsg}`, 25);
        for (let i=0;i<8;i++) {
          setTimeout(()=>{
            spawnBurst(target.x+target.width/2+(Math.random()-0.5)*120, target.y+(Math.random()-0.5)*60,
              ["#ff9f43","#ff6b81","#2ed573","#00d2d3","#f1c40f","#a855f7","#fb923c","#ff6bab"][i], 20);
          }, i*150);
        }
        setTimeout(() => { window.location.href = "halaman_audio.html"; }, 2500);
      }
    } else {
      alert("Gapapa nica, coba lagii semua pernah salah kok, prabowo aja banyak salah");
      tutupDialog();
    }
  }, 600);
}

function tutupDialog() {
  if (twInterval) { clearInterval(twInterval); twInterval = null; }
  if (dialogBox) { dialogBox.classList.add("hidden"); dialogOpen = false; }
  else dialogOpen = false;
}

// ==========================================
// 12. RENDERING HELPERS
// ==========================================
function drawShadow(x, y, w) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x+w/2-camX, y+w-2, w/2.5, 4, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawSprite(img, x, y, w, h, bob, flip) {
  ctx.save();
  if (flip) {
    ctx.translate(x+w, y+bob);
    ctx.scale(-1,1);
    if (img&&img.complete&&img.naturalWidth) ctx.drawImage(img,0,0,w,h);
    else { ctx.fillStyle="#ff9f43"; ctx.fillRect(0,0,w,h); }
  } else {
    if (img&&img.complete&&img.naturalWidth) ctx.drawImage(img,x,y+bob,w,h);
    else { ctx.fillStyle="#ff9f43"; ctx.fillRect(x,y+bob,w,h); }
  }
  ctx.restore();
}

function drawCompass(frame) {
  let nearest = null, minD = Infinity;
  npcs.forEach(n => {
    if (!n.interacted) {
      let d = Math.hypot(player.x-n.x, player.y-n.y);
      if (d < minD) { minD = d; nearest = n; }
    }
  });
  if (foundCount === totalFriends) {
    let d = Math.hypot(player.x-specialSurprise.x, player.y-specialSurprise.y);
    if (d < minD) { nearest = specialSurprise; }
  }
  if (!nearest || minD < 120) return;

  const px = player.x + player.width/2 - camX;
  const py = player.y - 20;
  const angle = Math.atan2(
    (nearest.y||nearest.y) - player.y,
    (nearest.x||nearest.x) - player.x
  );

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.5 + Math.sin(frame*0.05)*0.2;
  ctx.fillStyle = "#ff9f43";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(10, -5);
  ctx.lineTo(10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVignette() {
  ctx.save();
  const g = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.4,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75
  );
  g.addColorStop(0, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, "rgba(18, 5, 15, 0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawStars(frame) {
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 47.3) % canvas.width);
    const sy = ((i * 23.7) % (canvas.height * 0.4));
    const a = 0.2 + 0.3 * Math.sin(frame * 0.02 + i * 1.3);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8 + (i%3)*0.3, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBubble(sx, y, w, prox, frame) {
  const sc = Math.min(prox/65, 1);
  const bob = Math.sin(frame*0.1)*2;
  ctx.save();
  ctx.globalAlpha = sc;

  const bx = sx+w/2-18, by = y-30+bob, bw = 36, bh = 22, r = 6;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.moveTo(bx+r, by);
  ctx.lineTo(bx+bw-r, by);
  ctx.quadraticCurveTo(bx+bw, by, bx+bw, by+r);
  ctx.lineTo(bx+bw, by+bh-r);
  ctx.quadraticCurveTo(bx+bw, by+bh, bx+bw-r, by+bh);
  ctx.lineTo(bx+bw/2+4, by+bh);
  ctx.lineTo(bx+bw/2, by+bh+6);
  ctx.lineTo(bx+bw/2-4, by+bh);
  ctx.lineTo(bx+r, by+bh);
  ctx.quadraticCurveTo(bx, by+bh, bx, by+bh-r);
  ctx.lineTo(bx, by+r);
  ctx.quadraticCurveTo(bx, by, bx+r, by);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2c1b4d";
  ctx.font = "13px sans-serif";
  ctx.fillText("💬", bx+8, by+16);

  ctx.fillStyle = "#ff9f43";
  ctx.font = "bold 11px 'Outfit',sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("[E]", sx+w/2, by-6);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = "rgba(16,8,30,0.65)";
  const hx=15,hy=60,hw=145,hh=34,hr=8;
  ctx.beginPath();
  ctx.moveTo(hx+hr,hy); ctx.lineTo(hx+hw-hr,hy);
  ctx.quadraticCurveTo(hx+hw,hy,hx+hw,hy+hr);
  ctx.lineTo(hx+hw,hy+hh-hr);
  ctx.quadraticCurveTo(hx+hw,hy+hh,hx+hw-hr,hy+hh);
  ctx.lineTo(hx+hr,hy+hh);
  ctx.quadraticCurveTo(hx,hy+hh,hx,hy+hh-hr);
  ctx.lineTo(hx,hy+hr);
  ctx.quadraticCurveTo(hx,hy,hx+hr,hy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,159,67,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#ff9f43";
  ctx.font = "bold 13px 'Outfit',sans-serif";
  ctx.fillText(`Permata: ${collectedCount} / ${collectibles.length}`, 28, 82);
  ctx.restore();
}

function updateQuestGuide() {
  const el = document.getElementById("target-name");
  if (!el) return;
  if (foundCount === totalFriends) { el.innerText = "Buka Peti Harta di Puncak!"; return; }
  let nearest = null, minD = Infinity;
  npcs.forEach(n => {
    if (!n.interacted) {
      let d = Math.hypot(player.x-n.x, player.y-n.y);
      if (d<minD) { minD=d; nearest=n; }
    }
  });
  if (nearest) el.innerText = nearest.name;
}

// ==========================================
// 13. GAME LOOP
// ==========================================
let frame = 0;

function gameLoop() {
  if (!gameStarted) return;
  frame++;

  // ─── physics ───
  if (!dialogOpen) {
    if (keys["ArrowLeft"]||keys["KeyA"]) {
      if (player.vx > -player.speed) player.vx -= player.accel;
      player.facingLeft = true;
    } else if (keys["ArrowRight"]||keys["KeyD"]) {
      if (player.vx < player.speed) player.vx += player.accel;
      player.facingLeft = false;
    } else {
      player.vx *= player.friction;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }
  } else {
    player.vx *= player.friction;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  player.vy += player.grav;
  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  if (Math.abs(player.vx) > 1.5 && player.grounded && frame % 6 === 0) {
    spawnDust(player.x + player.width/2, player.y + player.height);
  }

  // collision
  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      let t = grid[r][c], bx = c*TILE, by = r*TILE;
      if (t===1||t===2||t===3) {
        if (player.vy>0 && player.x+player.width>bx+8 && player.x<bx+TILE-8 &&
            player.y+player.height>=by && player.y+player.height<=by+18) {
          player.y = by-player.height; player.vy=0; player.grounded=true;
        }
      }
    }
  }
  if (player.x<TILE) { player.x=TILE; player.vx=0; }
  if (player.x+player.width>MW-TILE) { player.x=MW-TILE-player.width; player.vx=0; }

  // collectibles
  collectibles.forEach(item => {
    if (!item.collected &&
        player.x+player.width>item.x && player.x<item.x+item.w &&
        player.y+player.height>item.y && player.y<item.y+item.h) {
      item.collected = true; collectedCount++;
      const cols = {coin:"#f1c40f",diamond:"#00d2d3",coin:"#e84393"};
      spawnBurst(item.x+item.w/2, item.y+item.h/2, cols[item.type]||"#fff", 12);
      spawnPop(item.x+item.w/2, item.y-10, "+1", cols[item.type]||"#fff");
    }
  });

  // camera
  let tgt = player.x - canvas.width/2 + player.width/2;
  camX += (tgt - camX) * 0.06;
  if (camX < 0) camX = 0;
  if (camX > MW - canvas.width) camX = MW - canvas.width;

  updateQuestGuide();

  // ─── RENDER ───
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // sky
  if (bgImg.complete && bgImg.naturalWidth) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    let sky = ctx.createLinearGradient(0,0,0,canvas.height);
    sky.addColorStop(0, "#0d0b2b");
    sky.addColorStop(0.3, "#1f1040");
    sky.addColorStop(0.55, "#6b3a5a");
    sky.addColorStop(0.75, "#d9856a");
    sky.addColorStop(1, "#eec39a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // stars
  drawStars(frame);

  // parallax palms
  palms.forEach(bp => {
    let sx = bp.x - camX*0.7;
    if (sx > -150 && sx < canvas.width+150) {
      if (palmBackImg.complete && palmBackImg.naturalWidth) ctx.drawImage(palmBackImg, sx, bp.y, bp.w, bp.h);
    }
  });

  // fireflies (behind terrain)
  drawFireflies(frame);

  // terrain
  const wfIdx = Math.floor(frame/15) % waterTopFrames.length;
  const wImg = waterTopFrames[wfIdx];

  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      let t = grid[r][c], x = c*TILE-camX, y = r*TILE;
      if (x > -TILE && x < canvas.width) {
        if (t===1||t===2) {
          if (terrainImg.complete && terrainImg.naturalWidth) {
            ctx.drawImage(terrainImg, 0, 0, 32, 32, x, y, TILE, TILE);
          } else {
            let g = ctx.createLinearGradient(x,y,x,y+TILE);
            g.addColorStop(0, t===1?"#4a9e4c":"#5cb85c");
            g.addColorStop(0.15, t===1?"#38683a":"#4e8f4c");
            g.addColorStop(1, t===1?"#274528":"#38683a");
            ctx.fillStyle = g;
            ctx.fillRect(x,y,TILE,TILE);
            ctx.fillStyle = t===1?"#5cb85c":"#72c972";
            for (let b=0;b<4;b++) {
              const bx = x + b*(TILE/4) + 2;
              ctx.fillRect(bx, y-1, 3, 3);
            }
          }
        } else if (t===3) {
          let g = ctx.createLinearGradient(x,y,x+TILE,y+TILE);
          g.addColorStop(0,"#6b6b7d"); g.addColorStop(1,"#4a4a5d");
          ctx.fillStyle = g;
          ctx.fillRect(x,y,TILE,TILE);
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x+0.5,y+0.5,TILE-1,TILE-1);
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.fillRect(x,y,TILE,2);
        } else if (t===4) {
          let wave = Math.sin(frame*0.06+c*0.4)*3;
          if (wImg&&wImg.complete&&wImg.naturalWidth) {
            ctx.drawImage(wImg, x, y+wave, TILE, TILE+6);
          } else {
            ctx.fillStyle = "rgba(72,219,251,0.7)";
            ctx.fillRect(x, y+wave, TILE, TILE);
            ctx.fillStyle = "rgba(10,140,200,0.35)";
            ctx.fillRect(x, y+wave+10, TILE, TILE-10);
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            ctx.fillRect(x, y+wave, TILE, 2);
          }
        }
      }
    }
  }

  // props
  props.forEach(p => {
    let sx = p.x-camX;
    if (sx > -100 && sx < canvas.width+100) {
      if (p.img&&p.img.complete&&p.img.naturalWidth) ctx.drawImage(p.img, sx, p.y, p.w, p.h);
    }
  });

  // collectibles
  collectibles.forEach(item => {
    if (!item.collected) {
      let sx = item.x-camX;
      let bob = Math.sin(frame*0.05+item.x*0.01)*4;
      if (sx > -50 && sx < canvas.width+50) {
        ctx.save();
        ctx.globalAlpha = 0.15+Math.sin(frame*0.07)*0.08;
        ctx.fillStyle = item.type==="coin"?"#f1c40f":item.type==="diamond"?"#00d2d3":"#e84393";
        ctx.beginPath();
        ctx.ellipse(sx+item.w/2, item.y+item.h+bob, item.w*0.5, 3, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        const frames = item.type==="coin"?coinFrames:item.type==="coin"?[kadoImg]:diamondFrames;
        const img = frames[0];
        if (img&&img.complete&&img.naturalWidth) ctx.drawImage(img, sx, item.y+bob, item.w, item.h);
        else { ctx.fillStyle=item.type==="coin"?"#f1c40f":"#00d2d3"; ctx.fillRect(sx,item.y+bob,item.w,item.h); }
      }
    }
  });

  // NPCs
  npcs.forEach(npc => {
    let sx = npc.x-camX;
    if (sx > -100 && sx < canvas.width+100) {
      let bob = Math.sin(frame*0.04+npc.id*0.7)*3;
      let img = npc.anims[Math.floor(frame/12)%npc.anims.length];

      if (!npc.interacted) {
        let gi = (Math.sin(frame*0.05)+1)/2;
        ctx.save();
        ctx.globalAlpha = gi*0.2;
        ctx.fillStyle = "#ff9f43";
        ctx.beginPath();
        ctx.ellipse(sx+npc.w/2, npc.y+npc.h/2, npc.w*0.7, npc.h*0.7, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      drawShadow(npc.x, npc.y, npc.w);
      drawSprite(img, sx, npc.y, npc.w, npc.h, bob, false);

      let dx=(player.x+player.width/2)-(npc.x+npc.w/2);
      let dy=(player.y+player.height/2)-(npc.y+npc.h/2);
      let dist = Math.sqrt(dx*dx+dy*dy);
      if (dist<95 && !dialogOpen) drawBubble(sx, npc.y, npc.w, Math.max(0,95-dist), frame);

      if (npc.interacted) {
        ctx.save();
        ctx.fillStyle = "#2ed573";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#2ed573";
        ctx.font = "bold 16px 'Outfit',sans-serif";
        ctx.fillText("✓", sx+npc.w-8, npc.y-4);
        ctx.restore();
      }
    }
  });

  // CHEST / SURPRISE AKHIR
  if (specialSurprise.active) {
    let sx = specialSurprise.x-camX;
    let pulse = Math.sin(frame*0.05)*5;
    let gi = (Math.sin(frame*0.04)+1)/2;

    ctx.save();
    ctx.globalAlpha = gi*0.25;
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.ellipse(sx+specialSurprise.width/2, specialSurprise.y+specialSurprise.height/2,
      specialSurprise.width*1.1, specialSurprise.height*1.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    drawShadow(specialSurprise.x, specialSurprise.y, specialSurprise.width);
    if (chestImg.complete&&chestImg.naturalWidth) ctx.drawImage(chestImg,sx,specialSurprise.y+pulse,specialSurprise.width,specialSurprise.height);
    else { ctx.fillStyle="#f1c40f"; ctx.fillRect(sx,specialSurprise.y+pulse,specialSurprise.width,specialSurprise.height); }

    let dx=(player.x+player.width/2)-(specialSurprise.x+specialSurprise.width/2);
    let dy=(player.y+player.height/2)-(specialSurprise.y+specialSurprise.height/2);
    let dist = Math.sqrt(dx*dx+dy*dy);
    if (dist<110 && !dialogOpen) drawBubble(sx, specialSurprise.y, specialSurprise.width, Math.max(0,110-dist), frame);

    ctx.save();
    ctx.fillStyle = "#ff6b81";
    ctx.font = "bold 12px 'Outfit',sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PETI HARTA KARUN", sx+specialSurprise.width/2, specialSurprise.y-14+Math.sin(frame*0.04)*2);
    ctx.textAlign = "start";
    ctx.restore();
  }

  // player
  let pBob = Math.sin(frame*0.1)*1.5;
  let anim = playerAnims.idle;
  if (!player.grounded) anim = playerAnims.jump;
  else if (Math.abs(player.vx)>0.1) anim = playerAnims.run;
  let pImg = anim[Math.floor(frame/8)%anim.length];

  drawShadow(player.x, player.y, player.width);
  drawSprite(pImg, player.x-camX, player.y, player.width, player.height, pBob, player.facingLeft);

  // effects
  updateFx();

  // compass arrow
  drawCompass(frame);

  // vignette
  drawVignette();

  // HUD
  drawHUD();

  requestAnimationFrame(gameLoop);
}