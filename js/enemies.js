// ============================================================
// enemies.js — Enemy & boss AI, drones, exploders, bombs,
//              hazards, per-level wave spawning
// ============================================================

import { state, GROUND, getGround, W, H, createEnemy, createBoss, showMsg, AS } from './gameState.js?v=020cd006';
import { spawnParticles, damageHero } from './combat.js?v=020cd006';
import { sfxLaser, sfxBossAppear, sfxProjectile } from './sound.js?v=020cd006';
import { getLevel } from './levels.js?v=020cd006';

// ---- PROJECTILE (world coords) ----
function spawnProjectile(worldX, y, vx, dmg, col) {
  state.G.projectiles.push({ x: worldX, y, vx, vy: 0, dmg, col, life: 2.0 });
}

export function updateProjectiles(dt, gameOverCb) {
  const G = state.G, h = G.hero;
  G.projectiles = G.projectiles.filter(p => {
    p.x += p.vx * dt;
    p.life -= dt;
    if (p.life <= 0) return false;
    if (Math.abs(p.x - h.x) < 24 && Math.abs(p.y - (h.y - 40)) < 32) {
      damageHero(h, p.dmg, 0, gameOverCb);
      spawnParticles(h.x, h.y - 30, p.col, 6, 100);
      return false;
    }
    return true;
  });
}

// ---- BOMBS (drone drops / airstrike — fall vertically) ----
function spawnBomb(worldX, y, dmg, col) {
  state.G.bombs.push({ x: worldX, y, vy: 120, dmg, col, life: 4.0, exploded: false });
}

export function updateBombs(dt, gameOverCb) {
  const G = state.G, h = G.hero;
  G.bombs = G.bombs.filter(b => {
    if (b.exploded) { b.life -= dt; return b.life > 0; }
    b.y  += b.vy * dt;
    b.vy += 400 * dt;
    b.life -= dt;
    if (b.life <= 0) return false;
    // Hit ground
    if (b.y >= getGround() - 10) {
      b.exploded = true;
      b.life = 0.4;
      spawnParticles(b.x, getGround() - 10, b.col, 18, 220);
      if (Math.abs(b.x - h.x) < 60 && Math.abs(getGround() - h.y) < 50) {
        damageHero(h, b.dmg, 80, gameOverCb);
      }
    }
    return true;
  });
}

// ---- HAZARDS ----
export function updateHazards(dt, gameOverCb) {
  const G = state.G, h = G.hero;
  const lvl = getLevel(G.levelNum);
  if (!lvl?.hazard) return;

  // Tick hazard timer stored on G
  if (G.hazardTimer === undefined) G.hazardTimer = lvl.hazard.interval;
  G.hazardTimer -= dt;
  if (G.hazardTimer > 0) return;
  G.hazardTimer = lvl.hazard.interval + Math.random() * 1.5;

  const haz = lvl.hazard;
  switch (haz.type) {

    case 'falling_rocks': {
      // Rock falls at a random x near the hero
      const rx = h.x + (Math.random() - 0.5) * 300;
      G.hazards.push({ type: 'rock', x: rx, y: 0, vy: 200, dmg: haz.dmg, life: 2.0 });
      showMsg('⚠ ROCKS FALLING!', 1.0);
      break;
    }

    case 'electric_rail': {
      // Platform-wide zap at a random x zone
      const ex = G.cx + Math.random() * W;
      G.hazards.push({ type: 'electric', x: ex, y: GROUND, w: 80, dmg: haz.dmg, life: 1.2 });
      showMsg('⚡ LIVE RAIL!', 1.0);
      break;
    }

    case 'laser_floor': {
      G.hazards.push({ type: 'laser_floor', x: G.cx, w: W, y: getGround() - 4, dmg: haz.dmg, life: 0.8 });
      showMsg('☢ LASER GRID!', 1.0);
      break;
    }

    case 'bomb_drop': {
      // Airstrike — 3 bombs drop across the screen
      for (let i = 0; i < 3; i++) {
        const bx = G.cx + 100 + i * 200 + (Math.random() - 0.5) * 80;
        spawnBomb(bx, 0, haz.dmg, '#ff4400');
      }
      showMsg('🚁 AIRSTRIKE INCOMING!', 1.0);
      break;
    }

    case 'gravity_pulse': {
      // Pushes all entities (including hero) upward briefly
      if (h.onGround) { h.vy = -300; h.onGround = false; }
      G.enemies.forEach(e => { if (e.onGround && !e.dead) { e.vy = -200; e.onGround = false; } });
      G.hazards.push({ type: 'gravity', x: 0, w: W, y: 0, h: H, dmg: 0, life: 0.6 });
      showMsg('〜 GRAVITY PULSE!', 1.0);
      break;
    }
  }
}

