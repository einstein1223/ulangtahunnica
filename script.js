// ==========================================
// 1. SETUP CANVAS & CONTEXT
// ==========================================
const canvas = document.getElementById("gameCanvas") || document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const dialogBox = document.getElementById("dialog-box");
const dialogName = document.getElementById("dialog-name");
const dialogText = document.getElementById("dialog-text");
const dialogImage = document.getElementById("dialog-image"); // Elemen untuk foto potret NPC
const fadeOverlay = document.getElementById("fade-overlay");

canvas.width = 800;
canvas.height = 600;
ctx.imageSmoothingEnabled = false; // Memastikan pixel-art tetap tajam

// ==========================================
// 2. SCENE TRANSITION ENGINE (HALAMAN DEPAN)
// ==========================================
let gameStarted = false;

function startGame() {
  const openingScreen = document.getElementById("opening-screen");
  const gameContainer = document.getElementById("game-container");

  if (openingScreen) {
    openingScreen.style.opacity = "0";
    openingScreen.style.transition = "opacity 0.8s ease";
    setTimeout(() => {
      openingScreen.classList.add("hidden");
      openingScreen.style.display = "none"; // Memastikan layar depan hilang total
      if (gameContainer) gameContainer.classList.remove("hidden");
      gameStarted = true;
      requestAnimationFrame(gameLoop);
    }, 800);
  } else {
    gameStarted = true;
    requestAnimationFrame(gameLoop);
  }
}

function triggerFadeTransition(callback) {
  if (!fadeOverlay) {
    callback();
    return;
  }
  fadeOverlay.style.opacity = "1";
  setTimeout(() => {
    callback();
    setTimeout(() => { fadeOverlay.style.opacity = "0"; }, 400);
  }, 400);
}

