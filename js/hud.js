// hud.js — Unique HUD per hero — self-contained module
import { imgs }   from './assets.js?v=020cd006';
import { state }  from './gameState.js?v=020cd006';
import { HEROES } from './heroes.js?v=020cd006';

// ── Per-hero unique identity ──────────────────────────────
const THEMES = {
  barq: {
    name:'BARQ', role:'SPEEDSTER',
    col:'#00d4ff', acc:'#88eeff', dim:'#003a55',
    portrait:'barq_portrait',
    accent: 'linear-gradient(180deg,#00d4ff 0%,#004466 100%)',
    hpTrack:'#001a2e', enTrack:'#001828',
    enFill: 'linear-gradient(90deg,#003388,#0088cc,#88eeff)',
    ultFill:'linear-gradient(90deg,#003a20,#00aa55,#00ffaa)',
    stars:4, starCol:'#00d4ff',
    frameBorder:'#00d4ff33',
    panelBg:'rgba(0,8,20,0.92)',
  },
  solarius: {
    name:'SOLARIUS', role:'SOLAR MAGE',
    col:'#ffaa00', acc:'#ffd700', dim:'#3d2000',
    portrait:'solarius_portrait',
    accent: 'linear-gradient(180deg,#ffaa00 0%,#663300 100%)',
    hpTrack:'#1a0a00', enTrack:'#1a0800',
    enFill: 'linear-gradient(90deg,#771100,#dd5500,#ffd700)',
    ultFill:'linear-gradient(90deg,#1a0800,#aa4400,#ffaa00)',
    stars:5, starCol:'#ffd700',
    frameBorder:'#ffaa0033',
    panelBg:'rgba(16,5,0,0.92)',
  },
  elwahm: {
    name:'EL-WAHM', role:'DEFENDER',
    col:'#ffd700', acc:'#ffee88', dim:'#332800',
    portrait:'elwahm_portrait',
    accent: 'linear-gradient(180deg,#ffd700 0%,#664400 100%)',
    hpTrack:'#181000', enTrack:'#141000',
    enFill: 'linear-gradient(90deg,#443300,#bb8800,#ffee88)',
    ultFill:'linear-gradient(90deg,#1a1000,#886600,#ffd700)',
    stars:5, starCol:'#ffd700',
    frameBorder:'#ffd70033',
    panelBg:'rgba(14,10,0,0.92)',
  },
  amunx7: {
    name:'AMUN-X7', role:'ASSASSIN',
    col:'#ff6600', acc:'#ff9944', dim:'#2d1000',
    portrait:'amunx7_portrait',
    accent: 'linear-gradient(180deg,#ff6600 0%,#661100 100%)',
    hpTrack:'#1a0800', enTrack:'#160600',
    enFill: 'linear-gradient(90deg,#550800,#cc3300,#ff9944)',
    ultFill:'linear-gradient(90deg,#160400,#882200,#ff6600)',
    stars:4, starCol:'#ff6600',
    frameBorder:'#ff660033',
    panelBg:'rgba(14,4,0,0.92)',
  },
};

// ── Shared state ──────────────────────────────────────────
let T           = THEMES.barq;
let trailHP     = 1, prevHP = 1, trailTimer = null;
let hudReady    = false, lastHeroId = null;
let _el         = null;

