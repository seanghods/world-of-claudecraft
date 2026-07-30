// Generate the Ravenrift Classic battleground map document: the pre-Thornhollow
// field geometry (the three-chamber layout of f377de4d4~1:src/sim/battleground_layout.ts,
// reproduced coordinate-for-coordinate) dressed in the Thornhollow style: two
// castles and a luscious yard between them.
//
// Emits an editor-format map document the Thornhollow compiler consumes:
//   node scripts/assets/generate_ravenrift_classic.mjs [out.json]
// (default out path: data/battleground/thornhollow.map.json), then re-run
// scripts/assets/compile_thornhollow.mjs and commit both.
//
// Separation of duties, so the classic mechanics survive the reskin EXACTLY:
//   collision   -> hidden collider/* volumes carrying the old layout's OBBs and
//                  circles verbatim (positions, half-extents, radii, and camera
//                  tops all from the old constants). Art NEVER collides.
//   anchors     -> regionRole-tagged placements at the old flag/spawn/banner/
//                  graveyard/rune coordinates.
//   art         -> Thornhollow GLB placements with collisionMode 'none',
//                  seated along the collider geometry they dress.
//   terrain     -> flat 0 across the whole walled play field (the classic field
//                  is flat by design: no elevation in combat); a forested
//                  backdrop ring OUTSIDE the ramparts carries the hollow look
//                  without touching a single walkable height.
//
// The LOOK (owner direction): organic, luscious, Thornhollow-grade. Meadow
// paint comes from smooth value noise in big organic patches, never per-cell
// static; one winding cobble road with ragged dirt fringes threads each
// approach, the gates and the yard ring; boulder formations are mossy rock
// clusters; the keeps read as castles (towers, arches, banners, a castle
// skyline behind each rampart); bushes, flowers, ferns and grass tufts fill
// the yard.
//
// Deterministic: no Date.now, no Math.random; scatter comes from sin-hash and
// lattice value noise. Same inputs, byte-identical output.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS_PATH = join(ROOT, 'data', 'battleground', 'thornhollow_assets.json');
const OUT_PATH = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : join(ROOT, 'data', 'battleground', 'thornhollow.map.json');

