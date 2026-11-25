// The Warung Rush simulation: tickets, cooking spots, the pass, scoring. Pure logic
// with a fixed step; rendering and input live elsewhere. All randomness comes from
// the seeded generator handed in at creation, so a staged scene never changes.

import { DONENESS, INGREDIENTS, ORDERS, RECIPES, SHIFT_SECONDS, SPOTS, STARS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_HOWTO = 'howto';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

let nextTicketId = 1;

function emptySpot(id) {
  return { id, items: [], cookElapsed: 0, dinged: false };
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function recipeFor(spot) {
  if (spot.items.length === 0) return null;
  for (const recipe of RECIPES) {
    if (recipe.vessel !== spot.id) continue;
    if (recipe.needs.length !== spot.items.length) continue;
    if (recipe.needs.every((need) => spot.items.includes(need))) return recipe;
  }
  return null;
}

/** A recipe this spot's current contents could still become, or null when spoiled. */
export function partialRecipeFor(spot) {
  let best = null;
  for (const recipe of RECIPES) {
    if (recipe.vessel !== spot.id) continue;
    if (!spot.items.every((item) => recipe.needs.includes(item))) continue;
    if (!best || recipe.needs.length < best.needs.length) best = recipe;
  }
  return best;
}

/** Doneness of a heated spot's contents: 'empty' | 'raw' | 'golden' | 'perfect' | 'burnt'. */
export function donenessOf(spot) {
  if (spot.items.length === 0) return 'empty';
  const recipe = recipeFor(spot) || partialRecipeFor(spot);
  const cook = recipe ? recipe.cook : 7;
  const f = spot.cookElapsed / cook;
  if (f >= DONENESS.burntFrom) return 'burnt';
  if (f >= DONENESS.perfectFrom && f <= DONENESS.perfectTo) return 'perfect';
  if (f >= DONENESS.goldenFrom) return 'golden';
  return 'raw';
}

/** Progress 0..1 toward the end of the perfect window, for the ring. */
export function cookFraction(spot) {
  const recipe = recipeFor(spot) || partialRecipeFor(spot);
  const cook = recipe ? recipe.cook : 7;
  return Math.min(1.45, spot.cookElapsed / (cook * DONENESS.perfectTo));
}

export function createWorld(random) {
  const world = {
    random,
    screen: SCREEN_TITLE,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    tickets: [],
    spots: { wajan: emptySpot('wajan'), panci: emptySpot('panci'), piring: emptySpot('piring') },
    pass: [],
    selectedSpot: 'wajan',
    selectedPlate: -1,
    spawnIn: ORDERS.firstDelay,
    popups: [],
    sparkles: [],
    shake: 0,
    lastServe: null,
  };
  world.reset = () => {
    world.timeLeft = SHIFT_SECONDS;
    world.elapsed = 0;
    world.score = 0;
    world.coins = 0;
    world.served = 0;
    world.lost = 0;
    world.combo = 0;
    world.bestCombo = 0;
    world.tickets = [];
    world.spots = { wajan: emptySpot('wajan'), panci: emptySpot('panci'), piring: emptySpot('piring') };
    world.pass = [];
    world.selectedSpot = 'wajan';
    world.selectedPlate = -1;
    world.spawnIn = ORDERS.firstDelay;
    world.popups = [];
    world.sparkles = [];
    world.shake = 0;
    world.lastServe = null;
  };
  return world;
}

function ramp(world) {
  return Math.min(1, world.elapsed / SHIFT_SECONDS);
}

function spawnTicket(world) {
  const t = ramp(world);
  // Early tickets are the quick two-ingredient dishes; the full menu joins as the
  // shift heats up.
  const pool = RECIPES.filter((r) => world.elapsed > 18 || r.needs.length <= 2);
  const recipe = pool[Math.floor(world.random() * pool.length)] || RECIPES[0];
  const patience = ORDERS.patienceStart + (ORDERS.patienceEnd - ORDERS.patienceStart) * t;
  world.tickets.push({
    id: nextTicketId,
    recipeId: recipe.id,
    patience,
    patienceMax: patience,
  });
  nextTicketId += 1;
}

function popup(world, x, y, text, colour) {
  world.popups.push({ x, y, text, colour, life: 1.1 });
}

/**
 * A burst of little coin sparkles at (x, y), for serve feedback. The pattern is
 * fixed (no randomness), so the simulation stays deterministic.
 */
export function spawnSparkles(world, x, y) {
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const speed = 46 + (i % 3) * 22;
    world.sparkles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 30,
      life: 0.7,
      maxLife: 0.7,
    });
  }
}

/** Add an ingredient to the selected spot. Returns an event word for sound/feedback. */
export function addIngredient(world, ingredient) {
  if (!INGREDIENTS.includes(ingredient)) return 'noop';
  const spot = world.spots[world.selectedSpot];
  if (spot.items.includes(ingredient)) {
    world.shake = 0.25;
    return 'dupe';
  }
  if (spot.items.length >= 3) {
    world.shake = 0.25;
    return 'full';
  }
  const wasEmpty = spot.items.length === 0;
  spot.items.push(ingredient);
  if (wasEmpty) {
    spot.cookElapsed = 0;
    spot.dinged = false;
  }
  return 'added';
}

/** Clear the selected spot into the bin. */
export function trashSpot(world) {
  const spot = world.spots[world.selectedSpot];
  if (spot.items.length === 0) return 'noop';
  spot.items = [];
  spot.cookElapsed = 0;
  spot.dinged = false;
  world.combo = 0;
  return 'trashed';
}

