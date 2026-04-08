# Agent Communication Protocol

This folder contains messages between the Boss Agent (orchestrator) and Worker Agents.

## Structure
```
.agents/messages/
  boss/              ← Messages FROM the Boss TO agents
    agent-1.md        ← Instructions for Agent 1
    agent-2a.md       ← Instructions for Agent 2A
    ...
  from-agent-1/      ← Messages FROM Agent 1 TO the Boss
    done.md           ← Completion report
    blocker.md        ← If stuck, describe the issue here
  from-agent-2a/
  from-agent-2b/
  from-agent-2c/
  from-agent-2d/
  from-agent-3/
  from-agent-4/
```

## Rules for Worker Agents

1. **When you finish your task**, create `.agents/messages/from-agent-N/done.md` with:
   - What files you created/modified
   - What you kept vs removed
   - Any issues or decisions you made
   - Any blockers for the next phase

2. **If you're stuck or need a decision**, create `.agents/messages/from-agent-N/blocker.md` with:
   - What you're stuck on
   - Options you see
   - What you need from the Boss

3. **Check `.agents/messages/boss/agent-N.md`** for any follow-up instructions from the Boss.

## Rules for Boss Agent

1. Write initial kickoff messages in `boss/agent-N.md`
2. After an agent reports done, review their `from-agent-N/done.md`
3. Write follow-up instructions or approval in `boss/agent-N.md`
