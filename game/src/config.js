// Warung Rush tuning: every number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule depends on
// the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** Length of one shift, in seconds. */
export const SHIFT_SECONDS = 150;

/** Ingredient ids, in station order (keyboard 1-6). */
export const INGREDIENTS = ['nasi', 'mie', 'ayam', 'telur', 'cabai', 'sayur'];

export const INGREDIENT_INFO = {
  nasi: { name: 'Nasi', key: '1' },
  mie: { name: 'Mie', key: '2' },
  ayam: { name: 'Ayam', key: '3' },
  telur: { name: 'Telur', key: '4' },
  cabai: { name: 'Cabai', key: '5' },
  sayur: { name: 'Sayur', key: '6' },
};

/** Cooking spots: two heated vessels plus the cold assembly plate. */
export const SPOTS = ['wajan', 'panci', 'piring'];

export const SPOT_INFO = {
  wajan: { name: 'Wajan', key: 'Q', heated: true },
  panci: { name: 'Panci', key: 'W', heated: true },
  piring: { name: 'Piring', key: 'E', heated: false },
};

/**
 * The menu. vessel: which spot the dish is built in. cook: seconds from first
 * ingredient to the end of the perfect window (heated dishes only). price: coins
 * for a good serve before patience and combo bonuses.
 */
export const RECIPES = [
  { id: 'nasgor', name: 'Nasi Goreng', vessel: 'wajan', needs: ['nasi', 'telur', 'cabai'], cook: 7, price: 18 },
  { id: 'miegor', name: 'Mie Goreng', vessel: 'wajan', needs: ['mie', 'telur', 'sayur'], cook: 7, price: 16 },
  { id: 'geprek', name: 'Ayam Geprek', vessel: 'wajan', needs: ['ayam', 'cabai'], cook: 6, price: 20, smash: true },
  { id: 'soto', name: 'Soto Ayam', vessel: 'panci', needs: ['ayam', 'sayur'], cook: 8, price: 17 },
  { id: 'campur', name: 'Nasi Campur', vessel: 'piring', needs: ['nasi', 'ayam', 'telur'], cook: 0, price: 22 },
];

/** Doneness bands, as fractions of a dish's cook time: golden is the serve window. */
export const DONENESS = { goldenFrom: 0.72, perfectFrom: 0.86, perfectTo: 1.08, burntFrom: 1.3 };

/** Ticket spawning and patience, before the difficulty ramp is applied. */
export const ORDERS = {
  maxOpen: 3,
  firstDelay: 1.2,
  spawnStart: 8.5,
  spawnEnd: 4.6,
  patienceStart: 52,
  patienceEnd: 32,
};

/** Coin thresholds for the end-of-shift stars. */
export const STARS = [170, 320, 500];

export const PALETTE = {
  wall: '#f3e2c7',
  wallBand: '#e8cf9f',
  awningRed: '#c0392b',
  awningCream: '#fdf3d8',
  counter: '#8a5a33',
  counterTop: '#b57e46',
  floor: '#d9b98a',
  board: '#fffaf0',
  boardEdge: '#a9713a',
  ink: '#33241a',
  muted: '#7a6650',
  gold: '#f2b134',
  coin: '#ffcf3f',
  good: '#3f9e4d',
  warn: '#e67e22',
  bad: '#c0392b',
  panel: '#fff6e3',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best shift is kept between visits (this browser only). */
export const BEST_KEY = 'warung-rush.best';
