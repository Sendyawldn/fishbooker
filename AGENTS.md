# AGENTS.md - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: 5de5017263401012b3516c76e68be3cfdc5d1f09a2569d5943cfcd4105e0dde4

This file is an adapter entrypoint for agent discovery.
The canonical policy source is [.instructions.md](.instructions.md).

## Mandatory Bootstrap Chain

1. Load [.instructions.md](.instructions.md) first as the single source of truth.
2. Read baseline governance from [.agent-context/rules/](.agent-context/rules).
3. Apply request templates from [.agent-context/prompts/](.agent-context/prompts).
4. Enforce review contracts from [.agent-context/review-checklists/](.agent-context/review-checklists).
5. Read change-risk maps and continuity state from [.agent-context/state/](.agent-context/state).
6. Enforce policy thresholds from [.agent-context/policies/](.agent-context/policies).
7. Use dynamic stack and architecture reasoning from project context docs and live research signals.

## Trigger Rules

- New project or module requests: propose architecture first and wait for approval.
- Refactor or fix requests: propose plan first, then execute safely.
- Completion: run [.agent-context/review-checklists/pr-checklist.md](.agent-context/review-checklists/pr-checklist.md) before declaring done.

If this adapter drifts from canonical behavior, refresh from [.instructions.md](.instructions.md) and update the hash metadata.
