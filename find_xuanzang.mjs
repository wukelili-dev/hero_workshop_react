import fs from 'fs';

const f = fs.readFileSync("D:/pyproject/hero_workshop_react/src/data/npcs.ts", "utf8");
const i = f.indexOf("id: 'changan_xuanzang'");
const end = f.indexOf("  },", f.indexOf("personalItem:", i) + 30);
// Look for next "  }," after personalItem
console.log("Context around personalItem xuanzang:", JSON.stringify(f.substring(end-60, end+10)));
