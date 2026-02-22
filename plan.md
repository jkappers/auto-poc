# Plan: GitHub Issue → Agent → PR Automation

> **POC Goal**: End-to-end automation where labeling a GitHub Issue spins up a Codespace, runs Claude Code CLI to plan, implement, and self-verify in a real browser, opens a PR, and handles review feedback. Human touchpoints: writing the issue and final merge.
>
> **Target**: Single-day proof of concept. Repo-agnostic and language-agnostic.

---

## Architecture Overview

```
GitHub Issue (labeled "agent-ready")
        │
        ▼
GitHub Actions Workflow (agent-run.yml)
        │
        ├─ Generate short-lived GitHub App token (least privilege)
        ├─ Create Codespace (devcontainer + Docker Compose services)
        └─ SSH into Codespace
                │
                ▼
        Bootstrap Script (agent-bootstrap.sh)
        ├─ Wait for services (DB, Redis, etc.) to be healthy
        ├─ Run migrations + seed data
        ├─ Fetch issue context via `gh` CLI → /tmp/agent-context.md
        └─ Invoke Claude Code CLI (headless)
                │
                ▼
        Claude Code Agent
        ├─ Plan phase (reads issue + repo docs)
        ├─ Implement phase (edits code)
        ├─ Self-verify phase (Playwright CLI + dev server)
        ├─ Test phase (test suite, fail-fast)
        └─ PR creation (branch + commit + `gh pr create`)
                │
                ▼
GitHub PR (label: "agent-pr")
        │
        ▼ (on review comments)
GitHub Actions Workflow (agent-feedback.yml)
        ├─ Spin up Codespace
        ├─ Feed review comments + diff to Claude Code
        ├─ Agent fixes, re-verifies, re-tests
        └─ Push follow-up commit
                │
                ▼
Human reviews → merges (or requests another round)
```

---

## Steps

### 1. GitHub App — Least Privilege Credentials

Create a GitHub App installed on the target repo only. This provides short-lived installation tokens (1-hour expiry) with granular permissions.

**Required permissions (and nothing else)**:

| Permission        | Access       | Why                                          |
| ----------------- | ------------ | -------------------------------------------- |
| Contents          | Read & Write | Clone repo, create branch, push commits      |
| Pull Requests     | Read & Write | Open PR, read review comments, post comments |
| Issues            | Read & Write | Read issue context, post status comments     |
| Checks / Statuses | Read         | Poll CI status before PR creation            |
| Metadata          | Read         | Required baseline for all GitHub Apps        |

**Explicitly denied** — no access to:

- Actions, Administration, Environments, Secrets, Members, Org settings
- No `delete` on any resource
- No branch protection bypass
- No ability to merge PRs (human-only)
- No access to other repos (single-repo installation)

**Token lifecycle**:

1. Workflow generates token via `actions/create-github-app-token@v1`
2. Passed to Codespace as `GITHUB_TOKEN` environment variable
3. Expires in ≤1 hour; workflow refreshes if run exceeds that
4. Invalidated on Codespace teardown

**Additional hardening**:

- Agent runs as non-root user inside Codespace
- No SSH keys — HTTPS token auth only
- `gh auth login --with-token` scoped to single repo
- Commits under dedicated bot identity (`agent-bot <agent-bot@noreply>`) for audit trail
- Git pre-push hook runs secret scanner on staged changes

### 2. Devcontainer + Docker Compose — App Dependencies

The agent needs the same runtime environment a developer uses, including real backing services.

**`.devcontainer/devcontainer.json`**:

- Uses `dockerComposeFile` to stand up all backing services
- Base image includes project toolchain (language runtime, package manager)
- Playwright browsers installed (`npx playwright install --with-deps`)
- Claude Code CLI installed
- `gh` CLI authenticated via `GITHUB_TOKEN`

**`.devcontainer/docker-compose.yml`** — backing services:

- `db` — MySQL/Postgres/etc. with test schema
- `redis` — Redis instance
- Any other required services (e.g., MinIO for S3, Mailhog for email)
- Health checks on all services

**Credentials for app services**:

- DB passwords, Redis auth, third-party API keys stored as **Codespace Secrets** (repo level)
- Injected as environment variables, never hardcoded or committed
- Agent never sees or logs these values
- Test/dev credentials only — never production values

**`postCreateCommand` sequence**:

