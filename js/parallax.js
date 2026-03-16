// ============================================================
// parallax.js — Multi-layer parallax background renderer
// Each level's layers are sliced from the parallax sheet image.
// Layers are ordered back→front (layer1 = sky/far, lastLayer = foreground).
// speed=0 fixed, speed=1 scrolls at full camera speed.
// ============================================================

import { imgs }           from './assets.js?v=020cd006';
import { W, H, GROUND }   from './gameState.js?v=020cd006';

let ctx = null;
export function initParallax(canvasCtx) { ctx = canvasCtx; }

// ---- PARALLAX DEFINITIONS PER LEVEL ----
// Each layer: { key, speed, y, h, repeat }
//   key    — asset key in imgs[]
//   speed  — parallax fraction (0=static, 1=full camera speed)
//   y      — canvas Y for top of this layer
//   h      — draw height in canvas px (null = fill to GROUND)
//   repeat — tile horizontally

const G = GROUND;  // shorthand

export const PARALLAX_DEFS = {

  // ── LEVEL 1 — Cairo Streets ────────────────────────────
  // Sheet: 1200x420, 4 equal strips of 105px each
  // Strip 1: sky + UFOs  |  Strip 2: city silhouette
  // Strip 3: midground buildings  |  Strip 4: foreground street
  1: [
    { key: 'l1_p1', speed: 0.00, y: 0,           h: G * 0.42, repeat: true  },  // sky + UFOs
    { key: 'l1_p2', speed: 0.06, y: G * 0.08,    h: G * 0.46, repeat: true  },  // city silhouette
    { key: 'l1_p3', speed: 0.18, y: G * 0.20,    h: G * 0.65, repeat: true  },  // buildings
    { key: 'l1_p4', speed: 0.70, y: G * 0.55,    h: H - G * 0.55, repeat: true },// foreground street
  ],

  // ── LEVEL 2 — Desert Highway ───────────────────────────
  // Sheet: 1024x682, 4 strips of 170px each
  // Strip 1: sunset sky  |  Strip 2: pyramids + city silhouette
  // Strip 3: props/vehicles mid  |  Strip 4: cracked road ground
  2: [
    { key: 'l2_p1', speed: 0.00, y: 0,           h: G * 0.40, repeat: true  },  // sunset sky
    { key: 'l2_p2', speed: 0.05, y: G * 0.10,    h: G * 0.55, repeat: true  },  // pyramids silhouette
    { key: 'l2_p3', speed: 0.22, y: G * 0.30,    h: G * 0.60, repeat: true  },  // mid props
    { key: 'l2_p4', speed: 0.72, y: G * 0.60,    h: H - G * 0.60, repeat: true },// road ground
  ],

  // ── LEVEL 3 — Cairo Metro ──────────────────────────────
  // Sheet: 1024x682, 4 strips of 170px each
  // Strip 1: ceiling/deep bg  |  Strip 2: track & train
  // Strip 3: main platform  |  Strip 4: foreground floor debris
  3: [
    { key: 'l3_p1', speed: 0.00, y: 0,           h: G * 0.38, repeat: true  },  // dark ceiling
    { key: 'l3_p2', speed: 0.10, y: G * 0.12,    h: G * 0.55, repeat: true  },  // track + train
    { key: 'l3_p3', speed: 0.35, y: G * 0.35,    h: G * 0.60, repeat: true  },  // platform
    { key: 'l3_p4', speed: 0.80, y: G * 0.65,    h: H - G * 0.65, repeat: true },// foreground floor
  ],

  // ── LEVEL 4 — Alien Factory ────────────────────────────
  // Sheet: 1024x682, 3 strips of ~227px each
  // Strip 1: deep background (neon far ceiling)
  // Strip 2: structural background (machines, portals)
  // Strip 3: foreground ground
  4: [
    { key: 'l4_p1', speed: 0.00, y: 0,           h: G * 0.45, repeat: true  },  // deep bg
    { key: 'l4_p2', speed: 0.12, y: G * 0.10,    h: G * 0.75, repeat: true  },  // structural
    { key: 'l4_p3', speed: 0.80, y: G * 0.62,    h: H - G * 0.62, repeat: true },// foreground
  ],

  // ── LEVEL 5 — Nile Bridge ──────────────────────────────
  // Sheet: 687x1024 (portrait!), 6 strips of 170px each
  // Strip 1: extreme fg props (barrels, cones)
  // Strip 2: battlefield vehicles & barriers
  // Strip 3: near bridge structures
  // Strip 4: main arch & anchorages
  // Strip 5: ancient & modern skyline
  // Strip 6: sky + UFOs + atmosphere
  5: [
    { key: 'l5_p6', speed: 0.00, y: 0,           h: G * 0.42, repeat: true  },  // sky + UFOs
    { key: 'l5_p5', speed: 0.05, y: G * 0.05,    h: G * 0.55, repeat: true  },  // city skyline
    { key: 'l5_p4', speed: 0.12, y: G * 0.08,    h: G * 0.72, repeat: false },  // main arch
    { key: 'l5_p3', speed: 0.25, y: G * 0.15,    h: G * 0.70, repeat: true  },  // bridge structures
    { key: 'l5_p2', speed: 0.55, y: G * 0.40,    h: G * 0.55, repeat: true  },  // vehicles & barriers
    { key: 'l5_p1', speed: 0.90, y: G * 0.65,    h: H - G * 0.65, repeat: true },// extreme fg
  ],

  // ── LEVEL 6 — Alien Mothership ─────────────────────────
  // Sheet: 1024x682, 6 strips of ~113px each
  // Strip 1: ext far background / walls
  // Strip 2: far background / distant pipes & cables
  // Strip 3: mid-background / main arches & stairs
  // Strip 4: midground / isolated props
  // Strip 5: main raised platform & lower floor
  // Strip 6: foreground debris & near effects
  6: [
    { key: 'l6_p1', speed: 0.00, y: 0,           h: G * 0.35, repeat: true  },  // far walls
    { key: 'l6_p2', speed: 0.04, y: G * 0.05,    h: G * 0.50, repeat: true  },  // distant pipes
    { key: 'l6_p3', speed: 0.10, y: G * 0.12,    h: G * 0.65, repeat: true  },  // main arches
    { key: 'l6_p4', speed: 0.22, y: G * 0.28,    h: G * 0.62, repeat: true  },  // midground props
    { key: 'l6_p5', speed: 0.50, y: G * 0.45,    h: G * 0.55, repeat: true  },  // raised platform
    { key: 'l6_p6', speed: 0.90, y: G * 0.65,    h: H - G * 0.65, repeat: true },// foreground
  ],
};

