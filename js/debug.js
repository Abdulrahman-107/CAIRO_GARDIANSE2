// ============================================================
// debug.js — Developer tools (hidden behind DEBUG flag)
// Toggle with: localStorage.setItem('debug','1') in console
// ============================================================

import { state, GROUND, W, H, AS } from './gameState.js?v=020cd006';
import { createEnemy } from './gameState.js?v=020cd006';
import { spawnWave } from './enemies.js?v=020cd006';

export const DEBUG = localStorage.getItem('debug') === '1';

// ---- DEBUG STATE ----
export const dbg = {
  showHitboxes:  false,
  invincible:    false,
  showFPS:       false,
  lastFrameTime: performance.now(),
  fps:           0,
  frameCount:    0,
  fpsTimer:      0,
};

// ---- FPS TRACKING ----
export function trackFPS(dt) {
  if (!DEBUG) return;
  dbg.frameCount++;
  dbg.fpsTimer += dt;
  if (dbg.fpsTimer >= 0.5) {
    dbg.fps = Math.round(dbg.frameCount / dbg.fpsTimer);
    dbg.frameCount = 0;
    dbg.fpsTimer   = 0;
  }
}

// ---- DRAW DEBUG OVERLAY ----
export function drawDebugOverlay(ctx, G) {
  if (!DEBUG || !G) return;

  // FPS
  if (dbg.showFPS) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W - 70, H - 22, 68, 20);
    ctx.fillStyle = dbg.fps >= 55 ? '#00ff88' : dbg.fps >= 30 ? '#ffcc00' : '#ff3333';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${dbg.fps} FPS`, W - 4, H - 6);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // Hero state
  const h = G.hero;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(4, H - 60, 220, 58);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#88ff88';
  ctx.fillText(`ANIM: ${h.animState}  lock:${h.actionLock.toFixed(2)}`, 8, H - 46);
  ctx.fillText(`pos: ${Math.round(h.x)},${Math.round(h.y)}  vy:${Math.round(h.vy)}`, 8, H - 34);
  ctx.fillText(`inv:${h.invTimer.toFixed(2)}  combo:${h.comboCount}  ult:${Math.floor(h.ult)}%`, 8, H - 22);
  ctx.fillText(`enemies:${G.enemies.filter(e=>!e.dead).length}  pfx:${G.pfx.length}  wave:${G.wave}`, 8, H - 10);
  ctx.restore();

  // Hitboxes
  if (dbg.showHitboxes) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,0,0.7)';
    ctx.lineWidth = 1;
    // Hero box
    ctx.strokeRect(h.x - G.cx - 30, h.y - 90, 60, 90);
    // Attack range
    const atkStates = [AS.ATTACK_1, AS.ATTACK_2, AS.ATTACK_3];
    if (atkStates.includes(h.animState)) {
      ctx.strokeStyle = 'rgba(255,100,0,0.9)';
      const rx = h.facing > 0 ? h.x - G.cx : h.x - G.cx - 90;
      ctx.strokeRect(rx, h.y - 60, 90, 50);
    }
    // Enemy boxes
    ctx.strokeStyle = 'rgba(255,0,0,0.6)';
    G.enemies.forEach(e => {
      if (!e.dead) ctx.strokeRect(e.x - G.cx - 25, e.y - 65, 50, 65);
    });
    // Boss box
    if (G.boss && !G.boss.dead) {
      ctx.strokeStyle = 'rgba(255,0,255,0.8)';
      ctx.strokeRect(G.boss.x - G.cx - 55, G.boss.y - 130, 110, 130);
    }
    ctx.restore();
  }

  // Invincible badge
  if (dbg.invincible) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,200,255,0.85)';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('★ INV', 310, 14);
    ctx.restore();
  }
}

// ---- DEBUG PANEL DOM ----
export function buildDebugPanel() {
  if (!DEBUG) return;

  const panel = document.createElement('div');
  panel.id = 'debugPanel';
  panel.style.cssText = `
    position:fixed;bottom:0;right:0;background:rgba(0,0,0,0.85);
    color:#0f0;font:10px monospace;padding:6px 8px;z-index:9999;
    border-top-left-radius:4px;display:flex;flex-direction:column;gap:3px;
  `;
  panel.innerHTML = `
    <div style="color:#ffcc00;font-weight:700;margin-bottom:2px">⚙ DEBUG</div>
    <label><input type="checkbox" id="dbgFPS">  FPS counter</label>
    <label><input type="checkbox" id="dbgHB">   Hitboxes</label>
    <label><input type="checkbox" id="dbgInv">  Invincible</label>
    <button id="dbgSpawn" style="background:#222;color:#0f0;border:1px solid #0f0;cursor:pointer;margin-top:2px">Spawn Enemy</button>
    <button id="dbgEnergy" style="background:#222;color:#0af;border:1px solid #0af;cursor:pointer">Refill Energy+Ult</button>
    <button id="dbgBoss" style="background:#222;color:#f0f;border:1px solid #f0f;cursor:pointer">Spawn Boss</button>
  `;
  document.body.appendChild(panel);

  document.getElementById('dbgFPS').onchange   = e => dbg.showFPS     = e.target.checked;
  document.getElementById('dbgHB').onchange    = e => dbg.showHitboxes = e.target.checked;
  document.getElementById('dbgInv').onchange   = e => dbg.invincible  = e.target.checked;
  document.getElementById('dbgSpawn').onclick  = () => {
    const G = state.G; if (!G) return;
    const e = createEnemy(G.hero.x + 150, G.wave, 'melee');
    e.facing = -1; G.enemies.push(e); G.el++;
  };
  document.getElementById('dbgEnergy').onclick = () => {
    const G = state.G; if (!G) return;
    G.hero.energy = 100; G.hero.ult = 100;
  };
  document.getElementById('dbgBoss').onclick   = () => {
    const G = state.G; if (!G || G.boss) return;
    import('./enemies.js').then(m => m.spawnBoss());
  };
}

// ---- DEBUG KEYBOARD SHORTCUTS ----
export function handleDebugKeys(e) {
  if (!DEBUG) return;
  const G = state.G; if (!G) return;
  switch (e.key) {
    case 'F1': dbg.showFPS      = !dbg.showFPS;      break;
    case 'F2': dbg.showHitboxes = !dbg.showHitboxes; break;
    case 'F3': dbg.invincible   = !dbg.invincible;   break;
    case 'F4': G.hero.energy = 100; G.hero.ult = 100; break;
    case 'F5': {
      const enemy = createEnemy(G.hero.x + 150, G.wave, 'melee');
      enemy.facing = -1; G.enemies.push(enemy); G.el++;
      break;
    }
  }
}