1. Install language toolchain dependencies
2. Wait for all compose services to be healthy
3. Run database migrations
4. Run seed script (populate test data)
5. Install Playwright browsers
6. Verify app starts and responds on expected port

### 3. Trigger Workflow — `agent-run.yml`

Fires on `issues.labeled` with label `agent-ready`.

**Workflow steps**:

1. Generate GitHub App installation token (short-lived, scoped)
2. Create Codespace: `gh codespace create --repo OWNER/REPO --branch main --devcontainer-path .devcontainer/devcontainer.json`
3. Wait for Codespace to be ready
4. SSH in and run bootstrap script
5. On completion (success or failure), delete Codespace
6. Post final status comment to issue

### 4. Bootstrap Script — `scripts/agent-bootstrap.sh`

Runs inside the Codespace. Orchestrates the full agent flow.

**Steps**:

1. Fetch issue context: `gh issue view $ISSUE_NUMBER --json title,body,comments,labels`
2. Fetch linked issues/attachments via `gh api`
3. Write structured context to `/tmp/agent-context.md`
4. Invoke Claude Code CLI:
   ```
   claude -p \
     --allowedTools "Edit,Write,Terminal,Read,Grep,Glob" \
     < /tmp/agent-context.md
   ```
5. Post timeline updates to the issue as comments throughout
6. Exit with status code reflecting outcome

### 5. Agent Flow — Plan → Implement → Verify → Test → PR

Claude Code reads issue context + repo's `CLAUDE.md` / docs and executes:

**a) Plan phase**

- Analyze issue requirements and acceptance criteria
- Read relevant codebase files
- Produce implementation plan
- Post plan summary as issue comment

**b) Implement phase**

- Execute the plan: edit/create files
- Iteratively verify during implementation using Playwright CLI

**c) Self-verify phase (Playwright CLI)**

- Author small ad-hoc Playwright scripts (e.g., `/tmp/verify.spec.ts`) that:
  - Start the dev server
  - Navigate to relevant pages
  - Assert no console errors (`page.on('console', ...)`)
  - Click through acceptance criteria flows
  - Take screenshots
- Run via: `npx playwright test /tmp/verify.spec.ts --reporter=line`
- For quick visual checks: `npx playwright screenshot http://localhost:PORT/page /tmp/screenshot.png`
- Screenshots attached to PR body later

**d) Test phase (fail-fast)**

- Run the project's test suite with fail-fast flags:
  - `dotnet test -- --fail-fast`
  - `npm test -- --bail`
  - `pytest -x`
  - (whatever the repo uses)
- Stop on first failure, report only that failure's output (prevent context bloat)
- If test fails → fix and re-run (max 3 attempts, then escalate)

**e) PR creation**

- Create feature branch: `agent/issue-{number}-{slug}`
- Commit with conventional message: `feat: implement {title} (closes #{number})`
- Push and open PR via `gh pr create` with structured body:
  - Summary of changes
  - Verification steps taken
  - Screenshots from Playwright
  - Link back to issue
- Label PR with `agent-pr`
- Update issue with comment linking to PR

### 6. Feedback Loop Workflow — `agent-feedback.yml`

Fires on `pull_request_review.submitted` where PR has label `agent-pr`.

**Workflow steps**:

1. Generate GitHub App installation token
2. Spin up Codespace (or reuse if still alive)
3. Fetch PR review comments + diff
4. Feed to Claude Code with context: "Address this review feedback"
5. Agent:
   - Reads review comments
   - Summarizes intended fixes as PR comment before applying
   - Makes changes
   - Re-verifies in browser (Playwright CLI)
   - Re-runs tests (fail-fast)
   - Pushes follow-up commit
6. Capped at 2 feedback iterations, then posts "escalating to human" comment
7. Delete Codespace on completion

### 7. Guardrails & Safety

| Guardrail                    | Value              | Action on breach            |
| ---------------------------- | ------------------ | --------------------------- |
| Max files changed per run    | 20 (configurable)  | Escalate to human           |
| Self-test fix attempts       | 3                  | Escalate to human           |
| PR feedback iterations       | 2                  | Post "escalating" comment   |
| Token scope                  | Least privilege    | No merge, no admin, no delete |
| Merge capability             | None               | Human-only merge            |
| Credential persistence       | None               | Codespace deleted after run |
| Secret scanning              | Pre-push hook      | Block push on detection     |
| Bot identity                 | `agent-bot`        | All commits auditable       |
| Codespace lifecycle          | Deleted after run  | No lingering environments   |
| Network access               | GitHub API + package registries + localhost | Block arbitrary outbound |

