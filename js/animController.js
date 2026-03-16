// ============================================================
// animController.js — Animation state machine controller
// Manages state transitions, timing, and frame calculation
// All timing is delta-time based (seconds)
// ============================================================

import { AS } from './gameState.js?v=020cd006';

// ---- TRANSITION RULES ----
// Defines which states can interrupt which
const INTERRUPT_PRIORITY = {
  death:      100,
  knockdown:  90,
  hurt:       80,
  ultimate:   70,
  special:    60,
  attack_3:   50,
  attack_2:   50,
  attack_1:   50,
  land:       20,
  jump_start: 15,
  jump_loop:  10,
  fall:       10,
  run:         5,
  idle:        0,
};

function priority(state) {
  return INTERRUPT_PRIORITY[state] ?? 0;
}

// Can newState interrupt currentState?
export function canTransition(current, next) {
  if (current === next) return false;
  if (current === AS.DEATH) return false;                     // death is final
  if (next === AS.DEATH || next === AS.KNOCKDOWN) return true; // always interruptible by damage
  if (current === AS.HURT && priority(next) < 80) return false;
  const attackStates = [AS.ATTACK_1, AS.ATTACK_2, AS.ATTACK_3, AS.SPECIAL, AS.ULTIMATE];
  if (attackStates.includes(current) && !attackStates.includes(next) &&
      next !== AS.DEATH && next !== AS.KNOCKDOWN && next !== AS.HURT) return false;
  return priority(next) >= priority(current);
}

// ---- CONTROLLER ----
export function transitionAnim(entity, newState) {
  if (!canTransition(entity.animState, newState)) return false;
  entity.animState = newState;
  entity.animTime  = 0;
  return true;
}

export function forceTransitionAnim(entity, newState) {
  entity.animState = newState;
  entity.animTime  = 0;
}

// ---- UPDATE ----
// Returns current frame column (sc + frameIndex)
export function updateAnim(entity, animDefs, dt) {
  const def = animDefs[entity.animState];
  if (!def) return 0;

  entity.animTime += dt;
  const frameDur  = 1 / def.fps;
  const totalDur  = frameDur * def.f;

  if (def.loop) {
    // Loop back
    entity.animTime %= totalDur;
  } else {
    // Clamp to last frame, then auto-transition
    if (entity.animTime >= totalDur) {
      if (def.next) {
        entity.animState = def.next;
        entity.animTime  = 0;
        return getFrameCol(animDefs[def.next], 0);
      } else {
        entity.animTime = totalDur - 0.001; // hold last frame
      }
    }
  }

  const frameIdx = Math.min(def.f - 1, Math.floor(entity.animTime / frameDur));
  return def.sc + frameIdx;
}

function getFrameCol(def, time) {
  if (!def) return 0;
  const frameDur = 1 / def.fps;
  return def.sc + Math.min(def.f - 1, Math.floor(time / frameDur));
}

// ---- ANIMATION QUERY HELPERS ----
export function animFinished(entity, animDefs) {
  const def = animDefs[entity.animState];
  if (!def || def.loop) return false;
  return entity.animTime >= (def.f / def.fps);
}

export function animProgress(entity, animDefs) {
  const def = animDefs[entity.animState];
  if (!def) return 1;
  return Math.min(1, entity.animTime / (def.f / def.fps));
}

// Is hero in an attack window where hit boxes should be active?
export function inHitWindow(hero) {
  const state  = hero.animState;
  const hw     = hero.hd.hitWindow?.[state];
  if (!hw) return false;
  const prog   = animProgress(hero, hero.hd.anims);
  return prog >= hw[0] && prog <= hw[1];
}
