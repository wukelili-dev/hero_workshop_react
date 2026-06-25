import { readFileSync } from 'fs';
const content = readFileSync('D:/pyproject/hero_workshop_react/src/data/npcs.ts', 'utf-8');

// Extract NPC objects - look for id: / name: / type: / location: patterns
const npcs = [];
const lines = content.split('\n');
let current = {};
let depth = 0;
let inNpc = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  depth += (line.match(/\{/g) || []).length;
  depth -= (line.match(/\}/g) || []).length;
  
  if (line.includes('id:') && depth <= 2) {
    inNpc = true;
    current = {};
  }
  
  if (inNpc) {
    const idMatch = line.match(/id:\s*['"](.+)['"],/);
    const nameMatch = line.match(/name:\s*['"](.+)['"],/);
    const typeMatch = line.match(/type:\s*['"](.+)['"],/);
    const locMatch = line.match(/location:\s*['"](.+)['"],/);
    if (idMatch) current.id = idMatch[1];
    if (nameMatch) current.name = nameMatch[1];
    if (typeMatch) current.type = typeMatch[1];
    if (locMatch) current.location = locMatch[1];
  }
  
  if (inNpc && depth <= 0 && line.trim() === '},') {
    if (current.location === 'changan') {
      npcs.push({ id: current.id, name: current.name, type: current.type });
    }
    inNpc = false;
    current = {};
  }
}

console.log('=== 长安 NPC 列表 ===');
npcs.forEach(n => console.log(`${n.id.padEnd(30)} name=${(n.name||'?').padEnd(10)} type=${n.type}`));