### 8. Observability

Each run posts a timeline to the GitHub Issue as comments:

- `🔄 Agent started planning`
- `📋 Plan complete` (with plan summary)
- `🔨 Implementation started`
- `🌐 Browser verification: passed ✓` (screenshot attached) or `failed ✗ (console errors: ...)`
- `✅ Tests: 47 passed, 0 failed` or `❌ Test failed: test_name — fixing (attempt 1/3)...`
- `🔀 PR opened: #123`
- `💬 Feedback addressed` (on review loop)
- `⚠️ Escalated: exceeded retry cap`

**Metrics to track** (parseable from issue/PR comments + labels):

| Metric                    | What it measures                                          |
| ------------------------- | --------------------------------------------------------- |
| Autonomy rate             | % tickets reaching "Ready to Merge" without manual edits  |
| Manual rescue rate        | % runs requiring human code intervention beyond approvals  |
| First-pass CI success     | % of PRs where CI passes on the first push                |
| Iterations per PR         | Number of agent feedback loops before merge-ready          |
| Cycle time                | Issue labeled → PR opened, and labeled → merge-ready       |
| Rework rate               | Post-merge defects or rollbacks within N days              |
| Cost per run              | Tokens + Codespace compute + API calls                     |

---

## Verification (POC Acceptance Criteria)

1. Label an issue `agent-ready` → Codespace spins up, agent starts within 2 minutes
2. Agent reads issue, implements a small change, verifies in browser (screenshot posted to issue)
3. Tests run fail-fast; if green, PR is opened with structured summary + screenshots
4. Post one review comment requesting a change → agent pushes a fix commit
5. On repeated failure (exceed caps), agent posts escalation comment and stops
6. Codespace is deleted after every run (no credential persistence)
7. GitHub App token has no merge/admin/delete permissions

---

## 1-Day Schedule

| Hours | Task                                                                                   |
| ----- | -------------------------------------------------------------------------------------- |
| 1–2   | Create GitHub App with scoped permissions. Set up devcontainer config + Docker Compose services. Install Claude Code CLI + Playwright in Codespace. Verify manually. |
| 3–4   | Build `agent-run.yml` workflow: issue label trigger → Codespace creation → bootstrap script → Claude Code invocation. Test with a simple issue. |
| 5–6   | Agent prompt engineering: context injection format, plan→implement→verify→test→PR flow. Tune fail-fast test output. Iterate on Playwright verification scripts. |
| 7–8   | Build `agent-feedback.yml` workflow: PR review trigger → agent re-invocation. End-to-end test with a real issue through full cycle including one feedback round. |

---

## Decisions Log

| Decision                  | Chose                        | Over                                  | Why                                                    |
| ------------------------- | ---------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Trigger source            | GitHub Issues                | Jira                                  | Closer to code, native API, no cross-platform auth     |
| Compute environment       | GitHub Codespaces            | Self-hosted runner, local machine     | Full dev environment, browser-capable, disposable      |
| Browser verification      | Playwright CLI               | Playwright MCP                        | Simpler setup, no MCP server dependency, easier debug  |
| AI agent                  | Claude Code CLI              | Codex CLI, Aider                      | Headless mode, tool support, CLAUDE.md context         |
| App dependencies          | Docker Compose (real services) | Testcontainers, in-memory fakes     | Matches real dev environment, highest fidelity         |
| Credentials               | GitHub App (installation tokens) | PAT, `GITHUB_TOKEN`              | Short-lived, granular permissions, per-repo scoping    |
| Merge policy              | Manual only                  | Auto-merge                            | Safety for day-1 POC                                   |
| Approval surface          | PR only                      | Jira + PR, Jira only                  | Single platform, simplest flow                         |

---

## Excluded from POC

- Auto-merge / branch protection bypass
- Multi-repo or monorepo fan-out
- Codespace prebuilds / cost optimization
- Parallel issue processing
- Persistent agent memory across runs
- Rich dashboard (GitHub comments are the UI)
- Complex security/compliance automation beyond token hygiene + secret scanning
