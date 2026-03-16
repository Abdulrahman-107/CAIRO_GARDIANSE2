// ============================================================
// main.js — Campaign loop: 5 levels × 3 waves + boss each
// ============================================================

import { loadAllAssets }                             from './assets.js?v=020cd006';
import { HEROES }                                    from './heroes.js?v=020cd006';
import { state, initGame, showMsg, saveHighScore,
         GROUND, W, H, AS,
         GRAVITY, ENERGY_REGEN, setGround, getGround } from './gameState.js?v=020cd006';
import { initInput, isLeft, isRight, isJump,
         consumeAttack, consumeSpecial, consumeUlt,
         bindButton }                               from './input.js?v=020cd006';
import { initRenderer, clearCanvas, drawBackground, drawUltProjectiles,
         drawHero, drawEnemy, drawBoss, drawParticles,
         drawProjectiles, drawBombs, drawHazards,
         drawHUD, drawBossFlash, drawComboTint, drawPauseOverlay,
         drawWaveTransition, drawLevelComplete }     from './rendering.js?v=020cd006';
import { doAttack, doSpecial, doUltimate, doJump,
         updateParticles }                          from './combat.js?v=020cd006';
import { spawnWave, updateEnemies, updateBoss, updateUltProjectiles,
         updateProjectiles, updateBombs,
         updateHazards, updateHazardObjects }       from './enemies.js?v=020cd006';
import { buildSelectScreen }                         from './ui.js?v=020cd006';
import { transitionAnim }                            from './animController.js?v=020cd006';
import { getLevel, LEVELS }                          from './levels.js?v=020cd006';
import { DEBUG, dbg, trackFPS, drawDebugOverlay,
         buildDebugPanel, handleDebugKeys }         from './debug.js?v=020cd006';
import { sfxWaveClear, sfxVictory, sfxGameOver,
         sfxHighScore, toggleMute, isMuted }        from './sound.js?v=020cd006';
import { buildMainMenu }                             from './mainMenu.js?v=020cd006';

// ============================================================

// ── DOM Loading Screen ────────────────────────────────────
function showLoadingScreen() {
  const ov = document.getElementById('loadOv');
  if (ov) ov.style.display = 'flex';
}
function updateLoadingScreen(loaded, total) {
  const pct  = total > 0 ? Math.round(loaded/total*100) : 0;
  const bar  = document.getElementById('ldBar');
  const pctEl= document.getElementById('ldPct');
  const lbl  = document.getElementById('ldBarLabel');
  const stat = document.getElementById('ldStatus');
  if (bar)   bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  const msgs = ['INITIALIZING...','LOADING BACKGROUNDS...','LOADING HEROES...','LOADING ENEMIES...','LOADING BOSSES...','READY'];
  const idx  = Math.min(5, Math.floor(pct/20));
  if (lbl)  lbl.textContent  = msgs[idx];
  if (stat) stat.textContent = pct >= 100 ? 'CAIRO READY  ✦' : 'LOADING ASSETS...';
  if (pct >= 100 && bar) {
    bar.style.background = 'linear-gradient(90deg,#00aa44,#00ff88)';
    if (pctEl) pctEl.style.color = '#00ff88';
    if (stat)  { stat.style.color = '#00ff88'; stat.style.animation = 'none'; }
  }
  // Set logo image once assets start loading
  const logoImg = document.getElementById('ldLogoSrc');
  const logoWrap= document.getElementById('ldLogoImg');
  const logoTxt = document.getElementById('ldLogoTxt');
  if (logoImg && !logoImg.src.includes('menu_logo') && pct > 10) {
    logoImg.src = 'assets/ui/menu_logo.png';
    logoImg.onload = () => { 
      if (logoWrap) logoWrap.style.display = 'block';
      if (logoTxt)  logoTxt.style.display  = 'none';
    };
  }
}
function hideLoadingScreen() {
  const ov = document.getElementById('loadOv');
  if (!ov) return;
  ov.style.pointerEvents = 'none';
  ov.style.transition = 'opacity .5s ease';
  ov.style.opacity = '0';
  setTimeout(() => { ov.style.display = 'none'; }, 520);
}

// INIT
// ============================================================
const canvas = document.getElementById('gc');
initInput(canvas);
initRenderer(canvas);
buildDebugPanel();
document.addEventListener('keydown', handleDebugKeys);

