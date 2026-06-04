/**
 * Phase 5 数值平衡 v2 — 按"刷低级怪练级→达标→推进"玩法验证
 * 假设：英雄在当前地图刷弱怪升级，达标后打强怪/Boss
 */

const getMaxHp = (lv) => Math.floor(80 + lv * 18 + Math.floor(lv / 5) * 5);
const getBaseAtk = (lv) => Math.floor(5 + lv * 2 + Math.floor(lv / 5));
const getBaseDef = (lv) => Math.floor(2 + lv + Math.floor(lv / 5));
const getExpNeeded = (lv) => 50 * lv + 10 * lv * lv;

const MONSTERS = {
  蝴蝶: { name:'蝴蝶', lv:1, hp:35, atk:8, def:2, exp:8, gold:5 },
  鹦鹉: { name:'鹦鹉', lv:3, hp:55, atk:12, def:3, exp:12, gold:8 },
  龙虾: { name:'龙虾', lv:5, hp:85, atk:18, def:5, exp:20, gold:15 },
  巨蟹: { name:'巨蟹', lv:8, hp:130, atk:25, def:8, exp:35, gold:25 },
  九头精怪: { name:'九头精怪', lv:10, hp:400, atk:35, def:15, exp:100, gold:80, boss:true },
  太监: { name:'太监', lv:11, hp:180, atk:35, def:12, exp:45, gold:35 },
  银甲唐兵: { name:'银甲唐兵', lv:12, hp:240, atk:42, def:18, exp:60, gold:45 },
  金甲唐兵: { name:'金甲唐兵', lv:13, hp:320, atk:50, def:22, exp:80, gold:60 },
  唐兵统领: { name:'唐兵统领', lv:15, hp:420, atk:58, def:28, exp:100, gold:80 },
  千年蛇魅: { name:'千年蛇魅', lv:15, hp:850, atk:72, def:35, exp:200, gold:150, boss:true },
  突厥弩手: { name:'突厥弩手', lv:15, hp:380, atk:65, def:25, exp:90, gold:70 },
  波斯女刀客: { name:'波斯女刀客', lv:17, hp:450, atk:72, def:28, exp:110, gold:85 },
  突厥弩王: { name:'突厥弩王', lv:20, hp:950, atk:85, def:35, exp:250, gold:200, boss:true },
  绝色剑客: { name:'绝色剑客', lv:20, hp:480, atk:78, def:30, exp:120, gold:95 },
  江州衙役: { name:'江州衙役', lv:22, hp:560, atk:85, def:35, exp:140, gold:110 },
  风流剑客: { name:'风流剑客', lv:25, hp:650, atk:92, def:32, exp:165, gold:130 },
  高丽密探: { name:'高丽密探', lv:25, hp:1200, atk:108, def:42, exp:300, gold:240, boss:true },
  巡海夜叉: { name:'巡海夜叉', lv:25, hp:600, atk:92, def:38, exp:160, gold:130 },
  龟丞相: { name:'龟丞相', lv:27, hp:750, atk:75, def:55, exp:180, gold:150 },
  螺精: { name:'螺精', lv:29, hp:550, atk:105, def:30, exp:150, gold:120 },
  万年虾妖: { name:'万年虾妖', lv:28, hp:1400, atk:115, def:45, exp:420, gold:360, boss:true },
  猴枪兵: { name:'猴枪兵', lv:30, hp:800, atk:110, def:42, exp:200, gold:160 },
  猴刀兵: { name:'猴刀兵', lv:32, hp:900, atk:120, def:45, exp:230, gold:185 },
  赤尻马猴: { name:'赤尻马猴', lv:34, hp:1000, atk:105, def:55, exp:250, gold:200 },
  混世魔王: { name:'混世魔王', lv:35, hp:2200, atk:155, def:60, exp:650, gold:520, boss:true },
  刁蛮女: { name:'刁蛮女', lv:35, hp:1000, atk:130, def:48, exp:260, gold:210 },
  好色僧人: { name:'好色僧人', lv:37, hp:1100, atk:125, def:55, exp:280, gold:225 },
  强盗: { name:'强盗', lv:39, hp:1050, atk:135, def:50, exp:270, gold:215 },
  芦花精: { name:'芦花精', lv:40, hp:2800, atk:175, def:70, exp:900, gold:720, boss:true },
  酒鬼: { name:'酒鬼', lv:40, hp:1200, atk:145, def:52, exp:310, gold:250 },
  赌鬼: { name:'赌鬼', lv:42, hp:1150, atk:155, def:48, exp:300, gold:240 },
  尾生: { name:'尾生', lv:44, hp:1300, atk:140, def:58, exp:330, gold:265 },
  无常: { name:'无常', lv:45, hp:3200, atk:190, def:75, exp:1100, gold:880, boss:true },
  熊罴: { name:'熊罴', lv:45, hp:1500, atk:165, def:65, exp:380, gold:310 },
  鸟精: { name:'鸟精', lv:47, hp:1350, atk:180, def:55, exp:360, gold:290 },
  虎先锋: { name:'虎先锋', lv:50, hp:1600, atk:175, def:68, exp:400, gold:330 },
  山神: { name:'山神', lv:52, hp:1800, atk:155, def:80, exp:420, gold:350 },
  黄风大圣: { name:'黄风大圣', lv:55, hp:4000, atk:220, def:90, exp:1500, gold:1200, boss:true },
  人参娃娃: { name:'人参娃娃', lv:55, hp:2000, atk:200, def:75, exp:480, gold:400 },
  五庄道童: { name:'五庄道童', lv:57, hp:2200, atk:210, def:82, exp:520, gold:440 },
  骷髅怪: { name:'骷髅怪', lv:59, hp:1900, atk:230, def:68, exp:500, gold:420 },
  镇元大仙: { name:'镇元大仙', lv:60, hp:5500, atk:270, def:110, exp:2200, gold:1700, boss:true },
};

