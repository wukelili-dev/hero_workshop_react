"""Fix 玄奘 personalItem using precise string manipulation."""
path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Check if already fixed
if "观音紫竹叶" in content:
    print("Already fixed! 玄奘 personalItem found.")
else:
    print("Still missing. Will fix now...")
    marker = '"贫僧启程在即。长安城外，灞桥折柳，唐王亲自相送。足下若来送行，咱们便算有缘——西天路上，说不定能再见。"'
    idx = content.find(marker)
    if idx < 0:
        print("ERROR: Marker not found!")
    else:
        print("Marker at:", idx)
        line_end = content.find("],", idx)
        print("Array end ], at:", line_end)
        close = content.find("},", line_end)
        print("Closing }, at:", close)
        personal_item = "\n    personalItem: { name: '观音紫竹叶', icon: '🌿', description: '观音菩萨所赠紫竹叶，可辨妖邪', sellPrice: 0 },"
        new_content = content[:line_end] + "]," + personal_item + "\n  }" + content[close+2:]
        content = new_content
        print("Inserted personalItem for 玄奘")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done.")
