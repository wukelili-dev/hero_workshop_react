import re
content = open(r"D:\pyproject\hero_workshop_react\src\data\npcs.ts", encoding="utf-8").read()

# Check current unlockCondition presence
count = content.count("unlockCondition:")
print("Current unlockCondition entries:", count)

# Find weizheng, tangwang, xuanzang entries
for name in ['changan_weizheng', 'changan_tangwang', 'changan_xuanzang']:
    idx = content.find(f"id: '{name}'")
    if idx >= 0:
        print(f"Found {name} at char {idx}")
    else:
        print(f"NOT FOUND: {name}")
