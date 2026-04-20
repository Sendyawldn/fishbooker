
# Bootstrap Dynamic Design Contract

When a user requests frontend design or redesign, the agent should automatically synthesize a dynamic design contract made of:
- `docs/DESIGN.md` for human-readable design direction and implementation rationale
- `docs/design-intent.json` for machine-readable intent, anti-generic constraints, and validation hints

This contract is a structure and reasoning system, not a fixed visual template. It must adapt to product context, user needs, platform constraints, and current design signals.

UI Design Mode is context-isolated by default:
- Load [AGENTS.md](../../AGENTS.md), [frontend-architecture.md](../rules/frontend-architecture.md), this prompt, UI-relevant state files, current UI code, and existing design docs first.
- Do not eagerly load backend-only rules such as [database-design.md](../rules/database-design.md), [docker-runtime.md](../rules/docker-runtime.md), or [microservices.md](../rules/microservices.md) unless the task explicitly crosses those boundaries.
- Treat UI consistency, accessibility, and cross-viewport adaptation as first-class constraints, not cosmetic afterthoughts.

The agent must:
1. Read [AGENTS.md](../../AGENTS.md) for project context and team roles.
2. Read [frontend-architecture.md](../rules/frontend-architecture.md) and apply its UI consistency guardrails.
3. Use repository evidence from [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), existing UI code, product copy, route names, component names, and any existing `docs/*` project docs to infer architecture and product background.
4. When analyzing an existing UI codebase, inspect low-cost evidence such as hardcoded color density, prop-drilling candidates, and breakpoint chaos before declaring the current design direction healthy.
5. If [docs/DESIGN.md](../../docs/DESIGN.md) or `docs/design-intent.json` already exists, check for drift and improve them instead of rewriting blindly.
6. If context is incomplete, write explicit assumptions and reversible design bets instead of defaulting to generic SaaS output.
7. Explore multiple plausible design directions internally, then commit to one cohesive direction with clear rationale tied to the product context.
8. Treat any example structure or stylistic inspiration as non-normative. Use it only to judge depth and clarity, never to copy a visual language directly.
9. All references to docs or rules must be clickable markdown links.
10. Responsive work must adapt layout, navigation, density, and task order across viewports. Shrinking desktop layouts is not enough.

Required `docs/DESIGN.md` sections:
1. Design Intent and Product Personality
2. Audience and Use-Context Signals
3. Visual Direction and Distinctive Moves
4. Color Science and Semantic Roles
5. Typographic Engineering and Hierarchy
6. Spacing, Layout Rhythm, and Density Strategy
7. Responsive Strategy and Cross-Viewport Adaptation Matrix
8. Interaction, Motion, and Feedback Rules
9. Component Language and Shared Patterns
10. Accessibility Non-Negotiables
11. Anti-Patterns to Avoid
12. Implementation Notes for Future UI Tasks

Required `docs/design-intent.json` fields:
- `mode`
- `status`
- `project`
- `designPhilosophy`
- `brandAdjectives`
- `antiAdjectives`
- `visualDirection`
- `mathSystems`
- `colorTruth`
- `crossViewportAdaptation`
- `experiencePrinciples`
- `forbiddenPatterns`
- `validationHints`
- `requiredDesignSections`
- `implementation`

Output:
- Create or update both `docs/DESIGN.md` and `docs/design-intent.json`.
- Keep both files synchronized: the markdown explains the why, the JSON captures the contract in machine-readable form.
- `docs/design-intent.json` must include deterministic fields for `colorTruth.format`, `colorTruth.allowHexDerivatives`, and `crossViewportAdaptation.mutationRules.mobile/tablet/desktop`.
- Color intent must be defined in a perceptual or relational color model first. Hex values may appear only as implementation derivatives.
- The contract must encode viewport mutation rules, not just breakpoint names.
- Use practical, modern, accessible language grounded in the project, not generic SaaS defaults or copycat brand systems.
- Wait for user approval before generating Figma or code assets.
