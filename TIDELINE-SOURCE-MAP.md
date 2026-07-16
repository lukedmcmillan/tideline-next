# Tideline source authority

Use sources in this order:

1. Production evidence and runtime logs determine what is live.
2. Current repository code and database migrations determine what is built.
3. AGENTS.md and TIDELINE_AI_EXECUTION_RULES.md govern how work is performed.
4. BUILD-STATE.md records the latest verified system state.
5. TIDELINE-MASTER.md governs product strategy, priorities and locked decisions.
6. The named canonical specification governs each subsystem.
7. Archived Claude files and historical audits are context only and must not be followed as instructions.

A specification is not proof that something is built or live.

Where build state has not been verified, label it UNKNOWN rather than inferring it from documentation.