// ============================================================
// heroes.js — Hero definitions
// ============================================================

// ---- BARQ ----
// Run sheet:   1280×1280, 5 cols × 5 rows, fw=256, fh=256
// Fight sheet: 1024×1024, 5 cols × 5 rows, fw=205, fh=205
export const BARQ = {
  id: 'barq',
  name: 'BARQ',
  power: 'Thunder Strike',
  lore: 'Enigmatic cyber-accelerator. Tachyon-drive armor. Unmatched speed.',
  col: '#00ccff',
  acc: '#88eeff',
  stats: { hp: 220, spd: 750, dmg: 12, sdmg: 32 },

  sk:        'barq_fight',
  skRun:     'barq_run2',
  skJump:    'barq_jump',
  skDeath:   'barq_death',
  fwJump: 204, fhJump: 204,
  fwDeath: 237, fhDeath: 292,
  skIdle:    'barq_idle',     // idle sheet: 1280x1280, 5x5=25 frames
  skTornado: 'barq_tornado',
  fw: 208, fh: 224,
  fwRun: 256, fhRun: 204,
  drawW: 110, drawH: 122,
  fwJump: 204, fhJump: 204,
  fwDeath: 237, fhDeath: 292,
  fwTornado: 112, fhTornado: 126,
  fwIdle:    244, fhIdle:    228,
  blackBg: false,

  anims: {
    idle:       { r:0, sc:0, f:5, fps:5,  loop:true,  next:null,        sheet:'idle'    },
    run:        { r:0, sc:0, f:4, fps:14, loop:true,  next:null,        sheet:'run'     },
    jump_start: { r:1, sc:0, f:5, fps:12, loop:false, next:'jump_loop', sheet:'jump'    },
    jump_loop:  { r:2, sc:0, f:5, fps:10, loop:true,  next:null,        sheet:'jump'    },
    fall:       { r:3, sc:0, f:5, fps:10, loop:true,  next:null,        sheet:'jump'    },
    land:       { r:4, sc:0, f:5, fps:14, loop:false, next:'idle',      sheet:'jump'    },
    attack_1:   { r:1, sc:0, f:3, fps:16, loop:false, next:'attack_2',  sheet:'fight'   },
    attack_2:   { r:1, sc:2, f:2, fps:16, loop:false, next:'attack_3',  sheet:'fight'   },
    attack_3:   { r:2, sc:0, f:4, fps:14, loop:false, next:'idle',      sheet:'fight'   },
    special:    { r:0, sc:0, f:5, fps:10, loop:false, next:'idle',      sheet:'tornado' },
    ultimate:   { r:0, sc:0, f:5, fps:14, loop:false, next:'idle',      sheet:'tornado' },
    hurt:       { r:4, sc:0, f:2, fps:8,  loop:false, next:'idle',      sheet:'fight'   },
    knockdown:  { r:4, sc:2, f:2, fps:6,  loop:false, next:'idle',      sheet:'fight'   },
    death:      { r:0, sc:0, f:5, fps:8,  loop:false, next:'death',     sheet:'death'   },
  },
  hitWindow: { attack_1:[0.3,0.85], attack_2:[0.25,0.85], attack_3:[0.2,0.9] },
};

