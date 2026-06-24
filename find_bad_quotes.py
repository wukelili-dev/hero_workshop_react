"""Find lines in npcs.ts where a single-quoted JS string contains
an embedded ASCII single quote (0x27) that would break rolldown's parser.
We check for lines like:  '..."...'X'..."...',  where the middle 'X is
actually an ASCII single quote that prematurely ends the string.
"""
import re
path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

problems = []
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    # Skip comments and empty lines
    if not stripped or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
        continue
    # Look for lines that are single-quoted JavaScript string values
    # Pattern: starts with whitespace + ' and ends with ',
    # Simple check: count ASCII single quotes. Normal string values
    # should have exactly 2 (open + close). If more, there's a problem.
    sq_count = stripped.count("'")
    if sq_count > 2:
        # Check if it looks like a string value (not code/syntax)
        if re.match(r"^'", stripped) and re.search(r"',$", stripped):
            problems.append((i, stripped[:100]))
            # Also check if these are really ASCII single quotes in content
            # by looking for pattern: 'text'text' inside

for ln, snippet in problems:
    print(f"Line {ln}: {snippet}...")
print(f"\nTotal problematic lines: {len(problems)}")
