content = open(r"D:\pyproject\hero_workshop_react\src\data\npcs.ts", encoding="utf-8").read()
idx = content.find("贫僧启程在即")
if idx >= 0:
    print("Found at:", idx)
    print(repr(content[idx:idx+400]))
