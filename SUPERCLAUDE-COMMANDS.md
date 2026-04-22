# SUPERCLAUDE-COMMANDS.md — TIDELINE REFERENCE

## Rule Zero — Always use /sc: commands
Plain prompts waste tokens and skip agent routing. Phrase every prompt as /sc:*. If unsure, use /sc:recommend first.

## First command every session
/sc:index-repo
Reduces codebase loading from ~58K tokens to ~3K. Run once per session.

## Decision tree

### Starting something new
- Vague idea, need to shape it: /sc:brainstorm
- Have a spec, need implementation plan: /sc:workflow
- Estimate feature timing: /sc:estimate
- Design API, schema, component interface: /sc:design
- Expert critique on a spec before building: /sc:spec-panel

### Building
- Feature or new code: /sc:implement
- Compile, package, run build: /sc:build
- Improve existing code quality: /sc:improve
- Remove dead code: /sc:cleanup
- Run tests with coverage: /sc:test

### Broken or unclear
- Cron, webhook, route misbehaving: /sc:troubleshoot
- Deep quality/security/perf review: /sc:analyze
- Explain code or system: /sc:explain
- Validate task completion: /sc:reflect

### Documentation
- Document function, component, API: /sc:document
- Full project knowledge base: /sc:index
- Reload codebase context efficiently: /sc:index-repo

### Orchestration
- Complex multi-agent task: /sc:task
- Meta breakdown of big project: /sc:spawn
- Default project manager: /sc:pm
- Specific specialist agent: /sc:agent
- Load saved session: /sc:load
- Save session at end (mandatory): /sc:save
- Pick right MCP tool: /sc:select-tool

### Research and utilities
- Deep web research: /sc:research
- Business strategy analysis: /sc:business-panel
- Commit with intelligent message: /sc:git
- Not sure which command: /sc:recommend
- List all commands: /sc:help

## Commands that do not exist
- /sc:fix → use /sc:troubleshoot (diagnose) or /sc:improve (quality)
- /sc:refactor → use /sc:improve
- /sc:debug → use /sc:troubleshoot
- /sc:review → use /sc:analyze
- /sc:deploy → use /sc:build then Vercel CLI manually
- /sc:plan → use /sc:workflow (features) or /sc:brainstorm (ideas)

## Tideline-specific patterns

### Morning brief
/sc:workflow "Personalised morning brief pipeline. 7am email, pulls from stories + velocity_scores filtered by user_topics. Quality-gated before send. Uses Resend. Reference CLAUDE.md priorities."

### Threshold alerts
/sc:implement "Threshold alert cron. When velocity_scores crosses a band boundary, fire email via Resend using user_alert_preferences. Follow existing cron pattern in app/api/cron/."

### Divergence detection
/sc:implement "Divergence detection Phase 1 only: create divergences table, build lib/divergence.ts, add cron at app/api/cron/divergence-detection/route.ts, seed 3 test rows. Do not build UI yet."

### Debugging a scraper
/sc:troubleshoot "[scraper name] hitting wrong endpoint. Check lib/scrapers/[file].ts and propose the fix."

### Before committing
/sc:analyze [file or dir]
/sc:test
/sc:git "commit and push"

### End of session (mandatory)
/sc:save
/sc:implement "Update tasks/todo.md with what was completed, known issues, next step. Update tasks/lessons.md with anything learned."
