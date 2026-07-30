// Ravenrift, the ranked 5v5 capture-the-flag battleground: the classic
// three-chamber field, re-dressed in the Thornhollow style. Two full-width
// curtain walls carve the walled rect into each team's field chamber and the
// Ruin Courtyard between them; every move between chambers passes one of TWO
// contested crossings per curtain (the main gate or the gatehouse room), a
// keep at each end holds the flag, and the old-growth hollow crowds the
// outside of the ramparts.
//
// The field is an AUTHORED map (data/battleground/thornhollow.map.json,
// emitted by scripts/assets/generate_ravenrift_classic.mjs from the classic
// layout's exact geometry), compiled by scripts/assets/compile_thornhollow.mjs
// into src/sim/thornhollow_field.generated.ts: terrain stamp chain, invisible
// collider volumes carrying the classic wall/cover set verbatim, art
// placements, ground paint, and the game-mode anchors. This module is the
// mode's view of that record (the handful of positions the flag/respawn/
// graveyard/rune logic reasons about) plus the collider set the spatial grid
// mounts (src/sim/colliders.ts bandSlotColliders). Sim layer: no three.js
// imports; the generated module is plain data.

import { bgFieldHeightLocal } from './battleground_field';
import type { Collider } from './colliders';
import {
  TH_BASES,
  TH_COLLIDERS,
  TH_GRAVEYARDS,
  TH_HALF_X,
  TH_HALF_Z,
  TH_POWER_RUNES,
  TH_SPEED_RUNES,
} from './thornhollow_field.generated';

export type BgTeam = 0 | 1; // 0 = Crimson (south, -z), 1 = Azure (north, +z)
export const BG_TEAM_NAMES = ['Crimson', 'Azure'] as const;
export const BG_TEAM_COLORS = [0xd1413a, 0x3a78d1] as const; // red, blue: flags/banners/blips

// Field footprint: the full document rect, forest backdrop ring included. The
// PLAY rect is the classic walled 100x280 field; the ring between the two is
// dressing outside the ramparts, walled off by both the rampart colliders and
// the perimeter blockers.
export const BG_HALF_X = TH_HALF_X; // 62
export const BG_HALF_Z = TH_HALF_Z; // 152
export const BG_PLAY_HALF_X = 50;
export const BG_PLAY_HALF_Z = 140;
export const BG_FLAG_Z = 118; // |z| of each team's flag stand (keep heart)

// Keep enclosure: a back wall behind the flag and two solid side walls, open
// only toward the field. The mouth line is the form-up hold.
const KEEP_HALF_X = 16;
const KEEP_BACK_DZ = 10; // back wall sits this far behind the flag
const KEEP_MOUTH_DZ = 10; // interior extends this far field-side of the flag

export interface BgBaseDef {
  team: BgTeam;
  flag: { x: number; z: number }; // flag home + capture point
  spawns: { x: number; z: number }[]; // respawn ring before the keep gate
  banner: { x: number; z: number };
}

export const BG_BASES: BgBaseDef[] = TH_BASES.map((b) => ({
  team: b.team,
  flag: { ...b.flag },
  spawns: b.spawns.map((s) => ({ ...s })),
  banner: { ...b.banner },
}));

// Rune pads: four Sprint Runes (one per flag approach, two courtyard flanks)
// and two Battle/Ward pads at the curtains' courtyard-side gate mouths,
// exactly where the map placed them.
export const BG_SPEED_RUNES: { x: number; z: number }[] = TH_SPEED_RUNES.map((r) => ({ ...r }));
export const BG_POWER_RUNES: { x: number; z: number }[] = TH_POWER_RUNES.map((r) => ({ ...r }));

export interface BgGraveyardPlot {
  x: number;
  z: number;
  hw: number;
  hd: number;
}

export const BG_GRAVEYARDS: [BgGraveyardPlot, BgGraveyardPlot] = [
  { ...TH_GRAVEYARDS[0] },
  { ...TH_GRAVEYARDS[1] },
];

/**
 * The keep's interior box for one team: x across the keep's full width, z from
 * the back wall to the mouth line. The spawn ring (|z| 113..117) sits inside
 * it, and the form-up containment (social/battleground.ts tickCountdown) reads
 * this so the gate can never drift from the walls it stands in for.
 */
export function keepInteriorBounds(team: BgTeam): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  const dir = team === 0 ? -1 : 1;
  const flagZ = team === 0 ? -BG_FLAG_Z : BG_FLAG_Z;
  const backZ = flagZ + dir * KEEP_BACK_DZ;
  const mouthZ = flagZ - dir * KEEP_MOUTH_DZ;
  return {
    minX: -KEEP_HALF_X,
    maxX: KEEP_HALF_X,
    minZ: Math.min(backZ, mouthZ),
    maxZ: Math.max(backZ, mouthZ),
  };
}

/**
 * The field's collider set in field-local coordinates: baked per-asset boxes,
 * the editor's invisible collider volumes (the rampart/stair/podium decks are
 * STANDABLE entries here), and the perimeter blockers. Mounted per slot into
 * the open-world spatial grid by src/sim/colliders.ts.
 */
export function battlegroundColliders(): Collider[] {
  return TH_COLLIDERS.map((c) => ({ ...c }));
}

/** A plan wall has to be tall enough to be worth navigating around; below this
 *  it is a kerb, a step or a floor slab, and drawing it would turn the map into
 *  noise. Deliberately LOWER than the camera-occlusion threshold: a 2.5yd
 *  parapet is a landmark you route around even though you can see over it. */
const BG_PLAN_WALL_MIN_HEIGHT = 2;

export interface BgPlanWall {
  x: number;
  z: number;
  hw: number;
  hd: number;
  rot: number;
  /** Absolute world-local top of the wall. */
  top: number;
  /** How far the wall rises above the ground beneath it. */
  height: number;
}

/**
 * Structural plan rectangles for the minimap and the M field map: the field's
 * REAL walls (keep curtains, court walls, gate structures, the ruins), in
 * field-local coordinates. Purely a projection of the collider set, so the plan
 * can never drift from what actually blocks.
 *
 * The filter is "blocks movement and stands taller than a step", NOT the
 * camera's occlusion flag: whether the chase cam can see over a parapet says
 * nothing about whether a runner has to go around it.
 */
export function bgFieldPlanWalls(): BgPlanWall[] {
  const out: BgPlanWall[] = [];
  for (const c of TH_COLLIDERS) {
    if (c.type !== 'obb' || c.standable) continue;
    const top = c.cameraTopY ?? 0;
    const height = top - bgFieldHeightLocal(c.x, c.z);
    if (height < BG_PLAN_WALL_MIN_HEIGHT) continue;
    out.push({ x: c.x, z: c.z, hw: c.hw, hd: c.hd, rot: c.rot, top, height });
  }
  return out;
}
