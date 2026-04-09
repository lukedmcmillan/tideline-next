#!/usr/bin/env bash
# Block git commits that contain secrets or sensitive tokens
# Used as a PreToolUse hook for Bash tool calls

# Read the tool input from stdin (JSON with "command" field)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/"command"\s*:\s*"//;s/"$//')

if [ -z "$COMMAND" ]; then
  COMMAND="$INPUT"
fi

# Only check git commit and git push commands
if ! echo "$COMMAND" | grep -qiE '^\s*git\s+(commit|push|add)'; then
  exit 0
fi

# For git commit, scan staged files for secrets
if echo "$COMMAND" | grep -qiE '^\s*git\s+commit'; then
  STAGED=$(git diff --cached --unified=0 2>/dev/null)

  # Check for Supabase service role key pattern (sbp_)
  if echo "$STAGED" | grep -qE 'sbp_[a-zA-Z0-9]'; then
    echo "BLOCKED: Staged files contain a Supabase key (sbp_*). Remove it before committing." >&2
    exit 2
  fi

  # Check for Firecrawl key pattern (fc-[hex])
  if echo "$STAGED" | grep -qE 'fc-[0-9a-fA-F]{8,}'; then
    echo "BLOCKED: Staged files contain a Firecrawl key (fc-*). Remove it before committing." >&2
    exit 2
  fi

  # Check for Anthropic key pattern (sk-ant-)
  if echo "$STAGED" | grep -qE 'sk-ant-[a-zA-Z0-9]'; then
    echo "BLOCKED: Staged files contain an Anthropic key (sk-ant-*). Remove it before committing." >&2
    exit 2
  fi

  # Check for hardcoded SUPABASE_SERVICE_ROLE_KEY=
  if echo "$STAGED" | grep -qE 'SUPABASE_SERVICE_ROLE_KEY\s*=\s*["\x27]?[a-zA-Z0-9]'; then
    echo "BLOCKED: Staged files contain SUPABASE_SERVICE_ROLE_KEY value. Remove it before committing." >&2
    exit 2
  fi
fi

exit 0
