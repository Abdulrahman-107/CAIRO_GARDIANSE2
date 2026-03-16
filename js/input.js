// ============================================================
// input.js — Keyboard and touch input
// ============================================================

export const keys = {};
export const btn  = {};

// One-shot action queue for touch (attack, special, ult)
const actionQueue = { attack: 0, special: 0, ult: 0 };

export function initInput(canvas) {
  // Keyboard
  canvas.setAttribute('tabindex', '0');
  canvas.addEventListener('click', () => canvas.focus());
  canvas.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    e.preventDefault();
  });
  canvas.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if ([' ','arrowup','arrowdown','arrowleft','arrowright']
        .includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
    // M = mute toggle (handled globally, don't block)
    if (e.key.toLowerCase() === 'm') {
      if (typeof handleMuteToggle === 'function') handleMuteToggle();
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });
}

export function bindButton(id, key, onPress) {
  const el = document.getElementById(id);
  if (!el) return;

  // Movement buttons: held state
  if (key === 'left' || key === 'right' || key === 'jump') {
    const on  = () => { btn[key] = true;  if (onPress) onPress(); };
    const off = () => { btn[key] = false; };
    el.addEventListener('mousedown',  e => { on();  e.preventDefault(); });
    el.addEventListener('mouseup',    off);
    el.addEventListener('mouseleave', off);
    el.addEventListener('touchstart', e => { on();  e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend',   e => { off(); e.preventDefault(); }, { passive: false });
  } else {
    // Action buttons: queue a one-shot press
    const actionKey = key === 'punch' ? 'attack' : key === 'special' ? 'special' : 'ult';
    const fire = (e) => {
      e.preventDefault();
      actionQueue[actionKey]++;
      if (onPress) onPress();
    };
    el.addEventListener('mousedown',  fire);
    el.addEventListener('touchstart', fire, { passive: false });
  }
}

export function isLeft()   { return keys['a'] || keys['arrowleft']  || btn.left;  }
export function isRight()  { return keys['d'] || keys['arrowright'] || btn.right; }
export function isJump()   { return keys['w'] || keys[' '] || keys['arrowup'] || btn.jump; }

export function consumeAttack() {
  if (keys['j']) { delete keys['j']; return true; }
  if (actionQueue.attack > 0) { actionQueue.attack--; return true; }
  return false;
}
export function consumeSpecial() {
  if (keys['k']) { delete keys['k']; return true; }
  if (actionQueue.special > 0) { actionQueue.special--; return true; }
  return false;
}
export function consumeUlt() {
  if (keys['l']) { delete keys['l']; return true; }
  if (actionQueue.ult > 0) { actionQueue.ult--; return true; }
  return false;
}
