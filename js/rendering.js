// ============================================================
// rendering.js v49 — All canvas drawing (delta-time animation)
// ============================================================

import { imgs }                       from './assets.js?v=020cd006';
import { ALIEN_DEF, TACTER_DEF, DARK_DRONE_DEF, L2_ALIEN_DEF, L2_BOSS_DEF } from './heroes.js?v=020cd006';
import { state, W, H, GROUND, AS }    from './gameState.js?v=020cd006';
import { updateAnim }                 from './animController.js?v=020cd006';
import { getLevel }                   from './levels.js?v=020cd006';

let canvas, ctx;

export function initRenderer(canvasEl) {
  canvas = canvasEl;
  ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
}
export function getCtx() { return ctx; }

// ---- SPRITE DRAW ----
function drawSprite(sk, col, row, fw, fh, dx, dy, dw, dh, flipX) {
  const img = imgs[sk];
  if (!img || !img.complete) return;
  ctx.save();
  if (flipX) {
    ctx.translate(dx + dw, dy); ctx.scale(-1, 1);
    ctx.drawImage(img, col*fw, row*fh, fw, fh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(img, col*fw, row*fh, fw, fh, dx, dy, dw, dh);
  }
  ctx.restore();
}

// ---- BACKGROUND ----
export function drawBackground(camX, levelNum = 1) {
  const lvl = getLevel(levelNum);
  const bgKey = lvl?.bg || 'bg_full';
  const bg = imgs[bgKey] || imgs['bg_full'];

  if (bg && bg.complete && bg.naturalWidth) {
    const srcW = bg.naturalWidth;
    const srcH = bg.naturalHeight;
    const aspectSrc = srcW / srcH;

    let scale, drawW, drawH, dy;

    if (aspectSrc > 2.0) {
      // ── WIDE image (e.g. 1568x470, 1024x304) ──────────────────
      // Scale to fill canvas HEIGHT — no black bars, scroll horizontally
      scale  = H / srcH;
      drawW  = srcW * scale;
      drawH  = H;
      dy     = 0;
    } else {
      // ── PORTRAIT / SQUARE image (e.g. 1536x1024) ──────────────
      // Scale to fill canvas WIDTH, bottom-crop (road is at bottom)
      scale  = W / srcW;
      drawW  = W;
      drawH  = srcH * scale;
      dy     = H - drawH;   // negative → crops off top
    }

    // Seamless horizontal scroll
    const scrollRaw = camX * 0.25;
    const srcOx = ((scrollRaw % srcW) + srcW) % srcW;

    // Primary slice
    const srcSliceW = srcW - srcOx;
    const dstSliceW = srcSliceW * scale;
    ctx.drawImage(bg, srcOx, 0, srcSliceW, srcH, 0, dy, dstSliceW, drawH);

    // Wrap-around tile
    if (dstSliceW < W) {
      ctx.drawImage(bg, 0, 0, srcW - srcSliceW, srcH, dstSliceW, dy, W - dstSliceW, drawH);
    }

    // If wide image doesn't fill full width (unlikely but safe)
    if (drawW < W) {
      let x = drawW;
      while (x < W) {
        ctx.drawImage(bg, 0, dy, Math.min(drawW, W - x), drawH);
        x += drawW;
      }
    }
  } else {
    ctx.fillStyle = '#070712';
    ctx.fillRect(0, 0, W, H);
  }

  if (lvl?.ambientTint) {
    ctx.fillStyle = lvl.ambientTint;
    ctx.fillRect(0, 0, W, H);
  }

  // Subtle ground separator
  // Ground line removed — blends naturally with background
}


// ---- HERO ----
// Offscreen canvas for black-bg sprite compositing
let _heroCanvas = null, _heroCtx = null;
function getHeroCanvas(w, h) {
  if (!_heroCanvas || _heroCanvas.width !== w || _heroCanvas.height !== h) {
    _heroCanvas = document.createElement('canvas');
    _heroCanvas.width  = w;
    _heroCanvas.height = h;
    _heroCtx = _heroCanvas.getContext('2d');
  }
  return { c: _heroCanvas, x: _heroCtx };
}

export function drawHero(hero, camX, dt) {
  const hd   = hero.hd;
  const anim = hd.anims[hero.animState];
  if (!anim) return;

  // Advance animation time
  hero.animTime += dt;
  const frameDur = 1 / anim.fps;
  const totalDur = frameDur * anim.f;
  if (anim.loop) {
    hero.animTime %= totalDur;
  } else {
    if (hero.animTime >= totalDur) {
      if (anim.next && anim.next !== hero.animState) {
        hero.animState = anim.next;
        hero.animTime  = 0;
      } else {
        hero.animTime = totalDur - 0.001;
      }
    }
  }
  const frameIdx = Math.min(anim.f - 1, Math.floor(hero.animTime / frameDur));
  const col      = anim.sc + frameIdx;

  // Pick correct sheet
  const useTornado    = hd.skTornado && anim.sheet === 'tornado';
  const useIdleSheet  = hd.skIdle   && anim.sheet === 'idle';
  const useRunSheet   = hd.skRun    && anim.sheet === 'run';
  const useSuperSheet = hd.skSuper  && anim.sheet === 'super';
  const useJumpSheet  = hd.skJump   && anim.sheet === 'jump';
  const useDeathSheet = hd.skDeath  && anim.sheet === 'death';
  const useUltSheet   = hd.skUlt    && anim.sheet === 'ult';
  const sheetKey = useTornado    ? hd.skTornado
                 : useIdleSheet  ? hd.skIdle
                 : useRunSheet   ? hd.skRun
                 : useSuperSheet ? hd.skSuper
                 : useJumpSheet  ? hd.skJump
                 : useDeathSheet ? hd.skDeath
                 : useUltSheet   ? hd.skUlt
                 : hd.sk;
  const fw = useTornado    ? hd.fwTornado
           : useIdleSheet  ? (hd.fwIdle  || hd.fw)
           : useSuperSheet ? (hd.fwSuper || hd.fw)
           : useRunSheet   ? hd.fwRun
           : useJumpSheet  ? (hd.fwJump  || hd.fw)
           : useDeathSheet ? (hd.fwDeath || hd.fw)
           : useUltSheet   ? (hd.fwUlt   || hd.fw)
           : hd.fw;
  const fh = useTornado    ? hd.fhTornado
           : useIdleSheet  ? (hd.fhIdle  || hd.fh)
           : useSuperSheet ? (hd.fhSuper || hd.fh)
           : useRunSheet   ? hd.fhRun
           : useJumpSheet  ? (hd.fhJump  || hd.fh)
           : useDeathSheet ? (hd.fhDeath || hd.fh)
           : useUltSheet   ? (hd.fhUlt   || hd.fh)
           : hd.fh;

  const img = imgs[sheetKey];
  if (!img || !img.complete) return;

  const srcRow = useTornado ? 0 : anim.r;

  // Tornado drawn larger and centered
  // Use per-hero draw size if defined, else fall back to defaults
  const baseDW = hd.drawW || 108;
  const baseDH = hd.drawH || 120;
  const dw = useTornado ? 150 : baseDW;
  const dh = useTornado ? 120 : baseDH;
  const dx = hero.x - camX - dw / 2;
  const dy = hero.y - dh;

  if (hero.invTimer > 0 && Math.floor(hero.invTimer * 10) % 2) return;

  ctx.save();

  if (img && img.complete && img.naturalWidth) {
    if (hero.facing < 0) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, col * fw, srcRow * fh, fw, fh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, col * fw, srcRow * fh, fw, fh, dx, dy, dw, dh);
    }
  }

  ctx.restore();

  // Ultimate aura — floor glow only (no box)
  if (hero.ult >= 100) {
    const pulse = Date.now() * 0.003;
    const sx = hero.x - camX;
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(pulse) * 0.08;
    const grad = ctx.createRadialGradient(sx, hero.y, 0, sx, hero.y, 45);
    grad.addColorStop(0, hd.acc);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, hero.y, 45, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---- ENEMY ----
export function drawEnemy(enemy, camX, dt) {
  if (enemy.archetype === 'drone')    { drawDrone(enemy, camX);    return; }
  if (enemy.archetype === 'exploder') { drawExploder(enemy, camX); return; }

  // Route to correct level renderer
  const lvl = state.G ? state.G.levelNum : 1;
  if (lvl >= 2) {
    drawL2Enemy(enemy, camX, dt);
  } else {
    drawL1Enemy(enemy, camX, dt);
  }
}

function drawL2Enemy(enemy, camX, dt) {
  const def = L2_ALIEN_DEF;
  const animKey = enemy.animState === 'death'   ? 'death'
                : enemy.animState === 'attack'  ? 'attack'
                : enemy.animState === 'hurt'    ? 'hurt'
                : (enemy.aiState === 'approach' || enemy.aiState === 'retreat') ? 'walk'
                : 'idle';

  const animDef  = def.anims[animKey] || def.anims.walk;
  const sheetKey = animDef.sheet === 'run' ? def.skRun : def.sk;
  const img      = imgs[sheetKey];

  enemy.animTime = (enemy.animTime || 0) + dt;
  const frameDur = 1 / animDef.fps;
  const totalDur = frameDur * animDef.f;
  enemy.animTime = animDef.loop
    ? (enemy.animTime % totalDur)
    : Math.min(enemy.animTime, totalDur - 0.001);
  const frameIdx = Math.min(animDef.f - 1, Math.floor(enemy.animTime / frameDur));
  const srcCol   = animDef.sc + frameIdx;

  const dw = 90, dh = 110;
  const dx = enemy.x - camX - dw / 2;
  const dy = enemy.y - dh;

  ctx.save();
  if (enemy.dead) ctx.globalAlpha = Math.max(0, (enemy.deathTimer || 0) / 0.5);

  if (img && (img.complete || img.naturalWidth > 0)) {
    if (enemy.facing < 0) {
      ctx.translate(dx + dw, dy); ctx.scale(-1, 1);
      ctx.drawImage(img, srcCol * def.fw, animDef.r * def.fh, def.fw, def.fh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, srcCol * def.fw, animDef.r * def.fh, def.fw, def.fh, dx, dy, dw, dh);
    }
  }
  ctx.restore();

  if (!enemy.dead && enemy.hp < enemy.mhp) {
    const hpPct = enemy.hp / enemy.mhp;
    ctx.fillStyle = '#001a00'; ctx.fillRect(enemy.x-camX-28, enemy.y-dh-8, 56, 5);
    ctx.fillStyle = hpPct > .5 ? '#00cc44' : hpPct > .25 ? '#aacc00' : '#ff4400';
    ctx.fillRect(enemy.x-camX-28, enemy.y-dh-8, 56 * hpPct, 5);
  }
}

function drawL1Enemy(enemy, camX, dt) {
  const def = ALIEN_DEF;
  const animKey = enemy.animState === 'death'   ? 'death'
                : enemy.animState === 'attack'  ? 'attack'
                : enemy.animState === 'ranged'  ? 'ranged'
                : enemy.animState === 'hurt'    ? 'hurt'
                : (enemy.aiState === 'approach' || enemy.aiState === 'retreat') ? 'walk'
                : 'idle';

  const animDef  = def.anims[animKey] || def.anims.idle;
  const sheetKey = animDef.sheet === 'run' ? def.skRun : def.sk;
  const img      = imgs[sheetKey];

  enemy.animTime = (enemy.animTime || 0) + dt;
  const frameDur = 1 / animDef.fps;
  const totalDur = frameDur * animDef.f;
  enemy.animTime = animDef.loop
    ? (enemy.animTime % totalDur)
    : Math.min(enemy.animTime, totalDur - 0.001);
  const frameIdx = Math.min(animDef.f - 1, Math.floor(enemy.animTime / frameDur));
  const srcCol   = animDef.sc + frameIdx;

  const dw = 68, dh = 82;
  const dx = enemy.x - camX - dw / 2;
  const dy = enemy.y - dh;

  ctx.save();
  if (enemy.dead) ctx.globalAlpha = Math.max(0, (enemy.deathTimer || 0) / 0.5);

  if (img && (img.complete || img.naturalWidth > 0)) {
    if (enemy.facing < 0) {
      ctx.translate(dx + dw, dy); ctx.scale(-1, 1);
      ctx.drawImage(img, srcCol * def.fw, animDef.r * def.fh, def.fw, def.fh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, srcCol * def.fw, animDef.r * def.fh, def.fw, def.fh, dx, dy, dw, dh);
    }
  }
  ctx.restore();

  if (!enemy.dead && enemy.hp < enemy.mhp) {
    const archCol = enemy.archetype === 'heavy' ? '#ff8800' : '#e33';
    ctx.fillStyle = '#400'; ctx.fillRect(enemy.x-camX-22, enemy.y-dh-7, 44, 4);
    ctx.fillStyle = archCol; ctx.fillRect(enemy.x-camX-22, enemy.y-dh-7, 44*enemy.hp/enemy.mhp, 4);
  }
}


function drawDrone(e, camX) {
  const def = DARK_DRONE_DEF;
  const sx = e.x - camX, sy = e.y;
  const dw = 96, dh = 76;
  const dx = sx - dw / 2, dy = sy - dh;

  // Pick sheet and anim
  const animKey = e.animState === 'death' ? 'death'
                : e.animState === 'attack' ? 'attack'
                : e.animState === 'hurt' ? 'hurt'
                : e.aiState === 'approach' || e.aiState === 'retreat' ? 'walk'
                : 'idle';
  const animDef = def.anims[animKey] || def.anims.idle;
  const sheetKey = animDef.sheet === 'flight' ? def.skFlight : def.sk;
  const img = imgs[sheetKey];

  e.animTime = (e.animTime || 0);
  const frameDur = 1 / animDef.fps;
  const totalDur = frameDur * animDef.f;
  e.animTime = animDef.loop ? (e.animTime % totalDur) : Math.min(e.animTime, totalDur - 0.001);
  const frameIdx = Math.min(animDef.f - 1, Math.floor(e.animTime / frameDur));
  const srcCol = animDef.sc + frameIdx;
  const srcRow = animDef.r;

  ctx.save();
  if (e.dead) ctx.globalAlpha = Math.max(0, e.deathTimer / 0.5);

  if (img && img.complete && img.naturalWidth) {
    // Flip facing
    if (e.facing > 0) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcCol * def.fw, srcRow * def.fh, def.fw, def.fh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, srcCol * def.fw, srcRow * def.fh, def.fw, def.fh, dx, dy, dw, dh);
    }
  } else {
    // Fallback UFO shape
    ctx.fillStyle = '#330044';
    ctx.beginPath(); ctx.ellipse(sx, sy, 28, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#660088';
    ctx.beginPath(); ctx.ellipse(sx, sy - 6, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff44aa';
    ctx.beginPath(); ctx.arc(sx, sy - 6, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Purple energy beam below drone
  const grad = ctx.createLinearGradient(sx, sy + 5, sx, GROUND);
  grad.addColorStop(0, 'rgba(160,0,255,0.3)');
  grad.addColorStop(1, 'rgba(160,0,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(sx - 6, sy + 5, 12, GROUND - sy - 5);
  ctx.restore();

  if (!e.dead && e.hp < e.mhp) {
    ctx.fillStyle = '#220033'; ctx.fillRect(sx - 22, sy - dh - 7, 44, 4);
    ctx.fillStyle = '#cc00ff'; ctx.fillRect(sx - 22, sy - dh - 7, 44 * e.hp/e.mhp, 4);
  }
}

function drawExploder(e, camX) {
  const sx = e.x - camX;
  const pulse = e.armed ? (0.6 + Math.sin(Date.now() * 0.012) * 0.4) : 0.3;
  const dw = 50, dh = 60;
  const dx = sx - dw / 2, dy = e.y - dh;

  ctx.save();
  if (e.dead) { ctx.globalAlpha = Math.max(0, e.deathTimer / 0.5); }

  // Use alien sheet but tinted red-orange
  const def  = ALIEN_DEF;
  const anim = def.anims.walk;
  const fi   = Math.floor((Date.now() / 140) % anim.f);
  const col  = anim.sc + fi;
  ctx.globalAlpha = (ctx.globalAlpha || 1);
  // Red tint layer
  ctx.drawImage(imgs['alien_combat'] || new Image(), col * def.fw, anim.r * def.fh, def.fw, def.fh, dx, dy, dw, dh);

  // Glowing warning overlay
  ctx.globalAlpha *= pulse * 0.55;
  ctx.fillStyle = '#ff4400';
  ctx.fillRect(dx, dy, dw, dh);

  ctx.restore();

  // Warning text
  if (e.armed) {
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!!!', sx, e.y - dh - 3);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

// ---- PROJECTILE ----
export function drawProjectiles(projectiles, camX) {
  projectiles.forEach(p => {
    const sx = p.x - camX;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.col || '#ff6600';
    ctx.beginPath();
    ctx.ellipse(sx, p.y, 12, 5, Math.atan2(0, p.vx), 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

// ---- BOMBS ----
export function drawBombs(bombs, camX) {
  bombs.forEach(b => {
    const sx = b.x - camX;
    ctx.save();
    if (b.exploded) {
      // Explosion circle
      ctx.globalAlpha = Math.max(0, b.life / 0.4) * 0.85;
      const r = (1 - b.life / 0.4) * 55 + 10;
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.arc(sx, GROUND - 10, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.arc(sx, GROUND - 10, r * 0.5, 0, Math.PI * 2); ctx.fill();
    } else {
      // Falling bomb
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = b.col || '#ff4400';
      ctx.beginPath(); ctx.arc(sx, b.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, b.y, 7, 0, Math.PI * 2); ctx.stroke();
      // Trail
      ctx.fillStyle = 'rgba(255,100,0,0.35)';
      ctx.fillRect(sx - 2, b.y - 18, 4, 18);
    }
    ctx.restore();
  });
}

// ---- HAZARDS ----
export function drawHazards(hazards, camX) {
  hazards.forEach(hz => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, hz.life * 2);
    switch (hz.type) {
      case 'rock': {
        const sx = hz.x - camX;
        ctx.fillStyle = '#888'; ctx.beginPath();
        ctx.arc(sx, hz.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.stroke();
        break;
      }
      case 'electric': {
        const sx = hz.x - camX;
        ctx.strokeStyle = '#44ffff'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(sx, hz.y - 30);
          ctx.lineTo(sx + (Math.random()-0.5)*30, hz.y - 15);
          ctx.lineTo(sx + (Math.random()-0.5)*20, hz.y);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,255,255,0.15)';
        ctx.fillRect(sx - hz.w/2, hz.y - 40, hz.w, 45);
        break;
      }
      case 'laser_floor': {
        const sx = hz.x - camX;
        ctx.fillStyle = 'rgba(255,0,80,0.35)';
        ctx.fillRect(0, GROUND - 8, W, 12);
        ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GROUND - 2); ctx.lineTo(W, GROUND - 2); ctx.stroke();
        break;
      }
      case 'gravity': {
        ctx.fillStyle = 'rgba(0,200,255,0.08)';
        ctx.fillRect(0, 0, W, H);
        // Floating particles
        ctx.fillStyle = 'rgba(0,200,255,0.4)';
        for (let i = 0; i < 12; i++) {
          const px = (Date.now() * 0.05 + i * 137) % W;
          const py = H - (Date.now() * 0.08 + i * 53) % H;
          ctx.fillRect(px, py, 3, 3);
        }
        break;
      }
    }
    ctx.restore();
  });
}

// ---- BOSS ----
export function drawBoss(boss, camX, hero, gameOverCb, dt, levelNum = 1) {
  if (!boss || (boss.dead && boss.deathTimer <= 0)) return;

  const sx = boss.x - camX;
  const sy = boss.y;

  // Level 1 uses Boss Tacter with real sprites
  if (levelNum === 1) {
    drawTacterBoss(boss, sx, sy, dt);
  } else if (levelNum === 2) {
    drawL2Boss(boss, sx, sy, dt);
  } else {
    drawDefaultBoss(boss, sx, sy, dt);
  }
}

function drawTacterBoss(boss, sx, sy, dt) {
  const def = TACTER_DEF;
  const dw = 160, dh = 150;
  const dx = sx - dw / 2, dy = sy - dh;

  // Pick animation
  const animKey = boss.dead ? 'death'
                : boss.animState === 'laser' ? 'laser'
                : boss.animState === 'attack' ? 'attack'
                : boss.animState === 'hurt' ? 'hurt'
                : boss.animState === 'walk' ? 'walk'
                : 'idle';
  const animDef = def.anims[animKey] || def.anims.idle;
  const sheetKey = animDef.sheet === 'move' ? def.skMove : def.sk;
  const img = imgs[sheetKey];

  boss.animTime = (boss.animTime || 0) + dt;
  const frameDur = 1 / animDef.fps;
  const totalDur = frameDur * animDef.f;
  if (animDef.loop) {
    boss.animTime %= totalDur;
  } else {
    boss.animTime = Math.min(boss.animTime, totalDur - 0.001);
  }
  const frameIdx = Math.min(animDef.f - 1, Math.floor(boss.animTime / frameDur));
  const srcCol = animDef.sc + frameIdx;

  ctx.save();
  if (boss.dead) ctx.globalAlpha = Math.max(0, boss.deathTimer / 3.0);
  if (boss.invTimer > 0 && Math.floor(boss.invTimer * 10) % 2) ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.4;

  if (boss.phase === 2) {
    ctx.shadowColor = '#cc00ff';
    ctx.shadowBlur  = 20;
  }

  if (img && img.complete && img.naturalWidth) {
    if (boss.facing < 0) {
      // Hero is to LEFT of boss — flip sprite to face left
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcCol * def.fw, animDef.r * def.fh, def.fw, def.fh, 0, 0, dw, dh);
    } else {
      // Hero is to RIGHT — draw normally (sprite faces right by default)
      ctx.drawImage(img, srcCol * def.fw, animDef.r * def.fh, def.fw, def.fh, dx, dy, dw, dh);
    }
  } else {
    // Fallback shape
    ctx.fillStyle = boss.phase === 2 ? '#660033' : '#330011';
    ctx.fillRect(dx + 20, dy + 20, dw - 40, dh - 20);
    ctx.fillStyle = '#cc2200';
    ctx.beginPath(); ctx.arc(sx, sy - dh*0.7, 30, 0, Math.PI*2); ctx.fill();
  }

  // Laser beam
  if (boss.laser?.active) {
    const ly = sy - dh * 0.5;
    const fR = boss.facing > 0;
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(fR ? sx : 0, ly - 6, fR ? W - sx : sx, 12);
    ctx.fillStyle = 'rgba(255,100,0,0.3)';
    ctx.fillRect(fR ? sx : 0, ly - 22, fR ? W - sx : sx, 44);
  }
  ctx.restore();

  // Boss HP bar
  if (!boss.dead) {
    drawBossHPBar(boss, "BOSS TACTER", boss.phase === 2 ? '#cc00ff' : '#cc2200');
    if (boss.phase === 2) {
      ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#cc00ff';
      ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
}


function drawL2Boss(boss, sx, sy, dt) {
  const def    = L2_BOSS_DEF;
  const dw = 200, dh = 200;
  const dx = sx - dw / 2, dy = sy - dh;

  // Pick animation based on boss state
  const animKey = boss.dead        ? 'death'
                : boss.phase === 2 ? (boss.animState === 'laser_beam' ? 'laser_beam'
                                    : boss.animState === 'laser_fire' ? 'laser_fire'
                                    : boss.animState === 'laser_up'   ? 'laser_up'
                                    : boss.animState === 'laser_sweep'? 'laser_sweep'
                                    : boss.animState === 'dash'       ? 'dash'
                                    : boss.animState === 'dash2'      ? 'dash2'
                                    : 'attack')
                : boss.animState === 'attack'  ? 'attack'
                : boss.animState === 'attack2' ? 'attack2'
                : boss.animState === 'slash'   ? 'slash'
                : boss.animState === 'hurt'    ? 'hurt'
                : boss.aiState === 'approach' || boss.aiState === 'charge' ? 'run'
                : boss.aiState === 'walk' ? 'walk'
                : 'idle';

  const animDef = def.anims[animKey] || def.anims.idle;

  // Pick correct sheet
  const isLaser = animKey.startsWith('laser');
  const isDash  = animKey.startsWith('dash');
  const sheetKey = isLaser ? def.skLaser
                 : isDash  ? def.skDash
                 : animKey === 'idle' || animKey === 'walk' || animKey === 'run' ? def.skMove
                 : def.sk;

  const img = imgs[sheetKey];
  const fw  = isLaser ? (def.fwLaser || def.fw) : def.fw;
  const fh  = isLaser ? (def.fhLaser || def.fh) : def.fh;

  boss.animTime = (boss.animTime || 0) + dt;
  const fps      = animDef.fps || 8;
  const maxF     = animDef.f   || 4;
  const frameDur = 1 / fps;
  if (animDef.loop) boss.animTime %= frameDur * maxF;
  else boss.animTime = Math.min(boss.animTime, frameDur * (maxF - 1) + 0.001);

  const frameIdx = Math.min(maxF - 1, Math.floor(boss.animTime / frameDur));
  const col      = animDef.sc + frameIdx;
  const row      = animDef.r;

  ctx.save();
  if (img && img.complete && img.naturalWidth) {
    if (boss.facing < 0) {
      ctx.translate(dx + dw, dy); ctx.scale(-1,1);
      ctx.drawImage(img, col*fw, row*fh, fw, fh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, col*fw, row*fh, fw, fh, dx, dy, dw, dh);
    }
  }

  // Phase 2 green aura
  if (boss.phase === 2) {
    ctx.globalAlpha = 0.18 + Math.sin(Date.now()*0.004)*0.1;
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy - dh*0.5, dw*0.55, dh*0.55, 0, 0, Math.PI*2);
    ctx.stroke();
  }

  ctx.restore();

  // HP bar - drawn outside flip so it's always correct
  const hpPct = Math.max(0, boss.hp / boss.mhp);
  const bw = dw + 20;
  const bx = sx - bw / 2;
  const by = boss.y - dh - 18;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(bx, by, bw, 9);
  ctx.fillStyle = hpPct > 0.5 ? '#00dd44' : hpPct > 0.25 ? '#aacc00' : '#ff4400';
  ctx.fillRect(bx, by, bw * hpPct, 9);
  ctx.strokeStyle = '#00ff6688';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, 9);
  ctx.fillStyle = '#00ffaa';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(def.name || 'WAR MACHINE', sx, by - 4);
  ctx.textAlign = 'left';
}

function drawDefaultBoss(boss, sx, sy, dt) {
  const dw = 150, dh = 150;
  const dx = sx - dw/2, dy = sy - dh;
  const def = boss.def || {};
  const col = boss.phase === 2 ? (def.acc || '#cc00ff') : (def.col || '#cc2200');

  boss.animTime = (boss.animTime || 0) + dt;

  ctx.save();
  if (boss.dead) ctx.globalAlpha = Math.max(0, boss.deathTimer / 3.0);
  if (boss.invTimer > 0 && Math.floor(boss.invTimer*10)%2) ctx.globalAlpha = (ctx.globalAlpha||1)*0.4;
  if (boss.phase===2) { ctx.shadowColor=col; ctx.shadowBlur=24; }

  // Animated body — pulse with sin wave
  const pulse = 1 + Math.sin(boss.animTime * 4) * 0.04;
  ctx.fillStyle = col + '88';
  ctx.fillRect(dx+20, dy+35, (dw-40)*pulse, dh-35);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(sx, dy+28, 28*pulse, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = boss.phase===2 ? '#ffffff' : '#ffff00';
  ctx.beginPath(); ctx.arc(sx-11, dy+22, 6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx+11, dy+22, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = col + 'cc';
  ctx.fillRect(dx, dy+52, 20, 48);
  ctx.fillRect(dx+dw-20, dy+52, 20, 48);
  ctx.fillRect(dx+26, dy+dh-28, 22, 28);
  ctx.fillRect(dx+dw-48, dy+dh-28, 22, 28);

  if (boss.laser?.active) {
    const ly = sy - dh*0.5, fR = boss.facing > 0;
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = def.col || '#ff6600';
    ctx.fillRect(fR?sx:0, ly-5, fR?W-sx:sx, 10);
    ctx.fillStyle = (def.col||'#ff8800')+'44';
    ctx.fillRect(fR?sx:0, ly-20, fR?W-sx:sx, 40);
  }
  ctx.restore();

  if (!boss.dead) {
    drawBossHPBar(boss, def.name || 'BOSS', boss.phase===2 ? (def.acc||'#cc00ff') : (def.col||'#cc2200'));
    if (boss.phase===2) { ctx.save(); ctx.globalAlpha=0.06; ctx.fillStyle=def.acc||'#cc00ff'; ctx.fillRect(0,0,W,H); ctx.restore(); }
  }
}
function drawBossHPBar(boss, name, fillColor) {
  const bw=320, bh=18, bx=W/2-bw/2, by=8;
  ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(bx-4,by-4,bw+8,bh+8);
  ctx.fillStyle='#110000';         ctx.fillRect(bx,by,bw,bh);
  const pct = boss.hp/boss.mhp;
  ctx.fillStyle = fillColor; ctx.fillRect(bx,by,bw*pct,bh);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx,by,bw*pct,bh/3);
  ctx.strokeStyle='#330000'; ctx.lineWidth=1.5; ctx.strokeRect(bx,by,bw,bh);
  ctx.fillStyle='#ffd700'; ctx.font='bold 9px monospace'; ctx.textAlign='center';
  ctx.fillText(`${name}${boss.phase===2?' ★ PHASE 2':''} — ${Math.ceil(boss.hp)}/${boss.mhp}`, W/2, by+bh+11);
  ctx.textAlign='left';
}


export function drawParticles(pfx) {
  pfx.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.9;
    ctx.fillStyle   = p.col;
    ctx.fillRect(p.x - p.sz/2, p.y - p.sz/2, p.sz, p.sz);
    ctx.restore();
  });
}

// ---- HUD ----
const HUD = { ICON:44, BAR_W:260, BAR_H:44, FX:18, FY:9, FW:224, FH:26, HP_X:4, HP_Y:4, EN_X:4, EN_Y:52 };

function drawBar(emptyKey, fillKey, pct, bx, by) {
  const ei=imgs[emptyKey], fi=imgs[fillKey];
  if (ei&&ei.complete) ctx.drawImage(ei,bx,by,HUD.BAR_W,HUD.BAR_H);
  if (fi&&fi.complete&&pct>0) {
    ctx.save(); ctx.beginPath(); ctx.rect(bx+HUD.FX,by+HUD.FY,HUD.FW*pct,HUD.FH); ctx.clip();
    ctx.drawImage(fi,bx+HUD.FX,by+HUD.FY,HUD.FW,HUD.FH); ctx.restore();
  }
  if (ei&&ei.complete) { ctx.save(); ctx.globalAlpha=0.55; ctx.drawImage(ei,bx,by,HUD.BAR_W,HUD.BAR_H); ctx.restore(); }
}

export function drawHUD(hero, score, wave, bossActive, highScore = 0, levelNum = 1) {
  // Left HUD is now DOM-based (hud.js) — only draw right-side score panel here
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(W-122,2,120,76);
  ctx.textAlign='right'; ctx.font='bold 10px monospace';
  ctx.fillStyle='#ffd700'; ctx.fillText('SCORE '+score.toLocaleString(), W-4,15);
  ctx.fillStyle='#ff7733'; ctx.fillText('WAVE '+(bossActive?'BOSS':wave), W-4,28);
  ctx.fillStyle='#555';    ctx.fillText('BEST  '+(highScore||0).toLocaleString(), W-4,40);
  ctx.fillStyle='#111'; ctx.fillRect(W-118,43,114,8);
  ctx.fillStyle=hero.ult>=100?'#00ffaa':'#33ddaa'; ctx.fillRect(W-118,43,114*(hero.ult/100),8);
  ctx.strokeStyle='#225544'; ctx.lineWidth=1; ctx.strokeRect(W-118,43,114,8);
  ctx.fillStyle=hero.ult>=100?'#00ffaa':'#88ccbb';
  ctx.fillText(hero.ult>=100?'★ ULTIMATE':'ULT '+Math.floor(hero.ult)+'%', W-4,60);
  if (hero.comboCount>=2) {
    ctx.fillStyle=hero.comboCount>=5?'#ff44aa':'#ffaa00';
    ctx.font='bold 13px monospace';
    ctx.fillText('×'+hero.comboCount+' COMBO', W-4,74);
  }
  ctx.textAlign='left';
  ctx.restore();
}


export function drawBossFlash(bossFlash) {
  if (bossFlash <= 0) return;
  ctx.save(); ctx.globalAlpha=(bossFlash/1.2)*0.35;
  ctx.fillStyle='#8800ff'; ctx.fillRect(0,0,W,H); ctx.restore();
}

export function drawComboTint(hero) {
  if (hero.comboCount < 3) return;
  ctx.save(); ctx.globalAlpha=0.05;
  ctx.fillStyle=hero.hd.acc; ctx.fillRect(0,0,W,H); ctx.restore();
}

export function drawLoadingScreen(pct) {
  if (!ctx) return;
  const t   = Date.now() / 1000;
  const cx  = W / 2, cy = H / 2;
  const logoImg = imgs['menu_logo'];

  // ── Background: deep dark with subtle radial ───────────
  ctx.fillStyle = '#020510';
  ctx.fillRect(0, 0, W, H);

  // Animated grid lines
  ctx.save();
  ctx.globalAlpha = 0.06 + Math.sin(t * 0.5) * 0.02;
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 0.5;
  const gridSize = 40;
  const offsetX = (t * 8) % gridSize;
  const offsetY = (t * 4) % gridSize;
  for (let x = -gridSize + offsetX; x < W + gridSize; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -gridSize + offsetY; y < H + gridSize; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // ── Horizon glow ──────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.15;
  const hGrad = ctx.createLinearGradient(0, cy - 20, 0, cy + 40);
  hGrad.addColorStop(0, '#003366');
  hGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, cy - 20, W, 60);
  ctx.restore();

  // ── Logo — use preloaded asset ────────────────────────
  const logoReady = logoImg && (logoImg.complete || logoImg.naturalWidth > 0);
  if (!logoReady) {
    // Fallback text while logo loads
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.letterSpacing = '4px';
    ctx.fillText('GUARDIANS OF CAIRO', cx, cy - 55);
    ctx.restore();
  } else {
    const lw = Math.min(W * 0.55, 320);
    const lh = lw * (logoImg.naturalHeight / logoImg.naturalWidth);
    const lx = cx - lw / 2;
    const ly = cy - lh - 28;
    const pulse = 0.88 + Math.sin(t * 1.8) * 0.12;
    ctx.save();
    ctx.globalAlpha = Math.min(1, pct / 20 + 0.3) * pulse;
    ctx.drawImage(logoImg, lx, ly, lw, lh);
    ctx.restore();
  }

  // ── Tagline ───────────────────────────────────────────
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '8px monospace';
  ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.2;
  ctx.fillStyle = '#00ccff';
  ctx.letterSpacing = '4px';
  ctx.fillText('حراس القاهرة  ·  CAIRO 2042  ·  THE SKY SPLIT OPEN', cx, cy - 8);
  ctx.restore();

  // ── Bar track ─────────────────────────────────────────
  const bw = Math.min(W * 0.55, 320);
  const bh = 6;
  const bx = cx - bw / 2;
  const by = cy + 4;

  // Track bg
  ctx.fillStyle = '#0a1428';
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.fill();

  // Filled portion with animated shimmer
  if (pct > 0) {
    const fillW = bw * (pct / 100);

    // Glow under bar
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(bx, by + bh, fillW, 6);
    ctx.restore();

    // Bar fill — color shifts cyan → gold as it fills
    const r = Math.round(pct < 60 ? 0   : (pct - 60) / 40 * 255);
    const g = Math.round(pct < 60 ? 150 + pct : 215);
    const b = Math.round(pct < 60 ? 255 : Math.max(0, 255 - (pct - 60) / 40 * 255));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.rect(bx, by, fillW, bh);
    ctx.fill();

    // Shimmer sweep
    const shimX = bx + (fillW * ((t * 0.6) % 1));
    const shimGrad = ctx.createLinearGradient(shimX - 20, 0, shimX + 20, 0);
    shimGrad.addColorStop(0,   'rgba(255,255,255,0)');
    shimGrad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    shimGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, fillW, bh);
    ctx.clip();
    ctx.fillStyle = shimGrad;
    ctx.fillRect(bx, by, fillW, bh);
    ctx.restore();
  }

  // Tick marks on bar
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#fff';
  for (let i = 1; i < 10; i++) {
    ctx.fillRect(bx + bw * i / 10 - 0.5, by, 1, bh);
  }
  ctx.restore();

  // ── Pct text ──────────────────────────────────────────
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = pct >= 100 ? '#ffd700' : '#00ccff';
  ctx.globalAlpha = 0.9;
  ctx.fillText(pct >= 100 ? '✦  READY  ✦' : `LOADING... ${Math.round(pct)}%`, cx, by + bh + 14);
  ctx.restore();

  // ── Corner decorations ────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 1;
  const cs = 12; // corner size
  [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([x,y,sx,sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + sx*cs, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy*cs);
    ctx.stroke();
  });
  ctx.restore();
}


export function clearCanvas() { ctx.clearRect(0,0,W,H); }

// ---- PAUSE OVERLAY ----
export function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  const pw = 240, ph = 88, px = W/2 - pw/2, py = H/2 - ph/2;
  ctx.fillStyle = 'rgba(5,5,20,0.94)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#334'; ctx.lineWidth = 1.5;
  ctx.strokeRect(px, py, pw, ph);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 18px monospace';
  ctx.fillText('PAUSED', W/2, py + 32);
  ctx.fillStyle = '#446'; ctx.font = '9px monospace';
  ctx.fillText('P / ESC  — resume', W/2, py + 52);
  ctx.fillText('M  — toggle sound', W/2, py + 66);
  ctx.textAlign = 'left';
  ctx.restore();
}

// ---- WAVE TRANSITION BANNER ----
export function drawWaveTransition(label, progress) {
  let alpha, yOff;
  if      (progress < 0.2)  { alpha = progress / 0.2;          yOff = (1 - alpha) * -60; }
  else if (progress < 0.75) { alpha = 1;                        yOff = 0; }
  else                       { alpha = 1 - (progress-0.75)/0.25; yOff = (1-alpha)*-60; }

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  const isBoss = label.includes('BOSS') || label.includes('ZETH') || label.includes('PHASE')
               || label.includes('TITAN') || label.includes('GENERAL') || label.includes('OVERLORD')
               || label.includes('MACHINE') || label.includes('COMMANDER');
  const col1 = isBoss ? '#cc00ff' : '#ffd700';
  const col2 = isBoss ? '#1a0030' : '#1a1000';

  const bw = 380, bh = 56, bx = W/2 - bw/2, by = H/2 - bh/2 + yOff;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx+3, by+3, bw, bh);
  ctx.fillStyle = col2; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = col1; ctx.fillRect(bx, by, bw, 2);
  ctx.fillStyle = col1; ctx.fillRect(bx, by+bh-2, bw, 2);

  // Shimmer
  const shimX = ((progress * 3) % 1) * (bw + 100) - 50;
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  const grad = ctx.createLinearGradient(bx+shimX, by, bx+shimX+60, by+bh);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(bx, by, bw, bh);
  ctx.restore();

  ctx.textAlign = 'center';
  const lines = label.split('\n');
  if (lines.length === 1) {
    ctx.fillStyle = col1; ctx.font = 'bold 22px monospace';
    ctx.fillText(label, W/2, by + bh/2 + 8);
  } else {
    ctx.fillStyle = col1; ctx.font = 'bold 13px monospace';
    ctx.fillText(lines[0], W/2, by + 22);
    ctx.font = 'bold 20px monospace';
    ctx.fillText(lines[1], W/2, by + 44);
  }
  ctx.textAlign = 'left';
  ctx.restore();
}

// ---- LEVEL COMPLETE SPLASH ----
export function drawLevelComplete(levelNum, nextLevelName, progress) {
  // progress 0→1
  const alpha = Math.min(1, progress * 3);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(0,0,W,H);

  const cy = H / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 26px monospace';
  ctx.fillText(`LEVEL ${levelNum} COMPLETE!`, W/2, cy - 28);
  ctx.fillStyle = '#aaa'; ctx.font = '11px monospace';
  ctx.fillText('CAIRO HOLDS... FOR NOW.', W/2, cy - 6);
  if (nextLevelName) {
    ctx.fillStyle = '#44ffaa'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`NEXT: ${nextLevelName}`, W/2, cy + 18);
  }
  ctx.fillStyle = '#555'; ctx.font = '9px monospace';
  ctx.fillText('Continue...', W/2, cy + 40);
  ctx.textAlign = 'left';
  ctx.restore();
}

// ── ULTIMATE PROJECTILE RENDERING ────────────────────────
export function drawUltProjectiles(G, camX) {
  if (!G) return;
  const droneImg  = imgs['elwahm_drones'];
  const solarImg  = imgs['solarius_sfx'];

  // Draw EL-WAHM drones
  if (G.ultDrones) {
    G.ultDrones.forEach(d => {
      const sx = d.x - camX;
      const dw = 64, dh = 54;

      // Draw drone
      if (droneImg && droneImg.complete) {
        const fw = 128, fh = 136;
        const frame = d.frame % 8;
        const col = frame % 8;
        const row = 0;
        ctx.save();
        if (d.dir < 0) {
          ctx.translate(sx + dw/2, d.y - dh/2);
          ctx.scale(-1, 1);
          ctx.drawImage(droneImg, col*fw, row*fh, fw, fh, -dw/2, -dh/2, dw, dh);
        } else {
          ctx.drawImage(droneImg, col*fw, row*fh, fw, fh, sx-dw/2, d.y-dh/2, dw, dh);
        }
        ctx.restore();
      } else {
        // Fallback drone shape
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(sx-16, d.y-10, 32, 12);
        ctx.fillRect(sx-6, d.y-18, 12, 8);
        ctx.restore();
      }

      // Draw rockets
      if (d.rockets) {
        d.rockets.forEach(rkt => {
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.ellipse(rkt.x-camX, rkt.y, 10, 4, Math.atan2(rkt.vy, rkt.vx), 0, Math.PI*2);
          ctx.fill();
          // Flame trail
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.ellipse(rkt.x-camX - rkt.vx*0.04, rkt.y - rkt.vy*0.04, 6, 3, Math.atan2(rkt.vy,rkt.vx), 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        });
      }
    });
  }

  // Draw SOLARIUS solar projectile
  if (G.ultProjectiles) {
    G.ultProjectiles.forEach(p => {
      const sx = p.x - camX;
      ctx.save();
      // Glow effect
      ctx.globalAlpha = 0.35 + Math.sin(p.animTime*8)*0.15;
      const grad = ctx.createRadialGradient(sx, p.y, 0, sx, p.y, p.radius);
      grad.addColorStop(0,   '#ffffff');
      grad.addColorStop(0.3, '#ffdd00');
      grad.addColorStop(0.7, '#ff6600');
      grad.addColorStop(1,   'rgba(255,80,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, p.y, p.radius, 0, Math.PI*2);
      ctx.fill();

      // Draw solar fx sprite if available
      if (solarImg && solarImg.complete) {
        ctx.globalAlpha = 0.85;
        const fw = 170, fh = 227;
        const f = p.frame;
        ctx.drawImage(solarImg, f*fw, 0, fw, fh, sx-60, p.y-60, 120, 120);
      }
      ctx.restore();
    });
  }
}
