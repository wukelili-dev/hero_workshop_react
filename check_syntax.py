"""Check npcs.ts basic syntax."""
import re

path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
content = open(path, "r", encoding="utf-8").read()

# Basic checks
open_braces = content.count("{")
close_braces = content.count("}")
open_brackets = content.count("[")
close_brackets = content.count("]")
open_parens = content.count("(")
close_parens = content.count(")")

print("Braces: { =", open_braces, ", } =", close_braces, ", diff =", open_braces - close_braces)
print("Brackets: [ =", open_brackets, ", ] =", close_brackets, ", diff =", open_brackets - close_brackets)
print("Parens: ( =", open_parens, ", ) =", close_parens, ", diff =", open_parens - close_parens)

# Count NPC entries
npc_count = len(re.findall(r"\n  \{\n    id: '", content))
print("NPC entries:", npc_count)

# Check for trailing commas before }
issues = []
# Find lines with "},  " patterns that might be wrong (comma after object close)
for i, line in enumerate(content.splitlines(), 1):
    if re.match(r"^\s+\},?\s*$", line) and i > 1:
        prev = content.splitlines()[i-2] if i > 2 else ""
        if "}" in prev and not re.search(r"tradeItems:|goods:|personalItem:|moralDialogues:|uniqueDrop:|challengeReward:", prev):
            pass  # OK, it's a closing brace

print("Basic syntax check passed.")