// ==========================================
// 3. ADVANCED ASSET & ANIMATION LOADER
// ==========================================
function loadImg(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Memuat deretan frame animasi menjadi array gambar
function loadAnimFrames(basePath, prefix, count, ext = ".png") {
  const frames = [];
  for (let i = 1; i <= count; i++) {
    const padNum = i < 10 ? `0${i}` : `${i}`;
    frames.push(loadImg(`${basePath}/${prefix} ${padNum}${ext}`));
  }
  return frames;
}

// Environment & Props (disesuaikan ke folder assets/)
const bgImg       = loadImg("assets/bg.png");
const chestImg    = loadImg("assets/chest.png");
const barrelImg   = loadImg("assets/barrel.png");
const flagImg     = loadImg("assets/flag.png");
const helmImg     = loadImg("assets/ship_helm.png");
const swordImg    = loadImg("assets/sword.png");
const palmBackImg = loadImg("assets/palm_back.png");

// ---> ASET FOTO BARU <---
const pohonImg    = loadImg("assets/palm.png");
const kadoImg     = loadImg("assets/sword.png");
const fotoTeman1  = loadImg("assets/npc/teman1.png");
const fotoTeman2  = loadImg("assets/npc/teman2.png");
const fotoTeman3  = loadImg("assets/npc/teman3.png");

// ---> AUDIO BUKA SOAL PERKALIAN <---
const kuisSound   = new Audio("audio/jokowi.mp3");
kuisSound.volume  = 1.0;

// Animasi Air & Ombak
const waterTopFrames = [
  loadImg("assets/1.png"),
  loadImg("assets/2.png"),
  loadImg("assets/3.png"),
  loadImg("assets/4.png")
];

// Collectibles Animasi (Koin & Berlian)
const coinFrames = [
  loadImg("assets/coin.png"),
  loadImg("assets/coin.png"),
  loadImg("assets/coin.png"),
  loadImg("assets/coin.png")
];

const diamondFrames = [
  loadImg("assets/barrel.png"),
  loadImg("assets/barrel.png"),
  loadImg("assets/barrel.png"),
  loadImg("assets/barrel.png")
];

// Animasi Karakter (Player)
const playerAnims = {
  idle: [loadImg("assets/player/idle.png")],
  run:  [loadImg("assets/player/run.png")],
  jump: [loadImg("assets/player/jump.png")]
};

// Animasi NPC (Crabby, Pink Star, Fierce Tooth + Foto Custom)
const npcAnims = {
  crabby:      [loadImg("assets/npc_crabby.png")],
  pinkStar:    [loadImg("assets/npc_star.png")],
  fierceTooth: [loadImg("assets/npc_tooth.png")],
  teman1:      [fotoTeman1],
  teman2:      [fotoTeman2],
  teman3:      [fotoTeman3]
};

const TILE_SIZE = 32;
const MAP_COLS = 60;
const MAP_ROWS = 19;
const MAP_W = MAP_COLS * TILE_SIZE;
const MAP_H = MAP_ROWS * TILE_SIZE;

// ==========================================
// 4. MAP DESIGN
// ==========================================
const mapGrid = [];
for (let r = 0; r < MAP_ROWS; r++) {
  const row = [];
  for (let c = 0; c < MAP_COLS; c++) {
    if (r === 0 || c === 0 || c === MAP_COLS - 1) {
      row.push(3);
    } else if (r >= 16) {
      row.push(1);
    } else if (r === 15) {
      row.push(4);
    } else if (
      (r === 12 && c >= 5  && c <= 10) ||
      (r === 10 && c >= 14 && c <= 18) ||
      (r === 13 && c >= 22 && c <= 28) ||
      (r === 9  && c >= 30 && c <= 36) ||
      (r === 12 && c >= 40 && c <= 46) ||
      (r === 8  && c >= 48 && c <= 54)
    ) {
      row.push(2);
    } else {
      row.push(0);
    }
  }
  mapGrid.push(row);
}

// Dekorasi statis & interaktif
const props = [
  { img: helmImg,   x: 8 * TILE_SIZE,  y: 12 * TILE_SIZE - 32, w: 32, h: 32 },
  { img: barrelImg, x: 17 * TILE_SIZE, y: 10 * TILE_SIZE - 28, w: 24, h: 28 },
  { img: swordImg,  x: 25 * TILE_SIZE, y: 13 * TILE_SIZE - 24, w: 24, h: 24 },
  { img: barrelImg, x: 35 * TILE_SIZE, y: 9 * TILE_SIZE - 28,  w: 24, h: 28 },
  { img: flagImg,   x: 53 * TILE_SIZE, y: 8 * TILE_SIZE - 48,  w: 36, h: 48 },
  { img: pohonImg,  x: 12 * TILE_SIZE, y: 16 * TILE_SIZE - 64, w: 48, h: 64 }
];

const backPalms = [
  { x: 300, y: 300, w: 96, h: 128 },
  { x: 750, y: 230, w: 96, h: 128 },
  { x: 1250, y: 290, w: 96, h: 128 },
  { x: 1650, y: 250, w: 96, h: 128 }
];

// ==========================================
// 5. COLLECTIBLES
// ==========================================
let collectibles = [
  { x: 7 * TILE_SIZE,  y: 11 * TILE_SIZE - 24, w: 20, h: 20, type: "coin",    collected: false },
  { x: 16 * TILE_SIZE, y: 9 * TILE_SIZE - 24,  w: 20, h: 20, type: "diamond", collected: false },
  { x: 24 * TILE_SIZE, y: 12 * TILE_SIZE - 24, w: 20, h: 20, type: "coin",    collected: false },
  { x: 33 * TILE_SIZE, y: 8 * TILE_SIZE - 24,  w: 20, h: 20, type: "diamond", collected: false },
  { x: 42 * TILE_SIZE, y: 11 * TILE_SIZE - 24, w: 20, h: 20, type: "coin",    collected: false },
  { x: 49 * TILE_SIZE, y: 7 * TILE_SIZE - 24,  w: 20, h: 20, type: "diamond", collected: false },
  { x: 28 * TILE_SIZE, y: 14 * TILE_SIZE - 28, w: 28, h: 28, type: "kado",    collected: false }
];

let collectedCount = 0;

// ==========================================
// 6. PLAYER PHYSICS & STATS (SPEED SANTAI)
// ==========================================
let player = {
  x: 100,
  y: 400,
  width: 44,
  height: 44,
  vx: 0,
  vy: 0,
  speed: 3.2,        // DITURUNKAN: supaya lari lebih santai & mudah dikontrol
  acceleration: 0.4, // DITURUNKAN: supaya akselerasi lebih halus
  friction: 0.82,
  jumpPower: -11.5,
  gravity: 0.48,
  grounded: false,
  facingLeft: false,
  state: "idle",
  animIndex: 0,
  animTimer: 0
};

let cameraX = 0;

// Daftar NPC beserta foto potretnya
let npcs = [
  { id: 1,  x: 200,  y: 440, w: 40, h: 40, anims: npcAnims.teman1,      portrait: "assets/npc/teman1.png", name: "Bintang",  question: "Berapakah hasil dari 7 x 8?", answer: "56", successMsg: "56! Benar banget! Kamu hebat!", interacted: false },
  { id: 2,  x: 220,  y: 340, w: 40, h: 40, anims: npcAnims.teman2,      portrait: "assets/npc/teman2.png", name: "Annissa",  question: "Berapakah hasil dari 9 x 8?", answer: "72", successMsg: "72! Pintar banget kaptenku!", interacted: false },
  { id: 3,  x: 500,  y: 280, w: 40, h: 40, anims: npcAnims.teman3,      portrait: "assets/npc/teman3.png", name: "Daniel",   question: "Berapakah hasil dari 6 x 7?", answer: "42", successMsg: "42! Tepat sekali!", interacted: false },
  { id: 4,  x: 750,  y: 380, w: 40, h: 40, anims: npcAnims.crabby,      name: "Teman 4",  question: "Berapakah hasil dari 8 x 8?", answer: "64", successMsg: "64! Wah, gak ada salahnya!", interacted: false },
  { id: 5,  x: 1000, y: 250, w: 40, h: 40, anims: npcAnims.pinkStar,    name: "Teman 5",  question: "Berapakah hasil dari 9 x 7?", answer: "63", successMsg: "63! Perfect!", interacted: false },
  { id: 6,  x: 1100, y: 440, w: 40, h: 40, anims: npcAnims.fierceTooth, name: "Teman 6",  question: "Berapakah hasil dari 7 x 7?", answer: "49", successMsg: "49! Kuadrat yang cantik!", interacted: false },
  { id: 7,  x: 1350, y: 340, w: 40, h: 40, anims: npcAnims.crabby,      name: "Teman 7",  question: "Berapakah hasil dari 12 x 12?", answer: "144", successMsg: "144! Angka besar pun bisa!", interacted: false },
  { id: 8,  x: 1500, y: 440, w: 40, h: 40, anims: npcAnims.pinkStar,    name: "Teman 8",  question: "Berapakah hasil dari 11 x 11?", answer: "121", successMsg: "121! Kamu jago hitung!", interacted: false },
  { id: 9,  x: 1600, y: 220, w: 40, h: 40, anims: npcAnims.fierceTooth, name: "Teman 9",  question: "Berapakah hasil dari 13 x 5?", answer: "65", successMsg: "65! Semakin dekat ke puncak!", interacted: false },
  { id: 10, x: 1700, y: 440, w: 40, h: 40, anims: npcAnims.crabby,      name: "Teman 10", question: "Berapakah hasil dari 15 x 6?", answer: "90", successMsg: "90! Satu lagi menuju harta karun!", interacted: false },
  { id: 11, x: 1400, y: 440, w: 40, h: 40, anims: npcAnims.pinkStar,    name: "Teman 11", question: "Berapakah hasil dari 14 x 5?", answer: "70", successMsg: "70! Luar biasa, semua kru udah dijawab!", interacted: false }
];

let specialSurprise = {
  x: 50 * TILE_SIZE,
  y: 8 * TILE_SIZE - 40,
  width: 44,
  height: 44,
  img: chestImg,
  portrait: "assets/chest.png",
  name: "💎 Peti Harta Perkalian",
  question: "🏆 TANTANGAN AKHIR: Berapakah hasil dari 14 x 14?",
  answer: "196",
  successMsg: "196!! SELAMAT ULANG TAHUN SAYANG! Kamu berhasil menaklukkan pulau ini! ❤️",
  active: false
};

let foundFriendsCount = 0;
const totalFriends = npcs.length;

// ==========================================
// 7. INPUT CONTROLLER & DIALOGUE (CUSTOM LOGIC)
// ==========================================
let keys = {};
let dialogOpen = false;

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if ((e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") && player.grounded && !dialogOpen && gameStarted) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
});
window.addEventListener("keyup", (e) => keys[e.code] = false);

window.addEventListener("keydown", (e) => {
  if (!gameStarted) return;
  if (e.code === "KeyE" || e.code === "Enter") {
    if (dialogOpen) {
      tutupDialog();
      return;
    }

    npcs.forEach((npc) => {
      let dx = (player.x + player.width/2) - (npc.x + npc.w/2);
      let dy = (player.y + player.height/2) - (npc.y + npc.h/2);
      if (Math.sqrt(dx*dx + dy*dy) < 65) {
        mulaiDialogKuis(npc);
      }
    });

    if (specialSurprise.active) {
      let dx = (player.x + player.width/2) - (specialSurprise.x + specialSurprise.width/2);
      let dy = (player.y + player.height/2) - (specialSurprise.y + specialSurprise.height/2);
      if (Math.sqrt(dx*dx + dy*dy) < 70) {
        mulaiDialogKuis(specialSurprise);
      }
    }
  }
});

function mulaiDialogKuis(target) {
  dialogOpen = true;
  player.vx = 0;
  
  // 1. MAINKAN SUARA BUKA PERKALIAN
  if (kuisSound) {
    kuisSound.currentTime = 0;
    kuisSound.play().catch(e => console.log("Audio play error:", e));
  }

  if (dialogBox && dialogName && dialogText) {
    dialogBox.style.opacity = "0";
    setTimeout(() => {
      dialogName.innerText = target.name;
      dialogText.innerText = `💡 Kuis: ${target.question}`;
      
      if (dialogImage && target.portrait) {
        dialogImage.src = target.portrait;
        dialogImage.style.display = "block";
      } else if (dialogImage) {
        dialogImage.style.display = "none";
      }

      dialogBox.classList.remove("hidden");
      dialogBox.style.opacity = "1";
    }, 150);
  }

  setTimeout(() => {
    let jawabanPlayer = prompt(`${target.name} bertanya:\n"${target.question}"\n\nKetik jawabanmu angka saja:`);

    if (jawabanPlayer === null) {
      tutupDialog(); // Langsung tutup supaya bisa lanjut jalan
    } else if (jawabanPlayer.trim() === target.answer) {
      // JIKA BENAR (TEMAN/NPC): Langsung centang dan tutup dialog tanpa teks/audio
      if (!target.interacted && target.id) {
        target.interacted = true;
        foundFriendsCount++;
        const progressEl = document.getElementById("progress-count");
        if (progressEl) progressEl.innerText = foundFriendsCount;
        
        if (foundFriendsCount === totalFriends) {
          specialSurprise.active = true;
        }
        
        tutupDialog();
      } 
      // JIKA BENAR (PETI HARTA AKHIR): Tampilkan ucapan sebentar, lalu pindah ke halaman audio
      else if (target === specialSurprise) {
        if (dialogText) dialogText.innerText = `🎉 BENAR! ${target.successMsg}`;
        setTimeout(() => {
          // GANTI "halaman_audio.html" dengan link/file websitemu yang berisi audio spesial
          window.location.href = "halaman_audio.html"; 
        }, 1500);
      }

    } else {
      // JIKA SALAH: Muncul pesan khusus, setelah klik OK langsung tutup agar bisa lanjut jalan
      alert("Gapapa nica, coba lagii semua pernah salah kok, prabowo aja banyak salah");
      tutupDialog();
    }
  }, 400);
}

function tutupDialog() {
  if (dialogBox) {
    dialogBox.style.opacity = "0";
    setTimeout(() => {
      dialogBox.classList.add("hidden");
      dialogOpen = false;
    }, 300);
  } else {
    dialogOpen = false;
  }
}

// ==========================================
// 8. RENDER HELPER & UI HUD
// ==========================================
function drawShadow(x, y, width) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + width/2 - cameraX, y + width - 4, width/3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAnimatedSprite(img, x, y, w, h, bob, flip = false) {
  ctx.save();
  if (flip) {
    ctx.translate(x + w, y + bob);
    ctx.scale(-1, 1);
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#ff9f43";
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, x, y + bob, w, h);
    } else {
      ctx.fillStyle = "#ff9f43";
      ctx.fillRect(x, y + bob, w, h);
    }
  }
  ctx.restore();
}