// ── CSS ───────────────────────────────────────────────────
function css() {
  if (document.getElementById('_hcss')) return;
  const s = document.createElement('style');
  s.id = '_hcss';
  s.textContent = `
#gHUD{position:absolute;top:6px;left:7px;z-index:30;pointer-events:none;}
.hf{display:flex;align-items:stretch;border-radius:6px;overflow:hidden;
    width:310px;position:relative;border-width:1.5px;border-style:solid;}
.hf-left{flex:0 0 68px;display:flex;flex-direction:column;align-items:center;
    justify-content:center;padding:6px 4px 22px;position:relative;overflow:hidden;}
.hf-left::after{content:'';position:absolute;right:0;top:12px;bottom:12px;
    width:1px;background:rgba(255,255,255,.08);}
.hport{width:56px;height:56px;border-radius:50%;border-width:2px;border-style:solid;
    overflow:hidden;background:#060a14;display:flex;align-items:center;justify-content:center;}
.hport img{width:100%;height:100%;object-fit:cover;object-position:top center;}
.hport-fb{font-size:16px;font-weight:700;font-family:'Courier New',monospace;}
.hlvl{position:absolute;bottom:5px;font-size:7px;font-weight:700;letter-spacing:1px;
    padding:1px 7px;border-radius:2px;font-family:'Courier New',monospace;color:#000d18;}
.hf-right{flex:1;padding:6px 10px 5px 8px;display:flex;flex-direction:column;gap:3px;
    position:relative;}
.hf-right::after{content:'';position:absolute;right:0;top:0;bottom:0;width:18px;
    background:linear-gradient(135deg,transparent 50%,rgba(0,0,0,.5) 50%);}
.hn{display:flex;align-items:baseline;gap:6px;margin-bottom:1px;}
.hn-name{font-size:12px;font-weight:700;letter-spacing:2px;font-family:'Courier New',monospace;}
.hn-role{font-size:7px;letter-spacing:2px;opacity:.45;font-family:'Courier New',monospace;}
.hn-st{margin-left:auto;margin-right:18px;font-size:7px;letter-spacing:1px;
    padding:1px 5px;border-radius:2px;font-family:'Courier New',monospace;}
.st-ok{background:#001810;color:#4cdd6a;border:1px solid #1a5030;}
.st-cr{background:#200000;color:#ff4444;border:1px solid #550000;
    animation:stcr .7s ease-in-out infinite;}
.st-ko{background:#150000;color:#ff6666;border:1px solid #330000;}
@keyframes stcr{0%,100%{opacity:1}50%{opacity:.35}}
.hrow{display:flex;align-items:center;gap:5px;}
.hlbl{font-size:7px;letter-spacing:1.5px;color:#2a4060;width:16px;flex-shrink:0;
    font-family:'Courier New',monospace;}
.htrk{flex:1;border-radius:2px;position:relative;overflow:hidden;
    border:1px solid rgba(255,255,255,.06);}
.htrk-hp {height:14px;clip-path:polygon(0 0,calc(100% - 7px) 0,100% 100%,0 100%);}
.htrk-en {height:9px; clip-path:polygon(0 0,calc(100% - 5px) 0,100% 100%,0 100%);}
.htrk-ul {height:7px; clip-path:polygon(0 0,calc(100% - 4px) 0,100% 100%,0 100%);}
.htrl{position:absolute;top:0;bottom:0;left:0;background:#cc2200;opacity:.3;
    transition:width .65s cubic-bezier(.4,0,.2,1);border-radius:2px;}
.hbar{position:absolute;top:0;bottom:0;left:0;border-radius:2px;overflow:hidden;
    transition:width .2s cubic-bezier(.4,0,.6,1),background .25s;}
.hbar::after,.enbar::after{content:'';position:absolute;top:0;left:0;right:0;height:38%;
    background:rgba(255,255,255,.14);}
.htks{position:absolute;inset:0;display:flex;pointer-events:none;}
.htk{flex:1;border-right:1px solid rgba(0,0,0,.2);}
.htk:last-child{border-right:none;}
.enbar{position:absolute;top:0;bottom:0;left:0;border-radius:2px;overflow:hidden;
    transition:width .25s ease;}
.ulbar{position:absolute;top:0;bottom:0;left:0;border-radius:2px;overflow:hidden;
    transition:width .25s ease;}
.hnum{font-size:9px;font-weight:700;color:#c8d8e8;white-space:nowrap;
    min-width:74px;text-align:right;font-family:'Courier New',monospace;}
.hpct{font-size:8px;white-space:nowrap;min-width:28px;text-align:right;
    font-family:'Courier New',monospace;}
.hstars{display:flex;gap:2px;margin-top:3px;padding-left:4px;}
.hstar{font-size:9px;line-height:1;}
.enbar-full{animation:enpls 1.4s ease-in-out infinite;}
.ulbar-rdy{animation:ulpls .9s ease-in-out infinite;}
@keyframes enpls{0%,100%{filter:brightness(1)}50%{filter:brightness(1.55)}}
@keyframes ulpls{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8)}}
  `;
  document.head.appendChild(s);
}

