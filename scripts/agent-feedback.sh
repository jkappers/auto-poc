#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${1:?Usage: agent-feedback.sh <pr-number> <review-id>}"
REVIEW_ID="${2:?Usage: agent-feedback.sh <pr-number> <review-id>}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"

# 1. Fetch PR and review context
echo "==> Fetching PR #$PR_NUMBER review #$REVIEW_ID..."
PR_JSON=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json title,body,headRefName,files)
REVIEW_COMMENTS=$(gh api "repos/$REPO/pulls/$PR_NUMBER/reviews/$REVIEW_ID/comments" --jq '.[] | "File: \(.path)\nLine: \(.line // .original_line)\nComment: \(.body)\n---"')
PR_DIFF=$(gh pr diff "$PR_NUMBER" --repo "$REPO")

PR_TITLE=$(echo "$PR_JSON" | jq -r '.title')
PR_BRANCH=$(echo "$PR_JSON" | jq -r '.headRefName')

# 2. Post feedback comment
gh pr comment "$PR_NUMBER" --repo "$REPO" --body "🤖 **Agent feedback iteration**: Addressing review comments..."

# 3. Checkout PR branch
echo "==> Checking out branch $PR_BRANCH..."
git fetch origin "$PR_BRANCH"
git checkout "$PR_BRANCH"

# 4. Build context
CONTEXT_FILE="/tmp/agent-feedback-context.md"
cat > "$CONTEXT_FILE" << CONTEXT_EOF
# Agent Task: Address PR Review Feedback

## PR #$PR_NUMBER: $PR_TITLE

### Review Comments to Address
$REVIEW_COMMENTS

### Current PR Diff
\`\`\`diff
$PR_DIFF
\`\`\`

---

## Instructions

You are an autonomous coding agent. Address the review feedback above.

### Steps
1. Read each review comment carefully
2. Read CLAUDE.md for project conventions
3. Make the requested changes
4. Run lint: npm run lint (fix errors, max 3 attempts)
5. Run type-check: npx tsc --noEmit (fix errors, max 3 attempts)
6. Run tests: npm test -- --bail (fix failures, max 3 attempts)
7. Commit with a conventional commit message referencing the feedback
8. Push to the current branch

### Guardrails
- Do NOT modify more than 20 files
- Do NOT commit secrets or .env files
- Stay focused on the review feedback — do not make unrelated changes
- If you cannot resolve feedback after 3 retries, post a comment explaining what went wrong and stop
- Always use import.meta.env.BASE_URL for base paths, never hardcode
CONTEXT_EOF

echo "==> Context built at $CONTEXT_FILE"

# 5. Ensure dependencies
echo "==> Running npm ci..."
npm ci

# 6. Invoke Claude Code CLI
echo "==> Starting Claude Code agent for feedback..."
claude -p \
  --allowedTools "Edit,Write,Bash(npm run lint),Bash(npm run build),Bash(npm test),Bash(npm test -- --bail),Bash(npx tsc --noEmit),Bash(npx playwright test),Bash(npm run dev),Bash(git *),Bash(gh *),Read,Grep,Glob" \
  < "$CONTEXT_FILE"

echo "==> Agent feedback completed."
