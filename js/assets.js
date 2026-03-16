// ============================================================
// assets.js — Central asset manifest
// ============================================================

export const ASSET_PATHS = {
  // ---- HEROES ----
  solarius:       'assets/heroes/solarius/sheet.webp',
  elwahm:         'assets/heroes/elwahm/sheet.webp',
  barq:           'assets/heroes/barq/sheet.webp',
  amunx7:         'assets/heroes/amunx7/sheet.webp',
  new_h1:         'assets/heroes/shield_guardian/sheet.webp',
  new_h2:         'assets/heroes/stormrunner/sheet.webp',
  new_h3:         'assets/heroes/agent_zero/sheet.webp',
  new_h4:         'assets/heroes/solaris_nova/sheet.webp',

  // ---- SOLARIUS sprites ----
  solarius_run:   'assets/heroes/solarius/run.png',
  solarius_fight: 'assets/heroes/solarius/fight.png',
  solarius_super: 'assets/heroes/solarius/super.png',
  solarius_card:  'assets/heroes/solarius/card.png',
  solarius_pose:  'assets/heroes/solarius/pose.png',
  solarius_ult:   'assets/heroes/solarius/ult.png',
  solarius_sfx:   'assets/heroes/solarius/solar_fx.png',

  elwahm_card:    'assets/heroes/elwahm/card.png',
  elwahm_run:     'assets/heroes/elwahm/run.png',
  elwahm_run2:    'assets/heroes/elwahm/run_shield.png',
  elwahm_fight:   'assets/heroes/elwahm/fight.png',
  elwahm_ult:     'assets/heroes/elwahm/ult.png',
  elwahm_drones:  'assets/heroes/elwahm/drones.png',
  elwahm_pose:    'assets/heroes/elwahm/pose.png',
  amunx7_card:    'assets/heroes/amunx7/card.png',
  amunx7_pose:    'assets/heroes/amunx7/pose.png',

  // ---- ENEMIES & BOSS ----
  drone_anim:           'assets/enemies/drone_anim_sheet.png',
  alien_combat:         'assets/enemies/alien_combat.png',
  alien_run:            'assets/enemies/alien_run.png',
  drone_combat:         'assets/enemies/drone_combat_sheet.png',
  tacter_run:           'assets/boss/boss_tacter_run.png',
  tacter_combat:        'assets/boss/boss_tacter_combat.png',
  // ---- BOSS TACTER (Level 1 boss) ----

  // ---- BARQ extra sprites ----
  barq_idle:      'assets/heroes/barq/idle.png',
  barq_card:      'assets/heroes/barq/card.png',
  barq_pose:      'assets/heroes/barq/pose.png',
  barq_portrait:     'assets/heroes/barq/portrait.png',
  solarius_portrait: 'assets/heroes/solarius/portrait.png',
  elwahm_portrait:   'assets/heroes/elwahm/portrait.png',
  amunx7_portrait:   'assets/heroes/amunx7/portrait.png',
  barq_run:       'assets/heroes/barq/run.webp',
  barq_run2:      'assets/heroes/barq/run_new.png',
  barq_jump:      'assets/heroes/barq/jump.png',
  barq_death:     'assets/heroes/barq/death.png',
  barq_fight:     'assets/heroes/barq/fight.webp',
  barq_tornado:   'assets/heroes/barq/tornado.webp',

  // ---- MAIN MENU ----
  menu_bg:        'assets/ui/menu_bg.png',
  menu_logo:      'assets/ui/menu_logo.png',

  // ---- UI ----
  hp_icon:        'assets/ui/hp_icon.webp',
  hp_bar_empty:   'assets/ui/hp_bar_empty.webp',
  hp_fill:        'assets/ui/hp_fill.webp',
  en_icon:        'assets/ui/en_icon.webp',
  en_bar_empty:   'assets/ui/en_bar_empty.webp',
  en_fill:        'assets/ui/en_fill.webp',
  sel_bg:         'assets/ui/select_bg.webp',
  sel_header:     'assets/ui/select_header.webp',
  sel_card:       'assets/ui/select_card.webp',
  sel_confirm:    'assets/ui/select_confirm.webp',

  // ---- FULL BACKGROUNDS ----
  bg_full:        'assets/backgrounds/cairo_street.png',
  level1_bg:      'assets/backgrounds/cairo_street.png',
  level2_bg:      'assets/backgrounds/level2_desert.png',
  level3_bg:      'assets/backgrounds/level3_metro.png',
  level4_bg:      'assets/backgrounds/level4_factory.png',
  level5_bg:      'assets/backgrounds/level5_bridge.png',
  level6_bg:      'assets/backgrounds/level6_mothership.png',
  // ---- LEVEL 2 ENEMIES & BOSS ----
  l2_alien_run:     'assets/enemies/level2/alien_run.png',
  l2_alien_fight:   'assets/enemies/level2/alien_fight.png',
  l2_boss_idle_run: 'assets/enemies/level2/boss_idle_run.png',
  l2_boss_fight:    'assets/enemies/level2/boss_fight.png',
  l2_boss_dash:     'assets/enemies/level2/boss_dash.png',
  l2_boss_laser:    'assets/enemies/level2/boss_laser.png',
};

// Loaded Image objects — populated by loadAllAssets()
export const imgs = {};

export function loadAllAssets(onProgress, onComplete) {
  const keys  = Object.keys(ASSET_PATHS);
  let loaded  = 0;
  const total = keys.length;

  keys.forEach(key => {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded++;
      if (onProgress) onProgress(loaded, total);
      if (loaded === total) onComplete();
    };
    img.src = ASSET_PATHS[key];
    imgs[key] = img;
  });

  return total;
}
