// ============================================================
// combat.js — Attack, special, ultimate, damage (delta-time)
// ============================================================

import { state, GROUND, getGround, showMsg, AS } from './gameState.js?v=020cd006';
import { transitionAnim, inHitWindow, forceTransitionAnim } from './animController.js?v=020cd006';
import { sfxPunch, sfxSpecial, sfxUltimate, sfxHeroDamage, sfxEnemyHit, sfxEnemyDeath, sfxBossHit, sfxJump, sfxLand, sfxComboMilestone } from './sound.js?v=020cd006';

// ---- PARTICLE SPAWNER ----
export function spawnParticles(x, y, col, count, power) {
  const G = state.G; if (!G) return;
  for (let i = 0; i < count; i++) {
    G.pfx.push({
      x: x - G.cx, y,
      vx: (Math.random() - 0.5) * power,
      vy: -(Math.random() * 180 + 60),   // px/s
      life: 0.3 + Math.random() * 0.3,   // seconds
      max:  0.6,
      col,
      sz: 2 + Math.random() * 4,
    });
  }
}

export function updateParticles(pfx, dt) {
  for (let i = pfx.length - 1; i >= 0; i--) {
    const p = pfx[i];
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.vy += 800 * dt;    // gravity in px/s²
    p.life -= dt;
    if (p.life <= 0) pfx.splice(i, 1);
  }
}

// ---- APPLY DAMAGE TO HERO ----
export function damageHero(hero, amount, knockback, gameOverCb) {
  if (hero.invTimer > 0) return;
  if (hero.animState === AS.DEATH) return;

  hero.hp -= amount;
  hero.invTimer = 0.6;
  sfxHeroDamage();
  spawnParticles(hero.x, hero.y - 30, '#ff3333', 8, 120);

  if (hero.hp <= 0) {
    hero.hp = 0;
    forceTransitionAnim(hero, AS.DEATH);
    setTimeout(gameOverCb, 1200);
  } else if (knockback > 100) {
    transitionAnim(hero, AS.KNOCKDOWN);
    hero.vy = -200;
  } else {
    transitionAnim(hero, AS.HURT);
  }
}

// ---- APPLY DAMAGE TO ENEMY ----
function damageEnemy(e, amount, hd) {
  e.hp -= amount;
  e.invTimer = 0.15;
  spawnParticles(e.x, e.y - 30, hd.acc, 6, 120);
  if (e.hp <= 0) {
    e.dead = true;
    e.deathTimer = 0.5;
    e.animState = 'death';
    e.animTime  = 0;
    sfxEnemyDeath();
    return true; // killed
  }
  sfxEnemyHit();
  e.aiState  = 'hurt';
  e.aiTimer  = 0.3;
  e.animState = 'hurt';
  e.animTime  = 0;
  return false;
}

// ---- APPLY DAMAGE TO BOSS ----
function damageBoss(boss, amount, hd, onVictory) {
  if (boss.invTimer > 0) return;
  boss.hp -= amount;
  boss.invTimer = 0.2;
  boss.animState = 'hurt'; boss.animTime = 0;
  sfxBossHit();
  spawnParticles(boss.x, boss.y - 50, '#ffd700', 10, 160);
  if (boss.hp <= 0) {
    boss.hp = 0; boss.dead = true; boss.deathTimer = 3.0;
    boss.animState = 'death'; boss.animTime = 0;
    state.G.score += 5000;
    setTimeout(onVictory, 2800);
  } else if (!boss.phase2done && boss.hp < boss.mhp / 2) {
    boss.phase = 2; boss.phase2done = true;
    showMsg("KHAR'ZETH PHASE 2 — UNLEASHED!");
  }
}

// ---- ATTACK ----
export function doAttack(onVictory) {
  const G = state.G; if (!G || !G.running) return;
  const h = G.hero, hd = h.hd;
  if (h.actionLock > 0) return;

  // Combo chaining
  let nextAtk = AS.ATTACK_1;
  if (h.animState === AS.ATTACK_1 && h.comboTimer > 0) nextAtk = AS.ATTACK_2;
  else if (h.animState === AS.ATTACK_2 && h.comboTimer > 0) nextAtk = AS.ATTACK_3;

  if (!transitionAnim(h, nextAtk)) return;

  // Duration based on animation fps + frames
  const animDef = hd.anims[nextAtk];
  h.actionLock  = animDef ? animDef.f / animDef.fps : 0.33;
  h.comboTimer  = h.actionLock + 0.2;
  h.comboCount  = Math.min(h.comboCount + 1, 9);

  sfxPunch(h.comboCount);
  if (h.comboCount === 5 || h.comboCount === 9) sfxComboMilestone(h.comboCount);

  const dmg = Math.floor(hd.stats.dmg * (1 + h.comboCount * 0.15));

  G.enemies.forEach(e => {
    if (e.dead || e.invTimer > 0) return;
    if (Math.abs(e.x - h.x) < 90 && Math.abs(e.y - h.y) < 50) {
      const killed = damageEnemy(e, dmg, hd);
      h.ult = Math.min(100, h.ult + 9);
      if (killed) { G.score += 100 * G.wave; G.el--; }
    }
  });

  if (G.boss && !G.boss.dead) {
    const b = G.boss;
    if (Math.abs(b.x - h.x) < 115 && Math.abs(b.y - h.y) < 70) {
      damageBoss(b, dmg, hd, onVictory);
      h.ult = Math.min(100, h.ult + 12);
    }
  }
}

