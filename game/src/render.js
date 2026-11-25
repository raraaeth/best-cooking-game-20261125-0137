// All drawing for Warung Rush: the warung, order board, cooking spots, ingredient
// stations, the pass, HUD and the overlay screens. Everything is drawn in code on
// the canvas — no image files. This module also owns the layout rectangles and
// hit-testing, so what is drawn is exactly what can be clicked.

import {
  FIELD, FONT, INGREDIENTS, INGREDIENT_INFO, PALETTE, RECIPES, SPOT_INFO, SPOTS, STARS,
} from './config.js';
import {
  SCREEN_HOWTO, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
  cookFraction, donenessOf, partialRecipeFor, recipeById, recipeFor, starsFor,
} from './world.js';

export const LAYOUT = {
  hud: { x: 0, y: 0, w: FIELD.width, h: 54 },
  board: { x: 16, y: 62, w: FIELD.width - 32, h: 138 },
  ticket: (i) => ({ x: 30 + i * 412, y: 76, w: 396, h: 110 }),
  spot: {
    wajan: { x: 30, y: 252, w: 280, h: 218 },
    panci: { x: 330, y: 252, w: 280, h: 218 },
    piring: { x: 630, y: 252, w: 280, h: 218 },
  },
  pass: { x: 930, y: 252, w: 320, h: 218 },
  plate: (i) => ({ x: 958 + (i % 3) * 100, y: 306 + Math.floor(i / 3) * 104, w: 88, h: 88 }),
  stationHead: { x: 30, y: 492, w: 830, h: 40 },
  trash: { x: 890, y: 492, w: 360, h: 40 },
  station: (i) => ({ x: 30 + i * 203, y: 548, w: 190, h: 128 }),
  btnMain: { x: 490, y: 470, w: 300, h: 64 },
  btnSecond: { x: 490, y: 548, w: 300, h: 52 },
  btnBack: { x: 490, y: 616, w: 300, h: 52 },
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, value, x, y, size, colour, align = 'left', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function coinIcon(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.coin;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c8930a';
  ctx.stroke();
  text(ctx, 'Rp', x, y + 1, r * 0.85, '#8a6100', 'center', 800);
}

/** One ingredient, drawn as a little picture centred on (x, y) inside `size`. */
export function drawIngredient(ctx, id, x, y, size) {
  const s = size / 60;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (id === 'nasi') {
    ctx.fillStyle = '#fdfdf8';
    ctx.beginPath(); ctx.ellipse(0, 2, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e4d2';
    ctx.beginPath(); ctx.ellipse(0, 6, 24, 12, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#4a6fa5';
    ctx.beginPath(); ctx.ellipse(0, 10, 26, 9, 0, 0, Math.PI); ctx.fill();
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f0b429';
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 8, -2, 7, Math.PI * 0.15, Math.PI * 0.95);
      ctx.stroke();
    }
    ctx.fillStyle = '#b03a2e';
    ctx.beginPath(); ctx.ellipse(0, 10, 26, 9, 0, 0, Math.PI); ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#c97b2f';
    ctx.beginPath(); ctx.ellipse(-4, -2, 17, 12, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a04c';
    ctx.beginPath(); ctx.ellipse(-6, -4, 11, 8, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5ead6';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(16, 12); ctx.stroke();
    ctx.fillStyle = '#f5ead6';
    ctx.beginPath(); ctx.arc(18, 14, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, 16, 4.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 15, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7b731';
    ctx.beginPath(); ctx.arc(2, 0, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd76e';
    ctx.beginPath(); ctx.arc(0, -2, 3.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cabai') {
    ctx.strokeStyle = '#d42a1e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.quadraticCurveTo(4, 14, 18, 2);
    ctx.stroke();
    ctx.strokeStyle = '#3f9e4d';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-18, -14, -12, -17); ctx.stroke();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#3f9e4d';
    for (const [dx, dy, rot] of [[-10, 2, -0.5], [0, -4, 0], [10, 2, 0.5]]) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#57b96a';
    ctx.beginPath(); ctx.ellipse(0, 2, 7, 13, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** A finished dish on its plate (or bowl, for soto), centred on (x, y). */
export function drawDish(ctx, recipeId, x, y, size, quality = 'golden') {
  const s = size / 120;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const burnt = quality === 'burnt';
  // Plate / bowl.
  if (recipeId === 'soto') {
    ctx.fillStyle = burnt ? '#5a4632' : '#e2725b';
    ctx.beginPath(); ctx.ellipse(0, 6, 52, 30, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = burnt ? '#3a2c1c' : '#f7c948';
    ctx.beginPath(); ctx.ellipse(0, 2, 50, 22, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eef0ea';
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  if (burnt) {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#241a12';
    ctx.beginPath(); ctx.ellipse(0, -2, 40, 26, 0, 0, Math.PI * 2); ctx.fill();
  } else if (recipeId === 'nasgor') {
    ctx.fillStyle = '#d1602a';
    ctx.beginPath(); ctx.ellipse(0, 0, 38, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e87f3a';
    ctx.beginPath(); ctx.ellipse(-4, -4, 26, 15, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, 'telur', 4, -8, 44);
    drawIngredient(ctx, 'cabai', -20, 8, 30);
  } else if (recipeId === 'miegor') {
    ctx.strokeStyle = '#f0b429';
    ctx.lineWidth = 6;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(-16 + i * 8, -2 + (i % 2) * 7, 9, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }
    drawIngredient(ctx, 'sayur', 16, -8, 34);
    drawIngredient(ctx, 'telur', -14, 8, 34);
  } else if (recipeId === 'geprek') {
    ctx.fillStyle = '#c97b2f';
    ctx.beginPath(); ctx.ellipse(0, 2, 36, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d42a1e';
    ctx.beginPath(); ctx.ellipse(-2, -2, 30, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b57';
    ctx.beginPath(); ctx.arc(-12, -4, 4, 0, Math.PI * 2); ctx.arc(8, 0, 3.4, 0, Math.PI * 2); ctx.arc(2, -8, 3, 0, Math.PI * 2); ctx.fill();
  } else if (recipeId === 'soto') {
    drawIngredient(ctx, 'ayam', -10, -2, 44);
    drawIngredient(ctx, 'sayur', 14, 0, 36);
  } else if (recipeId === 'campur') {
    ctx.fillStyle = '#fdfdf8';
    ctx.beginPath(); ctx.ellipse(-12, 0, 24, 17, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, 'ayam', 16, -6, 42);
    drawIngredient(ctx, 'telur', 14, 12, 34);
  }
  ctx.restore();
  if (quality === 'perfect') {
    ctx.fillStyle = '#ffd94d';
    for (const [dx, dy] of [[-40, -30], [38, -36], [44, 18], [-42, 22]]) {
      ctx.beginPath();
      ctx.moveTo(dx, dy - 7); ctx.lineTo(dx + 2.4, dy - 2.4); ctx.lineTo(dx + 7, dy);
      ctx.lineTo(dx + 2.4, dy + 2.4); ctx.lineTo(dx, dy + 7); ctx.lineTo(dx - 2.4, dy + 2.4);
      ctx.lineTo(dx - 7, dy); ctx.lineTo(dx - 2.4, dy - 2.4);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

function drawTicket(ctx, world, index) {
  const box = LAYOUT.ticket(index);
  const ticket = world.tickets[index];
  rr(ctx, box.x, box.y, box.w, box.h, 10);
  if (!ticket) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = PALETTE.muted;
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'menunggu pesanan…', box.x + box.w / 2, box.y + box.h / 2, 17, PALETTE.muted, 'center', 600);
    return;
  }
  const recipe = recipeById(ticket.recipeId);
  const selectedMatches = world.selectedPlate >= 0
    && world.pass[world.selectedPlate]
    && world.pass[world.selectedPlate].recipeId === ticket.recipeId;
  // Low patience (under 25%): the ticket border and bar pulse red as a warning.
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  const danger = frac < 0.25;
  const flash = danger && Math.floor(performance.now() / 260) % 2 === 0;
  ctx.fillStyle = flash ? '#ffe3de' : PALETTE.board;
  ctx.fill();
  ctx.lineWidth = selectedMatches ? 4 : danger ? 3.5 : 2;
  ctx.strokeStyle = selectedMatches ? PALETTE.gold : danger ? (flash ? '#ff2015' : PALETTE.bad) : PALETTE.boardEdge;
  ctx.stroke();
  drawDish(ctx, recipe.id, box.x + 52, box.y + 55, 84, 'golden');
  text(ctx, recipe.name, box.x + 104, box.y + 26, 23, PALETTE.ink, 'left', 800);
  // Recipe icons.
  recipe.needs.forEach((need, i) => {
    drawIngredient(ctx, need, box.x + 122 + i * 40, box.y + 58, 34);
  });
  coinIcon(ctx, box.x + box.w - 58, box.y + 26, 13);
  text(ctx, `${recipe.price}`, box.x + box.w - 40, box.y + 27, 19, PALETTE.ink, 'left', 800);
  // Patience bar.
  rr(ctx, box.x + 104, box.y + 84, box.w - 128, 12, 6);
  ctx.fillStyle = '#e5d9c3';
  ctx.fill();
  rr(ctx, box.x + 104, box.y + 84, Math.max(12, (box.w - 128) * frac), 12, 6);
  ctx.fillStyle = danger ? (flash ? '#ff5040' : PALETTE.bad) : frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.warn : PALETTE.bad;
  ctx.fill();
  if (selectedMatches) text(ctx, 'KLIK UNTUK MENYAJIKAN →', box.x + box.w - 24, box.y + box.h - 9, 13.5, '#b57e46', 'right', 800);
}

function drawSpot(ctx, world, spotId) {
  const box = LAYOUT.spot[spotId];
  const spot = world.spots[spotId];
  const info = SPOT_INFO[spotId];
  const selected = world.selectedSpot === spotId;
  rr(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? PALETTE.gold : PALETTE.boardEdge;
  ctx.stroke();
  text(ctx, `${info.name}`, box.x + 16, box.y + 22, 21, PALETTE.ink, 'left', 800);
  rr(ctx, box.x + box.w - 52, box.y + 8, 38, 28, 8);
  ctx.fillStyle = selected ? PALETTE.gold : '#d9c9a8';
  ctx.fill();
  text(ctx, info.key, box.x + box.w - 33, box.y + 23, 16, PALETTE.ink, 'center', 800);

  const cx = box.x + box.w / 2;
  const cy = box.y + 118;
  const recipe = recipeFor(spot);
  const partial = partialRecipeFor(spot);
  const state = donenessOf(spot);

  // Vessel.
  if (spotId === 'piring') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#cfd4c8'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 48, 0, Math.PI * 2); ctx.stroke();
  } else {
    // Stove + pan/pot body.
    ctx.fillStyle = '#4a4a52';
    rr(ctx, cx - 74, cy + 34, 148, 26, 10);
    ctx.fill();
    ctx.fillStyle = state !== 'empty' ? '#ff7b3d' : '#6a6a72';
    ctx.beginPath(); ctx.ellipse(cx, cy + 44, 44, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (spotId === 'wajan') {
      ctx.fillStyle = '#2e2e34';
      ctx.beginPath(); ctx.ellipse(cx, cy, 66, 40, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#45454e';
      ctx.beginPath(); ctx.ellipse(cx, cy - 4, 56, 32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2e2e34';
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(cx + 60, cy - 6); ctx.lineTo(cx + 88, cy - 16); ctx.stroke();
    } else {
      ctx.fillStyle = '#7d8590';
      rr(ctx, cx - 56, cy - 30, 112, 62, 12);
      ctx.fill();
      ctx.fillStyle = '#98a1ab';
      rr(ctx, cx - 56, cy - 30, 112, 16, 8);
      ctx.fill();
      ctx.strokeStyle = '#5d646d';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(cx - 56, cy - 6); ctx.lineTo(cx - 74, cy - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 56, cy - 6); ctx.lineTo(cx + 74, cy - 6); ctx.stroke();
    }
  }

  // Contents: the matching dish taking shape, or loose ingredients.
  if (spot.items.length > 0) {
    if (recipe) {
      const q = spotId === 'piring' ? 'golden' : state === 'raw' ? 'golden' : state;
      drawDish(ctx, recipe.id, cx, cy - 4, 104, q === 'perfect' ? 'perfect' : q);
      if (state === 'burnt') {
        ctx.fillStyle = 'rgba(60,50,45,0.55)';
        for (const [dx, dy, r] of [[-26, -52, 9], [4, -66, 12], [30, -50, 8]]) {
          ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
      spot.items.forEach((item, i) => {
        const dx = (i - (spot.items.length - 1) / 2) * 40;
        drawIngredient(ctx, item, cx + dx, cy - 2, 46);
      });
    }
  }

  // Progress ring for heated spots.
  if (spotId !== 'piring' && spot.items.length > 0) {
    const frac = cookFraction(spot);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#e5d9c3';
    ctx.beginPath(); ctx.arc(cx, cy, 72, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = state === 'burnt' ? PALETTE.bad : state === 'raw' ? '#b8a888' : PALETTE.good;
    ctx.beginPath();
    ctx.arc(cx, cy, 72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
    ctx.stroke();
    // Golden window marker.
    const a0 = -Math.PI / 2 + Math.PI * 2 * (0.72 / 1.08);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(cx, cy, 72, a0, -Math.PI / 2 + Math.PI * 2); ctx.stroke();
  }

  // Status line.
  let status = 'kosong — klik bahan untuk mulai';
  let colour = PALETTE.muted;
  if (spot.items.length > 0) {
    if (!recipe && !partial) { status = 'BAHAN SALAH — buang ke tong sampah'; colour = PALETTE.bad; }
    else if (!recipe) status = `menuju ${partial.name}…`;
    else if (spotId === 'piring') { status = `${recipe.name} siap! Klik untuk ke meja saji`; colour = PALETTE.good; }
    else if (state === 'raw') status = 'memasak… tunggu sampai keemasan';
    else if (state === 'golden') { status = 'KEEMASAN! Klik untuk mengangkat'; colour = PALETTE.good; }
    else if (state === 'perfect') { status = 'SEMPURNA! Klik sekarang!'; colour = '#b57e46'; }
    else if (state === 'burnt') { status = 'GOSONG! Buang ke tong sampah'; colour = PALETTE.bad; }
  }
  text(ctx, status, cx, box.y + box.h - 14, 14.5, colour, 'center', 700);
}

function drawPass(ctx, world) {
  const box = LAYOUT.pass;
  rr(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fillStyle = '#fdf0d5';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.stroke();
  text(ctx, 'MEJA SAJI', box.x + 16, box.y + 22, 20, PALETTE.ink, 'left', 800);
  text(ctx, world.pass.length === 0 ? 'belum ada hidangan' : 'pilih, lalu klik tiket', box.x + box.w - 14, box.y + 22, 13, PALETTE.muted, 'right', 600);
  if (world.pass.length === 0) {
    text(ctx, 'hidangan jadi muncul di sini', box.x + box.w / 2, box.y + box.h / 2 + 10, 15, PALETTE.muted, 'center', 600);
  }
  world.pass.forEach((plate, i) => {
    const p = LAYOUT.plate(i);
    const selected = world.selectedPlate === i;
    if (selected) {
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 52, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242,177,52,0.35)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = PALETTE.gold;
      ctx.stroke();
    }
    drawDish(ctx, plate.recipeId, p.x + p.w / 2, p.y + p.h / 2, 92, plate.quality);
    const recipe = recipeById(plate.recipeId);
    text(ctx, recipe.name, p.x + p.w / 2, p.y + p.h + 8, 13, PALETTE.ink, 'center', 700);
  });
}

function drawStations(ctx, world) {
  text(ctx, 'BAHAN — klik bahan atau tekan 1–6 untuk memasukkan ke tempat terpilih', LAYOUT.stationHead.x + 4, LAYOUT.stationHead.y + 21, 17, PALETTE.ink, 'left', 800);
  // Trash button.
  const t = LAYOUT.trash;
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fillStyle = '#c0392b';
  ctx.fill();
  text(ctx, '🗑  BUANG  (Backspace)', t.x + t.w / 2, t.y + t.h / 2 + 1, 17, '#ffffff', 'center', 800);
  INGREDIENTS.forEach((id, i) => {
    const box = LAYOUT.station(i);
    rr(ctx, box.x, box.y, box.w, box.h, 12);
    ctx.fillStyle = PALETTE.panel;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = PALETTE.boardEdge;
    ctx.stroke();
    drawIngredient(ctx, id, box.x + box.w / 2, box.y + 48, 62);
    text(ctx, INGREDIENT_INFO[id].name, box.x + box.w / 2, box.y + 96, 19, PALETTE.ink, 'center', 800);
    rr(ctx, box.x + box.w / 2 - 15, box.y + box.h - 26, 30, 20, 6);
    ctx.fillStyle = '#d9c9a8';
    ctx.fill();
    text(ctx, INGREDIENT_INFO[id].key, box.x + box.w / 2, box.y + box.h - 15, 13, PALETTE.ink, 'center', 800);
  });
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(0, 0, FIELD.width, 54);
  // Awning stripes under the HUD.
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.awningRed : PALETTE.awningCream;
    ctx.beginPath();
    ctx.moveTo(i * 80, 54);
    ctx.lineTo(i * 80 + 80, 54);
    ctx.lineTo(i * 80 + 72, 66);
    ctx.lineTo(i * 80 + 8, 66);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, '🍳 WARUNG RUSH', 18, 28, 24, '#ffe9b8', 'left', 800);
  // Timer pill.
  const mm = Math.floor(world.timeLeft / 60);
  const ss = Math.floor(world.timeLeft % 60);
  rr(ctx, 520, 9, 240, 36, 18);
  ctx.fillStyle = world.timeLeft <= 20 ? '#c0392b' : '#33241a';
  ctx.fill();
  text(ctx, `⏱  ${mm}:${String(ss).padStart(2, '0')}`, 640, 28, 22, '#ffffff', 'center', 800);
  coinIcon(ctx, 822, 27, 13);
  text(ctx, `${world.coins}`, 842, 28, 21, '#ffffff', 'left', 800);
  text(ctx, `Skor ${world.score}`, 928, 28, 18, '#ffe9b8', 'left', 700);
  text(ctx, `Terjual ${world.served}`, 1048, 28, 18, '#ffe9b8', 'left', 700);
  text(ctx, world.combo > 1 ? `Kombo x${Math.min(2, 1 + (world.combo - 1) * 0.1).toFixed(1)}` : '', 1258, 28, 17, '#ffd94d', 'right', 800);
}

function drawKitchen(ctx, world) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.wallBand;
  ctx.fillRect(0, 470, FIELD.width, 10);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 480, FIELD.width, FIELD.height - 480);
  // Shelf with jars behind the spots.
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(16, 232, FIELD.width - 32, 8);
  for (let i = 0; i < 7; i += 1) {
    const x = 90 + i * 175;
    ctx.fillStyle = ['#d42a1e', '#f0b429', '#3f9e4d', '#e2725b'][i % 4];
    rr(ctx, x, 204, 30, 28, 5);
    ctx.fill();
    ctx.fillStyle = '#8a5a33';
    rr(ctx, x + 4, 198, 22, 8, 3);
    ctx.fill();
  }
  // Counter surface.
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(16, 470, FIELD.width - 32, 12);
  drawHud(ctx, world);
  // Order board backing.
  const b = LAYOUT.board;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = '#8a5a33';
  ctx.fill();
  text(ctx, 'PAPAN PESANAN', b.x + 14, b.y - 2, 1, '#8a5a33', 'left', 700);
  for (let i = 0; i < 3; i += 1) drawTicket(ctx, world, i);
  for (const id of SPOTS) drawSpot(ctx, world, id);
  drawPass(ctx, world);
  drawStations(ctx, world);
  // Popups.
  for (const p of world.popups) {
    ctx.globalAlpha = Math.min(1, p.life);
    text(ctx, p.text, p.x, p.y, 24, p.colour, 'center', 800);
    ctx.globalAlpha = 1;
  }
  // Coin sparkles from a fresh serve.
  for (const s of world.sparkles) {
    const a = Math.max(0, s.life / s.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = PALETTE.coin;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1 + 3.5 * a, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function overlay(ctx, alpha = 0.55) {
  ctx.fillStyle = `rgba(38,24,12,${alpha})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function button(ctx, box, label, primary) {
  rr(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fillStyle = primary ? '#e2725b' : '#fdf3d8';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a5a33';
  ctx.stroke();
  text(ctx, label, box.x + box.w / 2, box.y + box.h / 2 + 1, primary ? 26 : 21, primary ? '#ffffff' : PALETTE.ink, 'center', 800);
}

function drawTitle(ctx, world) {
  drawKitchen(ctx, world);
  overlay(ctx, 0.45);
  rr(ctx, 290, 120, 700, 240, 24);
  ctx.fillStyle = '#fff6e3';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.stroke();
  text(ctx, '🍳 WARUNG RUSH', 640, 190, 58, '#c0392b', 'center', 800);
  text(ctx, 'Lomba masak kilat di warung: terima pesanan, masak pas,', 640, 248, 21, PALETTE.ink, 'center', 600);
  text(ctx, 'sajikan sebelum pelanggan pergi!', 640, 276, 21, PALETTE.ink, 'center', 600);
  text(ctx, 'Nasi Goreng • Mie Goreng • Ayam Geprek • Soto Ayam • Nasi Campur', 640, 322, 17, PALETTE.muted, 'center', 700);
  button(ctx, LAYOUT.btnMain, 'MULAI SHIFT', true);
  button(ctx, LAYOUT.btnSecond, 'CARA MAIN', false);
}

function drawHowto(ctx, world) {
  drawKitchen(ctx, world);
  overlay(ctx, 0.5);
  rr(ctx, 240, 90, 800, 470, 24);
  ctx.fillStyle = '#fff6e3';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.stroke();
  text(ctx, 'CARA MAIN', 640, 132, 34, '#c0392b', 'center', 800);
  const lines = [
    '1. Lihat tiket di papan pesanan: hidangan + bahan-bahannya.',
    '2. Pilih tempat masak: Wajan (Q), Panci (W), Piring (E).',
    '3. Klik bahan (atau tekan 1–6) sesuai resep tiket.',
    '4. Tunggu sampai KEEMASAN / SEMPURNA, lalu klik tempatnya',
    '    untuk memindahkan hidangan ke Meja Saji. Gosong = buang!',
    '5. Klik hidangan di Meja Saji, lalu klik tiketnya untuk menyajikan.',
    '    Spasi = sajikan hidangan terpilih ke tiket yang cocok.',
    '6. Backspace membuang isi tempat / hidangan terpilih (kombo putus).',
    'Sajikan cepat & sempurna untuk koin dan kombo. Shift 150 detik!',
  ];
  lines.forEach((line, i) => text(ctx, line, 300, 182 + i * 33, 19.5, PALETTE.ink, 'left', 600));
  button(ctx, { x: 490, y: 470, w: 300, h: 56 }, 'MULAI SHIFT', true);
}

function drawPaused(ctx, world) {
  drawKitchen(ctx, world);
  overlay(ctx, 0.5);
  text(ctx, 'JEDA', 640, 300, 54, '#ffffff', 'center', 800);
  button(ctx, LAYOUT.btnMain, 'LANJUT', true);
  button(ctx, LAYOUT.btnSecond, 'ULANGI SHIFT', false);
}

function drawOver(ctx, world) {
  drawKitchen(ctx, world);
  overlay(ctx, 0.6);
  rr(ctx, 340, 110, 600, 400, 24);
  ctx.fillStyle = '#fff6e3';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 160, 40, '#c0392b', 'center', 800);
  const stars = starsFor(world.coins);
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < stars ? '★' : '☆', 580 + i * 60, 212, 52, i < stars ? PALETTE.gold : '#cbb89a', 'center', 800);
  }
  const rows = [
    ['Koin terkumpul', `${world.coins}`],
    ['Skor akhir', `${world.score}`],
    ['Hidangan terjual', `${world.served}`],
    ['Pelanggan pergi', `${world.lost}`],
    ['Kombo terbaik', `x${world.bestCombo}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 420, 268 + i * 36, 21, PALETTE.ink, 'left', 600);
    text(ctx, value, 860, 268 + i * 36, 21, PALETTE.ink, 'right', 800);
  });
  text(ctx, `Bintang berikutnya di ${STARS[stars] ?? STARS[2]} koin`, 640, 462, 15, PALETTE.muted, 'center', 600);
  button(ctx, { x: 490, y: 528, w: 300, h: 56 }, 'SHIFT LAGI', true);
}

/** Draw the whole scene for the world's current screen. */
export function drawScene(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    const m = world.shake * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN_HOWTO) drawHowto(ctx, world);
  else if (world.screen === SCREEN_PAUSED) drawPaused(ctx, world);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  else drawKitchen(ctx, world);
  ctx.restore();
  ctx.fillStyle = '#241a12';
  const status = document.getElementById('status');
  if (status) {
    status.textContent = world.screen === SCREEN_PLAY
      ? `Warung Rush. Waktu ${Math.ceil(world.timeLeft)} detik, koin ${world.coins}, terjual ${world.served}.`
      : `Warung Rush, layar ${world.screen}.`;
  }
}

/** What was clicked, as an action word the input handler understands. */
export function hitTest(world, x, y) {
  const inside = (box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  if (world.screen === SCREEN_TITLE) {
    if (inside(LAYOUT.btnMain)) return { type: 'start' };
    if (inside(LAYOUT.btnSecond)) return { type: 'howto' };
    return { type: 'noop' };
  }
  if (world.screen === SCREEN_HOWTO) {
    if (inside({ x: 490, y: 470, w: 300, h: 56 })) return { type: 'start' };
    return { type: 'noop' };
  }
  if (world.screen === SCREEN_PAUSED) {
    if (inside(LAYOUT.btnMain)) return { type: 'resume' };
    if (inside(LAYOUT.btnSecond)) return { type: 'restart' };
    return { type: 'noop' };
  }
  if (world.screen === SCREEN_OVER) {
    if (inside({ x: 490, y: 528, w: 300, h: 56 })) return { type: 'restart' };
    return { type: 'noop' };
  }
  // Play screen.
  for (let i = 0; i < 3; i += 1) {
    if (inside(LAYOUT.ticket(i))) return { type: 'ticket', index: i };
  }
  for (const id of SPOTS) {
    if (inside(LAYOUT.spot[id])) return { type: 'spot', id };
  }
  for (let i = 0; i < world.pass.length; i += 1) {
    if (inside(LAYOUT.plate(i))) return { type: 'plate', index: i };
  }
  if (inside(LAYOUT.trash)) return { type: 'trash' };
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (inside(LAYOUT.station(i))) return { type: 'ingredient', id: INGREDIENTS[i] };
  }
  return { type: 'noop' };
}

export { RECIPES };
