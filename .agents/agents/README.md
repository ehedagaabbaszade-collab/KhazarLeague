# Khazar League subagent profiles

These seven role files are reusable instruction profiles for Codex subagents. They are not auto-discovered runtime agents: when assigning work with `collaboration.spawn_agent`, the coordinator must read the selected profile and include its instructions in the agent task.

Use no more than three subagents at the same time. Keep the coordinator responsible for shared-file coordination, final integration, and verification. Do not assign overlapping write scopes without explicit coordination.

Profiles:

- `ui-ux-designer.md`
- `frontend-engineer.md`
- `backend-engineer.md`
- `database-engineer.md`
- `football-domain-specialist.md`
- `qa-engineer.md`
- `security-engineer.md`

The profiles refer to skills already present under `../skills/`; they do not install, copy, or modify skills.
