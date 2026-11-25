// Warung Rush boot: canvas sizing, the fixed-step loop, mouse and keyboard input,
// and the wiring between the world, the renderer and the synthesized sounds.

import { FIELD, INGREDIENT_INFO, SPOTS, STEP } from './config.js';
import { createRandom } from './random.js';
import { initAudio, sfx } from './audio.js';
import {
  SCREEN_HOWTO, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
  addIngredient, createWorld, plateSpot, popup, servePlate, serveSelected,
  stepWorld, trashPlate, trashSpot,
} from './world.js';
import { LAYOUT, drawScene, hitTest } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261125;
const shot = params.get('shot');

const world = createWorld(createRandom(seed));
if (shot) stageShot(shot, world);

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener('resize', resize);
resize();

/** Convert a client point to the game's 1280x720 logical coordinates. */
function toLogical(clientX, clientY) {
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  const ox = (canvas.width - FIELD.width * scale) / 2;
  const oy = (canvas.height - FIELD.height * scale) / 2;
  return { x: (clientX - ox) / scale, y: (clientY - oy) / scale, scale, ox, oy };
}

function render() {
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  const ox = (canvas.width - FIELD.width * scale) / 2;
  const oy = (canvas.height - FIELD.height * scale) / 2;
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  drawScene(ctx, world);
  ctx.restore();
}

function startShift() {
  world.reset();
  world.screen = SCREEN_PLAY;
  sfx.click();
}

function handleAction(action) {
  if (!action || action.type === 'noop') return;
  initAudio();
  if (action.type === 'start') { startShift(); return; }
  if (action.type === 'howto') { world.screen = SCREEN_HOWTO; sfx.click(); return; }
  if (action.type === 'resume') { world.screen = SCREEN_PLAY; sfx.click(); return; }
  if (action.type === 'restart') { startShift(); return; }
  if (world.screen !== SCREEN_PLAY) return;

  if (action.type === 'ingredient') {
    const result = addIngredient(world, action.id);
    if (result === 'added') sfx.add(); else sfx.click();
    return;
  }
  if (action.type === 'spot') {
    world.selectedSpot = action.id;
    const spot = world.spots[action.id];
    if (spot.items.length > 0) {
      const result = plateSpot(world, action.id);
      if (result === 'plated') { sfx.ding(); popup(world, LAYOUT.spot[action.id].x + 140, 240, 'Siap disajikan!', '#3f9e4d'); }
      else if (result === 'smashed') { sfx.smash(); sfx.ding(); popup(world, LAYOUT.spot[action.id].x + 140, 240, 'GEPREK! Siap!', '#c0392b'); }
      else if (result === 'burnt') { sfx.click(); popup(world, LAYOUT.spot[action.id].x + 140, 240, 'Gosong! Buang dulu', '#c0392b'); }
      else if (result === 'undercooked') sfx.click();
      else if (result === 'wrong') sfx.click();
    } else {
      sfx.click();
    }
    return;
  }
  if (action.type === 'plate') {
    world.selectedPlate = world.selectedPlate === action.index ? -1 : action.index;
    sfx.click();
    return;
  }
  if (action.type === 'ticket') {
    const ticket = world.tickets[action.index];
    if (!ticket) return;
    if (world.selectedPlate >= 0) {
      const before = world.coins;
      const result = servePlate(world, world.selectedPlate, ticket.id);
      if (result === 'served') {
        sfx.serve();
        const box = LAYOUT.ticket(action.index);
        popup(world, box.x + box.w / 2, box.y + 40, `+${world.coins - before} koin`, '#b57e46');
      } else {
        sfx.click();
      }
    }
    return;
  }
  if (action.type === 'trash') {
    const result = world.selectedPlate >= 0 ? trashPlate(world) : trashSpot(world);
    if (result === 'trashed') sfx.trash();
    return;
  }
}

canvas.addEventListener('pointerdown', (event) => {
  const p = toLogical(event.clientX, event.clientY);
  handleAction(hitTest(world, p.x, p.y));
});

window.addEventListener('keydown', (event) => {
  if (shot) return;
  const key = event.key;
  initAudio();
  if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
    if (key === 'Enter' || key === ' ') { event.preventDefault(); startShift(); }
    return;
  }
  if (world.screen === SCREEN_HOWTO) {
    if (key === 'Enter' || key === ' ' || key === 'Escape') { event.preventDefault(); startShift(); }
    return;
  }
  if (key === 'Escape' || key.toLowerCase() === 'p') {
    if (world.screen === SCREEN_PLAY) world.screen = SCREEN_PAUSED;
    else if (world.screen === SCREEN_PAUSED) world.screen = SCREEN_PLAY;
    return;
  }
  if (world.screen !== SCREEN_PLAY) return;
  const lower = key.toLowerCase();
  if (lower === 'q') { world.selectedSpot = 'wajan'; sfx.click(); return; }
  if (lower === 'w') { world.selectedSpot = 'panci'; sfx.click(); return; }
  if (lower === 'e') { world.selectedSpot = 'piring'; sfx.click(); return; }
  for (const id of Object.keys(INGREDIENT_INFO)) {
    if (INGREDIENT_INFO[id].key === key) {
      const result = addIngredient(world, id);
      if (result === 'added') sfx.add(); else sfx.click();
      return;
    }
  }
  if (key === ' ') {
    event.preventDefault();
    if (world.selectedPlate >= 0) {
      const result = serveSelected(world);
      if (result === 'served') sfx.serve(); else sfx.click();
    } else {
      handleAction({ type: 'spot', id: world.selectedSpot });
    }
    return;
  }
  if (key === 'Backspace' || key === 'Delete') {
    event.preventDefault();
    handleAction({ type: 'trash' });
  }
});

// The loop: fixed simulation steps, then one draw. In a screenshot scene the
// world is staged and never stepped, so the frame is stable forever.
let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shot) {
    acc += dt;
    while (acc >= STEP) {
      const events = stepWorld(world, STEP);
      for (const e of events) {
        if (e === 'ding') sfx.ding();
        else if (e === 'expired') sfx.sad();
        else if (e === 'over') sfx.fanfare();
      }
      acc -= STEP;
    }
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Keep SPOTS referenced for readers of the module graph (spot order lives in config).
void SPOTS;
