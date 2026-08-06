#!/usr/bin/env bash
# PostToolUse hook for Codex: after the agent edits code files, auto-sync the
# codegraph index. Mirrors .github/hooks/scripts/codegraph-sync.sh but matches
# Codex tool names (apply_patch + Write/Edit aliases) and tolerates a missing
# codegraph binary.
#
# Reads hook JSON from stdin, detects edit tools, then runs `codegraph sync`.
set -u

# Read stdin JSON (PostToolUse payload)
input="$(cat)"

# Extract the tool name (tolerates missing/invalid JSON; no node dependency)
tool_name="$(printf '%s' "$input" \
  | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 \
  | sed -E 's/.*"tool_name"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"

# Edit tools that change source files (Codex canonical name + matcher aliases)
case "$tool_name" in
  apply_patch|Write|Edit)
    if command -v codegraph >/dev/null 2>&1; then
      codegraph sync >/dev/null 2>&1
    fi
    ;;
  *)
    ;;
esac

exit 0