// ---- SOLARIUS ----
// Run sheet:   1024×1024, 5 cols × 5 rows, fw=204, fh=204  (25 run frames)
// Fight sheet: 1024×572,  5 cols × 5 rows, fw=204, fh=114  (25 combat frames)
// Super sheet: 1024×572,  5 cols × 5 rows, fw=204, fh=114  (25 special/ult frames)
//
// Fight sheet row mapping (guessed from sprite preview):
//   Row 0: idle stance (5 frames)
//   Row 1: punch attack combo (5 frames)
//   Row 2: kick / sweep attack (5 frames)
//   Row 3: heavy/special charge (5 frames)
//   Row 4: hurt / death (5 frames)
//
// Super sheet row mapping:
//   Row 0: idle solar charge (5 frames)
//   Row 1: solar orb launch (5 frames)
//   Row 2: solar beam fire (5 frames)
//   Row 3: solar nova burst / ult (5 frames)
//   Row 4: landing sparkle (5 frames)
//
// Run sheet rows: all 5 rows are run cycle variations (~25 run frames)
export const SOLARIUS = {
  id: 'solarius',
  name: 'SOLARIUS',
  power: 'Solar Nova',
  lore: 'Incarnation of the sun\'s might. Harnesses cosmic fire. Devastating solar energy pulses.',
  col: '#ffaa00',
  acc: '#ffd700',
  stats: { hp: 190, spd: 440, dmg: 14, sdmg: 42 },

  sk:       'solarius_fight',
  skRun:    'solarius_run',
  skSuper:  'solarius_super',
  skUlt:    'solarius_ult',
  skUltFx:  'solarius_sfx',
  fw: 192, fh: 148,      // fight: 7x2, fw=128 fh=140
  fwRun: 132, fhRun: 176, // run:   5x5, fw=204 fh=160
  fwUlt: 192, fhUlt: 240,
  drawW: 100, drawH: 112, // consistent screen size all sheets
  blackBg: true,   // RGB with black bg → screen blend

  anims: {
    // ── Run sheet ──────────────────────────────────────────
    idle:       { r:0, sc:0, f:3, fps:6,  loop:true,  next:null,        sheet:'fight'  },
    run:        { r:0, sc:0, f:5, fps:14, loop:true,  next:null,        sheet:'run'    },
    jump_start: { r:1, sc:0, f:3, fps:9,  loop:false, next:'jump_loop', sheet:'run'    },
    jump_loop:  { r:2, sc:0, f:3, fps:7,  loop:true,  next:null,        sheet:'run'    },
    fall:       { r:3, sc:0, f:3, fps:7,  loop:true,  next:null,        sheet:'run'    },
    land:       { r:4, sc:0, f:2, fps:10, loop:false, next:'idle',      sheet:'run'    },
    // ── Fight sheet ────────────────────────────────────────
    attack_1:   { r:1, sc:0, f:3, fps:14, loop:false, next:'attack_2',  sheet:'fight'  },
    attack_2:   { r:1, sc:2, f:2, fps:14, loop:false, next:'attack_3',  sheet:'fight'  },
    attack_3:   { r:2, sc:0, f:4, fps:12, loop:false, next:'idle',      sheet:'fight'  },
    // ── Super sheet ────────────────────────────────────────
    special:    { r:1, sc:0, f:5, fps:10, loop:false, next:'idle',      sheet:'super'  },
    ult_charge: { r:0, sc:0, f:6, fps:10, loop:false, next:'ult_fire',  sheet:'ult'    },
  ult_fire:   { r:1, sc:0, f:6, fps:14, loop:false, next:'ult_end',   sheet:'ult'    },
  ult_end:    { r:2, sc:0, f:6, fps:8,  loop:false, next:'idle',      sheet:'ult'    },
  ultimate:   { r:0, sc:0, f:6, fps:10, loop:false, next:'ult_fire',  sheet:'ult'    },
    hurt:       { r:4, sc:0, f:2, fps:8,  loop:false, next:'idle',      sheet:'fight'  },
    knockdown:  { r:4, sc:2, f:2, fps:6,  loop:false, next:'idle',      sheet:'fight'  },
    death:      { r:4, sc:3, f:2, fps:5,  loop:false, next:'death',     sheet:'fight'  },
  },
  hitWindow: { attack_1:[0.3,0.85], attack_2:[0.25,0.85], attack_3:[0.2,0.9] },
};