function renderCollectiblesHUD() {
  ctx.fillStyle = "rgba(20, 10, 35, 0.85)";
  ctx.fillRect(15, 60, 130, 38);
  ctx.strokeStyle = "#ff9f43";
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 60, 130, 38);

  ctx.fillStyle = "#ff9f43";
  ctx.font = "bold 14px Courier New";
  ctx.fillText(`💎 Permata: ${collectedCount} / ${collectibles.length}`, 24, 84);
}

function updateQuestGuide() {
  const targetEl = document.getElementById("target-name");
  if (!targetEl) return;

  if (specialSurprise.active) {
    targetEl.innerText = "Buka Peti Harta di Puncak! 🏴‍☠️";
    return;
  }
  let nearestNPC = null;
  let minDst = Infinity;
  npcs.forEach((npc) => {
    if (!npc.interacted) {
      let dx = player.x - npc.x;
      let dy = player.y - npc.y;
      let dst = Math.sqrt(dx*dx + dy*dy);
      if (dst < minDst) {
        minDst = dst;
        nearestNPC = npc;
      }
    }
  });
  if (nearestNPC) {
    targetEl.innerText = nearestNPC.name;
  }
}

// ==========================================
// 9. GAME LOOP ENGINE (60 FPS)
// ==========================================
let frameCount = 0;

