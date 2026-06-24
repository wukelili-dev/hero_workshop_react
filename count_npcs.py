content = open(r"D:\pyproject\hero_workshop_react\src\data\npcs.ts", encoding="utf-8").read()
print("Total lines:", len(content.splitlines()))
print("Total NPCs (id: count):", content.count("id: '"))
print("personalItem count:", content.count("personalItem:"))
print("moralDialogues count:", content.count("moralDialogues:"))

# Verify key items
checks = [
    ("观音紫竹叶", "玄奘 personalItem"),
    ("判官朱笔", "崔珏 personalItem"),
    ("泾河那边的事", "敖广 moralDialogues"),
    ("观音玉净瓶柳枝", "观音 personalItem"),
    ("九转金丹", "太上老君 uniqueDrop"),
    ("盘古斧片", "盘古 uniqueDrop"),
    ("牛魔王角", "牛魔王 uniqueDrop"),
    ("判官朱笔", "崔珏 moralDialogues"),
]
for text, label in checks:
    print(f"{label}: {'✓' if text in content else '✗ MISSING'}")