let loadedCount = 0, totalAssets = 0;
let lastTime = 0;
const MAX_DT = 0.05;

const WORLD_LEFT  = 50;
// No WORLD_RIGHT — background tiles infinitely via modulo scroll

// ---- State ----
let waveTransition  = { active: false, timer: 0, label: '', duration: 2.0 };
let levelComplete   = { active: false, timer: 0, duration: 3.5, nextName: '' };
let currentHeroIdx  = 0;

// ============================================================
// GAME OVER / VICTORY
// ============================================================
function showGameOverScreen(victory) {
  const G = state.G; if (!G) return;
  G.running = false;
  state.paused = false;
  const isNewRecord = saveHighScore(G.score);

  document.getElementById('goTitle').textContent = victory ? 'CAIRO SAVED!' : 'GAME OVER';
  document.getElementById('goTitle').style.color = victory ? '#ffd700' : '#cc2222';
  document.getElementById('goWave').textContent  = victory
    ? `ALL 5 LEVELS CLEARED!`
    : `Level ${G.levelNum} — Wave ${G.wave}`;
  document.getElementById('goScore').textContent = `Score: ${G.score.toLocaleString()}`;
  document.getElementById('goHigh').textContent  = isNewRecord
    ? `★ NEW RECORD: ${state.highScore.toLocaleString()}!`
    : `Best: ${state.highScore.toLocaleString()}`;
  document.getElementById('goHigh').style.color  = isNewRecord ? '#ffd700' : '#666';
  document.getElementById('goOv').style.display  = 'flex';

  if (isNewRecord) sfxHighScore();
  else if (victory) sfxVictory();
  else sfxGameOver();
}

function gameOver()  { showGameOverScreen(false); }
function fullVictory(){ showGameOverScreen(true);  }

// ============================================================
// LEVEL TRANSITION
// ============================================================
function startLevelComplete() {
  const G = state.G;
  const nextLvl = getLevel(G.levelNum + 1);
  levelComplete = {
    active:   true,
    timer:    0,
    duration: 3.5,
    nextName: nextLvl ? nextLvl.name : null,
  };
  G.running = false;   // pause game logic
}

function advanceToNextLevel() {
  const G = state.G;
  const nextNum = G.levelNum + 1;
  if (nextNum > LEVELS.length) {
    fullVictory();
    return;
  }
  // Apply level reward (HP regen etc.)
  const lvl = getLevel(G.levelNum);
  if (lvl?.reward) {
    G.hero.hp = Math.min(G.hero.mhp, G.hero.hp + (lvl.reward.hp || 0));
    G.hero.energy = Math.min(100, G.hero.energy + (lvl.reward.energy || 0));
  }
  // Move to next level
  const newLvlDef = getLevel(nextNum);
  if (newLvlDef?.groundY) setGround(newLvlDef.groundY);
  G.levelNum  = nextNum;
  G.wave      = 1;
  G.boss      = null;
  G.enemies   = [];
  G.projectiles = [];
  G.bombs     = [];
  G.hazards   = [];
  G.pfx       = [];
  G.el        = 9999;
  G.hero.x    = 200;
  G.hero.y    = getGround();
  G.cx        = 0;
  G.running   = true;
  levelComplete.active = false;

  const newLvl = getLevel(nextNum);
  showMsg(`${newLvl.name} — ${newLvl.subtitle}`);
  lastTime = performance.now();
  setTimeout(spawnWave, 1800);
  requestAnimationFrame(gameLoop);
}

// ============================================================
// START / SELECT
// ============================================================
function startGame(heroIndex, levelNum = 1) {
  currentHeroIdx = heroIndex;
  const lvlDef = getLevel(levelNum);
  if (lvlDef?.groundY) setGround(lvlDef.groundY);
  initGame(HEROES[heroIndex], levelNum);
  document.getElementById('selOv').style.display = 'none';
  const lvl = getLevel(levelNum);
  showMsg(`${lvl.name} — ${lvl.subtitle}`);
  spawnWave();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function showSelect() {
  document.getElementById('goOv').style.display   = 'none';
  document.getElementById('selOv').style.display  = 'none';
  document.getElementById('menuOv').style.display = 'none';
  state.phase  = 'menu';
  state.paused = false;
  levelComplete.active = false;
  buildMainMenu(() => {
    state.phase = 'select';
    buildSelectScreen(startGame);
    document.getElementById('selOv').style.display = 'flex';
  });
}
window.showSelect = showSelect;

// ---- PAUSE ----
function togglePause() {
  if (!state.G || !state.G.running) return;
  state.paused = !state.paused;
  const btn = document.getElementById('pauseBtn');
  if (btn) btn.textContent = state.paused ? '▶' : '⏸';
  if (!state.paused) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  } else {
    render(0);
  }
}
window.togglePause = togglePause;

