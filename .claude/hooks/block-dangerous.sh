#!/usr/bin/env bash
# Block dangerous database commands from being executed
# Used as a PreToolUse hook for Bash tool calls

# Read the tool input from stdin (JSON with "command" field)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/"command"\s*:\s*"//;s/"$//')

# If no command extracted, try the whole input as plain text
if [ -z "$COMMAND" ]; then
  COMMAND="$INPUT"
fi

# Block: supabase db reset --linked
if echo "$COMMAND" | grep -qiE 'supabase\s+db\s+reset\s+.*--linked'; then
  echo "BLOCKED: 'supabase db reset --linked' is prohibited — this destroys the production database." >&2
  exit 2
fi

# Block: supabase db drop
if echo "$COMMAND" | grep -qiE 'supabase\s+db\s+drop'; then
  echo "BLOCKED: 'supabase db drop' is prohibited — this destroys the database." >&2
  exit 2
fi

# Block: DELETE without WHERE
if echo "$COMMAND" | grep -qiE 'DELETE\s+FROM\s+' && ! echo "$COMMAND" | grep -qiE 'WHERE'; then
  echo "BLOCKED: DELETE without WHERE clause is prohibited — this deletes all rows." >&2
  exit 2
fi

# Block: DROP TABLE
if echo "$COMMAND" | grep -qiE 'DROP\s+TABLE'; then
  echo "BLOCKED: 'DROP TABLE' is prohibited — this destroys table data permanently." >&2
  exit 2
fi

exit 0