// ---- EL-WAHM — Gold Defender ----
export const ELWAHM = {
  id: 'elwahm',
  name: 'EL-WAHM',
  power: 'Drone Strike',
  lore: 'Elite guardian armored in gold. Commands a drone swarm. Nigh-indestructible.',
  col: '#ffd700', acc: '#ffee88',
  stars: 5,
  stats: { hp: 280, spd: 320, dmg: 10, sdmg: 28 },

  sk:       'elwahm_fight',
  skRun:    'elwahm_run',
  skUlt:    'elwahm_ult',
  fw: 192, fh: 148,
  fwRun: 164, fhRun: 180,
  fwUlt: 224, fhUlt: 176,
  drawW: 105, drawH: 115,
  blackBg: false,

  anims: {
    idle:       { r:0, sc:0, f:6, fps:8,  loop:true,  next:null,        sheet:'fight'  },
    run:        { r:0, sc:0, f:6, fps:16, loop:true,  next:null,        sheet:'run'    },
    jump_start: { r:1, sc:0, f:6, fps:12, loop:false, next:'jump_loop', sheet:'run'    },
    jump_loop:  { r:2, sc:0, f:6, fps:10, loop:true,  next:null,        sheet:'run'    },
    fall:       { r:3, sc:0, f:6, fps:10, loop:true,  next:null,        sheet:'run'    },
    land:       { r:3, sc:3, f:3, fps:14, loop:false, next:'idle',      sheet:'run'    },
    attack_1:   { r:0, sc:0, f:6, fps:16, loop:false, next:'attack_2',  sheet:'fight'  },
    attack_2:   { r:1, sc:0, f:6, fps:16, loop:false, next:'idle',      sheet:'fight'  },
    attack_3:   { r:0, sc:0, f:6, fps:14, loop:false, next:'idle',      sheet:'fight'  },
    special:    { r:0, sc:0, f:6, fps:10, loop:false, next:'idle',      sheet:'fight'  },
    // Ultimate: drone deploy → drones scatter → laser barrage → explosions
    ult_charge: { r:0, sc:0, f:5, fps:10, loop:false, next:'ult_fire',  sheet:'ult'    },
    ult_fire:   { r:1, sc:0, f:5, fps:12, loop:false, next:'ult_boom',  sheet:'ult'    },
    ult_boom:   { r:2, sc:0, f:5, fps:10, loop:false, next:'ult_end',   sheet:'ult'    },
    ult_end:    { r:3, sc:0, f:5, fps:8,  loop:false, next:'idle',      sheet:'ult'    },
    ultimate:   { r:0, sc:0, f:5, fps:10, loop:false, next:'ult_fire',  sheet:'ult'    },
    hurt:       { r:0, sc:4, f:2, fps:8,  loop:false, next:'idle',      sheet:'fight'  },
    death:      { r:1, sc:4, f:2, fps:6,  loop:false, next:'death',     sheet:'fight'  },
  },
};


export const AMUNX7 = {
  id: 'amunx7',
  name: 'AMUN-X7',
  power: 'Ghost Strike',
  lore: 'Shadow operative with a cybernetic arm. Trained to eliminate. Never misses.',
  col: '#ff6600', acc: '#ff9944',
  stats: { hp: 160, spd: 660, dmg: 16, sdmg: 44 },
  sk: 'barq_fight', skRun: 'barq_run', skTornado: 'barq_tornado',
  fw: 204, fh: 204, fwRun: 256, fhRun: 256, fwTornado: 112, fhTornado: 126,
  blackBg: false,
  anims: {
    idle:       { r:0, sc:0, f:5, fps:5,  loop:true,  next:null,        sheet:'fight'   },
    run:        { r:0, sc:0, f:5, fps:18, loop:true,  next:null,        sheet:'run'     },
    jump_start: { r:1, sc:0, f:5, fps:12, loop:false, next:'jump_loop', sheet:'jump'    },
    jump_loop:  { r:2, sc:0, f:5, fps:10, loop:true,  next:null,        sheet:'jump'    },
    fall:       { r:3, sc:0, f:5, fps:10, loop:true,  next:null,        sheet:'jump'    },
    land:       { r:4, sc:0, f:5, fps:14, loop:false, next:'idle',      sheet:'jump'    },
    attack_1:   { r:1, sc:0, f:3, fps:18, loop:false, next:'attack_2',  sheet:'fight'   },
    attack_2:   { r:1, sc:2, f:2, fps:18, loop:false, next:'attack_3',  sheet:'fight'   },
    attack_3:   { r:2, sc:0, f:4, fps:16, loop:false, next:'idle',      sheet:'fight'   },
    special:    { r:0, sc:0, f:5, fps:10, loop:false, next:'idle',      sheet:'tornado' },
    ultimate:   { r:0, sc:0, f:5, fps:14, loop:false, next:'idle',      sheet:'tornado' },
    hurt:       { r:4, sc:0, f:2, fps:8,  loop:false, next:'idle',      sheet:'fight'   },
    knockdown:  { r:4, sc:2, f:2, fps:6,  loop:false, next:'idle',      sheet:'fight'   },
    death:      { r:0, sc:0, f:5, fps:8,  loop:false, next:'death',     sheet:'death'   },
  },
  hitWindow: { attack_1:[0.25,0.9], attack_2:[0.2,0.9], attack_3:[0.15,0.95] },
};

