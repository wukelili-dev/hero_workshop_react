import fs from 'fs';

const f = fs.readFileSync("D:/pyproject/hero_workshop_react/src/data/npcs.ts", "utf8");
const targets = ["changan_weizheng","changan_tangwang","changan_xuanzang"];

for (const n of targets) {
  const i = f.indexOf("id: '" + n + "'");
  if (i < 0) continue;
  let d = 1, j = i;
  while (d > 0) { d += (f[j]==='{') ? 1 : (f[j]==='}') ? -1 : 0; j++; }
  const seg = f.slice(i, j);
  const lines = seg.split("\n");
  console.log(n, "lines:", lines.length, "last:", JSON.stringify(lines[lines.length-2]?.trim()||"").slice(0,150));
}
