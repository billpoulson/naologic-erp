# ADR-002: Prefer @ Path Alias for Imports

## Status
Accepted

## Context
Relative imports (`./../../shared`) can become long and brittle as the project grows. Path aliases improve readability and make refactoring easier.

## Decision
Prefer `@` path alias for imports (e.g. `@app`, `@shared`, `@core`) instead of relative paths.

## Examples

```typescript
// ❌ Avoid
import { WorkOrderService } from '../../../core/services/work-order.service';

// ✅ Prefer
import { WorkOrderService } from '@app/core/services/work-order.service';
```

## Consequences
- Configure path aliases in `tsconfig.json` (and `angular.json` if needed)
- Shorter, clearer imports
- Easier refactoring when moving files
- Consistent across the codebase
