#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing npm dependencies..."
npm ci

echo "==> Installing Playwright browsers..."
npx playwright install --with-deps chromium

echo "==> Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code

echo "==> Smoke test: starting dev server..."
npm run dev &
DEV_PID=$!
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
  echo "==> Dev server smoke test passed"
else
  echo "==> Warning: Dev server did not respond with 200"
fi

kill $DEV_PID 2>/dev/null || true

echo "==> Authenticating GitHub CLI..."
if [ -n "${GH_TOKEN:-}" ]; then
  echo "$GH_TOKEN" | gh auth login --with-token
  echo "==> GitHub CLI authenticated"
else
  echo "==> Skipping gh auth (no GH_TOKEN set)"
fi

echo "==> Post-create setup complete!"
