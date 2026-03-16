// ============================================================
// gameState.js — Central mutable game state
// All timers are in SECONDS (delta-time based)
// ============================================================

export const state = {
  G: null,
  phase: 'loading',
  selHero: 0,
  msgTimer: 0,
  paused: false,
  highScore: (() => { try { return parseInt(localStorage.getItem('cog_highscore') || '0', 10); } catch(e) { return 0; } })(),
};

export const W      = 800;
export const H      = 300;
export let GROUND = 242;  // default, updated via setGround()
export function setGround(y) { GROUND = y; state.currentGround = y; }
export function getGround() { return state.currentGround || GROUND; }

// Physics (per second)
export const GRAVITY      = 1800;
export const JUMP_VEL     = -520;
export const ENERGY_REGEN = 30;

// ---- ANIMATION STATES ----
export const AS = {
  IDLE:       'idle',
  RUN:        'run',
  JUMP_START: 'jump_start',
  JUMP_LOOP:  'jump_loop',
  FALL:       'fall',
  LAND:       'land',
  ATTACK_1:   'attack_1',
  ATTACK_2:   'attack_2',
  ATTACK_3:   'attack_3',
  SPECIAL:    'special',
  ULTIMATE:   'ultimate',
  HURT:       'hurt',
  KNOCKDOWN:  'knockdown',
  DEATH:      'death',
};

export function createHero(heroDef) {
  return {
    id: heroDef.id,
    x: 200, y: getGround(),
    vx: 0,  vy: 0,
    onGround: true,
    wasOnGround: true,
    facing: 1,
    hp: heroDef.stats.hp, mhp: heroDef.stats.hp,
    energy: 100,
    ult: 0,
    animState:  AS.IDLE,
    animTime:   0,
    comboHits:  0,
    actionLock: 0,
    invTimer:   0,
    comboTimer: 0,
    comboCount: 0,
    landTimer:  0,
    hd: heroDef,
  };
}

export function createEnemy(x, wave, archetype = 'melee', levelNum = 1) {
  const scale = 1 + (levelNum - 1) * 0.18; // enemies scale with level
  const stats = {
    melee:    { hp: (55+wave*14)*scale,  spd: 95+wave*10,   dmg: (3+wave*0.5)*scale,    atkRange: 72,  atkCD: 1.3, retreatChance: 0.1 },
    ranged:   { hp: (35+wave*8)*scale,   spd: 60+wave*6,    dmg: (4+wave*0.8)*scale,    atkRange: 200, atkCD: 2.4, prefDist: 180, projSpd: 260 },
    heavy:    { hp: (130+wave*25)*scale, spd: 48+wave*5,    dmg: (7+wave)*scale,        atkRange: 88,  atkCD: 2.6, knockback: 120 },
    drone:    { hp: (30+wave*6)*scale,   spd: 70+wave*8,    dmg: (3+wave*0.5)*scale,    atkRange: 160, atkCD: 3.0, bombDmg: (5+wave)*scale,   floatY: getGround() - 90 },
    exploder: { hp: (25+wave*5)*scale,   spd: 130+wave*12,  dmg: (10+wave*1.5)*scale,   atkRange: 55,  atkCD: 99, explodeRange: 80 },
  }[archetype] || { hp: 55, spd: 95, dmg: 5, atkRange: 72, atkCD: 1.1 };

  const base = {
    x, y: archetype === 'drone' ? (stats.floatY || getGround() - 90) : getGround(),
    vy: 0,
    onGround: archetype !== 'drone',
    facing: -1,
    archetype,
    levelNum,
    ...stats,
    mhp: stats.hp,
    animState: 'walk', animTime: 0,
    aiState:  'approach',
    aiTimer:  0,
    atkTimer: 0,
    invTimer: 0,
    dead:     false,
    deathTimer: 0,
  };

  // Drone-specific
  if (archetype === 'drone') {
    base.floatTargetY = stats.floatY || getGround() - 90;
    base.bombTimer = 1.5 + Math.random() * 1.5;
    base.onGround  = false;
  }
  // Exploder-specific
  if (archetype === 'exploder') {
    base.armed = true;
  }

  return base;
}

export function createBoss(heroX, bossDef, levelNum = 1) {
  const scale = 1 + (levelNum - 1) * 0.12;
  return {
    x: heroX + 520, y: getGround(),
    vy: 0, onGround: true, facing: -1,
    hp:  Math.floor((bossDef?.hp  || 800) * scale),
    mhp: Math.floor((bossDef?.hp  || 800) * scale),
    spd: bossDef?.spd || 110,
    dmg: Math.floor((bossDef?.dmg || 12)  * scale),
    def: bossDef,  // full level boss definition
    animState: 'idle', animTime: 0,
    actionLock: 0,
    atkTimer:   0,
    laserTimer: bossDef?.laserInterval || 6.0,
    laser: { active: false, timer: 0 },
    invTimer:   0,
    dead:       false,
    deathTimer: 0,
    phase: 1, phase2done: false,
    bossFlash:  0,
    // burst fire state
    burstCount: 0,
    burstTimer: 0,
  };
}

export function initGame(heroDef, levelNum = 1) {
  state.G = {
    time:     0,
    score:    0,
    wave:     1,
    levelNum,
    cx:       0,
    running:  true,
    boss:     null,
    hero:     createHero(heroDef),
    enemies:  [],
    projectiles: [],
    bombs:    [],     // drone/airstrike bombs
    hazards:  [],     // active floor hazards
    pfx:      [],
    el:       9999,
  };
  state.phase = 'game';
}

export function showMsg(text, duration = 2.5) {
  const el = document.getElementById('msg');
  if (el) el.textContent = text;
  state.msgTimer = duration;
}

export function saveHighScore(score) {
  if (score > state.highScore) {
    state.highScore = score;
    try { localStorage.setItem('cog_highscore', String(score)); } catch(e) {}
    return true;
  }
  return false;
}