const MAPS = [
  { id:'aolai', name:'傲来国', minLv:1, unlock:0, mobs:['蝴蝶','鹦鹉','龙虾','巨蟹'], boss:'九头精怪' },
  { id:'datangdong', name:'大唐东', minLv:11, unlock:500, mobs:['太监','银甲唐兵','金甲唐兵','唐兵统领'], boss:'千年蛇魅' },
  { id:'yangguan', name:'阳关', minLv:15, unlock:1000, mobs:['突厥弩手','波斯女刀客'], boss:'突厥弩王' },
  { id:'datangnan', name:'大唐南', minLv:20, unlock:1500, mobs:['绝色剑客','江州衙役','风流剑客'], boss:'高丽密探' },
  { id:'donghai', name:'东海', minLv:25, unlock:3000, mobs:['巡海夜叉','龟丞相','螺精'], boss:'万年虾妖' },
  { id:'huaguoshan', name:'花果山', minLv:30, unlock:6000, mobs:['猴枪兵','猴刀兵','赤尻马猴'], boss:'混世魔王' },
  { id:'wuzhishan', name:'五指山', minLv:35, unlock:12000, mobs:['刁蛮女','好色僧人','强盗'], boss:'芦花精' },
  { id:'difu', name:'地府', minLv:40, unlock:25000, mobs:['酒鬼','赌鬼','尾生'], boss:'无常' },
  { id:'wusizang', name:'乌斯藏', minLv:45, unlock:35000, mobs:['熊罴','鸟精','虎先锋','山神'], boss:'黄风大圣' },
  { id:'wanshoushan', name:'万寿山', minLv:55, unlock:60000, mobs:['人参娃娃','五庄道童','骷髅怪'], boss:'镇元大仙' },
];

function simWinRate(heroLv, monster, n) {
  n = n || 1000;
  let wins = 0;
  for (let i = 0; i < n; i++) {
    let heroHp = getMaxHp(heroLv);
    let monsterHp = monster.hp;
    const heroAtk = getBaseAtk(heroLv);
    const heroDef = getBaseDef(heroLv);
    while (heroHp > 0 && monsterHp > 0) {
      const dmg = Math.max(1, Math.floor(heroAtk * (1 - monster.def / (monster.def + 50)) * (0.9 + Math.random() * 0.2)));
      monsterHp -= dmg;
      if (monsterHp <= 0) { wins++; break; }
      const mdmg = Math.max(1, Math.floor(monster.atk * (1 - heroDef / (heroDef + 50)) * (0.9 + Math.random() * 0.2)));
      heroHp -= mdmg;
    }
  }
  return wins / n;
}

function simWinRateWithGear(heroLv, monster, gearAtk, gearDef, n) {
  n = n || 1000;
  let wins = 0;
  for (let i = 0; i < n; i++) {
    let heroHp = getMaxHp(heroLv);
    let monsterHp = monster.hp;
    const heroAtk = getBaseAtk(heroLv) + gearAtk;
    const heroDef = getBaseDef(heroLv) + gearDef;
    while (heroHp > 0 && monsterHp > 0) {
      const dmg = Math.max(1, Math.floor(heroAtk * (1 - monster.def / (monster.def + 50)) * (0.9 + Math.random() * 0.2)));
      monsterHp -= dmg;
      if (monsterHp <= 0) { wins++; break; }
      const mdmg = Math.max(1, Math.floor(monster.atk * (1 - heroDef / (heroDef + 50)) * (0.9 + Math.random() * 0.2)));
      heroHp -= mdmg;
    }
  }
  return wins / n;
}

function findFarmLevel(monster, minLv) {
  for (let lv = minLv || 1; lv <= 60; lv++) {
    if (simWinRate(lv, monster) >= 0.8) return lv;
  }
  return 99;
}

function pad(s, n) { return String(s).padStart(n); }

console.log('='.repeat(100));
console.log('刷怪练级可行性分析');
console.log('='.repeat(100));
console.log('');
console.log('怪物            | 怪Lv | 怪HP  | 怪ATK | 安全刷Lv | 英雄HP | 英雄ATK | minLv胜率');
console.log('-'.repeat(85));

