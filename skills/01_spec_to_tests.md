# Spec → Tests discipline

## Rule
No requirement without at least one test.

## Test layers
- **Unit**: JSON validation, state reducers, doomfire update step.
- **Component/Renderer**: A2UI message parsing + component allowlist.
- **Integration (Playwright/Cypress)**: preview sandbox enforcement, engage gating, event allowlist.
- **Contract**: traceability matrix mapping R* -> T*.

## Recommended tools (web host)
- TypeScript + Vitest (unit)
- Playwright (integration)

## Example: R3.2 Preview sandbox
- Unit tests verify surface allowlist and action deny-list.
- Integration tests confirm no outbound network requests during preview.
