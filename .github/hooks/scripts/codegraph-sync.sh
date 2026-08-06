#!/usr/bin/env bash
# PostToolUse hook: after the agent edits code files, auto-sync the codegraph index.
# Reads hook JSON from stdin, detects edit tools, then runs `codegraph sync`.
set -u

# Read stdin JSON (PostToolUse payload)
input="$(cat)"

# Extract the tool name (tolerates missing/invalid JSON)
tool_name="$(printf '%s' "$input" | /usr/local/nodejs/bin/node -e '
  let d = "";
  process.stdin.on("data", c => d += c);
  process.stdin.on("end", () => {
    try { const j = JSON.parse(d); console.log(j.tool || ""); }
    catch { console.log(""); }
  });
')"

# Edit tools that change source files
case "$tool_name" in
  writeToFile|editFile|multiDiffEdit)
    /usr/local/bin/codegraph sync >/dev/null 2>&1
    ;;
  *)
    ;;
esac

exit 0
