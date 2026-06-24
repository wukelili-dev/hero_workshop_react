import json, os
os.environ.pop('AW_PYTHON_BINARY', None)
f = open(r"D:\pyproject\hero_workshop_react\src\data\npcs.ts", encoding="utf-8").read()
targets = ['changan_weizheng', 'changan_tangwang', 'changan_xuanzang']
for t in targets:
    idx = f.find("id: '" + t + "'")
    end = f.index("  },", idx + 100)
    segment = f[idx:end]
    last3 = segment.split("\n")[-3:]
    print(t, "lines:", len(segment.split("\n")), "last meaningful:", repr(last3[-2]) if len(last3)>1 else "")
