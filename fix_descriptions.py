import re

path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Match: description: '...\n...'  (multiline single-quoted strings in description only)
# Replace single quotes containing actual newlines with backtick template literals
def fix_multiline_desc(m):
    full = m.group(0)
    # Only fix if it contains actual line breaks
    if '\n' in full:
        # Replace opening ' with ` and closing ' with `
        # pattern: "description: 'XXX\nXXX'"
        inner = re.sub(r"^description: '", "description: `", full)
        inner = re.sub(r"'$", "`", inner)
        return inner
    return full

# Match: description: '...content with \n...'
content = re.sub(
    r"description: '.*?'",
    fix_multiline_desc,
    content,
    flags=re.DOTALL
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

# Verify no remaining multiline single-quoted descriptions
import sys
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    # Check for lines inside a single-quoted string that has no closing quote
    pass

print("Done. Checking for remaining issues...")
# Count backtick descriptions  
bt_count = content.count('description: `')
sq_count = len(re.findall(r"description: '", content))
print(f"Backtick descriptions: {bt_count}")
print(f"Single-quote descriptions: {sq_count}")

# Check if any remaining single-quote descriptions have embedded newlines
remaining_sq = re.findall(r"description: '.*?'", content, re.DOTALL)
multiline_still = [d for d in remaining_sq if '\n' in d]
if multiline_still:
    print(f"WARNING: {len(multiline_still)} multiline single-quote descriptions remain:")
    for d in multiline_still[:5]:
        print(f"  {d[:80]}...")
else:
    print("No multiline single-quote descriptions remain.")
