# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any shell command containing `curl` or `wget` will be intercepted and blocked by the context-mode plugin. Do NOT retry.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` to fetch and index web pages
- `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any shell command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` will be intercepted and blocked. Do NOT retry with shell.
Instead use:
- `context-mode_ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — BLOCKED
Do NOT use any direct URL fetching tool. Use the sandbox equivalent.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)
Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `context-mode_ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `context-mode_ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)
If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `context-mode_ctx_execute_file(path, language, code)` instead. Only your printed summary enters context.

### grep / search (large results)
Search results can flood context. Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |

---

# Git Workflow — MANDATORY rules

These rules are NON-NEGOTIABLE. Every agent working in this repo MUST follow them.

## Branch Protection

- **NEVER push directly to `main`**. The `main` branch is protected and requires pull requests.
- All work happens on feature branches: `feat/`, `fix/`, `refactor/`, `ci/`, `docs/`, `chore/`.
- Branch names: lowercase, kebab-case. Example: `fix/hydration-errors`, `feat/markdown-renderer`.

## Pull Request Workflow

1. Create a branch from `main`.
2. Make commits following the commit format below.
3. Push the branch and open a PR with `gh pr create`.
4. **Wait for ALL CI checks to pass** before merging.
5. Merge only when: lint ✓, typecheck ✓, tests ✓, build ✓.
6. If CI fails, fix the issue on the branch and push again. Never skip or ignore failing checks.

## Commit Message Format

Conventional Commits — enforced by commitlint.

```
<type>: <summary>
```

- **Types**: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`
- **Subject**: lowercase, max 100 chars, no period at end
- **Body** (optional): max 120 chars per line
- **Header**: max 120 chars total

Examples:
```
feat: add markdown rendering for assistant messages
fix: resolve react hydration mismatch on vercel
ci: add github actions workflow for lint and tests
```

## CI Pipeline

GitHub Actions runs 5 parallel jobs on every push and PR:

| Job | Command | What it checks |
|-----|---------|----------------|
| **Lint** | `pnpm lint` | Biome linting + formatting |
| **Typecheck** | `pnpm exec tsc --noEmit` | TypeScript strict mode |
| **Unit Tests** | `pnpm jest --testPathIgnorePatterns=__integration__` | 400+ unit tests |
| **Build** | `pnpm expo export --platform web` | Web export produces valid output |
| **Integration Tests** | `pnpm jest --testPathPattern=__integration__` | SDK tests (only when server configured) |

All jobs except Integration Tests MUST pass before merging.

## Pre-Push Checklist

Before pushing, run these locally to catch issues early:

```bash
pnpm lint                # Biome check
pnpm exec tsc --noEmit   # TypeScript
pnpm test                # Jest (all tests)
```

## Integration Tests

Integration tests live in `src/__integration__/` and are **self-contained** — they spawn their own `opencode serve` instance automatically.

```bash
# Run integration tests (spawns its own server)
pnpm test:integration
```

They use a dedicated Jest config (`jest.integration.config.js`) with plain Node environment.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
