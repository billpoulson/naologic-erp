# ADR-007: Prefer No Inline Styles

## Status
Accepted

## Context
Angular components support inline styles via the `styles` array in the component decorator. While convenient for tiny snippets, inline styles reduce editor support (syntax highlighting, formatting, linting), make diffs noisier, and encourage style bloat. Consistent use of external files improves maintainability and tooling.

## Decision

1. **Prefer external files** – Use `styleUrls` with a dedicated `.css` or `.scss` file for all component styles. Avoid the `styles` array.

2. **Co-locate** – Place the style file next to the component (e.g. `example.component.scss` next to `example.component.ts`).

3. **Exception** – Only use inline `styles` when strictly necessary (e.g. dynamic styles, third-party constraints). Document the reason in a comment.

## Consequences

- **Positive**: Consistent tooling and formatting for all component CSS
- **Positive**: Cleaner component files; styles live in dedicated files
- **Positive**: Easier to review and maintain style changes
- **Consideration**: One file per component even for minimal styles
- **Supersedes**: [ADR-006](006-component-css-external-files.md) – no longer allow "small styles inline"