document.addEventListener('keydown', e => {
  if ((e.key==='p'||e.key==='P'||e.key==='Escape') && state.phase==='game') {
    e.preventDefault(); togglePause();
  }
  // Skip level-complete screen
  if ((e.key==='Enter'||e.key===' ') && levelComplete.active) {
    e.preventDefault(); advanceToNextLevel();
  }
});

// ---- MUTE ----
function handleMuteToggle() {
  const muted = toggleMute();
  const btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = muted ? '🔇' : '🔊';
}
window.handleMuteToggle = handleMuteToggle;

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  const G = state.G;
  if (!G || !G.running || state.paused) return;

  // Level complete screen ticking
  if (levelComplete.active) {
    levelComplete.timer += dt;
    if (levelComplete.timer >= levelComplete.duration) advanceToNextLevel();
    return;
  }

  G.time += dt;
  const h = G.hero, hd = h.hd;

  // ---- MOVEMENT ----
  let moving = false;
  if (isLeft())  { h.x -= hd.stats.spd * dt; h.facing = -1; moving = true; }
  if (isRight()) { h.x += hd.stats.spd * dt; h.facing =  1; moving = true; }
  if (isJump())  doJump();

  // Left boundary only — right side scrolls infinitely, bg tiles via modulo
  h.x = Math.max(WORLD_LEFT, h.x);

  // Gravity
  h.vy += GRAVITY * dt;
  h.y  += h.vy * dt;
  const wasOnGround = h.wasOnGround;
  if (h.y >= getGround()) {
    h.y = getGround(); h.vy = 0; h.onGround = true;
    if (!wasOnGround) { transitionAnim(h, AS.LAND); h.landTimer = 0.12; }
  } else { h.onGround = false; }
  h.wasOnGround = h.onGround;

  if (h.actionLock > 0) h.actionLock = Math.max(0, h.actionLock - dt);

  // Anim state machine
  if (h.actionLock <= 0) {
    const cur = h.animState;
    const isAtk = [AS.ATTACK_1,AS.ATTACK_2,AS.ATTACK_3,AS.SPECIAL,AS.ULTIMATE].includes(cur);
    const isDmg = [AS.HURT,AS.KNOCKDOWN,AS.DEATH].includes(cur);
    if (!isAtk && !isDmg) {
      if (!h.onGround) { transitionAnim(h, h.vy > 50 ? AS.FALL : AS.JUMP_LOOP); }
      else if (cur !== AS.LAND) { transitionAnim(h, moving ? AS.RUN : AS.IDLE); }
    }
    if (cur === AS.KNOCKDOWN && h.onGround && h.actionLock <= 0) transitionAnim(h, AS.IDLE);
  }

  if (h.invTimer   > 0) h.invTimer   = Math.max(0, h.invTimer   - dt);
  if (h.comboTimer > 0) { h.comboTimer -= dt; if (h.comboTimer <= 0) h.comboCount = 0; }
  h.energy = Math.min(100, h.energy + ENERGY_REGEN * dt);
  if (DEBUG && dbg.invincible) h.invTimer = 0.1;

  if (consumeAttack())  doAttack(onBossDefeated);
  if (consumeSpecial()) doSpecial(onBossDefeated);
  if (consumeUlt())     doUltimate(onBossDefeated);

  // Camera — scrolls infinitely, background loops seamlessly
  G.cx = Math.max(0, h.x - W * 0.35);

  // Entities
  updateEnemies(dt, gameOver);
  updateProjectiles(dt, gameOver);
  updateBombs(dt, gameOver);
  updateHazards(dt, gameOver);
  updateHazardObjects(dt, gameOver);
  if (G.boss) updateBoss(dt, gameOver);
  updateParticles(G.pfx, dt);

  // Wave transition timer
  if (waveTransition.active) {
    waveTransition.timer -= dt;
    if (waveTransition.timer <= 0) waveTransition.active = false;
  }

  // ---- WAVE CLEAR ----
  if (G.el <= 0 && G.enemies.length === 0 && !G.boss) {
    G.wave++;
    const isBossWave = G.wave > 3;
    const lvl = getLevel(G.levelNum);
    waveTransition = {
      active: true, timer: 1.8, duration: 1.8,
      label: isBossWave
        ? `${lvl.boss.name}\nAPPEARS!`
        : `WAVE ${G.wave - 1} CLEAR!`,
    };
    if (!isBossWave) {
      sfxWaveClear();
      showMsg(`WAVE CLEAR! +30 HP`);
      h.hp = Math.min(h.mhp, h.hp + 30);
    }
    G.el = 9999;
    setTimeout(spawnWave, 2000);
  }

  // Message timer
  if (state.msgTimer > 0) {
    state.msgTimer -= dt;
    if (state.msgTimer <= 0) {
      const el = document.getElementById('msg');
      if (el) el.textContent = '';
    }
  }
}