export function updateHazardObjects(dt, gameOverCb) {
  const G = state.G, h = G.hero;
  G.hazards = G.hazards.filter(hz => {
    hz.life -= dt;
    if (hz.life <= 0) return false;

    if (hz.type === 'rock') {
      hz.y  += hz.vy * dt;
      hz.vy += 800 * dt;
      if (hz.y >= getGround() - 10) {
        spawnParticles(hz.x, getGround() - 10, '#aa8844', 10, 150);
        if (Math.abs(hz.x - h.x) < 30) damageHero(h, hz.dmg, 0, gameOverCb);
        return false;
      }
    }
    if (hz.type === 'electric' || hz.type === 'laser_floor') {
      if (Math.abs(hz.x - h.x) < (hz.w / 2) && Math.abs(hz.y - h.y) < 30) {
        if (h.invTimer <= 0) damageHero(h, hz.dmg * dt * 2, 0, gameOverCb);
      }
    }
    return true;
  });
}

// ---- WAVE SPAWN ----
export function spawnWave() {
  const G = state.G;
  const lvl = getLevel(G.levelNum);
  if (!lvl) return;

  // After 3 waves, spawn the level boss
  if (G.wave > 3) { spawnLevelBoss(); return; }

  const waveDef = lvl.waves[G.wave - 1] || lvl.waves[lvl.waves.length - 1];
  const count   = waveDef.count;
  G.el = count;

  const archetypes = waveDef.mix.slice(0, count);
  // Pad if needed
  while (archetypes.length < count) archetypes.push('melee');

  for (let i = 0; i < count; i++) {
    const fromRight = i % 2 === 0;
    const arch = archetypes[i] || 'melee';
    const e = createEnemy(
      fromRight ? G.hero.x + 500 + i * 90 : G.hero.x - 300 - i * 90,
      G.wave,
      arch,
      G.levelNum
    );
    e.facing = fromRight ? -1 : 1;
    G.enemies.push(e);
  }

  document.getElementById('wv').textContent = G.wave;
  showMsg(`${lvl.name} — WAVE ${G.wave}!`);
}

export function spawnLevelBoss() {
  const G = state.G;
  const lvl = getLevel(G.levelNum);
  document.getElementById('wv').textContent = 'BOSS';
  G.boss = createBoss(G.hero.x, lvl.boss, G.levelNum);
  sfxBossAppear();
  showMsg(`${lvl.boss.name} APPEARS!`);
}

