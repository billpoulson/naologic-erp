# ADR-005: UTC Date Persistence and Client Timezone Transformation

## Status
Accepted

## Context
Applications must handle dates consistently across servers, databases, and clients in different timezones. Storing dates in local time or mixed formats leads to ambiguity, incorrect calculations, and bugs when users or systems span multiple timezones.

## Decision

1. **Persist all dates in UTC** – All date/time values stored in databases, APIs, and persistent storage use UTC (ISO 8601 with `Z` suffix or equivalent).

2. **Transform at runtime** – Dates are converted from UTC to the client's local timezone only at display time (UI layer). Business logic and API contracts work in UTC.

3. **API contracts** – APIs accept and return dates in UTC (e.g. ISO 8601 strings like `2025-03-01T14:30:00Z`).

## Consequences

- **Positive**: Single source of truth; no ambiguity when users or systems are in different timezones
- **Positive**: Correct ordering and duration calculations regardless of timezone
- **Positive**: Aligns with common best practice (ISO 8601, database conventions)
- **Consideration**: Client code must explicitly convert UTC → local for display; use platform APIs (e.g. `Intl`, `Date`, Angular `DatePipe` with timezone)
- **Consideration**: User input in local time must be converted to UTC before persistence