const allData = [];
for (const map of MAPS) {
  for (const name of map.mobs) {
    const m = MONSTERS[name];
    if (!m) continue;
    const safeLv = findFarmLevel(m, map.minLv);
    const heroHp = getMaxHp(safeLv);
    const heroAtk = getBaseAtk(safeLv);
    const minLvWR = simWinRate(map.minLv, m);
    allData.push({ ...m, map:map.name, minLv:map.minLv, safeLv, heroHp, heroAtk, minLvWR });
    const icon = safeLv <= 60 ? 'OK' : 'XX';
    console.log(`${pad(m.name,12)} | ${pad(m.lv,4)} | ${pad(m.hp,5)} | ${pad(m.atk,5)} | ${pad(safeLv,7)} | ${pad(heroHp,6)} | ${pad(heroAtk,7)} | ${pad((minLvWR*100).toFixed(0)+'%',8)}`);
  }
  const boss = MONSTERS[map.boss];
  if (boss) {
    const safeLv = findFarmLevel(boss, map.minLv + 2);
    const heroHp = getMaxHp(safeLv);
    const heroAtk = getBaseAtk(safeLv);
    allData.push({ ...boss, map:map.name, minLv:map.minLv, safeLv, heroHp, heroAtk, minLvWR:0 });
    console.log(`Boss ${pad(boss.name,10)} | ${pad(boss.lv,4)} | ${pad(boss.hp,5)} | ${pad(boss.atk,5)} | ${pad(safeLv,7)} | ${pad(heroHp,6)} | ${pad(heroAtk,7)} |`);
  }
}

// 练级效率
console.log('');
console.log('='.repeat(100));
console.log('练级效率: 刷怪到安全等级需杀多少只');
console.log('='.repeat(100));

for (const map of MAPS) {
  const mobs = allData.filter(m => m.map === map.name && !m.boss);
  if (mobs.length === 0) continue;
  const easiest = mobs.reduce((a, b) => a.safeLv < b.safeLv ? a : b);
  const hardest = mobs.reduce((a, b) => a.safeLv > b.safeLv ? a : b);

  let expToEasy = 0;
  for (let lv = map.minLv; lv < easiest.safeLv; lv++) expToEasy += getExpNeeded(lv);
  const killsEasy = Math.ceil(expToEasy / easiest.exp);

  let expToHard = 0;
  for (let lv = map.minLv; lv < hardest.safeLv; lv++) expToHard += getExpNeeded(lv);
  const killsHard = Math.ceil(expToHard / easiest.exp);

  console.log(`${map.name.padEnd(6)} | 最弱${easiest.name.padEnd(6)} Lv.${pad(easiest.safeLv,2)} 需杀${pad(killsEasy,3)}只 | 最强${hardest.name.padEnd(6)} Lv.${pad(hardest.safeLv,2)} 需杀${pad(killsHard,3)}只`);
}

// 装备加成
console.log('');
console.log('='.repeat(100));
console.log('装备加成效果: minLv 英雄穿上对应阶段装备后的胜率变化');
console.log('='.repeat(100));

const GEAR = [
  { name:'新手', atk:3, def:2 },
  { name:'白装', atk:8, def:5 },
  { name:'绿装', atk:15, def:10 },
  { name:'蓝装', atk:25, def:18 },
  { name:'紫装', atk:40, def:28 },
];

console.log('');
console.log('地图      | 装备   | 裸装胜率 | 带装胜率 | Boss裸装 | Boss带装');
console.log('-'.repeat(75));

for (let i = 0; i < MAPS.length; i++) {
  const map = MAPS[i];
  const tierIdx = Math.min(Math.floor(i / 2), GEAR.length - 1);
  const gear = GEAR[tierIdx];
  const heroLv = map.minLv;
  const mobs = map.mobs.map(n => MONSTERS[n]).filter(Boolean);
  if (mobs.length === 0) continue;

  const bareWR = mobs.reduce((s, m) => s + simWinRate(heroLv, m), 0) / mobs.length;
  const gearedWR = mobs.reduce((s, m) => s + simWinRateWithGear(heroLv, m, gear.atk, gear.def), 0) / mobs.length;

  const boss = MONSTERS[map.boss];
  const bossBare = boss ? simWinRate(heroLv, boss) : 1;
  const bossGeared = boss ? simWinRateWithGear(heroLv, boss, gear.atk, gear.def) : 1;

  console.log(`${map.name.padEnd(8)} | ${gear.name.padEnd(4)} | ${pad((bareWR*100).toFixed(0)+'%',7)} | ${pad((gearedWR*100).toFixed(0)+'%',7)} | ${pad((bossBare*100).toFixed(0)+'%',8)} | ${pad((bossGeared*100).toFixed(0)+'%',8)}`);
}

console.log('');
console.log('='.repeat(100));
console.log('结论');
console.log('='.repeat(100));
