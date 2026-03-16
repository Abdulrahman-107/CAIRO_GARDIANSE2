// ============================================================
// mainMenu.js — Animated main menu overlay
// ============================================================

import { imgs } from './assets.js?v=020cd006';

let _onNewGame = null;

export function buildMainMenu(onNewGame) {
  _onNewGame = onNewGame;

  const ov = document.getElementById('menuOv');
  ov.innerHTML = '';
  // Use fixed positioning to cover full viewport
  ov.style.cssText = `
    display:flex;
    position:fixed;
    inset:0;
    z-index:100;
    overflow:hidden;
    flex-direction:column;
    align-items:center;
    justify-content:center;
  `;

  // ── BACKGROUND ─────────────────────────────────────────
  const bgImg = imgs['menu_bg'];
  if (bgImg && bgImg.complete && bgImg.naturalWidth) {
    ov.style.backgroundImage  = `url(${bgImg.src})`;
    ov.style.backgroundSize   = 'cover';
    ov.style.backgroundPosition = 'center';
  } else {
    ov.style.background = '#020510';
  }

  // Dark overlay for readability
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(0,0,0,0.25) 0%,rgba(0,5,20,0.55) 60%,rgba(0,0,0,0.75) 100%);
  `;
  ov.appendChild(overlay);

  // ── CONTENT WRAPPER ────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:relative;z-index:1;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    gap:16px;
    width:100%;height:100%;padding:8px 8px 12px;
    overflow:hidden;
  `;
  ov.appendChild(wrap);

  // ── LOGO ───────────────────────────────────────────────
  const logoWrap = document.createElement('div');
  logoWrap.style.cssText = `
    display:flex;flex-direction:column;align-items:center;
    animation:logoIn 0.8s cubic-bezier(0.22,1,0.36,1) both;
  `;

  const logoImg = imgs['menu_logo'];
  if (logoImg && logoImg.complete && logoImg.naturalWidth) {
    const li = document.createElement('img');
    li.src = logoImg.src;
    li.style.cssText = `
      width:min(380px,88%);height:auto;max-height:140px;
      object-fit:contain;object-position:center;
      filter:drop-shadow(0 0 20px #00ccff99) drop-shadow(0 0 40px #0088ff55);
      display:block;
    `;
    logoWrap.appendChild(li);
  } else {
    // Fallback text logo
    const lt = document.createElement('div');
    lt.style.cssText = `
      font-family:'Courier New',monospace;font-size:22px;font-weight:900;
      color:#00ccff;letter-spacing:6px;
      text-shadow:0 0 20px #00ccff,0 0 40px #00ccff88;
    `;
    lt.innerHTML = `<div style="font-size:11px;color:#00ff88;letter-spacing:3px;">حراس القاهرة</div>GUARDIANS`;
    logoWrap.appendChild(lt);
  }
  wrap.appendChild(logoWrap);

  // ── MENU BUTTONS ───────────────────────────────────────
  const menuBox = document.createElement('div');
  menuBox.style.cssText = `
    display:flex;flex-direction:column;align-items:center;gap:4px;
    background:rgba(0,5,20,0.72);
    border:1px solid #00ccff33;
    border-radius:6px;
    padding:14px 28px;
    backdrop-filter:blur(2px);
    box-shadow:0 0 30px rgba(0,204,255,0.1), inset 0 0 20px rgba(0,0,0,0.4);
    animation:menuIn 0.6s 0.3s cubic-bezier(0.22,1,0.36,1) both;
  `;

  // Corner accents
  ['top:0;left:0;border-top:2px solid #00ccff;border-left:2px solid #00ccff;',
   'top:0;right:0;border-top:2px solid #00ccff;border-right:2px solid #00ccff;',
   'bottom:0;left:0;border-bottom:2px solid #00ccff;border-left:2px solid #00ccff;',
   'bottom:0;right:0;border-bottom:2px solid #00ccff;border-right:2px solid #00ccff;',
  ].forEach(css => {
    const c = document.createElement('div');
    c.style.cssText = `position:absolute;${css}width:12px;height:12px;pointer-events:none;`;
    menuBox.style.position = 'relative';
    menuBox.appendChild(c);
  });

  const items = [
    { label: 'NEW GAME', key: 'new',      action: () => startNewGame()       },
    { label: 'CONTINUE', key: 'continue', action: () => tryContinue()        },
    { label: 'OPTIONS',  key: 'options',  action: () => showOptions(menuBox) },
    { label: 'CREDITS',  key: 'credits',  action: () => showCredits(menuBox) },
  ];

  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width:180px;padding:7px 0;
      background:transparent;
      color:#88bbcc;
      border:none;border-radius:0;
      font-family:'Courier New',monospace;
      font-size:11px;font-weight:700;letter-spacing:3px;
      cursor:pointer;text-align:center;
      transition:color 0.12s,text-shadow 0.12s,letter-spacing 0.12s;
      animation:btnIn 0.4s ${0.4 + i*0.08}s both;
      position:relative;
    `;
    btn.textContent = `[ ${item.label} ]`;

    btn.onmouseenter = () => {
      btn.style.color         = '#00ffcc';
      btn.style.textShadow    = '0 0 12px #00ffcc, 0 0 24px #00ffcc88';
      btn.style.letterSpacing = '5px';
    };
    btn.onmouseleave = () => {
      btn.style.color         = '#88bbcc';
      btn.style.textShadow    = 'none';
      btn.style.letterSpacing = '3px';
    };
    btn.onclick = item.action;
    menuBox.appendChild(btn);

    // Divider (except last)
    if (i < items.length - 1) {
      const div = document.createElement('div');
      div.style.cssText = `width:120px;height:1px;background:linear-gradient(90deg,transparent,#00ccff22,transparent);margin:1px 0;`;
      menuBox.appendChild(div);
    }
  });

  wrap.appendChild(menuBox);

  // ── BOTTOM TAGLINE ─────────────────────────────────────
  const tag = document.createElement('div');
  tag.style.cssText = `
    color:rgba(0,204,255,0.35);font-family:'Courier New',monospace;
    font-size:7px;letter-spacing:2px;text-align:center;
    animation:btnIn 0.4s 0.9s both;
  `;
  tag.textContent = 'CAIRO 2042 · DEFEND THE NILE';
  wrap.appendChild(tag);

  // ── ANIMATIONS ─────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @keyframes logoIn {
      from { opacity:0; transform:translateY(-20px) scale(0.92); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes menuIn {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes btnIn {
      from { opacity:0; transform:translateX(-8px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(200%); }
    }
  `;
  ov.appendChild(style);

  // Scanline effect
  const scan = document.createElement('div');
  scan.style.cssText = `
    position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;
  `;
  const scanBeam = document.createElement('div');
  scanBeam.style.cssText = `
    position:absolute;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(0,255,180,0.08),transparent);
    animation:scanline 4s linear infinite;
  `;
  scan.appendChild(scanBeam);
  ov.appendChild(scan);
}

// ── ACTIONS ────────────────────────────────────────────────

function startNewGame() {
  const ov = document.getElementById('menuOv');
  ov.style.transition = 'opacity 0.4s';
  ov.style.opacity = '0';
  setTimeout(() => {
    ov.style.display = 'none';
    ov.style.opacity = '1';
    ov.style.transition = '';
    if (_onNewGame) _onNewGame();
  }, 400);
}

function tryContinue() {
  try {
    const saved = localStorage.getItem('cog_save');
    if (saved) {
      startNewGame(); // for now, continue = new game (save system future feature)
    } else {
      flashMessage('NO SAVE DATA FOUND');
    }
  } catch(e) {
    flashMessage('NO SAVE DATA FOUND');
  }
}

function showOptions(container) {
  const existing = document.getElementById('submenuPanel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'submenuPanel';
  panel.style.cssText = `
    position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
    background:rgba(0,5,20,0.96);border:1px solid #00ccff44;
    border-radius:6px;padding:16px 24px;z-index:10;
    font-family:'Courier New',monospace;color:#88bbcc;
    min-width:200px;text-align:center;
  `;

  const closeBtn = makeCloseBtn(() => panel.remove());
  panel.appendChild(closeBtn);

  panel.innerHTML += `
    <div style="color:#00ccff;font-size:10px;font-weight:900;letter-spacing:3px;margin-bottom:12px;">OPTIONS</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
      <span style="font-size:8px;letter-spacing:1px;">SOUND</span>
      <button onclick="handleMuteToggle();this.textContent=window._muted?'OFF':'ON'"
        style="background:#001a22;color:#00ccff;border:1px solid #00ccff44;padding:3px 14px;
        font-family:inherit;font-size:8px;cursor:pointer;border-radius:2px;">ON</button>
    </div>
    <div style="font-size:7px;color:#334455;letter-spacing:1px;margin-top:8px;">v1.0 · CAIRO 2042</div>
  `;
  panel.appendChild(makeCloseBtn(() => panel.remove()));
  document.getElementById('menuOv').appendChild(panel);
}

function showCredits(container) {
  const existing = document.getElementById('submenuPanel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'submenuPanel';
  panel.style.cssText = `
    position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
    background:rgba(0,5,20,0.96);border:1px solid #00ccff44;
    border-radius:6px;padding:16px 24px;z-index:10;
    font-family:'Courier New',monospace;color:#88bbcc;
    min-width:220px;text-align:center;
    line-height:1.8;
  `;
  panel.innerHTML = `
    <div style="color:#00ccff;font-size:10px;font-weight:900;letter-spacing:3px;margin-bottom:10px;">CREDITS</div>
    <div style="font-size:8px;letter-spacing:1px;">
      <div style="color:#ffd700;margin-bottom:4px;">GUARDIANS OF CAIRO</div>
      <div style="color:#00ff88;">حراس القاهرة</div>
      <div style="margin-top:8px;color:#445566;">GAME DESIGN & ART</div>
      <div>Cairo Studios</div>
      <div style="margin-top:6px;color:#445566;">ENGINE</div>
      <div>Custom JS · WebAudio</div>
      <div style="margin-top:10px;color:#334455;font-size:7px;">CAIRO 2042 — DEFEND THE NILE</div>
    </div>
  `;
  const closeBtn = makeCloseBtn(() => panel.remove());
  closeBtn.style.marginTop = '12px';
  panel.appendChild(closeBtn);
  document.getElementById('menuOv').appendChild(panel);
}

function makeCloseBtn(fn) {
  const btn = document.createElement('button');
  btn.textContent = '[ CLOSE ]';
  btn.style.cssText = `
    display:block;margin:10px auto 0;
    background:transparent;color:#445566;border:1px solid #223344;
    padding:4px 16px;font-family:'Courier New',monospace;font-size:8px;
    letter-spacing:2px;cursor:pointer;border-radius:2px;
  `;
  btn.onmouseenter = () => { btn.style.color='#00ccff'; btn.style.borderColor='#00ccff44'; };
  btn.onmouseleave = () => { btn.style.color='#445566'; btn.style.borderColor='#223344'; };
  btn.onclick = fn;
  return btn;
}

function flashMessage(msg) {
  const el = document.getElementById('msg');
  if (el) { el.textContent = msg; setTimeout(() => { el.textContent = ''; }, 2000); }
}