export const HEROES = [BARQ, SOLARIUS, ELWAHM, AMUNX7];

// ---- ALIEN ENEMY (Level 1 ground enemy) ----
// alien_combat.png: 500x500, 5x5=25 frames, fw=100, fh=100, black bg
//   Row 0: idle + tail-swing (5 frames)
//   Row 1: ranged attack / beam fire (5 frames)
//   Row 2: walk/approach (5 frames)
//   Row 3: melee lance attack (5 frames)
//   Row 4: special sweep (5 frames)
// alien_run.png: 500x500, 5x5=25 frames, fw=100, fh=100, black bg
//   All rows: run cycle
export const ALIEN_DEF = {
  sk:     'alien_combat',  // combat sheet (primary)
  skRun:  'alien_run',     // run sheet
  fw: 100, fh: 100,
  blackBg: false,
  anims: {
    idle:   { sheet:'combat', r:0, sc:0, f:5, fps:5,  loop:true  },
    walk:   { sheet:'run',    r:0, sc:0, f:5, fps:10, loop:true  },
    attack: { sheet:'combat', r:3, sc:0, f:5, fps:10, loop:false },
    ranged: { sheet:'combat', r:1, sc:0, f:5, fps:10, loop:false },
    hurt:   { sheet:'combat', r:0, sc:3, f:2, fps:8,  loop:false },
    death:  { sheet:'combat', r:4, sc:0, f:5, fps:7,  loop:false },
  },
};


// ---- BOSS TACTER (Level 1 boss) ----
// boss_tacter_run.png:    500x500, 5x5=25 frames, fw=100, fh=100, black bg
//   All 5 rows: walk/movement cycle variants
// boss_tacter_combat.png: 500x500, 5x5=25 frames, fw=100, fh=100, black bg
//   Row 0: idle/prep poses
//   Row 1: spin attack
//   Row 2: ground slam
//   Row 3: energy blast
//   Row 4: special sweep
export const TACTER_DEF = {
  sk:      'tacter_combat',  // combat sheet (primary)
  skMove:  'tacter_run',     // movement sheet
  fw: 100, fh: 100,
  blackBg: false,
  anims: {
    idle:   { sheet:'move',   r:0, sc:0, f:5, fps:5,  loop:true  },
    walk:   { sheet:'move',   r:1, sc:0, f:5, fps:8,  loop:true  },
    attack: { sheet:'combat', r:2, sc:0, f:5, fps:10, loop:false },
    laser:  { sheet:'combat', r:3, sc:0, f:5, fps:9,  loop:false },
    hurt:   { sheet:'combat', r:0, sc:3, f:2, fps:8,  loop:false },
    death:  { sheet:'combat', r:4, sc:0, f:5, fps:6,  loop:false },
  },
};

