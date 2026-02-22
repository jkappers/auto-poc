#!/usr/bin/env bash
set -euo pipefail

ISSUE_NUMBER="${1:?Usage: agent-bootstrap.sh <issue-number>}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"

# 1. Fetch issue context
echo "==> Fetching issue #$ISSUE_NUMBER..."
ISSUE_JSON=$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json title,body,comments,labels)

ISSUE_TITLE=$(echo "$ISSUE_JSON" | jq -r '.title')
ISSUE_BODY=$(echo "$ISSUE_JSON" | jq -r '.body')
ISSUE_LABELS=$(echo "$ISSUE_JSON" | jq -r '[.labels[].name] | join(", ")')

# 2. Post planning comment
gh issue comment "$ISSUE_NUMBER" --repo "$REPO" --body "🤖 **Agent**: Reading issue and planning implementation..."

# 3. Build structured context
CONTEXT_FILE="/tmp/agent-context.md"
cat > "$CONTEXT_FILE" << CONTEXT_EOF
# Agent Task: Issue #$ISSUE_NUMBER

## Issue: $ISSUE_TITLE

### Description
$ISSUE_BODY

### Labels
$ISSUE_LABELS

---

## Instructions

You are an autonomous coding agent. Complete the task described in the issue above.

### Phase 1: Plan
- Read the issue carefully
- Explore the codebase to understand the project structure
- Read CLAUDE.md for project conventions
- Create a brief implementation plan

### Phase 2: Implement
- Create a new branch: agent/issue-${ISSUE_NUMBER}-<short-slug>
- Implement the changes described in the issue
- Follow project conventions from CLAUDE.md
- Keep changes focused and minimal

### Phase 3: Lint
- Run: npm run lint
- Fix any lint errors (max 3 attempts, then escalate)

### Phase 4: Type-check
- Run: npx tsc --noEmit
- Fix any type errors (max 3 attempts, then escalate)

### Phase 5: Verify
- Start the dev server: npm run dev
- Use a browser or Playwright to verify the changes look correct
- Take screenshots if relevant

### Phase 6: Test
- Run: npm test -- --bail
- Fix any test failures (max 3 attempts, then escalate)

### Phase 7: Open PR
- Commit with a conventional commit message
- Push the branch
- Open a PR with:
  - Title: descriptive of the change
  - Body: summary of what was done, reference to issue (Closes #${ISSUE_NUMBER})
  - Label: agent-pr
- Command: gh pr create --title "<title>" --body "<body>" --label "agent-pr"

### Guardrails
- Do NOT modify more than 20 files
- Do NOT commit secrets or .env files
- Do NOT merge the PR — humans review and merge
- If you cannot complete a phase after 3 retries, post a comment explaining what went wrong and stop
- Always use import.meta.env.BASE_URL for base paths, never hardcode
CONTEXT_EOF

echo "==> Context built at $CONTEXT_FILE"

# 4. Ensure dependencies are installed
echo "==> Running npm ci..."
npm ci

# 5. Invoke Claude Code CLI
echo "==> Starting Claude Code agent..."
claude -p \
  --allowedTools "Edit,Write,Bash(npm run lint),Bash(npm run build),Bash(npm test),Bash(npm test -- --bail),Bash(npx tsc --noEmit),Bash(npx playwright test),Bash(npm run dev),Bash(git *),Bash(gh *),Read,Grep,Glob" \
  < "$CONTEXT_FILE"

echo "==> Agent completed."
