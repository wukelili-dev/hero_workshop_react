import fs from 'fs';

const f = fs.readFileSync("D:/pyproject/hero_workshop_react/src/data/npcs.ts", "utf8");
const i = f.indexOf("id: 'changan_xuanzang'");
let d = 1, j = i;
while (d > 0) { d += (f[j]==='{') ? 1 : (f[j]==='}') ? -1 : 0; j++; }
// j now points after the closing }
// Find the actual closing }, line
const chunk = f.substring(j-50, j+5);
console.log("End of xuanzang:", JSON.stringify(chunk));