// ---- DARK ALIEN DRONE ----
// drone_anim_sheet.png: 600x240 — 6 cols x 3 rows, fw=100, fh=80
// drone_combat_sheet.png: 500x400 — 5 cols x 5 rows, fw=100, fh=80
export const DARK_DRONE_DEF = {
  sk:       'drone_combat',
  skFlight: 'drone_anim',
  fw: 100, fh: 80,
  anims: {
    idle:   { sheet:'flight', r:0, sc:0, f:5, fps:5,  loop:true  },
    walk:   { sheet:'flight', r:1, sc:0, f:6, fps:10, loop:true  },
    attack: { sheet:'combat', r:1, sc:0, f:5, fps:10, loop:false },
    hurt:   { sheet:'combat', r:0, sc:0, f:3, fps:8,  loop:false },
    death:  { sheet:'combat', r:4, sc:0, f:5, fps:7,  loop:false },
  },
};

// ── LEVEL 2 ALIEN SOLDIER ────────────────────────────────
export const L2_ALIEN_DEF = {
  sk:       'l2_alien_fight',
  skRun:    'l2_alien_run',
  fw: 256, fh: 341,
  blackBg: false,
  anims: {
    idle:   { sheet:'fight', r:0, sc:0, f:4, fps:18, loop:true  },
    walk:   { sheet:'run',   r:0, sc:0, f:6, fps:22, loop:true  },
    run:    { sheet:'run',   r:1, sc:0, f:6, fps:28, loop:true  },
    attack: { sheet:'fight', r:0, sc:0, f:6, fps:24, loop:false },
    slash:  { sheet:'fight', r:1, sc:0, f:6, fps:22, loop:false },
    blade:  { sheet:'fight', r:2, sc:0, f:6, fps:22, loop:false },
    hurt:   { sheet:'fight', r:0, sc:4, f:2, fps:18, loop:false },
    death:  { sheet:'fight', r:2, sc:3, f:3, fps:14, loop:false },
  },
};

// ── LEVEL 2 BOSS — WAR MACHINE ───────────────────────────
export const L2_BOSS_DEF = {
  sk:       'l2_boss_fight',    // fight sheet (primary)
  skMove:   'l2_boss_idle_run', // idle + run sheet
  skDash:   'l2_boss_dash',     // dash sheet
  skLaser:  'l2_boss_laser',    // laser sheet
  fw: 384, fh: 341,
  fwLaser: 384, fhLaser: 256,
  blackBg: false,
  hp: 1800, mhp: 1800,
  name: 'WAR MACHINE MK-I',
  anims: {
    idle:       { sheet:'move',   r:0, sc:0, f:4, fps:5,  loop:true  },
    walk:       { sheet:'move',   r:1, sc:0, f:4, fps:7,  loop:true  },
    run:        { sheet:'move',   r:2, sc:0, f:4, fps:10, loop:true  },
    attack:     { sheet:'fight',  r:0, sc:0, f:4, fps:10, loop:false },
    attack2:    { sheet:'fight',  r:1, sc:0, f:4, fps:10, loop:false },
    slash:      { sheet:'fight',  r:2, sc:0, f:4, fps:8,  loop:false },
    dash:       { sheet:'dash',   r:0, sc:0, f:4, fps:10, loop:false },
    dash2:      { sheet:'dash',   r:1, sc:0, f:4, fps:12, loop:false },
    dash_end:   { sheet:'dash',   r:2, sc:0, f:4, fps:8,  loop:false },
    laser_up:   { sheet:'laser',  r:0, sc:0, f:4, fps:8,  loop:false },
    laser_fire: { sheet:'laser',  r:1, sc:0, f:4, fps:10, loop:false },
    laser_beam: { sheet:'laser',  r:2, sc:0, f:4, fps:10, loop:true  },
    laser_sweep:{ sheet:'laser',  r:3, sc:0, f:4, fps:8,  loop:false },
    hurt:       { sheet:'fight',  r:0, sc:3, f:1, fps:8,  loop:false },
    death:      { sheet:'dash',   r:2, sc:2, f:2, fps:5,  loop:false },
  },
};