// ── Build hero-specific HTML ──────────────────────────────
function buildHTML(heroId) {
  T = THEMES[heroId] || THEMES.barq;
  const ticks = Array.from({length:10},()=>'<div class="htk"></div>').join('');
  const stars = Array.from({length:5},(_,i)=>{
    const on = i < T.stars;
    const col = on ? T.starCol : '#1a2535';
    return `<span class="hstar" style="color:${col}">★</span>`;
  }).join('');

  return `
<div class="hf" style="background:${T.panelBg};border-color:${T.frameBorder};">
  <div style="position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:4px 0 0 4px;background:${T.accent};z-index:2;"></div>
  <div style="position:absolute;top:0;left:72px;right:40px;height:1.5px;background:linear-gradient(90deg,${T.col}44,transparent);"></div>
  <div class="hf-left" style="background:linear-gradient(180deg,${T.dim}88,rgba(0,0,0,.5));">
    <div class="hport" style="border-color:${T.col}55;" id="hPort_${heroId}">
      <div class="hport-fb" style="color:${T.col};">${T.name.slice(0,2)}</div>
    </div>
    <div class="hlvl" style="background:${T.col};">LVL 1</div>
  </div>
  <div class="hf-right">
    <div class="hn">
      <span class="hn-name" style="color:${T.col};text-shadow:0 0 8px ${T.col}66;">${T.name}</span>
      <span class="hn-role">${T.role}</span>
      <span class="hn-st st-ok" id="hStat">ACTIVE</span>
    </div>
    <div class="hrow">
      <span class="hlbl">HP</span>
      <div class="htrk htrk-hp" style="background:${T.hpTrack};">
        <div class="htrl" id="hTrl"></div>
        <div class="hbar" id="hHP" style="background:#4cdd6a;">
          <div class="htks">${ticks}</div>
        </div>
      </div>
      <span class="hnum" id="hNum">— / —</span>
    </div>
    <div class="hrow">
      <span class="hlbl" style="color:${T.col}55;">EN</span>
      <div class="htrk htrk-en" style="background:${T.enTrack};">
        <div class="enbar" id="hEN" style="background:${T.enFill};"><div class="enbar::after"></div></div>
      </div>
      <span class="hpct" id="hENP" style="color:${T.col}88;">10%</span>
    </div>
    <div class="hrow">
      <span class="hlbl" style="color:${T.col}33;">UL</span>
      <div class="htrk htrk-ul" style="background:${T.hpTrack};">
        <div class="ulbar" id="hUL" style="background:${T.ultFill};"></div>
      </div>
      <span class="hpct" id="hULP" style="color:${T.col}66;">0%</span>
    </div>
  </div>
</div>
<div class="hstars">${stars}</div>`;
}

// ── Apply portrait image ───────────────────────────────────
function applyPortrait(heroId) {
  const t     = THEMES[heroId] || THEMES.barq;
  const asset = imgs[t.portrait];
  const wrap  = document.getElementById(`hPort_${heroId}`);
  if (!wrap) return;
  if (asset && asset.complete && asset.naturalWidth) {
    wrap.style.backgroundImage    = `url(${asset.src})`;
    wrap.style.backgroundSize     = 'cover';
    wrap.style.backgroundPosition = 'top center';
    wrap.style.backgroundRepeat   = 'no-repeat';
    // Clear fallback text
    const fb = wrap.querySelector('.hport-fb');
    if (fb) fb.style.display = 'none';
  }
}

