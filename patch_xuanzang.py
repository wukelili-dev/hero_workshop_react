import re

path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# xuanzang: insert unlockCondition after personalItem line
old = "personalItem: { name: '观音紫竹叶', icon: '🌿', description: '观音菩萨所赠紫竹叶，可辨妖邪', sellPrice: 0 },\n  }"
new = "personalItem: { name: '观音紫竹叶', icon: '🌿', description: '观音菩萨所赠紫竹叶，可辨妖邪', sellPrice: 0 },\n    unlockCondition: { kind: 'explorationFlag', value: 1, compare: 'xuanzang_unlocked' },\n  }"
count = content.count(old)
print(f"xuanzang found: {count}")
if count == 1:
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("xuanzang unlockCondition added")
else:
    print(f"ERROR: found {count} occurrences")
