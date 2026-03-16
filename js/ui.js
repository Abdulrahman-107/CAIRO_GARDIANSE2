// ============================================================
// ui.js — Hero Select — Full-screen responsive
// ============================================================
import { imgs }   from './assets.js?v=020cd006';
import { HEROES } from './heroes.js?v=020cd006';
import { state }  from './gameState.js?v=020cd006';

const HERO_META = {
  barq:     { poseKey:'barq_pose',     col:'#00d4ff', acc:'#00ffee', role:'SPEEDSTER',
               stats:{ATK:75,DEF:55,SPD:98,SKL:80},
               abilities:['TACHYON DASH','THUNDER ARC','LIGHTNING ULT'],
               bg:'linear-gradient(170deg,#00070f 0%,#001e36 50%,#000d1a 100%)' },
  solarius: { poseKey:'solarius_pose', col:'#ff8c00', acc:'#ffcc44', role:'SOLAR MAGE',
               stats:{ATK:92,DEF:50,SPD:65,SKL:95},
               abilities:['SOLAR FLARE','NOVA BLAST','SOLAR NOVA ULT'],
               bg:'linear-gradient(170deg,#0f0400 0%,#3d1200 50%,#0a0300 100%)' },
  elwahm:   { poseKey:'elwahm_pose',  col:'#ffd700', acc:'#fff088', role:'DEFENDER',
               stats:{ATK:65,DEF:98,SPD:50,SKL:72},
               abilities:['DIVINE SHIELD','AEGIS SLAM','IMPERVIOUS ULT'],
               bg:'linear-gradient(170deg,#0a0800 0%,#2e2000 50%,#0a0800 100%)' },
  amunx7:   { poseKey:'amunx7_pose',  col:'#ff6600', acc:'#ff9944', role:'ASSASSIN',
               stats:{ATK:95,DEF:40,SPD:88,SKL:90},
               abilities:['GHOST STRIKE','CYBER FIST','ANNIHILATE ULT'],
               bg:'linear-gradient(170deg,#0f0500 0%,#2d1000 50%,#0a0400 100%)' },
};

function getMeta(hero) {
  return HERO_META[hero.id] || {
    poseKey: hero.id+'_pose', col: hero.col||'#00ccff',
    acc: hero.acc||'#88ffff', role: hero.power||'GUARDIAN',
    stats:{ATK:70,DEF:70,SPD:70,SKL:70}, abilities:[],
    bg:'linear-gradient(170deg,#060810,#0e1825)'
  };
}