/** Remove one ready plate from the pass into the bin. */
export function trashPlate(world) {
  if (world.selectedPlate < 0 || world.selectedPlate >= world.pass.length) return 'noop';
  world.pass.splice(world.selectedPlate, 1);
  world.selectedPlate = -1;
  world.combo = 0;
  return 'trashed';
}

/**
 * Plate a finished dish from a spot onto the pass. Heated dishes must be golden or
 * perfect and match a recipe exactly; the plate dish only needs the exact recipe.
 * Returns 'plated' | 'smashed' | 'undercooked' | 'wrong' | 'burnt' | 'empty'.
 */
export function plateSpot(world, spotId) {
  const spot = world.spots[spotId];
  if (spot.items.length === 0) return 'empty';
  const recipe = recipeFor(spot);
  if (!recipe) {
    world.shake = 0.25;
    return 'wrong';
  }
  let quality = 'golden';
  if (spotId !== 'piring') {
    const d = donenessOf(spot);
    if (d === 'burnt') return 'burnt';
    if (d === 'raw') {
      world.shake = 0.25;
      return 'undercooked';
    }
    quality = d;
  }
  world.pass.push({ recipeId: recipe.id, quality, spotId });
  spot.items = [];
  spot.cookElapsed = 0;
  spot.dinged = false;
  world.selectedPlate = world.pass.length - 1;
  return recipe.smash ? 'smashed' : 'plated';
}

/**
 * Serve a ready plate to a ticket. Matching is by recipe; coins reward a full
 * patience bar and a perfect cook, and the combo multiplier grows per clean serve.
 */
export function servePlate(world, plateIndex, ticketId) {
  const plate = world.pass[plateIndex];
  const ticketIndex = world.tickets.findIndex((t) => t.id === ticketId);
  if (!plate || ticketIndex === -1) return 'noop';
  const ticket = world.tickets[ticketIndex];
  if (plate.recipeId !== ticket.recipeId) {
    world.shake = 0.25;
    return 'mismatch';
  }
  const recipe = recipeById(ticket.recipeId);
  const patienceFrac = Math.max(0, ticket.patience / ticket.patienceMax);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const multiplier = Math.min(2, 1 + (world.combo - 1) * 0.1);
  let coins = Math.round(recipe.price * (0.7 + 0.6 * patienceFrac) * multiplier);
  if (plate.quality === 'perfect') coins += 5;
  world.coins += coins;
  world.score += coins * 10;
  world.served += 1;
  world.lastServe = { recipeId: recipe.id, coins, x: 0, y: 0 };
  world.tickets.splice(ticketIndex, 1);
  world.pass.splice(plateIndex, 1);
  world.selectedPlate = -1;
  return 'served';
}

/** Serve the selected plate to the first matching ticket (Space key). */
export function serveSelected(world) {
  if (world.selectedPlate < 0 || world.selectedPlate >= world.pass.length) return 'noop';
  const plate = world.pass[world.selectedPlate];
  const ticket = world.tickets.find((t) => t.recipeId === plate.recipeId);
  if (!ticket) {
    world.shake = 0.25;
    return 'mismatch';
  }
  return servePlate(world, world.selectedPlate, ticket.id);
}

/** Advance the simulation one fixed step. Returns events that happened, for sound. */
export function stepWorld(world, dt) {
  const events = [];
  if (world.screen !== SCREEN_PLAY) return events;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  world.shake = Math.max(0, world.shake - dt);

  // Spawning.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    if (world.tickets.length < ORDERS.maxOpen) spawnTicket(world);
    const t = ramp(world);
    world.spawnIn = ORDERS.spawnStart + (ORDERS.spawnEnd - ORDERS.spawnStart) * t;
  }

  // Cooking.
  for (const id of SPOTS) {
    const spot = world.spots[id];
    if (id === 'piring' || spot.items.length === 0) continue;
    spot.cookElapsed += dt;
    const d = donenessOf(spot);
    if ((d === 'golden' || d === 'perfect') && !spot.dinged && recipeFor(spot)) {
      spot.dinged = true;
      events.push('ding');
    }
    if (d === 'burnt' && spot.dinged !== 'burnt') {
      if (spot.dinged === true) events.push('burnt');
      spot.dinged = 'burnt';
    }
  }

  // Patience.
  for (let i = world.tickets.length - 1; i >= 0; i -= 1) {
    const ticket = world.tickets[i];
    ticket.patience -= dt;
    if (ticket.patience <= 0) {
      world.tickets.splice(i, 1);
      world.lost += 1;
      world.combo = 0;
      events.push('expired');
    }
  }

  // Popups float and fade.
  for (let i = world.popups.length - 1; i >= 0; i -= 1) {
    const p = world.popups[i];
    p.life -= dt;
    p.y -= 34 * dt;
    if (p.life <= 0) world.popups.splice(i, 1);
  }

  // Sparkles burst, drift down and fade.
  for (let i = world.sparkles.length - 1; i >= 0; i -= 1) {
    const s = world.sparkles[i];
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 120 * dt;
    if (s.life <= 0) world.sparkles.splice(i, 1);
  }

  if (world.timeLeft <= 0) {
    world.screen = SCREEN_OVER;
    events.push('over');
  }
  return events;
}

export function starsFor(coins) {
  let stars = 0;
  for (const threshold of STARS) if (coins >= threshold) stars += 1;
  return stars;
}

export { popup };