const assetData = JSON.parse(readFileSync(ASSETS_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// The classic Ravenrift layout, verbatim from the old battleground_layout.ts.
// Every number below is load-bearing: it is the collision and anchor geometry
// the mode was balanced around. Do not "improve" a coordinate.
// ---------------------------------------------------------------------------

const BG_HALF_X = 50;
const BG_HALF_Z = 140;
const BG_WALL_T = 1;
const BG_WALL_HEIGHT = 6;
const BG_FLAG_Z = 118;
const KEEP_HALF_X = 16;
const KEEP_BACK_DZ = 10;
const KEEP_SIDE_DZ = 0;
const KEEP_SIDE_HD = 10;
const BG_GRAVEYARD_FENCE_TOP = 1.8;
const PILLAR_R = 1.0;
const RUBBLE_TOP = 1.4;
const CRATE_R = 0.8;
const CRATE_TOP = 2.2;

const BG_BASES = [
  {
    team: 0,
    flag: { x: 0, z: -BG_FLAG_Z },
    spawns: [
      { x: -7, z: -117 },
      { x: 0, z: -113 },
      { x: 7, z: -117 },
      { x: -3.5, z: -114.5 },
      { x: 3.5, z: -114.5 },
    ],
    banner: { x: 0, z: -128 },
  },
  {
    team: 1,
    flag: { x: 0, z: BG_FLAG_Z },
    spawns: [
      { x: 7, z: 117 },
      { x: 0, z: 113 },
      { x: -7, z: 117 },
      { x: 3.5, z: 114.5 },
      { x: -3.5, z: 114.5 },
    ],
    banner: { x: 0, z: 128 },
  },
];

const BG_POWER_RUNES = [
  { x: 13, z: -48 },
  { x: -13, z: 48 },
];
const BG_SPEED_RUNES = [
  { x: 0, z: -91 },
  { x: 0, z: 91 },
  { x: -38, z: 0 },
  { x: 38, z: 0 },
];

const BG_COVER_WALLS = [
  { x: 0, z: 0, hw: 8, hd: 8, heart: true },
  { x: -16, z: -22, hw: 7, hd: 1 },
  { x: 16, z: 22, hw: 7, hd: 1 },
  { x: 26, z: -30, hw: 1, hd: 7 },
  { x: -26, z: 30, hw: 1, hd: 7 },
  { x: -30, z: -98, hw: 9, hd: 1 },
  { x: 30, z: 98, hw: 9, hd: 1 },
  { x: 10, z: -84, hw: 12, hd: 1 },
  { x: -10, z: 84, hw: 12, hd: 1 },
  { x: -18, z: -70, hw: 12, hd: 1 },
  { x: 18, z: 70, hw: 12, hd: 1 },
];
const BG_COVER_PILLARS = [
  { x: -30, z: -14 },
  { x: 30, z: -14 },
  { x: 0, z: -42 },
  { x: 30, z: 14 },
  { x: -30, z: 14 },
  { x: 0, z: 42 },
];
const BG_COVER_CRATES = [
  { x: -10, z: -102 },
  { x: 10, z: 102 },
  { x: 14, z: -76 },
  { x: -14, z: 76 },
  { x: -42, z: -60 },
  { x: 42, z: 60 },
  { x: 41, z: -4 },
  { x: -41, z: 4 },
  { x: -26, z: -58 },
  { x: 26, z: 58 },
  { x: -27, z: -51 },
  { x: 27, z: 51 },
];
const BG_RUBBLE_PILES = [
  { x: 9.5, z: -10.5, kind: 'rocks_decorated' },
  { x: -9.5, z: 10.5, kind: 'rocks_decorated' },
  { x: -20, z: -50, kind: 'rubble_large' },
  { x: 20, z: 50, kind: 'rubble_large' },
  { x: 43, z: -24, kind: 'rubble_large' },
  { x: -43, z: 24, kind: 'rubble_large' },
  { x: 3, z: -33, kind: 'rubble_large' },
  { x: -3, z: 33, kind: 'rubble_large' },
  { x: -33, z: -20, kind: 'rocks_decorated' },
  { x: 33, z: 20, kind: 'rocks_decorated' },
  { x: -16, z: -9, kind: 'rocks_decorated' },
  { x: 16, z: 9, kind: 'rocks_decorated' },
  { x: 30, z: -51, kind: 'rocks_decorated' },
  { x: -30, z: 51, kind: 'rocks_decorated' },
  { x: -44, z: -36, kind: 'rocks_decorated' },
  { x: 44, z: 36, kind: 'rocks_decorated' },
];
const bgRubbleRadius = (kind) => (kind === 'rubble_large' ? 4.6 : 2.0);

const BG_CURTAIN_Z = 56;
const BG_CURTAIN_WALLS = [
  { x: -41.5, z: -56, hw: 7.5, hd: 1 },
  { x: -5, z: -56, hw: 13, hd: 1 },
  { x: 33.5, z: -56, hw: 15.5, hd: 1 },
  { x: 41.5, z: 56, hw: 7.5, hd: 1 },
  { x: 5, z: 56, hw: 13, hd: 1 },
  { x: -33.5, z: 56, hw: 15.5, hd: 1 },
];
const BG_GATEHOUSE_WALLS = [
  { x: -33, z: -56, hw: 1, hd: 9 },
  { x: -19, z: -56, hw: 1, hd: 9 },
  { x: -29, z: -65, hw: 4, hd: 1 },
  { x: -23.5, z: -47, hw: 4.5, hd: 1 },
  { x: 33, z: 56, hw: 1, hd: 9 },
  { x: 19, z: 56, hw: 1, hd: 9 },
  { x: 29, z: 65, hw: 4, hd: 1 },
  { x: 23.5, z: 47, hw: 4.5, hd: 1 },
];
const BG_KEEP_BARRICADES = [
  { x: -3, z: -106, hw: 8, hd: 1, low: true },
  { x: 3, z: 106, hw: 8, hd: 1, low: true },
];
const BG_GRAVEYARDS = [
  { x: 33, z: -130, hw: 9, hd: 6 },
  { x: -33, z: 130, hw: 9, hd: 6 },
];
const BG_GRAVEYARD_FENCES = [
  { x: 24, z: -130, hw: BG_WALL_T, hd: 6, fence: true },
  { x: 42, z: -130, hw: BG_WALL_T, hd: 6, fence: true },
  { x: 33, z: -136, hw: 8, hd: BG_WALL_T, fence: true },
  { x: 35, z: -124, hw: 6, hd: BG_WALL_T, fence: true },
  { x: -24, z: 130, hw: BG_WALL_T, hd: 6, fence: true },
  { x: -42, z: 130, hw: BG_WALL_T, hd: 6, fence: true },
  { x: -33, z: 136, hw: 8, hd: BG_WALL_T, fence: true },
  { x: -35, z: 124, hw: 6, hd: BG_WALL_T, fence: true },
];

const BG_PERIMETER_WALLS = [
  { x: -BG_HALF_X, z: 0, hw: BG_WALL_T, hd: BG_HALF_Z },
  { x: BG_HALF_X, z: 0, hw: BG_WALL_T, hd: BG_HALF_Z },
  { x: 0, z: -BG_HALF_Z, hw: BG_HALF_X, hd: BG_WALL_T },
  { x: 0, z: BG_HALF_Z, hw: BG_HALF_X, hd: BG_WALL_T },
];

function keepWallSegments(team) {
  const dir = team === 0 ? -1 : 1;
  const flagZ = team === 0 ? -BG_FLAG_Z : BG_FLAG_Z;
  const backZ = flagZ + dir * KEEP_BACK_DZ;
  const sideZ = flagZ + dir * KEEP_SIDE_DZ;
  const segs = [{ x: 0, z: backZ, hw: KEEP_HALF_X, hd: BG_WALL_T }];
  for (const sx of [-KEEP_HALF_X, KEEP_HALF_X]) {
    segs.push({ x: sx, z: sideZ, hw: BG_WALL_T, hd: KEEP_SIDE_HD });
  }
  return segs;
}

// ---------------------------------------------------------------------------
// Document frame. The field rect is the classic walled 100x280; a backdrop
// ring OUTSIDE the ramparts (forest, slopes, the castle skylines) extends the
// document rect so the hollow reads as a real place from inside. Nothing in
// the ring is reachable: the ramparts and the blocker ring both wall it off.
// ---------------------------------------------------------------------------

const RING = 12; // backdrop ring width outside the ramparts
const WORLD_HALF_X = BG_HALF_X + RING; // 62
const WORLD_HALF_Z = BG_HALF_Z + RING; // 152
const SEED = 20061; // the game's fixed world seed, same as Thornhollow

// The old layout's deterministic hash (battleground_layout.ts layoutHash):
// static scatter, not gameplay randomness.
function hash(a, b) {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
}
const round2 = (v) => Math.round(v * 100) / 100;
const smooth = (t) => t * t * (3 - 2 * t);

// Lattice value noise: smooth organic fields for the paint and the scatter
// gates. `freq` is cycles per yard (feature size ~ 1/freq yards).
function vnoise(x, z, freq, salt) {
  const gx = x * freq;
  const gz = z * freq;
  const x0 = Math.floor(gx);
  const z0 = Math.floor(gz);
  const tx = smooth(gx - x0);
  const tz = smooth(gz - z0);
  const c = (ix, iz) => hash(ix * 12.9898 + salt * 78.233, iz * 4.1414 - salt * 0.7);
  const a = c(x0, z0) + (c(x0 + 1, z0) - c(x0, z0)) * tx;
  const b = c(x0, z0 + 1) + (c(x0 + 1, z0 + 1) - c(x0, z0 + 1)) * tx;
  return a + (b - a) * tz;
}

// ---------------------------------------------------------------------------
// Terrain: one flat level-0 stamp covers the whole rect (the classic field is
// flat y=0 everywhere inside the walls; heights ARE gameplay, so the play
// field gets none). The backdrop slopes rise only outside the ramparts:
// every ring stamp's reach (its radius) stays outside the walled rect, so the
// chain provably never moves a walkable height.
// ---------------------------------------------------------------------------

const terrainEdits = [
  // corner distance sqrt(62^2 + 152^2) = 164.2 < 220: one disc levels it all
  { x: 0, z: 0, radius: 220, delta: 0, falloff: 'flat', mode: 'level' },
  // The yard dip (owner direction): a gentle down-and-up through the middle,
  // the classic center hollow. Shallow on purpose: about 2yd over a 12yd run
  // (a stroll, not a ravine), it never reaches the curtains, the rune flanks
  // or any anchor, and every collider seats on it automatically.
  { x: 0, z: 0, radius: 30, delta: -2.2, falloff: 'smooth', mode: 'level', hardness: 0.15 },
];
const YARD_DIP = terrainEdits[1];

function ringStamps() {
  const out = [];
  const bump = (x, z, radius, height) => {
    out.push({
      x: round2(x),
      z: round2(z),
      radius,
      delta: height,
      falloff: 'smooth',
      mode: 'level',
      hardness: 0.35,
    });
  };
  // East/west outer edges: bumps march along |x| = WORLD_HALF_X.
  for (let z = -WORLD_HALF_Z; z <= WORLD_HALF_Z; z += 16) {
    bump(-WORLD_HALF_X, z, 11, 5 + hash(3, z) * 3.5);
    bump(WORLD_HALF_X, -z, 11, 5 + hash(3, -z) * 3.5);
  }
  // North/south outer edges behind the keeps.
  for (let x = -WORLD_HALF_X; x <= WORLD_HALF_X; x += 16) {
    bump(x, -WORLD_HALF_Z, 11, 5.5 + hash(x, 7) * 3.5);
    bump(-x, WORLD_HALF_Z, 11, 5.5 + hash(-x, 7) * 3.5);
  }
  return out;
}
terrainEdits.push(...ringStamps());

// ---------------------------------------------------------------------------
// The road: one winding cobbled way per approach, threading the keep mouth,
// the barricade lane, the S-approach walls and the main gate, then a ring
// around the heart ruin in the yard, plus a footpath through each gatehouse.
// Authored on the SOUTH half only: the paint query point-mirrors the north
// half onto it, so both teams' roads are exactly fair.
// ---------------------------------------------------------------------------

const ROAD_MAIN_S = [
  [0, -126],
  [0, -113],
  [9, -104], // round the mouth barricade through its narrow east lane
  [-4, -88], // then S past the first approach wall
  [-11, -75],
  [-2, -71], // thread the second approach wall's east end
  [3, -63],
  [13, -56], // the main gate
  [24, -38],
  [33, -16],
  [38, 0], // the east flank rune
];
const ROAD_RING_S = [
  [38, 0],
  [31, -13],
  [17, -21],
  [0, -23],
  [-17, -21],
  [-31, -13],
  [-38, 0], // the west flank rune (its own road arrives mirrored)
];
const ROAD_GATEHOUSE_S = [
  [-20, -74],
  [-22.5, -66], // the field-side door
  [-24, -57],
  [-30, -46], // the courtyard-side door
  [-35, -32],
  [-38, -12],
  [-38, 0],
];
const ROAD_POLYLINES = [ROAD_MAIN_S, ROAD_RING_S, ROAD_GATEHOUSE_S];

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

function roadDist(x, z) {
  let best = Infinity;
  for (const line of ROAD_POLYLINES) {
    for (let i = 1; i < line.length; i++) {
      const d = segDist(x, z, line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]);
      if (d < best) best = d;
    }
  }
  return best;
}

/** Road distance for any point: mirrors a north-half query onto the authored
 *  south-half polylines (the same fairness mirror the paint uses). */
function roadDistMirrored(x, z) {
  return z > 0 || (z === 0 && x > 0) ? roadDist(-x, -z) : roadDist(x, z);
}

// ---------------------------------------------------------------------------
// Ground paint. Cell 0.25yd (Thornhollow's own grain, so organic edges read
// smooth, not stepped). Swatches carry the Thornhollow texture set; the field
// is a luscious meadow with big noise-shaped patches, a ragged-edged road,
// worn cobble castle courts, and rooty halos under the boulder formations.
// ---------------------------------------------------------------------------

const PAINT_CELL = 0.25;
const PAINT_COLS = (WORLD_HALF_X * 2) / PAINT_CELL + 1; // 497
const PAINT_ROWS = (WORLD_HALF_Z * 2) / PAINT_CELL + 1; // 1217

// The swatch configs are Thornhollow's own (same texture, tile size and light
// lift as the shipped map's palette), so the ground reads exactly like the
// look the owner approved: bright meadow, warm trodden paths, chunky cobbles.
const SW_MEADOW = 200;
const SW_SUNGRASS = 201;
const SW_COBBLE = 202;
const SW_EARTH = 203;
const SW_ROOTS = 204;
const SW_FOREST = 205;
const SW_COURT = 206;

const paintSwatches = [
  { id: SW_MEADOW, color: 0x55763c, label: 'Hollow Meadow', textureSha: 'builtin:Grass002', tileSize: 26, light: 0, saved: true },
  { id: SW_SUNGRASS, color: 0x6d8a44, label: 'Spring Sward', textureSha: 'builtin:Grass003', tileSize: 14, light: 0, saved: true },
  { id: SW_COBBLE, color: 0x7d787a, label: 'Cobbled Road', textureSha: 'builtin:Cobblestone001', tileSize: 14, light: 0, saved: true },
  { id: SW_EARTH, color: 0x8a6f52, label: 'Trodden Path', textureSha: 'builtin:Ground100', tileSize: 7, light: 0.12, saved: true },
  { id: SW_ROOTS, color: 0x584a38, label: 'Living Roots', textureSha: 'builtin:Roots002', tileSize: 15, light: 0, saved: true },
  { id: SW_FOREST, color: 0x5c5138, label: 'Forest Loam', textureSha: 'builtin:Ground101', tileSize: 8, light: 0.1, saved: true },
  { id: SW_COURT, color: 0x74706b, label: 'Old Cobblestone', textureSha: 'builtin:Cobblestone002', tileSize: 14, light: 0, saved: true },
];

const inRect = (x, z, cx, cz, hw, hd) =>
  Math.abs(x - cx) <= hw && Math.abs(z - cz) <= hd;

function paintAt(x, z) {
  // Point-mirror the north half onto the south pick so neither team's ground
  // reads different (the classic floor tiler's fairness rule).
  if (z > 0 || (z === 0 && x > 0)) return paintAt(-x, -z);
  const inField = Math.abs(x) < BG_HALF_X && Math.abs(z) < BG_HALF_Z;

  if (!inField) {
    // Backdrop ring: forest floor with mossy meadow breaks and root veins.
    const n = vnoise(x, z, 0.07, 31);
    if (n > 0.62) return SW_MEADOW;
    if (vnoise(x, z, 0.11, 47) > 0.74) return SW_ROOTS;
    return SW_FOREST;
  }

  // The castle court: old worn cobbles inside the keep enclosure.
  if (inRect(x, z, 0, -BG_FLAG_Z, KEEP_HALF_X, KEEP_BACK_DZ + 1)) {
    return vnoise(x, z, 0.3, 13) > 0.78 ? SW_EARTH : SW_COURT;
  }

  // The gatehouse room: a paved interior, not a grass strip between walls.
  if (inRect(x, z, -26, -BG_CURTAIN_Z, 6.8, 8.8)) {
    return vnoise(x, z, 0.3, 59) > 0.7 ? SW_EARTH : SW_COURT;
  }

  // Graveyard plots: bare rooty earth inside the rails.
  const g = BG_GRAVEYARDS[0];
  if (inRect(x, z, g.x, g.z, g.hw + 1, g.hd + 1)) {
    return vnoise(x, z, 0.25, 17) > 0.5 ? SW_ROOTS : SW_EARTH;
  }

  // The road: a cobbled core with a ragged packed-earth fringe. The ripple
  // noise moves both edges so no stretch reads machine-straight.
  const rd = roadDist(x, z);
  if (rd < 8) {
    const ripple = (vnoise(x, z, 0.3, 5) - 0.5) * 2.4;
    if (rd < 2.4 + ripple) return SW_COBBLE;
    if (rd < 4.2 + ripple && vnoise(x, z, 0.55, 7) > 0.35) return SW_EARTH;
  }

  // Rooty halos under the boulder formations and the heart ruin.
  for (const rb of BG_RUBBLE_PILES) {
    if (rb.z > 0) continue; // south half only: the query is already mirrored
    const r = bgRubbleRadius(rb.kind);
    const d = Math.hypot(x - rb.x, z - rb.z);
    if (d < r * 1.5 + (vnoise(x, z, 0.4, 19) - 0.5) * 2) return SW_ROOTS;
    if (d < r * 2.3 + (vnoise(x, z, 0.35, 23) - 0.5) * 2.5) return SW_EARTH;
  }
  const heartD = Math.max(Math.abs(x) - 8, Math.abs(z) - 8);
  if (heartD < 3 + (vnoise(x, z, 0.35, 29) - 0.5) * 2.5) {
    return vnoise(x, z, 0.3, 37) > 0.45 ? SW_ROOTS : SW_EARTH;
  }

  // The luscious yard: meadow with big sunlit sweeps and the odd mud patch.
  if (vnoise(x, z, 0.055, 41) < 0.16) return SW_EARTH;
  if (vnoise(x, z, 0.07, 43) > 0.58) return SW_SUNGRASS;
  return SW_MEADOW;
}

function buildPaintIds() {
  const ids = new Array(PAINT_COLS * PAINT_ROWS);
  let i = 0;
  for (let row = 0; row < PAINT_ROWS; row++) {
    const z = -WORLD_HALF_Z + row * PAINT_CELL;
    for (let col = 0; col < PAINT_COLS; col++) {
      const x = -WORLD_HALF_X + col * PAINT_CELL;
      ids[i++] = paintAt(x, z);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Placements: anchors, colliders, art.
// ---------------------------------------------------------------------------

const placements = [];

// --- Game-mode anchors (never render, never collide) -----------------------
const TEAM_LABEL = ['Crimson', 'Azure'];
for (const base of BG_BASES) {
  const t = base.team;
  placements.push({
    assetId: 'collider/box',
    name: `${TEAM_LABEL[t]} flag`,
    regionRole: `flag${t}`,
    x: base.flag.x,
    z: base.flag.z,
    rotY: 0,
    scale: 1,
    collide: false,
  });
  placements.push({
    assetId: 'collider/box',
    name: `${TEAM_LABEL[t]} banner`,
    regionRole: `banner${t}`,
    x: base.banner.x,
    z: base.banner.z,
    rotY: 0,
    scale: 1,
    collide: false,
  });
  base.spawns.forEach((s, i) => {
    // Names pin the wave-spawn order: the compiler sorts spawns by name.
    placements.push({
      assetId: 'collider/sphere',
      name: `${TEAM_LABEL[t]} spawn ${i + 1}`,
      regionRole: `spawn${t}`,
      x: s.x,
      z: s.z,
      rotY: 0,
      scale: 1,
      collide: false,
    });
  });
}
BG_GRAVEYARDS.forEach((g, t) => {
  placements.push({
    assetId: 'collider/box',
    name: `${TEAM_LABEL[t]} graveyard`,
    regionRole: `graveyard${t}`,
    x: g.x,
    z: g.z,
    rotY: 0,
    scale: 1,
    collide: false,
    sizeX: g.hw * 2,
    sizeZ: g.hd * 2,
  });
});
BG_SPEED_RUNES.forEach((r, i) => {
  placements.push({
    assetId: 'collider/box',
    name: `speed rune ${i + 1}`,
    regionRole: 'speedRune',
    x: r.x,
    z: r.z,
    rotY: 0,
    scale: 1,
    collide: false,
  });
});
BG_POWER_RUNES.forEach((r, i) => {
  placements.push({
    assetId: 'collider/box',
    name: `power rune ${i + 1}`,
    regionRole: 'powerRune',
    x: r.x,
    z: r.z,
    rotY: 0,
    scale: 1,
    collide: false,
  });
});

// --- Collision volumes: the old collider set, verbatim ---------------------
// Every wall segment becomes a hidden collider/wall OBB with the exact old
// half-extents. Movement blocking is IDENTICAL to the classic set everywhere
// (full-height OBBs). Spell sight is identical too: any top above the 1.6yd
// eye line blocks a cast the same, so the hedge-dressed yard cover carries a
// 3yd top (a hedge the camera glides over) while stone structure keeps the
// classic 6yd camera-solid top (camSolid pulls the chase cam in on real
// castle walls).
function wallVolume(seg, name, opts = {}) {
  const top =
    opts.top ?? (seg.fence ? BG_GRAVEYARD_FENCE_TOP : seg.low ? BG_WALL_HEIGHT / 2 : BG_WALL_HEIGHT);
  placements.push({
    assetId: 'collider/wall',
    name,
    x: seg.x,
    z: seg.z,
    rotY: 0,
    scale: 1,
    collide: true,
    hidden: true,
    ...(opts.hedge ? {} : { camSolid: true }),
    sizeX: seg.hw * 2,
    sizeY: top,
    sizeZ: seg.hd * 2,
  });
}

const YARD_HEDGES = BG_COVER_WALLS.slice(1); // the classic sightline breakers,
// wing baffles and S-approach walls: same footprints, dressed as hedgerows

BG_PERIMETER_WALLS.forEach((s, i) => wallVolume(s, `rampart ${i + 1}`));
keepWallSegments(0).forEach((s, i) => wallVolume(s, `crimson keep wall ${i + 1}`));
keepWallSegments(1).forEach((s, i) => wallVolume(s, `azure keep wall ${i + 1}`));
wallVolume(BG_COVER_WALLS[0], 'heart ruin block');
YARD_HEDGES.forEach((s, i) => wallVolume(s, `yard hedge ${i + 1}`, { hedge: true, top: 3 }));
BG_CURTAIN_WALLS.forEach((s, i) => wallVolume(s, `curtain ${i + 1}`));
BG_GATEHOUSE_WALLS.forEach((s, i) => wallVolume(s, `gatehouse wall ${i + 1}`));
BG_KEEP_BARRICADES.forEach((s, i) => wallVolume(s, `mouth barricade ${i + 1}`));
BG_GRAVEYARD_FENCES.forEach((s, i) => wallVolume(s, `graveyard fence ${i + 1}`));

// Circle colliders: pillars, crates, rubble, exactly the old circles. camTopY
// pins each one's occlusion/sight top to the old value: pillar 6 (the dressed
// trunk height), crate 2.2 (the stack top), rubble 1.4 (below SIGHT_HEIGHT
// plus eye: movement cover, never sight cover, and the camera clears it).
function circleVolume(name, x, z, r, top) {
  placements.push({
    assetId: 'collider/sphere',
    name,
    x,
    z,
    rotY: 0,
    scale: 1,
    collide: true,
    hidden: true,
    camSolid: true,
    sizeX: r * 2,
    camTopY: top,
  });
}
BG_COVER_PILLARS.forEach((p, i) => circleVolume(`pillar collider ${i + 1}`, p.x, p.z, PILLAR_R, BG_WALL_HEIGHT));
BG_COVER_CRATES.forEach((c, i) => circleVolume(`crate collider ${i + 1}`, c.x, c.z, CRATE_R, CRATE_TOP));
BG_RUBBLE_PILES.forEach((rb, i) =>
  circleVolume(`rubble collider ${i + 1}`, rb.x, rb.z, bgRubbleRadius(rb.kind), RUBBLE_TOP),
);

// --- Art dressing ----------------------------------------------------------
// Module metrics come from the baked collision tables so runs of wall pieces
// tile at their NATURAL proportions (uniform scale only: a squashed or
// stretched wall module reads broken).
function bakedFootprint(assetId) {
  const entry = assetData[assetId];
  if (!entry || !entry.boxes || entry.boxes.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxY = 0;
  for (const b of entry.boxes) {
    minX = Math.min(minX, b.x - b.hx);
    maxX = Math.max(maxX, b.x + b.hx);
    minZ = Math.min(minZ, b.z - b.hz);
    maxZ = Math.max(maxZ, b.z + b.hz);
    maxY = Math.max(maxY, b.y + b.hy);
  }
  return { w: maxX - minX, d: maxZ - minZ, h: maxY };
}

const WALL_ASSET = 'dungeon/wall';
const wallFp = bakedFootprint(WALL_ASSET) ?? { w: 4, d: 1, h: 6 };
const wallLen = Math.max(wallFp.w, wallFp.d);
const wallRunsAlongX = wallFp.w >= wallFp.d;

let artSerial = 0;
function art(assetId, x, z, opts = {}) {
  artSerial++;
  placements.push({
    assetId,
    name: opts.name ?? `art ${artSerial}`,
    x: round2(x),
    z: round2(z),
    rotY: round2(opts.rotY ?? 0),
    scale: round2(opts.scale ?? 1),
    collide: false,
    collisionMode: 'none',
    ...(opts.scaleX !== undefined ? { scaleX: round2(opts.scaleX) } : {}),
    ...(opts.scaleY !== undefined ? { scaleY: round2(opts.scaleY) } : {}),
    ...(opts.scaleZ !== undefined ? { scaleZ: round2(opts.scaleZ) } : {}),
    ...(opts.detached ? { detached: true, groundY: opts.groundY ?? 0 } : {}),
    ...(opts.hue !== undefined ? { hue: opts.hue } : {}),
    ...(opts.lum !== undefined ? { lum: opts.lum } : {}),
    ...(opts.clump !== undefined ? { clump: opts.clump } : {}),
  });
}

// Dress a wall segment with a run of wall modules along its long axis, at the
// module's natural proportions: uniform scale to the target height, modules
// tiled edge to edge (tiny overlaps beat gaps and stretching).
function dressWall(seg, opts = {}) {
  const alongX = seg.hw >= seg.hd;
  const len = (alongX ? seg.hw : seg.hd) * 2;
  const targetH = opts.height ?? BG_WALL_HEIGHT;
  const scale = targetH / wallFp.h;
  const moduleLen = wallLen * scale;
  const n = Math.max(1, Math.ceil(len / moduleLen - 0.02));
  const step = len / n;
  const rotY = alongX === wallRunsAlongX ? 0 : Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + step * (i + 0.5);
    const x = alongX ? seg.x + t : seg.x;
    const z = alongX ? seg.z : seg.z + t;
    art(WALL_ASSET, x, z, { rotY, scale });
  }
}

const TOWER = 'city/wall_tower';
const ARCH = 'biome/dungeon_arch_stone';

// Perimeter ramparts: solid runs, wall towers on the four corners and at the
// curtain junctions.
for (const seg of BG_PERIMETER_WALLS) dressWall(seg);
for (const cx of [-BG_HALF_X, BG_HALF_X]) {
  for (const cz of [-BG_HALF_Z, BG_HALF_Z]) art(TOWER, cx, cz, { scale: 0.95 });
  for (const cz of [-BG_CURTAIN_Z, BG_CURTAIN_Z]) art(TOWER, cx, cz, { scale: 0.85 });
}

// The keeps read as castles: towered walls, a gate arch over the mouth road,
// banners inside the court, and a castle skyline rising in the backdrop ring
// behind each rampart (out of play, pure silhouette).
for (const t of [0, 1]) {
  for (const seg of keepWallSegments(t)) dressWall(seg);
  const dir = t === 0 ? -1 : 1;
  const flagZ = dir * BG_FLAG_Z;
  const backZ = flagZ + dir * KEEP_BACK_DZ;
  const mouthZ = flagZ - dir * KEEP_SIDE_HD;
  // Towers on all four wall ends. The mouth itself stays an OPEN span (the
  // classic entrance is the whole gap between the side walls; only the low
  // offset barricade breaks the straight line, and dressing a "door" onto it
  // would lie about where the way in is).
  for (const sx of [-KEEP_HALF_X, KEEP_HALF_X]) {
    art(TOWER, sx, backZ, { scale: 0.9 });
    art(TOWER, sx, mouthZ, { scale: 0.8 });
  }
  const bannerAsset = t === 0 ? 'dungeon/banner_shield_red' : 'dungeon/banner_shield_blue';
  for (const bx of [-7, 7]) art(bannerAsset, bx, backZ - dir * 1.2, { rotY: t === 0 ? 0 : Math.PI });
  for (const mx of [-10, 10]) art('dungeon/lantern_standing', mx, mouthZ - dir * 1.5);
  // The castle skyline behind the rampart: unreachable backdrop in the ring.
  const skyZ = dir * (BG_HALF_Z + 6);
  art('medieval_village_v2/buildings/CastleBase_03', 0, skyZ, {
    name: `${TEAM_LABEL[t]} castle skyline`,
    scale: 1.25,
    rotY: t === 0 ? 0 : Math.PI,
    detached: true,
    groundY: 2,
  });
  art(TOWER, -14, skyZ, { scale: 1.15, detached: true, groundY: 2 });
  art(TOWER, 14, skyZ, { scale: 1.15, detached: true, groundY: 2 });
}

// Curtain walls: towered runs with an arch spanning each main gate. The arch
// is width-matched to the REAL 10yd opening (x 8..18 on the south curtain) so
// the visual doorway and the walkable gap are the same thing; its legs stand
// on the tower line at the opening's edges.
for (const seg of BG_CURTAIN_WALLS) dressWall(seg);
{
  const fp = bakedFootprint(ARCH) ?? { w: 4, d: 1.2, h: 4.4 };
  const legsAlongX = fp.w >= fp.d;
  const legSpan = legsAlongX ? fp.w : fp.d;
  const sx = 10.5 / legSpan; // opening spans the full gate
  const arch = (x, z, rotY) =>
    art(ARCH, x, z, {
      name: 'main gate arch',
      rotY,
      scale: 1,
      scaleX: legsAlongX ? sx : 1.15,
      scaleZ: legsAlongX ? 1.15 : sx,
      scaleY: Math.max(1.45, sx * 0.75),
    });
  // The gate runs along x, the road passes along z: legs east/west of the gap.
  arch(13, -BG_CURTAIN_Z, legsAlongX ? 0 : Math.PI / 2);
  arch(-13, BG_CURTAIN_Z, legsAlongX ? 0 : Math.PI / 2);
}
art(TOWER, 8, -BG_CURTAIN_Z, { scale: 0.75 });
art(TOWER, 18, -BG_CURTAIN_Z, { scale: 0.75 });
art(TOWER, -8, BG_CURTAIN_Z, { scale: 0.75 });
art(TOWER, -18, BG_CURTAIN_Z, { scale: 0.75 });

// Gatehouses: solid rooms, lanterns at both doors.
for (const seg of BG_GATEHOUSE_WALLS) dressWall(seg);
art('dungeon/post_lantern', -22.5, -67.5);
art('dungeon/post_lantern', -31, -45.5);
art('dungeon/post_lantern', 22.5, 67.5);
art('dungeon/post_lantern', 31, 45.5);

// Mouth barricades: a low parapet of the same castle stone (half wall height,
// uniform scale, so it reads as a hold point in front of the keep, never as
// scattered debris).
for (const seg of BG_KEEP_BARRICADES) {
  dressWall(seg, { height: BG_WALL_HEIGHT / 2 });
}

// The heart ruin: an overgrown hollow shell (the collider stays the solid
// 16x16 block). Boulders shoulder its faces, an old trunk rises from it.
{
  const h = BG_COVER_WALLS[0];
  const faces = [
    { x: h.x, z: h.z - h.hd, hw: h.hw, hd: 0.5 },
    { x: h.x, z: h.z + h.hd, hw: h.hw, hd: 0.5 },
    { x: h.x - h.hw, z: h.z, hw: 0.5, hd: h.hd },
    { x: h.x + h.hw, z: h.z, hw: 0.5, hd: h.hd },
  ];
  for (const f of faces) dressWall(f, { height: 5 });
  for (const [cx, cz] of [
    [-h.hw, -h.hd],
    [h.hw, h.hd],
    [-h.hw, h.hd],
    [h.hw, -h.hd],
  ]) {
    art(`foliage/rock_${1 + Math.floor(hash(cx, cz) * 3)}`, cx * 0.95, cz * 0.95, {
      rotY: hash(cz, cx) * Math.PI * 2,
      scale: 1.5 + hash(cx + 9, cz) * 0.6,
    });
  }
  art('dungeon/trunk_large_b', 0, 0, { scale: 1.8, detached: true, groundY: 2.5 });
  art('dungeon/sword_shield_broken', 2.5, -3.1, { rotY: 0.9 });
  art('dungeon/skull', -2.2, 3.4);
}

// The yard's cover walls become hedgerows: dense overlapping bushes down each
// classic footprint, a boulder anchoring one end, so the yard reads as an
// overgrown garden, never a stone maze. (The hidden hedge volume above still
// blocks movement and casts exactly like the classic wall.)
for (const seg of YARD_HEDGES) {
  const alongX = seg.hw >= seg.hd;
  const len = (alongX ? seg.hw : seg.hd) * 2;
  const n = Math.max(2, Math.round(len / 1.5));
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (len / n) * (i + 0.5);
    const jitter = (hash(seg.x + i, seg.z) - 0.5) * 0.8;
    const x = alongX ? seg.x + t : seg.x + jitter;
    const z = alongX ? seg.z + jitter : seg.z + t;
    const pick = hash(i, seg.x + seg.z);
    const asset = pick < 0.72 ? 'foliage/bush' : pick < 0.88 ? 'foliage/bush_flowers' : 'foliage/fern';
    art(asset, x, z, {
      rotY: hash(z, x) * Math.PI * 2,
      scale: 1.25 + hash(seg.z + i, seg.x) * 0.55,
    });
  }
  const endT = (alongX ? seg.hw : seg.hd) * (hash(seg.x, seg.z) > 0.5 ? 1 : -1);
  art(`foliage/rock_${1 + Math.floor(hash(seg.z, seg.x) * 3)}`,
    alongX ? seg.x + endT : seg.x + (hash(seg.x + 1, seg.z) - 0.5) * 2,
    alongX ? seg.z + (hash(seg.x, seg.z + 1) - 0.5) * 2 : seg.z + endT,
    { rotY: hash(seg.x * 2, seg.z) * Math.PI * 2, scale: 0.9 + hash(seg.x, seg.z * 2) * 0.5 });
}

// The classic pillars become mighty oaks: the trunk stands in for the column
// (the hidden r=1 circle is the collider, exactly the classic footprint).
for (const p of BG_COVER_PILLARS) {
  art('foliage/oak_1', p.x, p.z, { rotY: hash(p.x, p.z) * Math.PI * 2, scale: 1.35 + hash(p.z, p.x) * 0.3 });
}

// Crates: stacked crate sets with a barrel alongside.
for (const c of BG_COVER_CRATES) {
  const ry = Math.floor(hash(c.x, c.z) * 4) * (Math.PI / 2);
  art('dungeon/crates_stacked', c.x, c.z, { rotY: ry });
  if (hash(c.z, c.x) > 0.45) {
    art('dungeon/barrel_large', c.x + 1.3, c.z + 0.6, { rotY: hash(c.x + 3, c.z) * Math.PI * 2, scale: 0.9 });
  }
}

// Boulder formations: mossy rock clusters over the old rubble circles, the
// image-one look (two or three big stones shouldering each other, ferns at
// the feet).
for (const rb of BG_RUBBLE_PILES) {
  const r = bgRubbleRadius(rb.kind);
  const big = rb.kind === 'rubble_large';
  const n = big ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const a = hash(rb.x + i, rb.z) * Math.PI * 2;
    const d = i === 0 ? 0 : r * (0.35 + hash(rb.z + i, rb.x) * 0.4);
    art(`foliage/rock_${1 + Math.floor(hash(rb.x * 1.3 + i, rb.z) * 3)}`, rb.x + Math.cos(a) * d, rb.z + Math.sin(a) * d, {
      rotY: hash(i, rb.x + rb.z) * Math.PI * 2,
      scale: (big ? 1.9 : 1.1) * (1 - i * 0.22),
    });
  }
  art('foliage/fern', rb.x + r * 0.9, rb.z - r * 0.4, { rotY: hash(rb.x, rb.z + 7) * Math.PI * 2, scale: 1.1 });
  if (big) art('foliage/bush', rb.x - r * 0.8, rb.z + r * 0.5, { rotY: hash(rb.z, rb.x + 7) * Math.PI * 2 });
}

// Graveyards: stones inside each plot, broken fence dressing on the rails, a
// twisted tree mourning in the outer corner.
for (const [t, g] of BG_GRAVEYARDS.entries()) {
  const stones = ['dungeon/gravestone', 'dungeon/grave_a', 'dungeon/gravemarker_b', 'props/gravestone_cross'];
  for (let i = 0; i < 7; i++) {
    const gx = g.x - g.hw + 1.6 + hash(i, t) * (g.hw * 2 - 3.2);
    const gz = g.z - g.hd + 1.4 + hash(t, i) * (g.hd * 2 - 2.8);
    art(stones[Math.floor(hash(i * 3.1, t + 2) * stones.length)], gx, gz, {
      rotY: (hash(i, t + 5) - 0.5) * 0.7 + (t === 0 ? 0 : Math.PI),
    });
  }
  art('dungeon/lantern_standing', g.x, g.z + (t === 0 ? g.hd - 1 : -(g.hd - 1)));
  const sx = t === 0 ? g.x + g.hw - 1 : g.x - g.hw + 1;
  const sz = t === 0 ? g.z - g.hd + 1 : g.z + g.hd - 1;
  art('foliage/twisted_1', sx, sz, { rotY: hash(sx, sz) * Math.PI * 2, scale: 1.1 });
}
for (const seg of BG_GRAVEYARD_FENCES) {
  const alongX = seg.hw >= seg.hd;
  const len = (alongX ? seg.hw : seg.hd) * 2;
  const n = Math.max(1, Math.round(len / 2.2));
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (len / n) * (i + 0.5);
    art('dungeon/fence_broken', alongX ? seg.x + t : seg.x, alongX ? seg.z : seg.z + t, {
      rotY: alongX ? 0 : Math.PI / 2,
    });
  }
}

// Rune pads read as places: a torch beside each power rune pad.
for (const r of BG_POWER_RUNES) art('dungeon/torch_mounted', r.x + 2, r.z, { rotY: Math.PI / 2 });

// ---------------------------------------------------------------------------
// The luscious scatter: bushes, flowering bushes, ferns and grass tufts over
// the meadow, dense but honest: never on the road, never in the castle courts
// or graveyards, never crowding a flag, spawn, rune pad or crossing.
// ---------------------------------------------------------------------------

const CLEAR_SPOTS = [
  ...BG_BASES.flatMap((b) => [b.flag, b.banner, ...b.spawns]),
  ...BG_SPEED_RUNES,
  ...BG_POWER_RUNES,
  { x: 13, z: -BG_CURTAIN_Z },
  { x: -13, z: BG_CURTAIN_Z },
  { x: -22.5, z: -65 },
  { x: -30, z: -47 },
  { x: 22.5, z: 65 },
  { x: 30, z: 47 },
];
function clearOfPlay(x, z, margin) {
  for (const s of CLEAR_SPOTS) {
    if (Math.hypot(x - s.x, z - s.z) < margin) return false;
  }
  return true;
}
function inKeepCourtOrYard(x, z) {
  return (
    inRect(x, z, 0, -BG_FLAG_Z, KEEP_HALF_X, KEEP_BACK_DZ + 1) ||
    inRect(x, z, 0, BG_FLAG_Z, KEEP_HALF_X, KEEP_BACK_DZ + 1) ||
    inRect(x, z, BG_GRAVEYARDS[0].x, BG_GRAVEYARDS[0].z, BG_GRAVEYARDS[0].hw + 1, BG_GRAVEYARDS[0].hd + 1) ||
    inRect(x, z, BG_GRAVEYARDS[1].x, BG_GRAVEYARDS[1].z, BG_GRAVEYARDS[1].hw + 1, BG_GRAVEYARDS[1].hd + 1)
  );
}

{
  // Shrub layer: bushes, flowering bushes, ferns (all walk-through foliage).
  let si = 0;
  for (let z = -136; z <= 136; z += 5) {
    for (let x = -47; x <= 47; x += 5) {
      si++;
      const jx = x + (hash(si, 21) - 0.5) * 4;
      const jz = z + (hash(21, si) - 0.5) * 4;
      if (Math.abs(jx) > 47 || Math.abs(jz) > 137) continue;
      if (roadDistMirrored(jx, jz) < 5.5) continue;
      if (inKeepCourtOrYard(jx, jz)) continue;
      if (!clearOfPlay(jx, jz, 4)) continue;
      const gate = vnoise(jx, jz, 0.05, 53);
      if (hash(jx * 0.61, jz * 0.43) > gate * 0.85) continue;
      const pick = hash(si, 22);
      const asset = pick < 0.4 ? 'foliage/bush' : pick < 0.62 ? 'foliage/bush_flowers' : 'foliage/fern';
      art(asset, jx, jz, {
        rotY: hash(jz, jx) * Math.PI * 2,
        scale: 0.8 + hash(si, 23) * 0.55,
      });
    }
  }
  // Grass tuft layer: dense over painted grass, Thornhollow's own tint.
  let gi = 0;
  for (let z = -136; z <= 136; z += 4) {
    for (let x = -47; x <= 47; x += 4) {
      gi++;
      const jx = x + (hash(gi, 1) - 0.5) * 3.4;
      const jz = z + (hash(1, gi) - 0.5) * 3.4;
      if (Math.abs(jx) > 47 || Math.abs(jz) > 137) continue;
      const paint = paintAt(jx, jz);
      if (paint !== SW_MEADOW && paint !== SW_SUNGRASS) continue;
      if (!clearOfPlay(jx, jz, 2.5)) continue;
      // Clustered, not carpeted: a low-frequency gate keeps tuft drifts with
      // open lawn between them (a uniform carpet reads as confetti at range).
      if (vnoise(jx, jz, 0.06, 67) < 0.45) continue;
      if (hash(jx * 0.61, jz * 0.43) < 0.5) continue;
      art('grass/patch', jx, jz, {
        rotY: hash(jz, jx) * Math.PI * 2,
        scale: 0.85 + hash(gi, 2) * 0.5,
        hue: 100 + Math.floor(hash(gi, 3) * 16),
        lum: 0.45 + hash(gi, 4) * 0.18,
        clump: 12 + Math.floor(hash(gi, 5) * 8),
      });
    }
  }
}

// The backdrop ring: old-growth forest crowding the outside of the ramparts,
// with canopies leaning over the walls.
{
  const trees = ['foliage/oak_1', 'foliage/oak_2', 'foliage/oak_3', 'foliage/oak_5', 'foliage/pine_1', 'foliage/pine_2', 'foliage/pine_3', 'foliage/twisted_1'];
  let ti = 0;
  const ringSpot = (x, z, spread) => {
    ti++;
    const t = trees[Math.floor(hash(ti * 1.7, 3) * trees.length)];
    art(t, x + (hash(ti, 6) - 0.5) * spread, z + (hash(6, ti) - 0.5) * spread, {
      rotY: hash(ti, 7) * Math.PI * 2,
      scale: 1.0 + hash(ti, 8) * 0.7,
    });
    if (hash(ti, 9) < 0.35) {
      art(`foliage/rock_${1 + Math.floor(hash(ti, 10) * 3)}`, x + (hash(ti, 11) - 0.5) * 6, z + (hash(11, ti) - 0.5) * 6, {
        rotY: hash(ti, 12) * Math.PI * 2,
        scale: 0.8 + hash(ti, 13) * 0.6,
      });
    }
    if (hash(ti, 14) < 0.4) {
      art(hash(ti, 15) < 0.5 ? 'foliage/bush' : 'foliage/bush_flowers', x + (hash(ti, 16) - 0.5) * 7, z + (hash(16, ti) - 0.5) * 7, {
        rotY: hash(ti, 17) * Math.PI * 2,
      });
    }
  };
  // Two staggered ranks per side: one hugging the rampart, one on the slope.
  for (let z = -WORLD_HALF_Z + 3; z <= WORLD_HALF_Z - 3; z += 6) {
    ringSpot(-(BG_HALF_X + 3), z, 3);
    ringSpot(BG_HALF_X + 3, -z, 3);
    ringSpot(-(BG_HALF_X + 8.5), z + 3, 4);
    ringSpot(BG_HALF_X + 8.5, -z - 3, 4);
  }
  for (let x = -WORLD_HALF_X + 3; x <= WORLD_HALF_X - 3; x += 6) {
    ringSpot(x, -(BG_HALF_Z + 3), 3);
    ringSpot(-x, BG_HALF_Z + 3, 3);
    ringSpot(x + 3, -(BG_HALF_Z + 8.5), 4);
    ringSpot(-x - 3, BG_HALF_Z + 8.5, 4);
  }
}

// ---------------------------------------------------------------------------
// Lights and decals: lantern glow at the gates, mouths, and graveyards.
// ---------------------------------------------------------------------------

const lights = [];
function lantern(x, z, color = 0xffb45c, intensity = 1.4, range = 14) {
  lights.push({ x: round2(x), y: 3, z: round2(z), color, intensity, range });
}
lantern(13, -BG_CURTAIN_Z);
lantern(-13, BG_CURTAIN_Z);
lantern(-22.5, -67.5);
lantern(-31, -45.5);
lantern(22.5, 67.5);
lantern(31, 45.5);
for (const t of [0, 1]) {
  const dir = t === 0 ? -1 : 1;
  for (const mx of [-10, 10]) lantern(mx, dir * (BG_FLAG_Z - KEEP_SIDE_HD - 1.5));
}
lantern(33, -125, 0x9cc4ff, 1.1, 12);
lantern(-33, 125, 0x9cc4ff, 1.1, 12);

const decals = [
  { x: 2.1, z: -1.4, tex: 'builtin:blood_pool', size: 3.2, rot: 0.7 },
  { x: -2.1, z: 1.4, tex: 'builtin:blood_splatter', size: 2.6, rot: 3.9 },
];

// Named places: the classic chambers.
const locations = [
  { name: 'Crimson Keep', minX: -KEEP_HALF_X, minZ: -(BG_FLAG_Z + KEEP_BACK_DZ), maxX: KEEP_HALF_X, maxZ: -(BG_FLAG_Z - 10) },
  { name: 'Azure Keep', minX: -KEEP_HALF_X, minZ: BG_FLAG_Z - 10, maxX: KEEP_HALF_X, maxZ: BG_FLAG_Z + KEEP_BACK_DZ },
  { name: 'The Hollow Yard', minX: -BG_HALF_X, minZ: -BG_CURTAIN_Z, maxX: BG_HALF_X, maxZ: BG_CURTAIN_Z },
];

// Invisible blocker ring at the document rect edge, matching Thornhollow's
// convention (belt and braces outside the ramparts).
const blockers = [
  { x1: -WORLD_HALF_X, z1: -WORLD_HALF_Z, x2: WORLD_HALF_X, z2: -WORLD_HALF_Z },
  { x1: WORLD_HALF_X, z1: -WORLD_HALF_Z, x2: WORLD_HALF_X, z2: WORLD_HALF_Z },
  { x1: WORLD_HALF_X, z1: WORLD_HALF_Z, x2: -WORLD_HALF_X, z2: WORLD_HALF_Z },
  { x1: -WORLD_HALF_X, z1: WORLD_HALF_Z, x2: -WORLD_HALF_X, z2: -WORLD_HALF_Z },
];

// ---------------------------------------------------------------------------
// Assemble, self-check, emit.
// ---------------------------------------------------------------------------

const doc = {
  version: 2,
  meta: {
    id: 'ravenrift_classic_v2',
    name: 'Ravenrift',
    description:
      'Ravenrift, the classic three-chamber field in the Thornhollow style: two castles and a luscious yard between them, the walled Hollow Yard crossed by two curtain gates, and the old-growth hollow crowding the ramparts.',
    createdAt: 0,
    updatedAt: 0,
    seed: SEED,
    parentId: 'thornhollow_v3',
  },
  content: {
    zones: [
      {
        id: 'blank_world',
        name: 'Ravenrift',
        zMin: -WORLD_HALF_Z,
        zMax: WORLD_HALF_Z,
        levelRange: [1, 1],
        biome: 'vale',
        hub: { x: 0, z: 0, radius: 8, name: '' },
        graveyard: { x: 0, z: 0 },
        lakes: [],
        pois: [],
        welcome: '',
      },
    ],
    camps: [],
    npcs: {},
    objects: [],
    roads: [],
  },
  worldHalfX: WORLD_HALF_X,
  playerStart: { x: 0, z: -113 },
  waterLevel: -40,
  skybox: 'builtin:vale_day',
  terrainEdits,
  biomePaint: {
    cell: PAINT_CELL,
    cols: PAINT_COLS,
    rows: PAINT_ROWS,
    originX: -WORLD_HALF_X,
    originZ: -WORLD_HALF_Z,
    ids: buildPaintIds(),
    custom: paintSwatches,
  },
  placements,
  blockers,
  lights,
  decals,
  locations,
};

// Self-checks before writing anything.
function fail(msg) {
  console.error(`SELF-CHECK FAILED: ${msg}`);
  process.exit(1);
}
{
  const byRole = (role) => placements.filter((p) => p.regionRole === role);
  for (const t of [0, 1]) {
    if (byRole(`flag${t}`).length !== 1) fail(`flag${t} count`);
    if (byRole(`banner${t}`).length !== 1) fail(`banner${t} count`);
    if (byRole(`spawn${t}`).length !== 5) fail(`spawn${t} count`);
    if (byRole(`graveyard${t}`).length !== 1) fail(`graveyard${t} count`);
  }
  if (byRole('speedRune').length !== 4) fail('speedRune count');
  if (byRole('powerRune').length !== 2) fail('powerRune count');
  // Anchor sets must mirror through the origin.
  for (const [a, b] of [
    ['flag0', 'flag1'],
    ['banner0', 'banner1'],
    ['spawn0', 'spawn1'],
    ['graveyard0', 'graveyard1'],
  ]) {
    const as = byRole(a);
    const bs = byRole(b);
    for (const p of as) {
      const hit = bs.some((q) => Math.abs(q.x + p.x) < 0.05 && Math.abs(q.z + p.z) < 0.05);
      if (!hit) fail(`${a} (${p.x},${p.z}) has no ${b} mirror`);
    }
  }
  if (doc.biomePaint.ids.length !== PAINT_COLS * PAINT_ROWS) fail('paint ids length');
  const swatchIds = new Set(paintSwatches.map((s) => s.id));
  for (const id of doc.biomePaint.ids) {
    if (id !== 255 && !swatchIds.has(id)) fail(`paint id ${id} has no swatch`);
  }
  // The paint itself must be point-symmetric inside the field: fairness.
  for (let i = 0; i < 4000; i++) {
    const x = (hash(i, 61) - 0.5) * 2 * (BG_HALF_X - 1);
    const z = (hash(61, i) - 0.5) * 2 * (BG_HALF_Z - 1);
    if (paintAt(x, z) !== paintAt(-x, -z)) fail(`paint asymmetric at (${x},${z})`);
  }
  // The yard dip is the ONE authored in-field stamp: it must stay a shallow
  // depression (never a climbable rise) and keep clear of every anchor.
  if (YARD_DIP.delta >= 0 || YARD_DIP.delta < -3) fail('yard dip out of its shallow band');
  for (const p of placements.filter((q) => q.regionRole)) {
    if (Math.hypot(p.x - YARD_DIP.x, p.z - YARD_DIP.z) < YARD_DIP.radius + 2) {
      const flat = ['speedRune', 'powerRune'].includes(p.regionRole)
        ? Math.hypot(p.x - YARD_DIP.x, p.z - YARD_DIP.z) > YARD_DIP.radius
        : false;
      if (!flat) fail(`anchor ${p.name} sits inside the yard dip`);
    }
  }
  // Ring terrain must not reach a walkable height: every OTHER smooth stamp's
  // full radius stays outside the walled rect.
  for (const s of terrainEdits.slice(2)) {
    const reachX = Math.abs(s.x) - s.radius;
    const reachZ = Math.abs(s.z) - s.radius;
    if (reachX < BG_HALF_X && reachZ < BG_HALF_Z) {
      fail(`ring stamp at (${s.x},${s.z}) r${s.radius} reaches inside the walls`);
    }
  }
  // Art must never collide; volumes must never render.
  for (const p of placements) {
    if (p.regionRole) continue;
    const isVolume = p.assetId.startsWith('collider/');
    if (isVolume && !p.hidden) fail(`volume ${p.name} not hidden`);
    if (!isVolume && p.assetId !== 'grass/patch' && p.collisionMode !== 'none') {
      fail(`art ${p.name} (${p.assetId}) collides`);
    }
  }
  // No apostrophes or backslashes anywhere the compiler will emit.
  const emitted = JSON.stringify({ terrainEdits, placements, blockers, lights, decals, locations });
  if (emitted.includes("'") || emitted.includes('\\')) fail('emit-unsafe character in document');
}

writeFileSync(OUT_PATH, `${JSON.stringify(doc, null, 1)}\n`);
console.log(
  `wrote ${OUT_PATH}: ${placements.length} placements (${placements.filter((p) => p.regionRole).length} anchors, ${placements.filter((p) => !p.regionRole && p.assetId.startsWith('collider/')).length} collider volumes, ${placements.filter((p) => !p.regionRole && !p.assetId.startsWith('collider/')).length} art), ${terrainEdits.length} terrain stamps, ${lights.length} lights, ${doc.biomePaint.ids.length} paint cells`,
);
