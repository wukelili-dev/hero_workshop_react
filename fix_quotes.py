"""Fix unescaped single quotes in npcs.ts by converting problematic
single-quoted JS strings to backtick template literals.

A JS single-quoted string like:  '..."...'...'..."...'
will be seen by the parser as: '..."...'   followed by garbage.
We fix these by converting the outer delimiters to backticks.
"""

import re

path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Strategy: Find single-quoted string values in the code that contain
# additional single quotes inside. These occur in:
# - description: '...\n...'  (multiline - already partly fixed)
# - chatDialogues entries: '..."..."...'...'...'
# - greetings entries
# - reward messages, drop messages
#
# All these are JS string literal values delimited by '...'
# Some have embedded Chinese single quotes: ' ... '
#
# Approach: Parse line by line, identify lines that are single-quoted
# strings in array context (leading whitespace + ' + content + ',)
# If content contains unescaped single quotes, convert to backtick.

lines = text.split('\n')
fixed_lines = []
for line in lines:
    # Match: leading whitespace, opening ', content, closing ', (possibly with comma)
    m = re.match(r'^(\s*)'([\s\S]*?)'(,\s*)$', line)
    if m:
        prefix, content, suffix = m.group(1), m.group(2), m.group(3)
        # Check if content has an odd number of " characters that would
        # confuse the parser, or has unescaped single quotes
        # The real problem: content contains ' characters
        if "'" in content:
            # Convert to backtick template literal
            # Escape backticks and ${ in content
            content_escaped = content.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
            fixed_lines.append(f'{prefix}`{content_escaped}`{suffix}')
            continue
    fixed_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.write('\n'.join(fixed_lines))

print(f"Fixed. Output written to {path}")