export function buildSelectScreen(onStart) {
  const ov = document.getElementById('selOv');
  ov.innerHTML = '';
  ov.style.cssText = `
    position:fixed; inset:0; z-index:100;
    display:flex; flex-direction:column;
    background:#020408; overflow:hidden;
    font-family:'Courier New',monospace;
  `;

  state.selHero  = 0;
  let selIdx     = 0;
  let startLevel = 1;

  // ── HEADER ────────────────────────────────────────────────
  const hdr = el('div', `
    flex:0 0 auto;
    display:flex; align-items:center; justify-content:center; gap:10px;
    padding:clamp(6px,1.5vh,12px) 20px;
    border-bottom:1px solid #0d1a28;
    background:linear-gradient(180deg,#030610,#020408);
  `);
  hdr.innerHTML = `
    <span style="color:#ffd700;font-size:clamp(9px,2.5vw,16px);letter-spacing:1px;">⚡</span>
    <span style="color:#ffd700;font-size:clamp(10px,3vw,18px);font-weight:900;letter-spacing:clamp(3px,1vw,8px);
                 text-shadow:0 0 20px #ffd70066;">SELECT YOUR GUARDIAN</span>
    <span style="color:#ffd700;font-size:clamp(9px,2.5vw,16px);letter-spacing:1px;">⚡</span>
  `;
  ov.appendChild(hdr);

  // ── CARDS ROW ─────────────────────────────────────────────
  const cardsRow = el('div', `
    flex:1 1 auto; min-height:0;
    display:flex; gap:clamp(4px,1vw,10px);
    padding:clamp(6px,1.5vw,12px);
  `);
  ov.appendChild(cardsRow);

  // ── BOTTOM PANEL ──────────────────────────────────────────
  const btm = el('div', `
    flex:0 0 auto;
    display:flex; flex-wrap:wrap; gap:10px;
    padding:clamp(6px,1.5vh,10px) clamp(8px,2vw,16px);
    border-top:1px solid #0d1a28;
    background:linear-gradient(0deg,#030610,#020408);
    align-items:center;
  `);
  ov.appendChild(btm);

  // Left: hero info
  const infoBox = el('div', `flex:1 1 200px; min-width:0;`);
  btm.appendChild(infoBox);

  // Center: stage select
  const stageBox = el('div', `flex:0 0 auto; display:flex; flex-direction:column; gap:4px; align-items:center;`);
  const stageLabel = el('div',`color:#334455;font-size:clamp(7px,1.2vw,9px);letter-spacing:2px;`);
  stageLabel.textContent = 'STAGE:';
  stageBox.appendChild(stageLabel);
  const stageBtns = el('div',`display:flex;gap:4px;flex-wrap:wrap;justify-content:center;`);
  stageBox.appendChild(stageBtns);
  btm.appendChild(stageBox);

  const lvlNames = ['L1 CAIRO','L2 DESERT','L3 METRO','L4 FACTORY','L5 BRIDGE','L6 MOTHERSHIP'];
  lvlNames.forEach((name,i)=>{
    const b = el('button',`
      background:${i===0?'#001828':'transparent'};
      color:${i===0?'#00ccff':'#334455'};
      border:1px solid ${i===0?'#00ccff44':'#0d1a22'};
      padding:clamp(3px,.8vh,5px) clamp(6px,1.2vw,10px);
      font-family:inherit; font-size:clamp(7px,1.2vw,9px);
      letter-spacing:1px; cursor:pointer; border-radius:3px;
      white-space:nowrap; transition:all .1s;
    `);
    b.textContent = name;
    b.onclick = ()=>{
      startLevel = i+1;
      stageBtns.querySelectorAll('button').forEach((btn,j)=>{
        btn.style.background   = j===i?'#001828':'transparent';
        btn.style.color        = j===i?'#00ccff':'#334455';
        btn.style.borderColor  = j===i?'#00ccff44':'#0d1a22';
      });
    };
    stageBtns.appendChild(b);
  });

  // Right: deploy
  const deployWrap = el('div',`flex:0 0 auto;`);
  const deployBtn = el('button',`
    background:linear-gradient(135deg,#001828,#002a40);
    color:#00ccff; border:1px solid #00ccff66;
    border-radius:6px;
    padding:clamp(8px,2vh,14px) clamp(20px,4vw,48px);
    font-family:inherit; font-size:clamp(11px,2.5vw,16px);
    font-weight:900; letter-spacing:clamp(2px,1vw,6px);
    cursor:pointer;
    box-shadow:0 0 20px #00ccff22, inset 0 0 20px #00ccff08;
    transition:all .12s; white-space:nowrap;
  `);
  deployBtn.textContent = '▶  DEPLOY';
  deployBtn.onmouseover = ()=>{ deployBtn.style.boxShadow='0 0 36px #00ccff55'; deployBtn.style.background='linear-gradient(135deg,#002030,#003a55)'; };
  deployBtn.onmouseout  = ()=>{ deployBtn.style.boxShadow='0 0 20px #00ccff22'; deployBtn.style.background='linear-gradient(135deg,#001828,#002a40)'; };
  deployBtn.onclick = ()=> onStart(selIdx, startLevel);
  deployWrap.appendChild(deployBtn);
  btm.appendChild(deployWrap);

  // ── BUILD CARDS ───────────────────────────────────────────
  const cardEls = [];

  HEROES.forEach((hero, i)=>{
    const meta = getMeta(hero);
    const isSel = i===selIdx;

    const card = el('div',`
      flex:1; min-width:0; position:relative;
      border-radius:clamp(6px,1.5vw,12px); overflow:hidden;
      border:2px solid ${isSel ? meta.col : '#0d1a26'};
      box-shadow:${isSel ? `0 0 28px ${meta.col}55,inset 0 0 30px ${meta.col}0a` : 'none'};
      background:${meta.bg};
      cursor:pointer;
      display:flex; flex-direction:column;
      transition:border-color .15s,box-shadow .15s;
    `);

    // Scanlines
    const scan = el('div',`position:absolute;inset:0;pointer-events:none;z-index:3;
      background:repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 1px,transparent 3px);`);
    card.appendChild(scan);

    // Name strip (top)
    const nameStrip = el('div',`
      padding:clamp(5px,1.2vh,8px) clamp(8px,1.5vw,12px);
      border-bottom:1px solid ${meta.col}22; z-index:2; position:relative;
      background:rgba(0,0,0,.4);
    `);
    nameStrip.innerHTML = `
      <div style="color:${meta.col};font-size:clamp(9px,2vw,14px);font-weight:900;
                  letter-spacing:2px;text-shadow:0 0 10px ${meta.col}88;">${hero.name}</div>
      <div style="color:${meta.acc}77;font-size:clamp(6px,1.2vw,9px);letter-spacing:3px;">${meta.role}</div>
    `;
    card.appendChild(nameStrip);

    // Pose area
    const poseArea = el('div',`
      flex:1; min-height:0; position:relative;
      display:flex; align-items:flex-end; justify-content:center;
      overflow:hidden;
    `);

    // Floor glow
    const floorGlow = el('div',`
      position:absolute; bottom:0; left:0; right:0; height:50%; pointer-events:none;
      background:radial-gradient(ellipse at 50% 110%, ${meta.col}18 0%, transparent 70%);
    `);
    poseArea.appendChild(floorGlow);

    // Side glows
    const sideGlow = el('div',`
      position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(ellipse at 50% 40%, ${meta.col}0a 0%, transparent 65%);
    `);
    poseArea.appendChild(sideGlow);

    // Hero image
    const img = document.createElement('img');
    const poseAsset = imgs[meta.poseKey];
    const cardAsset = imgs[hero.id+'_card'];
    if (poseAsset?.complete && poseAsset.naturalWidth) {
      img.src = poseAsset.src;
    } else if (cardAsset?.complete && cardAsset.naturalWidth) {
      img.src = cardAsset.src;
    }
    img.style.cssText = `
      width:100%; height:100%;
      object-fit:cover; object-position:top center;
      position:absolute; top:0; left:0;
      z-index:2;
      filter:drop-shadow(0 0 10px ${meta.col}66) drop-shadow(0 4px 20px ${meta.col}33);
      transform:${isSel?'scale(1.04)':'scale(1)'};
      transition:transform .2s, filter .2s;
    `;
    poseArea.appendChild(img);
    card.appendChild(poseArea);

    // Selection bar (bottom)
    const selBar = el('div',`
      height:3px;
      background:${isSel?meta.col:'transparent'};
      box-shadow:${isSel?`0 0 10px ${meta.col}`:'none'};
      transition:background .15s,box-shadow .15s;
    `);
    card.appendChild(selBar);

    card.onclick    = ()=>{ selIdx = i; state.selHero = i; updateAll(); };
    card.ondblclick = ()=>{ selIdx = i; state.selHero = i; onStart(selIdx, startLevel); };

    cardEls.push({ card, img, nameStrip, selBar, meta });
    cardsRow.appendChild(card);
  });

  // ── UPDATE ────────────────────────────────────────────────
  function updateAll() {
    cardEls.forEach(({ card, img, selBar, meta }, i)=>{
      const s = i===selIdx;
      card.style.borderColor = s ? meta.col : '#0d1a26';
      card.style.boxShadow   = s ? `0 0 28px ${meta.col}55,inset 0 0 30px ${meta.col}0a` : 'none';
      img.style.transform    = s ? 'scale(1.04)' : 'scale(1)';
      img.style.filter       = `drop-shadow(0 0 ${s?'14px':'8px'} ${meta.col}${s?'99':'55'}) drop-shadow(0 4px 20px ${meta.col}33)`;
      selBar.style.background = s ? meta.col : 'transparent';
      selBar.style.boxShadow  = s ? `0 0 10px ${meta.col}` : 'none';
    });

    const hero = HEROES[selIdx];
    const meta = getMeta(hero);
    const s = meta.stats;

    infoBox.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
        <span style="color:${meta.col};font-size:clamp(11px,2.5vw,16px);font-weight:900;letter-spacing:2px;
                     text-shadow:0 0 10px ${meta.col}88;">${hero.name}</span>
        <span style="color:${meta.acc}66;font-size:clamp(7px,1.2vw,9px);letter-spacing:2px;">${meta.role}</span>
      </div>
      <div style="color:#445566;font-size:clamp(7px,1.2vw,9px);margin-bottom:6px;line-height:1.5;">${hero.lore||''}</div>
      <div style="display:flex;gap:clamp(6px,1.5vw,12px);align-items:center;flex-wrap:wrap;">
        ${Object.entries(s).map(([k,v])=>`
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:#334455;font-size:clamp(6px,1.1vw,8px);width:20px;">${k}</span>
            <div style="width:clamp(36px,8vw,70px);height:4px;background:#0a1218;border-radius:2px;overflow:hidden;">
              <div style="width:${v}%;height:100%;background:${meta.col};border-radius:2px;"></div>
            </div>
            <span style="color:${meta.col};font-size:clamp(6px,1.1vw,8px);">${v}</span>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap;">
        ${(meta.abilities||[]).map((a,i)=>`
          <span style="background:${meta.col}11;border:1px solid ${meta.col}33;
                       color:${i===2?meta.col:'#445566'};
                       font-size:clamp(6px,1.1vw,8px);letter-spacing:1px;
                       padding:2px 6px;border-radius:3px;">${i===2?'★ ':i===1?'◆ ':'▸ '}${a}</span>`).join('')}
      </div>
    `;
  }

  updateAll();
}

// Helper
function el(tag, cssText) {
  const e = document.createElement(tag);
  if (cssText) e.style.cssText = cssText.replace(/\s+/g,' ').trim();
  return e;
}
