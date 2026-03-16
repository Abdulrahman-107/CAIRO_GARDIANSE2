export const LEVELS = [
  {
    id:1, name:'CAIRO STREETS', groundY:278, subtitle:'They have arrived...',
    bg:'level1_bg', groundLineColor:'rgba(60,40,20,0.8)', ambientTint:null,
    waves:[
      {count:5,  mix:['melee','melee','ranged','melee','melee']},
      {count:7,  mix:['melee','ranged','melee','heavy','melee','ranged','melee']},
      {count:9,  mix:['heavy','melee','ranged','melee','drone','melee','ranged','heavy','melee']},
    ],
    boss:{name:'BOSS TACTER',hp:900,spd:100,dmg:13,col:'#cc2200',acc:'#ff4422',laserBurst:2,laserInterval:5.5,phase2msg:'BOSS TACTER — PHASE 2: CATACLYSM MODE!'},
    hazard:{type:'falling_rocks',interval:5,dmg:8}, reward:{hp:30,energy:30}, scoreBase:100,
  },
  {
    id:2, name:'DESERT HIGHWAY', groundY:270, subtitle:'The outskirts burn...',
    bg:'level2_bg', groundLineColor:'#c87030', ambientTint:'rgba(180,80,20,0.08)',
    waves:[
      {count:6,  mix:['melee','melee','ranged','melee','heavy','melee']},
      {count:8,  mix:['heavy','melee','ranged','drone','melee','ranged','heavy','melee']},
      {count:10, mix:['drone','melee','ranged','heavy','melee','drone','ranged','melee','heavy','exploder']},
    ],
    boss:{name:'WAR MACHINE MK-I',hp:900,spd:90,dmg:14,col:'#ff8800',acc:'#ffcc44',laserBurst:3,laserInterval:5,phase2msg:'WAR MACHINE OVERHEATING!'},
    hazard:{type:'falling_rocks',interval:4,dmg:8}, reward:{hp:40,energy:40}, scoreBase:120,
  },
  {
    id:3, name:'CAIRO METRO', groundY:272, subtitle:'Underground terror...',
    bg:'level3_bg', groundLineColor:'#f5c842', ambientTint:'rgba(0,100,140,0.08)',
    waves:[
      {count:7,  mix:['melee','ranged','melee','drone','heavy','melee','ranged']},
      {count:9,  mix:['heavy','drone','ranged','melee','exploder','drone','heavy','melee','ranged']},
      {count:11, mix:['drone','heavy','exploder','ranged','melee','drone','heavy','exploder','ranged','melee','drone']},
    ],
    boss:{name:'CYBORG COMMANDER',hp:1000,spd:120,dmg:15,col:'#00ccff',acc:'#88eeff',laserBurst:2,laserInterval:4.5,summonsDrones:true,phase2msg:'OVERDRIVE PROTOCOL!'},
    hazard:{type:'electric_rail',interval:3.5,dmg:12}, reward:{hp:45,energy:50}, scoreBase:150,
  },
  {
    id:4, name:'ALIEN FACTORY', groundY:268, subtitle:'They are building something...',
    bg:'level4_bg', groundLineColor:'#ff6600', ambientTint:'rgba(120,0,200,0.08)',
    waves:[
      {count:8,  mix:['heavy','drone','ranged','exploder','melee','heavy','drone','ranged']},
      {count:10, mix:['drone','exploder','heavy','ranged','melee','drone','exploder','heavy','ranged','melee']},
      {count:12, mix:['exploder','drone','heavy','ranged','melee','drone','exploder','heavy','ranged','melee','drone','exploder']},
    ],
    boss:{name:'NANO-TECH TITAN',hp:1200,spd:80,dmg:18,col:'#cc00ff',acc:'#ff88ff',laserBurst:4,laserInterval:4,summonsExploders:true,phase2msg:'TITAN NANO-SWARM!'},
    hazard:{type:'laser_floor',interval:3,dmg:15}, reward:{hp:50,energy:60}, scoreBase:200,
  },
  {
    id:5, name:'NILE BRIDGE', groundY:272, subtitle:'Hold the last crossing!',
    bg:'level5_bg', groundLineColor:'#ffaa00', ambientTint:'rgba(255,80,0,0.07)',
    waves:[
      {count:9,  mix:['melee','heavy','drone','ranged','exploder','melee','heavy','drone','ranged']},
      {count:11, mix:['drone','drone','heavy','exploder','ranged','melee','drone','heavy','exploder','ranged','melee']},
      {count:13, mix:['heavy','exploder','drone','ranged','melee','heavy','drone','exploder','ranged','melee','heavy','drone','exploder']},
    ],
    boss:{name:'ALIEN GENERAL ZAX',hp:1400,spd:130,dmg:20,col:'#ff4400',acc:'#ff8866',laserBurst:3,laserInterval:3.5,airStrike:true,phase2msg:'GENERAL ZAX CALLS THE FLEET!'},
    hazard:{type:'bomb_drop',interval:2.5,dmg:18}, reward:{hp:55,energy:70}, scoreBase:250,
  },
  {
    id:6, name:'ALIEN MOTHERSHIP', groundY:272, subtitle:'End this. Now.',
    bg:'level6_bg', groundLineColor:'#00ffff', ambientTint:'rgba(0,200,255,0.10)',
    waves:[
      {count:10, mix:['drone','heavy','exploder','ranged','melee','drone','heavy','exploder','ranged','melee']},
      {count:12, mix:['heavy','drone','exploder','ranged','drone','melee','heavy','exploder','drone','ranged','melee','heavy']},
      {count:14, mix:['exploder','drone','heavy','ranged','drone','melee','exploder','heavy','drone','ranged','melee','exploder','drone','heavy']},
    ],
    boss:{name:'ALIEN OVERLORD',hp:2000,spd:140,dmg:24,col:'#00ffff',acc:'#88ffff',laserBurst:5,laserInterval:2.5,summonsDrones:true,summonsExploders:true,airStrike:true,phase2msg:'THE OVERLORD ASCENDS!'},
    hazard:{type:'gravity_pulse',interval:5,dmg:10}, reward:{hp:999,energy:100}, scoreBase:500,
  },
];
export function getLevel(n){ return LEVELS[Math.min(n-1, LEVELS.length-1)]; }