// ---- ENEMY AI UPDATE ----
export function updateEnemies(dt, gameOverCb) {
  const G = state.G, h = G.hero;

  G.enemies.forEach(e => {
    if (e.dead) { e.deathTimer -= dt; return; }

    e.animTime += dt;
    if (e.invTimer > 0) e.invTimer -= dt;
    if (e.atkTimer > 0) e.atkTimer -= dt;

    // ── DRONE ──────────────────────────────────────────────
    if (e.archetype === 'drone') {
      updateDrone(e, h, G, dt, gameOverCb);
      return;
    }

    // ── EXPLODER ───────────────────────────────────────────
    if (e.archetype === 'exploder') {
      updateExploder(e, h, G, dt, gameOverCb);
      return;
    }

    // ── STANDARD getGround() ENEMY ──────────────────────────────
    const dx   = h.x - e.x;
    const dist = Math.abs(dx);
    e.facing   = dx > 0 ? 1 : -1;

    // Gravity
    if (!e.onGround) { e.vy += 1200 * dt; e.y += e.vy * dt; }
    if (e.y >= getGround()) { e.y = getGround(); e.vy = 0; e.onGround = true; }

    switch (e.aiState) {
      case 'approach':
        e.animState = 'walk';
        if (e.archetype === 'ranged') {
          if (dist > e.prefDist + 30) e.x += e.facing * e.spd * dt;
          else if (dist < e.prefDist - 30) e.x -= e.facing * e.spd * dt;
          if (dist <= e.prefDist + 50 && e.atkTimer <= 0) {
            e.aiState = 'attack'; e.aiTimer = 0; e.atkTimer = e.atkCD;
          }
        } else {
          if (dist > e.atkRange) e.x += e.facing * e.spd * dt;
          else { e.aiState = 'attack'; e.aiTimer = 0; }
        }
        break;

      case 'attack':
        e.animState = 'attack';
        e.aiTimer  += dt;
        if (e.aiTimer >= 0.25 && e.atkTimer <= 0) {
          e.atkTimer = e.atkCD;
          if (e.archetype !== 'ranged') {
            if (dist <= e.atkRange) {
              const knock = e.archetype === 'heavy' ? e.knockback : 0;
              damageHero(h, e.dmg, knock, gameOverCb);
            }
          } else {
            const vx = e.facing * (e.projSpd || 280);
            spawnProjectile(e.x, e.y - 50, vx, e.dmg, '#ff6600');
            sfxProjectile();
            spawnParticles(e.x, e.y - 50, '#ff8800', 5, 100);
          }
          e.aiState = 'recovery'; e.aiTimer = 0;
        }
        break;

      case 'recovery':
        e.animState = 'idle';
        e.aiTimer  += dt;
        if (e.archetype === 'heavy') e.x -= e.facing * 40 * dt;
        if (e.aiTimer >= 0.4) {
          e.aiState = Math.random() < (e.retreatChance || 0) && dist < 120
            ? 'retreat' : 'approach';
          e.aiTimer = 0;
        }
        break;

      case 'hurt':
        e.animState = 'hurt';
        e.aiTimer  -= dt;
        if (e.aiTimer <= 0) e.aiState = 'approach';
        break;

      case 'retreat':
        e.animState = 'walk';
        e.x -= e.facing * e.spd * 0.8 * dt;
        e.aiTimer += dt;
        if (e.aiTimer >= 0.6 || dist > 200) { e.aiState = 'approach'; e.aiTimer = 0; }
        break;
    }
  });

  G.enemies = G.enemies.filter(e => !e.dead || e.deathTimer > 0);
}

function updateDrone(e, h, G, dt, gameOverCb) {
  e.animTime = (e.animTime || 0) + dt;
  const dx   = h.x - e.x;
  const dist = Math.abs(dx);
  e.facing   = dx > 0 ? 1 : -1;

  // Float toward target height
  const targetY = e.floatTargetY || (getGround() - 90);
  const dy = targetY - e.y;
  e.y += dy * 3 * dt;

  // Hover horizontally above hero, staying at preferred range
  const prefX = h.x - e.facing * 160;
  e.x += (prefX - e.x) * 1.5 * dt;

  // Bomb drop timer
  e.bombTimer -= dt;
  if (e.bombTimer <= 0 && dist < 200) {
    e.bombTimer = 2.0 + Math.random() * 1.5;
    spawnBomb(e.x, e.y + 20, e.bombDmg || e.dmg, '#ff8800');
    spawnParticles(e.x, e.y + 20, '#ff8800', 6, 80);
    e.animState = 'attack';
  } else {
    e.animState = 'walk';
  }
}

function updateExploder(e, h, G, dt, gameOverCb) {
  const dx   = h.x - e.x;
  const dist = Math.abs(dx);
  e.facing   = dx > 0 ? 1 : -1;

  // Gravity
  if (!e.onGround) { e.vy += 1200 * dt; e.y += e.vy * dt; }
  if (e.y >= getGround()) { e.y = getGround(); e.vy = 0; e.onGround = true; }

  if (dist > e.explodeRange) {
    // Rush toward hero
    e.x += e.facing * e.spd * dt;
    e.animState = 'walk';
  } else if (e.armed) {
    // EXPLODE
    e.armed = false;
    e.dead  = true;
    e.deathTimer = 0.5;
    spawnParticles(e.x, e.y - 20, '#ff4400', 30, 300);
    spawnParticles(e.x, e.y - 20, '#ffaa00', 20, 200);
    if (h.invTimer <= 0) damageHero(h, e.dmg, 120, gameOverCb);
    // Damage nearby enemies too
    G.enemies.forEach(other => {
      if (other !== e && !other.dead && Math.abs(other.x - e.x) < e.explodeRange) {
        other.hp -= e.dmg * 0.5;
        if (other.hp <= 0) { other.dead = true; other.deathTimer = 0.4; G.el--; }
      }
    });
    G.el--;
  }
}