// ---- SPECIAL ----
export function doSpecial(onVictory) {
  const G = state.G; if (!G || !G.running) return;
  const h = G.hero, hd = h.hd;
  if (h.actionLock > 0 || h.energy < 25) return;
  if (!transitionAnim(h, AS.SPECIAL)) return;

  const animDef = hd.anims[AS.SPECIAL];
  h.actionLock = animDef ? animDef.f / animDef.fps : 0.5;
  h.energy -= 25;
  sfxSpecial();
  spawnParticles(h.x, h.y - 30, hd.col, 16, 200);

  G.enemies.forEach(e => {
    if (e.dead) return;
    if (Math.abs(e.x - h.x) < 148 && Math.abs(e.y - h.y) < 58) {
      e.vy = -200;
      const killed = damageEnemy(e, hd.stats.sdmg, hd);
      h.ult = Math.min(100, h.ult + 16);
      if (killed) { G.score += 200 * G.wave; G.el--; }
    }
  });

  if (G.boss && !G.boss.dead) {
    if (Math.abs(G.boss.x - h.x) < 180) {
      damageBoss(G.boss, hd.stats.sdmg * 1.5, hd, onVictory);
    }
  }
  showMsg(hd.power.toUpperCase() + '!');
}

// ---- ULTIMATE ----
export function doUltimate(onVictory) {
  const G = state.G; if (!G || !G.running) return;
  const h = G.hero, hd = h.hd;
  if (h.ult < 100) return;
  if (!transitionAnim(h, AS.ULTIMATE)) return;

  const animDef = hd.anims[AS.ULTIMATE];
  // Sum all phases for multi-phase ultimates
  const phases = ['ult_charge','ult_fire','ult_boom','ult_end'].filter(p=>hd.anims[p]);
  const ultDur = phases.length > 1
    ? phases.reduce((s,p)=>s+(hd.anims[p].f/hd.anims[p].fps),0)
    : (animDef ? animDef.f / animDef.fps : 0.8);
  h.actionLock = ultDur;
  h.ult = 0;
  sfxUltimate();

  // EL-WAHM drone ultimate: spawn free-flying drones across the map
  if (hd.id === 'elwahm') {
    if (!G.ultDrones) G.ultDrones = [];
    const dirs = [-1, 1];
    for (let i = 0; i < 6; i++) {
      const dir = dirs[i % 2];
      G.ultDrones.push({
        x: h.x + (Math.random()-0.5)*60,
        y: getGround() - 80 - Math.random()*120,
        vx: dir * (180 + Math.random()*120),
        vy: -20 + (Math.random()-0.5)*40,
        life: 3.5 + Math.random()*1.5,
        fireTimer: 0.3 + i*0.25,
        frame: 0, animTime: 0,
        dir, dmg: hd.stats.sdmg * 0.8,
        rockets: [],
      });
    }
  }
  // SOLARIUS ult: spawn solar projectile
  if (hd.id === 'solarius') {
    if (!G.ultProjectiles) G.ultProjectiles = [];
    G.ultProjectiles.push({
      type: 'solar',
      x: h.x + (h.facing > 0 ? 60 : -60),
      y: h.y - 80,
      vx: h.facing > 0 ? 480 : -480,
      vy: 0,
      life: 2.5,
      frame: 0, animTime: 0,
      dmg: hd.stats.sdmg * 2,
      radius: 80,
    });
  }

  G.enemies.forEach(e => {
    if (e.dead) return;
    e.vy = -250;
    const killed = damageEnemy(e, hd.stats.sdmg * 3, hd);
    if (killed) { G.score += 500 * G.wave; G.el--; }
  });

  if (G.boss && !G.boss.dead) {
    damageBoss(G.boss, hd.stats.sdmg * 4, hd, onVictory);
    for (let i = 0; i < 20; i++) spawnParticles(G.boss.x + (Math.random()-0.5)*100, G.boss.y-50, hd.acc, 3, 220);
  }
  for (let i = 0; i < 40; i++) spawnParticles(50 + Math.random() * 700, getGround() - 30, hd.acc, 2, 250);
  showMsg('ULTIMATE — CAIRO IS SAVED!');
}

// ---- JUMP ----
import { JUMP_VEL } from './gameState.js?v=020cd006';
export function doJump() {
  const G = state.G; if (!G || !G.running) return;
  const h = G.hero;
  if (!h.onGround) return;
  h.vy = JUMP_VEL;
  h.onGround = false;
  sfxJump();
  transitionAnim(h, AS.JUMP_START);
}