// ---- DRAW ----
export function drawParallaxBg(camX, levelNum) {
  // Parallax disabled — using full background images only
  return false;
  const layers = PARALLAX_DEFS[levelNum];
  if (!layers || !ctx) return false;

  let anyDrawn = false;

  layers.forEach(layer => {
    const img = imgs[layer.key];
    if (!img || !img.complete || !img.naturalWidth) return;

    const srcW  = img.naturalWidth;
    const srcH  = img.naturalHeight;
    const dH    = layer.h ?? (G - layer.y);
    const scale = dH / srcH;
    const dW    = srcW * scale;

    ctx.save();
    if (layer.opacity != null) ctx.globalAlpha = layer.opacity;

    const scrollX = camX * layer.speed;

    if (layer.repeat) {
      const ox = ((scrollX % dW) + dW) % dW;
      let x = -ox;
      while (x < W) {
        ctx.drawImage(img, x, layer.y, dW, dH);
        x += dW;
      }
    } else {
      // Single non-repeating image (e.g. bridge arch) — drift slowly
      const x = -scrollX * 0.08;
      ctx.drawImage(img, x, layer.y, dW, dH);
      // Draw a second copy in case of wide screens
      if (x + dW < W) ctx.drawImage(img, x + dW, layer.y, dW, dH);
    }

    ctx.restore();
    anyDrawn = true;
  });

  return anyDrawn;
}
