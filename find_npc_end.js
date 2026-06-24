const fs = require('fs');
const f = fs.readFileSync('D:/pyproject/hero_workshop_react/src/data/npcs.ts', 'utf8');
const targets = ['changan_weizheng', 'changan_tangwang', 'changan_xuanzang'];

for (const n of targets) {
  const i = f.indexOf("id: '" + n + "'");
  if (i < 0) { console.log(n, 'NOT FOUND'); continue; }
  let d = 1, j = i;
  while (d > 0) d += (f[j] === '{') ? 1 : (f[j] === '}') ? -1 : 0, j++;
  const seg = f.substring(i, j);
  const lines = seg.split('\n');
  const last = lines[lines.length - 2]?.trim() ?? '';
  console.log(n, 'lines:', lines.length, 'last:', JSON.stringify(last).substring(0, 150));
}
