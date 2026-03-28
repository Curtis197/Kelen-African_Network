#!/bin/bash
# Kelen — Commit → Push → Deploy → Log Check
# Triggered by Claude Code Stop hook after each session.
# Skips silently if there are no changes to commit.

cd "/c/Users/DELL LATITUDE 7480/Kelen-African_Network" || exit 0

# ── 1. Guard: skip if nothing to commit ─────────────────────────────────────
if [ -z "$(git status --porcelain)" ]; then
  echo '{"systemMessage": "Pipeline: no changes — nothing to commit or deploy."}'
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# ── 2. Stage all changes ─────────────────────────────────────────────────────
git add -A

# ── 3. Build commit message from staged diff ─────────────────────────────────
CHANGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
CHANGED_FILES=$(git diff --cached --name-only | head -3 | paste -sd ', ')
if [ "$CHANGED_COUNT" -gt 3 ]; then
  COMMIT_MSG="update($BRANCH): $CHANGED_FILES... (+$((CHANGED_COUNT - 3)) more)"
else
  COMMIT_MSG="update($BRANCH): $CHANGED_FILES"
fi

git commit -m "$COMMIT_MSG" || {
  echo '{"systemMessage": "Pipeline: commit failed — check git status."}'
  exit 0
}

# ── 4. Push ──────────────────────────────────────────────────────────────────
git push origin "$BRANCH" 2>&1 || {
  echo '{"systemMessage": "Pipeline ⚠️: committed but push failed — run: git push origin '"$BRANCH"'"}'
  exit 0
}

# ── 5. Deploy via Vercel CLI ─────────────────────────────────────────────────
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  DEPLOY_OUTPUT=$(vercel --prod --yes --no-clipboard 2>&1)
  TARGET="production"
else
  DEPLOY_OUTPUT=$(vercel --yes --no-clipboard 2>&1)
  TARGET="preview"
fi

DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -E "^https://" | tail -1)

if [ -z "$DEPLOY_URL" ]; then
  SNIPPET=$(echo "$DEPLOY_OUTPUT" | tail -3 | tr '\n' ' ')
  echo "{\"systemMessage\": \"Pipeline ⚠️: deploy may have failed.\\nVercel output: $SNIPPET\"}"
  exit 0
fi

# ── 6. Check deployment logs for errors ──────────────────────────────────────
sleep 8
ERROR_LINES=$(vercel logs "$DEPLOY_URL" --level error 2>/dev/null | head -5)

if [ -n "$ERROR_LINES" ]; then
  LOG_STATUS="⚠️ errors detected — fix needed"
  EXTRA="\\nErrors: $ERROR_LINES"
  # Exit 2 = asyncRewake: wakes Claude to investigate and fix
  echo "{\"systemMessage\": \"🚀 Deployed ($TARGET) but errors found\\n• URL: $DEPLOY_URL\\n• Commit: $COMMIT_MSG\\n• $LOG_STATUS$EXTRA\"}"
  exit 2
else
  LOG_STATUS="✓ clean"
  echo "{\"systemMessage\": \"🚀 Pipeline complete ($TARGET)\\n• URL: $DEPLOY_URL\\n• Commit: $COMMIT_MSG\\n• Logs: $LOG_STATUS\"}"
  exit 0
fi