// ── Render bars every frame ───────────────────────────────
function render(hp, mhp, energy, ult) {
  const hpPct  = mhp > 0 ? hp / mhp : 0;
  const tPct   = mhp > 0 ? trailHP / mhp : 0;
  const hpCol  = hpPct > .6 ? '#4cdd6a' : hpPct > .3 ? '#e8d040' : '#e83a3a';

  const eHP  = document.getElementById('hHP');
  const eTrl = document.getElementById('hTrl');
  const eNum = document.getElementById('hNum');
  const eEN  = document.getElementById('hEN');
  const eENP = document.getElementById('hENP');
  const eUL  = document.getElementById('hUL');
  const eULP = document.getElementById('hULP');
  const eSt  = document.getElementById('hStat');

  if (!eHP) return;

  eHP.style.width      = (hpPct*100).toFixed(1)+'%';
  eHP.style.background = hpCol;
  eTrl.style.width     = (tPct*100).toFixed(1)+'%';
  eNum.textContent     = Math.ceil(hp).toLocaleString()+' / '+Math.round(mhp).toLocaleString();

  eEN.style.width  = energy.toFixed(0)+'%';
  eENP.textContent = energy.toFixed(0)+'%';
  energy >= 100 ? eEN.classList.add('enbar-full') : eEN.classList.remove('enbar-full');

  eUL.style.width  = ult.toFixed(0)+'%';
  eULP.textContent = ult >= 100 ? '★ RDY' : ult.toFixed(0)+'%';
  eULP.style.color = ult >= 100 ? '#00ffaa' : T.col+'66';
  ult >= 100 ? eUL.classList.add('ulbar-rdy') : eUL.classList.remove('ulbar-rdy');

  if (eSt) {
    if (hpPct<=0)   { eSt.textContent='KO';       eSt.className='hn-st st-ko'; }
    else if(hpPct<.3){ eSt.textContent='CRITICAL'; eSt.className='hn-st st-cr'; }
    else             { eSt.textContent='ACTIVE';   eSt.className='hn-st st-ok'; }
  }
}

// ── Tick (called every 16ms) ───────────────────────────────
function tick() {
  if (!hudReady) return;
  const G = state.G;
  if (!G || !G.hero || state.phase !== 'game') return;

  const hp     = Math.max(0, G.hero.hp);
  const mhp    = G.hero.mhp;
  const energy = Math.max(0, Math.min(100, G.hero.energy));
  const ult    = Math.max(0, Math.min(100, G.hero.ult));

  if (hp < prevHP) {
    if (trailTimer) clearTimeout(trailTimer);
    trailHP    = prevHP;
    trailTimer = setTimeout(()=>{ trailHP=hp; render(hp,mhp,energy,ult); }, 550);
  } else {
    trailHP = hp;
  }
  prevHP = hp;
  render(hp, mhp, energy, ult);
}

// ── Bootstrap ─────────────────────────────────────────────
function boot() {
  const wrap = document.getElementById('canvasWrap');
  if (!wrap) { setTimeout(boot, 200); return; }

  css();
  _el = document.createElement('div');
  _el.id = 'gHUD';
  _el.style.display = 'none';
  wrap.appendChild(_el);

  setInterval(()=>{
    const inGame = state.phase==='game' && state.G && state.G.hero;

    if (inGame) {
      const heroId = state.G.hero.id || 'barq';
      if (!hudReady || heroId !== lastHeroId) {
        _el.innerHTML = buildHTML(heroId);
        trailHP = prevHP = state.G.hero.hp;
        hudReady = true; lastHeroId = heroId;
        setTimeout(()=>applyPortrait(heroId), 150);
      }
      _el.style.display = 'block';
      tick();
    } else {
      if (_el.style.display !== 'none') {
        _el.style.display = 'none';
        hudReady = false; lastHeroId = null;
      }
    }
  }, 16);
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();