// Called when boss HP hits 0
function onBossDefeated() {
  const G = state.G; if (!G) return;
  G.score += 5000 * G.levelNum;
  // Trigger level complete after a short delay
  setTimeout(() => {
    if (G.levelNum >= LEVELS.length) {
      fullVictory();
    } else {
      startLevelComplete();
    }
  }, 2200);
}

// ============================================================
// RENDER
// ============================================================
function render(dt) {
  const G = state.G; if (!G) return;

  clearCanvas();
  drawBackground(G.cx, G.levelNum);

  if (G.boss?.bossFlash > 0) drawBossFlash(G.boss.bossFlash);

  G.enemies.forEach(e => drawEnemy(e, G.cx, dt));
  drawProjectiles(G.projectiles, G.cx);
  drawBombs(G.bombs || [], G.cx);
  drawHazards(G.hazards || [], G.cx);
  if (G.boss) drawBoss(G.boss, G.cx, G.hero, onBossDefeated, dt, G.levelNum);
  drawHero(G.hero, G.cx, dt);
  drawParticles(G.pfx);
  drawHUD(G.hero, G.score, G.wave, !!G.boss, state.highScore, G.levelNum);
  drawComboTint(G.hero);

  if (waveTransition.active) {
    drawWaveTransition(waveTransition.label, 1 - waveTransition.timer / waveTransition.duration);
  }

  if (levelComplete.active) {
    drawLevelComplete(G.levelNum, levelComplete.nextName, levelComplete.timer / levelComplete.duration);
  }

  if (state.paused) drawPauseOverlay();

  drawDebugOverlay(document.getElementById('gc').getContext('2d'), G);
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timestamp) {
  if (!state.G || (!state.G.running && !levelComplete.active)) return;
  if (state.paused) return;

  const dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
  lastTime = timestamp;

  trackFPS(dt);
  update(dt);
  render(dt);

  requestAnimationFrame(gameLoop);
}

function loadingLoop() {
  if (state.phase === 'loading') requestAnimationFrame(loadingLoop);
}

// ============================================================
// BUTTONS
// ============================================================
bindButton('bL',  'left',    null);
bindButton('bR',  'right',   null);
bindButton('bJ',  'jump',    doJump);
bindButton('bP',  'punch',   () => doAttack(onBossDefeated));
bindButton('bS',  'special', () => doSpecial(onBossDefeated));
bindButton('bU',  'ult',     () => doUltimate(onBossDefeated));

// Level complete: tap to advance
canvas.addEventListener('click', () => {
  if (levelComplete.active) advanceToNextLevel();
});

// ============================================================
// BOOT
// ============================================================
state.phase = 'loading';
showLoadingScreen();
totalAssets = loadAllAssets(
  (loaded) => { loadedCount = loaded; updateLoadingScreen(loaded, totalAssets); },
  () => {
    updateLoadingScreen(totalAssets, totalAssets);
    hideLoadingScreen();
    state.phase = 'menu';
    buildMainMenu(() => {
      state.phase = 'select';
      buildSelectScreen(startGame);
      document.getElementById('selOv').style.display = 'flex';
    });
  }
);
requestAnimationFrame(loadingLoop);
