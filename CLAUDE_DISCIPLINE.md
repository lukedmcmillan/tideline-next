# CLAUDE_DISCIPLINE.md — TIDELINE WORKING PROCESS
Paired with CLAUDE_RULES.md (codebase invariants). Read at session start.

## Relationship to other rules files
- CLAUDE_RULES.md — WHAT must not change (model assignments, caching, design tokens, CTAs, landing page, plan-mode zones, locked decisions)
- CLAUDE_DISCIPLINE.md (this file) — HOW to work (plan first, verify, subagents, lessons)

If the two conflict, CLAUDE_RULES.md wins. Invariants beat process.

## 1. Plan Mode Default
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, stop and re-plan. Do not keep pushing
- For features touching 3+ files: /sc:workflow first, /sc:implement second
- Plan-mode-required zones are listed in CLAUDE_RULES.md

## 2. Subagent Strategy
Route to installed SuperClaude agents, not generic subagents:
- @backend-architect — API routes, database, cron jobs
- @frontend-architect — UI components, page layouts
- @python-expert — scraper optimisation, data processing

Offload research, exploration, and parallel analysis to subagents. One task per subagent.

## 3. Self-Improvement Loop
- After any correction from Luke, update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- If a lesson becomes a permanent codebase fact, promote it to CLAUDE_RULES.md

## 4. Verification Before Done
Never mark a task complete without proving it works:
- Database changes: run the SELECT, show the result
- API routes: curl it or show the response
- UI: describe what renders or screenshot if possible
- Ask: "Would a staff engineer approve this?"

## 5. Ship Ugly, Refactor Later
- Simplicity first. No refactoring of working code unless asked
- If a fix feels hacky but works and is isolated, ship it
- Refactor only when retention proves the feature matters, the hack blocks new work, or Luke asks

## 6. Autonomous vs Plan-Mode Zones
Autonomous (just fix it): UI components, pure logic, TypeScript types, lint, non-critical tests.
Plan-mode required: see CLAUDE_RULES.md for the full list.

## Task Management
1. Plan First: write plan to tasks/todo.md with checkable items
2. Verify Plan: check in with Luke before implementation
3. Track Progress: mark items complete as you go
4. Explain Changes: high-level summary at each step
5. Document Results: add review section to tasks/todo.md
6. Capture Lessons: update tasks/lessons.md after corrections

## Session Discipline
First command every session:
/sc:index-repo

Last commands every session (mandatory):
/sc:save
/sc:implement "Update .claude/SPEC.md with what was completed this session, new known issues, and next step. Update LESSONS.md with anything new learned. Keep both concise."

## Core Principles
- Simplicity First: every change as simple as possible
- No Laziness: find root causes, no temporary fixes
- Spec Loyalty: locked decisions stay locked, ask before deviating
- Prove It Works: no "should work", show it works
- One Task at a Time: finish and verify before starting the next