function gameLoop() {
  if (!gameStarted) return;
  frameCount++;

  // --- A. UPDATE KONTROL & FISIKA AKSELERASI ---
  if (!dialogOpen) {
    if (keys["ArrowLeft"] || keys["KeyA"]) {
      if (player.vx > -player.speed) {
        player.vx -= player.acceleration;
      }
      player.facingLeft = true;
    } else if (keys["ArrowRight"] || keys["KeyD"]) {
      if (player.vx < player.speed) {
        player.vx += player.acceleration;
      }
      player.facingLeft = false;
    } else {
      player.vx *= player.friction;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }
  } else {
    player.vx *= player.friction;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  player.vy += player.gravity;
  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  // --- B. COLLISION LANTAI & PLATFORM ---
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      let type = mapGrid[r][c];
      let blockX = c * TILE_SIZE;
      let blockY = r * TILE_SIZE;

      if (type === 1 || type === 2 || type === 3) {
        if (player.vy > 0 &&
            player.x + player.width > blockX + 8 &&
            player.x < blockX + TILE_SIZE - 8 &&
            player.y + player.height >= blockY &&
            player.y + player.height <= blockY + 18) {
          player.y = blockY - player.height;
          player.vy = 0;
          player.grounded = true;
        }
      }
    }
  }

  if (player.x < TILE_SIZE) {
    player.x = TILE_SIZE;
    player.vx = 0;
  }
  if (player.x + player.width > MAP_W - TILE_SIZE) {
    player.x = MAP_W - TILE_SIZE - player.width;
    player.vx = 0;
  }

  // --- C. CEK MENGAMBIL KOIN & BERLIAN ---
  collectibles.forEach((item) => {
    if (!item.collected &&
        player.x + player.width > item.x &&
        player.x < item.x + item.w &&
        player.y + player.height > item.y &&
        player.y < item.y + item.h) {
      item.collected = true;
      collectedCount++;
    }
  });

  // Update Kamera
  let targetCamX = player.x - canvas.width / 2 + player.width / 2;
  cameraX += (targetCamX - cameraX) * 0.1;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > MAP_W - canvas.width) cameraX = MAP_W - canvas.width;

  updateQuestGuide();

  // ==========================================
  // 10. RENDER ENGINE
  // ==========================================
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Background Senja Tropis
  if (bgImg.complete && bgImg.naturalWidth !== 0) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#3e2731");
    sky.addColorStop(0.5, "#d9a066");
    sky.addColorStop(1, "#eec39a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Parallax Palms
  backPalms.forEach((bp) => {
    let screenX = bp.x - cameraX * 0.7;
    if (screenX > -150 && screenX < canvas.width + 150) {
      if (palmBackImg.complete && palmBackImg.naturalWidth !== 0) {
        ctx.drawImage(palmBackImg, screenX, bp.y, bp.w, bp.h);
      }
    }
  });

  // 3. Render Grid Lantai, Platform & Animasi Ombak Air Laut
  const waterFrameIndex = Math.floor(frameCount / 15) % waterTopFrames.length;
  const currentWaterImg = waterTopFrames[waterFrameIndex];

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      let type = mapGrid[r][c];
      let x = c * TILE_SIZE - cameraX;
      let y = r * TILE_SIZE;

      if (x > -TILE_SIZE && x < canvas.width) {
        if (type === 1 || type === 2) {
          ctx.fillStyle = (type === 1) ? "#38683a" : "#4e8f4c";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = "#274528";
          ctx.fillRect(x, y + 6, TILE_SIZE, TILE_SIZE - 6);
        } else if (type === 3) {
          ctx.fillStyle = "#5c5c6d";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#383845";
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (type === 4) {
          let wave = Math.sin(frameCount * 0.06 + c * 0.4) * 3;
          if (currentWaterImg && currentWaterImg.complete && currentWaterImg.naturalWidth !== 0) {
            ctx.drawImage(currentWaterImg, x, y + wave, TILE_SIZE, TILE_SIZE + 6);
          } else {
            ctx.fillStyle = "rgba(72, 219, 251, 0.75)";
            ctx.fillRect(x, y + wave, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "rgba(10, 140, 200, 0.4)";
            ctx.fillRect(x, y + wave + 8, TILE_SIZE, TILE_SIZE - 8);
          }
        }
      }
    }
  }

  // 4. Render Props Dekoratif
  props.forEach((p) => {
    let screenX = p.x - cameraX;
    if (screenX > -100 && screenX < canvas.width + 100) {
      if (p.img && p.img.complete && p.img.naturalWidth !== 0) {
        ctx.drawImage(p.img, screenX, p.y, p.w, p.h);
      }
    }
  });

  // 5. Render Koin Emas, Berlian, & Kado
  const coinFrameIndex = Math.floor(frameCount / 10) % coinFrames.length;
  const diamondFrameIndex = Math.floor(frameCount / 10) % diamondFrames.length;

  collectibles.forEach((item) => {
    if (!item.collected) {
      let screenX = item.x - cameraX;
      let floatBob = Math.sin(frameCount * 0.08 + item.x) * 4;
      if (screenX > -50 && screenX < canvas.width + 50) {
        if (item.type === "kado") {
          if (kadoImg && kadoImg.complete && kadoImg.naturalWidth !== 0) {
            ctx.drawImage(kadoImg, screenX, item.y + floatBob, item.w, item.h);
          } else {
            ctx.fillStyle = "#e84393";
            ctx.fillRect(screenX, item.y + floatBob, item.w, item.h);
          }
        } else {
          let activeFrames = (item.type === "coin") ? coinFrames : diamondFrames;
          let activeFrame = (item.type === "coin") ? activeFrames[coinFrameIndex] : activeFrames[diamondFrameIndex];

          if (activeFrame && activeFrame.complete && activeFrame.naturalWidth !== 0) {
            ctx.drawImage(activeFrame, screenX, item.y + floatBob, item.w, item.h);
          } else {
            ctx.fillStyle = (item.type === "coin") ? "#f1c40f" : "#00d2d3";
            ctx.fillRect(screenX, item.y + floatBob, item.w, item.h);
          }
        }
      }
    }
  });

  // 6. Render 11 Sahabat
  npcs.forEach((npc) => {
    let screenX = npc.x - cameraX;
    if (screenX > -100 && screenX < canvas.width + 100) {
      let bob = Math.sin(frameCount * 0.05 + npc.id) * 3;
      let npcFrameIdx = Math.floor(frameCount / 12) % npc.anims.length;
      let currentNpcImg = npc.anims[npcFrameIdx];

      drawShadow(npc.x, npc.y, npc.w);
      drawAnimatedSprite(currentNpcImg, screenX, npc.y, npc.w, npc.h, bob);

      let dx = (player.x + player.width/2) - (npc.x + npc.w/2);
      let dy = (player.y + player.height/2) - (npc.y + npc.h/2);
      if (Math.sqrt(dx*dx + dy*dy) < 65 && !dialogOpen) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(screenX + 4, npc.y - 28, 32, 20);
        ctx.fillStyle = "#2c1b4d";
        ctx.font = "bold 13px Courier New";
        ctx.fillText("💬", screenX + 10, npc.y - 14);
        ctx.fillStyle = "#ff9f43";
        ctx.font = "bold 11px Courier New";
        ctx.fillText("[E]", screenX + 8, npc.y - 33);
      }

      // Munculkan centang hijau jika sudah dijawab
      if (npc.interacted) {
        ctx.fillStyle = "#2ed573";
        ctx.font = "bold 16px Courier New";
        ctx.fillText("✓", screenX + npc.w - 10, npc.y - 5);
      }
    }
  });

  // 7. Render Peti Harta Karun
  if (specialSurprise.active) {
    let screenX = specialSurprise.x - cameraX;
    let pulse = Math.sin(frameCount * 0.08) * 4;
    drawShadow(specialSurprise.x, specialSurprise.y, specialSurprise.width);
    if (chestImg.complete && chestImg.naturalWidth !== 0) {
      ctx.drawImage(chestImg, screenX, specialSurprise.y + pulse, specialSurprise.width, specialSurprise.height);
    } else {
      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(screenX, specialSurprise.y + pulse, specialSurprise.width, specialSurprise.height);
    }
    ctx.fillStyle = "#ff6b81";
    ctx.font = "bold 13px Courier New";
    ctx.fillText("⭐ PETI HARTA KARUN ⭐", screenX - 45, specialSurprise.y - 15);
  }

  // 8. Render Kapten (Player)
  let playerBob = Math.sin(frameCount * 0.1) * 1.5;
  let activeAnimArray = playerAnims.idle;
  if (!player.grounded) {
    activeAnimArray = playerAnims.jump;
  } else if (Math.abs(player.vx) > 0.1) {
    activeAnimArray = playerAnims.run;
  }

  let playerFrameIdx = Math.floor(frameCount / 8) % activeAnimArray.length;
  let currentPlayerImg = activeAnimArray[playerFrameIdx];

  drawShadow(player.x, player.y, player.width);
  drawAnimatedSprite(currentPlayerImg, player.x - cameraX, player.y, player.width, player.height, playerBob, player.facingLeft);

  // 9. Render UI HUD
  renderCollectiblesHUD();

  requestAnimationFrame(gameLoop);
}