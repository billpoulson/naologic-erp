# ADR-006: Component CSS in External Files

## Status
Superseded by [ADR-007](007-prefer-no-inline-styles.md)

## Context
Angular components support inline styles via the `styles` or `styleUrls` array. Inline styles work well for small amounts of CSS (a few lines), but large inline style blocks make components harder to read, reduce editor support (syntax highlighting, formatting), and complicate maintenance. Components with hundreds of lines of embedded CSS become unwieldy.

## Decision

1. **Extract CSS when substantial** – When a component has more than ~15–20 lines of CSS, move the styles into a dedicated `.css` or `.scss` file alongside the component.

2. **Reference via styleUrls** – Use `styleUrls` in the component decorator to reference the external file:
   ```typescript
   @Component({
     selector: 'app-example',
     templateUrl: './example.component.html',
     styleUrls: ['./example.component.scss'],
   })
   ```

3. **Co-locate** – Place the style file in the same directory as the component (e.g. `example.component.scss` next to `example.component.ts`).

4. **Keep small styles inline** – Components with only a few lines of CSS may keep them inline in the `styles` array for simplicity.

## Consequences

- **Positive**: Better readability; components focus on logic and template
- **Positive**: Full editor support for CSS/SCSS (syntax highlighting, formatting, linting)
- **Positive**: Easier to maintain and diff style changes
- **Consideration**: One more file per component when styles are extracted
- **Consideration**: Use `encapsulation` defaults; external files still get view encapsulation when using `::ng-deep` or `:host` as needed
