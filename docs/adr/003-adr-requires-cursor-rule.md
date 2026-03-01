# ADR-003: ADR Requires Matching Cursor Rule

## Status
Accepted

## Context
ADRs document key decisions, but without reinforcement the AI may not consistently apply them during development. Documentation alone does not change behavior.

## Decision
When adding an ADR, a Cursor rule must also be created to reinforce it. Every ADR must have a corresponding rule in `.cursor/rules/`.

## Consequences
- ADRs and rules are paired—no orphan ADRs
- The rule encodes the decision so the AI applies it in code
- Workflow: Create ADR → Create/update Cursor rule → Reference in code/docs when relevant
