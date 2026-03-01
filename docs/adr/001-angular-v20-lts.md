# ADR-001: Angular v20 for LTS

## Status
Accepted

## Context
The Outline specifies Angular 17+. Multiple versions are available. We need a stable foundation for production use.

## Decision
Use Angular v20 for LTS (Long Term Support). Security fixes through November 2026.

## Options Considered
- Angular 17/18: Meets minimum requirement but older
- Angular 19: Active development
- Angular 20: LTS as of May 2025

## Consequences
- Use `npx @angular/cli@20 new` to scaffold
- LTS provides security fixes through Nov 2026
- Stable foundation for the Work Order Schedule Timeline

## Reference
[Angular versioning and releases](https://angular.dev/reference/releases)