// ---- BOSS AI UPDATE ----
export function updateBoss(dt, gameOverCb) {
  const G = state.G;
  const b = G.boss, h = G.hero;
  if (!b) return;

  b.animTime += dt;
  if (b.invTimer   > 0) b.invTimer   -= dt;
  if (b.atkTimer   > 0) b.atkTimer   -= dt;
  if (b.laserTimer > 0) b.laserTimer -= dt;
  if (b.actionLock > 0) b.actionLock -= dt;
  if (b.bossFlash  > 0) b.bossFlash  -= dt;
  if (b.burstTimer > 0) b.burstTimer -= dt;

  if (b.dead) { b.deathTimer -= dt; return; }

  if (b.laser.active) {
    b.laser.timer -= dt;
    if (b.laser.timer <= 0) b.laser.active = false;
  }

  const dx   = h.x - b.x;
  b.facing   = dx > 0 ? 1 : -1;
  const dist = Math.abs(dx);

  if (b.actionLock > 0) return;

  const def = b.def || {};
  const spd = b.phase === 2 ? b.spd * 1.5 : b.spd;

  // Movement
  if (dist > 150) { b.x += b.facing * spd * dt; b.animState = 'walk'; }
  else            { b.animState = 'idle'; }

  // ── LASER / BURST ATTACK ──────────────────────────────
  if (b.laserTimer <= 0 && dist < 600) {
    const burstCount = b.phase === 2
      ? (def.laserBurst || 1) + 1
      : (def.laserBurst || 1);
    const freq = def.laserInterval || 6.0;
    b.laserTimer = (b.phase === 2 ? freq * 0.65 : freq) + Math.random();

    b.animState  = 'laser'; b.animTime = 0;
    b.actionLock = 0.3 + burstCount * 0.25;

    // Fire burst
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        if (!b.dead) {
          b.laser = { active: true, timer: 0.6 };
          sfxLaser();
          spawnParticles(b.x, b.y - 60, def.col || '#ff6600', 16, 220);
          const laserDir = b.facing;
          const heroInLine = laserDir > 0 ? h.x > b.x : h.x < b.x;
          if (h.invTimer <= 0 && Math.abs(h.y - b.y) < 70 && heroInLine) {
            damageHero(h, b.dmg * 0.35, 0, gameOverCb);
          }
        }
      }, i * 280);
    }
  }

  // ── MELEE ATTACK ─────────────────────────────────────
  if (dist < 140 && b.atkTimer <= 0 && !b.laser.active) {
    b.atkTimer   = b.phase === 2 ? 0.9 : 1.4;
    b.actionLock = 0.4;
    b.animState  = 'attack'; b.animTime = 0;
    damageHero(h, b.phase === 2 ? b.dmg * 1.4 : b.dmg, 0, gameOverCb);
  }

  // ── PHASE 2 SPECIALS ────────────────────────────────
  if (b.phase === 2) {
    // Summon drones
    if (def.summonsDrones && G.enemies.filter(e => !e.dead && e.archetype === 'drone').length < 2
        && Math.random() < 0.004) {
      for (let i = 0; i < 2; i++) {
        const e = createEnemy(b.x + (i - 0.5) * 150, G.wave, 'drone', G.levelNum);
        G.enemies.push(e);
      }
      showMsg(`${def.name} DEPLOYS DRONES!`);
    }

    // Summon exploders
    if (def.summonsExploders && G.enemies.filter(e => !e.dead && e.archetype === 'exploder').length < 2
        && Math.random() < 0.003) {
      for (let i = 0; i < 2; i++) {
        const e = createEnemy(b.x + (i % 2 === 0 ? 120 : -120), G.wave, 'exploder', G.levelNum);
        G.enemies.push(e);
      }
      showMsg(`${def.name} LAUNCHES BOMBERS!`);
    }

    // Air strike
    if (def.airStrike && Math.random() < 0.003) {
      for (let i = 0; i < 4; i++) {
        const bx = G.cx + 80 + i * 170 + (Math.random() - 0.5) * 60;
        spawnBomb(bx, -20, b.dmg * 0.6, def.col || '#ff4400');
      }
      showMsg('⚡ AIR STRIKE!', 1.5);
    }
  }

  // Gravity
  b.vy += 1200 * dt; b.y += b.vy * dt;
  if (b.y >= getGround()) { b.y = getGround(); b.vy = 0; }

  // Phase 2 trigger
  if (!b.phase2done && b.hp < b.mhp / 2) {
    b.phase = 2; b.phase2done = true;
    b.bossFlash = 1.2;
    showMsg(def.phase2msg || `${def.name} — PHASE 2!`);
  }
}

