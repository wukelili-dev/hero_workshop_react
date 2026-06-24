import re
content = open(r"D:\pyproject\hero_workshop_react\src\data\npcs.ts", encoding="utf-8").read()
ids = re.findall(r"id: '([^']+)'", content)
names = re.findall(r"name: '([^']+)'", content)
loc = re.findall(r"location: '([^']+)'", content)
for i, n, l in zip(ids, names, loc):
    print(f"{i:30s} | {n:15s} | {l}")
