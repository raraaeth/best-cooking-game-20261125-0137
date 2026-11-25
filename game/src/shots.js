// The screenshot scenes behind ?shot=start|play|serve|end&seed=N. Each scene builds
// its state directly from the real game objects (real tickets, real spots, real
// pass), so the frame is exactly what the game looks like mid-play, and the seeded
// generator makes it identical on every load. In a shot scene the world is frozen:
// no step runs, so patience bars, progress rings and the timer never move.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function ticket(id, recipeId, patience, patienceMax) {
  return { id, recipeId, patience, patienceMax };
}

/** The shared mid-rush kitchen: three tickets, both pans busy, a dish mid-assembly. */
function stageRush(world) {
  world.screen = SCREEN_PLAY;
  world.elapsed = 63;
  world.timeLeft = 87;
  world.coins = 214;
  world.score = 2140;
  world.served = 9;
  world.lost = 1;
  world.combo = 3;
  world.bestCombo = 5;
  world.tickets = [
    ticket(101, 'nasgor', 30, 44),
    ticket(102, 'soto', 38, 48),
    ticket(103, 'geprek', 21, 40),
  ];
  // Wajan: Nasi Goreng mid-cook, inside the golden window (its ring shows it).
  world.spots.wajan.items = ['nasi', 'telur', 'cabai'];
  world.spots.wajan.cookElapsed = 5.9;
  world.spots.wajan.dinged = true;
  // Panci: Soto Ayam still early.
  world.spots.panci.items = ['ayam', 'sayur'];
  world.spots.panci.cookElapsed = 2.2;
  // Piring: Nasi Campur mid-assembly, egg still missing.
  world.spots.piring.items = ['nasi', 'ayam'];
  // The pass: one finished Mie Goreng ready to serve.
  world.pass = [{ recipeId: 'miegor', quality: 'perfect', spotId: 'wajan' }];
  world.selectedSpot = 'wajan';
  world.selectedPlate = -1;
}

/**
 * Set `world` to the named scene and leave it there. Unknown names stage the
 * title screen.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    stageRush(world);
    return;
  }
  if (name === 'serve') {
    stageRush(world);
    // The ready plate is selected and its ticket is on the board, mid-serve.
    world.tickets[1] = ticket(102, 'miegor', 34, 46);
    world.selectedPlate = 0;
    return;
  }
  if (name === 'end') {
    stageRush(world);
    world.screen = SCREEN_OVER;
    world.timeLeft = 0;
    world.elapsed = 150;
    world.coins = 486;
    world.score = 5120;
    world.served = 15;
    world.lost = 2;
    world.combo = 0;
    world.bestCombo = 8;
    return;
  }
  world.screen = SCREEN_TITLE;
}