// ── ULTIMATE PROJECTILES (drones + solar) ──────────────────
export function updateUltProjectiles(dt) {
  const G = state.G;
  if (!G) return;

  // EL-WAHM drones
  if (G.ultDrones) {
    G.ultDrones = G.ultDrones.filter(d => {
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.animTime += dt;
      d.frame = Math.floor(d.animTime * 12) % 8;

      // Fire rockets at enemies
      d.fireTimer -= dt;
      if (d.fireTimer <= 0) {
        d.fireTimer = 0.6 + Math.random()*0.4;
        // Find nearest enemy
        let nearest = null, nd = 999;
        G.enemies.forEach(e => {
          if (e.dead) return;
          const dist = Math.abs(e.x - d.x) + Math.abs(e.y - d.y);
          if (dist < nd) { nd = dist; nearest = e; }
        });
        if (G.boss && !G.boss.dead) {
          const bd = Math.abs(G.boss.x - d.x) + Math.abs(G.boss.y - d.y);
          if (bd < nd) nearest = G.boss;
        }
        if (nearest && nd < 600) {
          if (!d.rockets) d.rockets = [];
          const dx = nearest.x - d.x, dy = (nearest.y-40) - d.y;
          const len = Math.sqrt(dx*dx+dy*dy);
          d.rockets.push({ x:d.x, y:d.y, vx:dx/len*320, vy:dy/len*320, life:1.2, dmg:d.dmg });
        }
      }

      // Update rockets
      if (d.rockets) {
        d.rockets = d.rockets.filter(rkt => {
          rkt.x += rkt.vx * dt; rkt.y += rkt.vy * dt; rkt.life -= dt;
          // Hit enemies
          G.enemies.forEach(e => {
            if (e.dead) return;
            if (Math.abs(e.x-rkt.x)<30 && Math.abs(e.y-40-rkt.y)<30) {
              damageEnemy(e, rkt.dmg, G.hero.hd);
              rkt.life = 0;
              spawnParticles(rkt.x, rkt.y, '#ff8800', 4, 180);
            }
          });
          if (G.boss && !G.boss.dead) {
            if (Math.abs(G.boss.x-rkt.x)<60 && Math.abs(G.boss.y-60-rkt.y)<60) {
              damageBoss(G.boss, rkt.dmg, G.hero.hd, null);
              rkt.life = 0;
              spawnParticles(rkt.x, rkt.y, '#ff4400', 6, 200);
            }
          }
          return rkt.life > 0;
        });
      }

      return d.life > 0;
    });
  }

  // SOLARIUS solar projectile
  if (G.ultProjectiles) {
    G.ultProjectiles = G.ultProjectiles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.animTime = (p.animTime||0) + dt;
      p.frame = Math.floor(p.animTime * 10) % 6;
      // Damage enemies in radius
      G.enemies.forEach(e => {
        if (e.dead) return;
        const dist = Math.hypot(e.x-p.x, e.y-40-p.y);
        if (dist < p.radius) {
          damageEnemy(e, p.dmg * dt * 3, G.hero.hd);
          spawnParticles(e.x, e.y-40, '#ffaa00', 2, 160);
        }
      });
      if (G.boss && !G.boss.dead) {
        const bd = Math.hypot(G.boss.x-p.x, G.boss.y-60-p.y);
        if (bd < p.radius*1.5) damageBoss(G.boss, p.dmg*dt*2, G.hero.hd, null);
      }
      return p.life > 0 && p.x > -200 && p.x < W + 200;
    });
  }
}
