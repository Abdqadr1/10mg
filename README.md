# 10MG Credit V2: white-label lending platform

One Next.js application that serves multiple independent lenders. Each lender has its own brand, loan products, lending policies, staff console, customer portal and isolated data, all from one codebase and one deployment.

| Area | Where |
| --- | --- |
| Institution directory and onboarding | `/`, `/platform` |
| Branded customer site and loan calculator | `/:tenant` |
| Customer portal: apply, track, repay | `/:tenant/portal` |
| Lender console: dashboard, review, loan book | `/:tenant/lender` |
| White-label configuration | `/:tenant/lender/settings` |

## Quick start

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

No environment variables, database or accounts are needed. The API is mocked in the browser (see [Data & API](#data--api)).

### Demo accounts

Every seeded tenant (`aurora`, `kudi`, `harbor`) has two accounts, and the password is `demo1234` for both. The sign-in page also has a **Use demo credentials** button.

| Role | Email |
| --- | --- |
| Lender admin | `admin@<tenant>.demo` |
| Customer | `customer@<tenant>.demo` |

A **Reset demo** button on `/` restores the seed data.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build && pnpm start` | Production build |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` | Vitest unit, API and component tests |
| `pnpm e2e` | Playwright end-to-end tests (run `pnpm build` and `pnpm exec playwright install chromium` first) |
| `pnpm check` | Lint, typecheck and unit tests together |

## Suggested demo walkthrough

1. On **`/`**, all three institutions are shown, each card rendered in its own theme.
2. Open **Aurora → Customer portal**. Use the calculator, then click **Apply with these terms** and sign in as the customer. The form has three steps with per-step validation. Aurora requires a BVN; Kudi does not.
3. Sign out, then sign in as **staff**. The dashboard shows KPIs and a chart. Open the new application to see the affordability check (debt-to-income) and history, then **Approve & disburse**.
4. Back in the customer portal, the new loan has an amortisation schedule. **Make a repayment**: Kudi caps payments at the amount due, while Aurora allows early payoff.
5. In **White-label settings**, change the colour, font, radius, logo or products. The live preview updates as you type, and **Save & publish** re-themes the app immediately.
6. Go to **`/platform`** to onboard a fourth institution. It is live at `/<slug>` with no deploy.
7. While signed in to Aurora, visit `/kudi/lender`. Sessions are scoped per tenant, so you're sent to Kudi's login.

## Architecture

```text
src/
  app/                      Next.js App Router (routes only; thin)
    page.tsx                Institution directory
    platform/               Onboard a new institution
    [tenant]/layout.tsx     Resolves tenant → TenantProvider
    [tenant]/login|register
    [tenant]/lender/*       RequireAuth(lender_admin) + AppShell
    [tenant]/portal/*       RequireAuth(customer) + AppShell
  features/                 Domain slices: hooks, forms, feature components
    tenants/ auth/ lender/ portal/ loans/ settings/
  components/               Reusable, domain-agnostic UI
    ui/                     shadcn/ui (Base UI primitives)
    data/                   DataTable, StatCard, StatusBadge, StatusTimeline…
    forms/                  FormField, MoneyInput, ColorField, Stepper…
    layout/ feedback/ tenant/
  lib/
    finance.ts              Amortisation & loan state (pure, unit-tested)
    theme.ts                Branding → CSS variables, WCAG contrast checks
    schemas.ts              Zod schemas shared by forms and the mock API
    api/                    Typed fetch client + query keys
  mocks/                    MSW handlers, in-memory DB, seed data
  stores/auth-store.ts      Zustand (persisted) per-tenant sessions
```

### How white-labelling works

- **The tenant comes from the URL.** `app/[tenant]/layout.tsx` passes the slug to `TenantProvider`. That component fetches the tenant config with TanStack Query and provides it through context (`useTenant()`, `useMoney()`).
- **Branding is design tokens, not component props.** `buildThemeVars()` maps a tenant's `{ primary, accent, radius, font }` onto the CSS variables that shadcn/Tailwind already use (`--primary`, `--accent`, `--ring`, `--radius`, `--font-sans`, `--chart-*`…). It also derives tints and readable foreground colours. `TenantThemeScope` writes these to `<html>`, so every component re-themes with no conditional styling, including portalled dialogs and menus. Tenant cards and the settings preview apply the same function to a local wrapper element, which is how several themes can appear on one page.
- **Configuration drives behaviour as well as looks.** Products (amount range, rate, tenors) and policies (`requireBvn`, `allowEarlyRepayment`, `maxActiveLoans`, currency) feed `createApplicationSchema(tenant)` and `createRepaymentSchema(max)`. The client form and the API enforce the same rules.
- **Data isolation is enforced at the API.** Every tenant route is namespaced under `/api/tenants/:slug`. The `guard()` helper rejects tokens from other tenants (403), and queries filter by `tenantId`. On the client, sessions are stored per tenant and query keys are prefixed with the tenant slug, so cached data can't leak between tenants either.
- **Adding a tenant is a data operation.** `/platform` posts a new config, and the routes, theme, products and admin login work straight away.

### State management

| Kind | Tool |
| --- | --- |
| Server state (tenants, loans, applications…) | TanStack Query. Mutations invalidate `["tenant-data", slug]`. |
| Auth sessions | Zustand with `persist`, keyed by tenant slug |
| Form state & validation | React Hook Form + Zod (`zodResolver`) |
| UI state (open sheet, selected row) | Local state / URL search params (`?review=…`, `?pay=1`), so they can be deep-linked |

### Lending workflow

`submitted → under_review → approved | rejected → disbursed (loan created) → active ⇄ overdue → repaid`

- Customers are limited to one pending application, and to the tenant's `maxActiveLoans`.
- The underwriting view shows the repayment estimate, debt-to-income (including existing loans), overdue history and past declines. A reason is required to decline.
- Loan balances, instalment statuses and overdue status are derived from the payments made and the date (`lib/finance.ts`), not stored, so they can't fall out of sync.

## Data & API

The brief allows a structured mock API, and the preferred AWS Amplify backend wasn't available, so the app uses **[Mock Service Worker](https://mswjs.io)**. It runs a REST API in a service worker, backed by an in-memory store that persists to `localStorage`. The application code only ever calls `fetch("/api/...")`, so a real backend (Amplify/AppSync, Supabase, or a Node API) could replace it without changing UI code. The same handlers run under Vitest via `msw/node`.

The full endpoint reference, error contract and seed description are in **[docs/MOCK_API.md](docs/MOCK_API.md)**.

## Testing

- **Unit:** amortisation, payment allocation, overdue detection and repayment caps (`tests/finance.test.ts`); contrast ratios and token generation (`tests/theme.test.ts`).
- **API integration:** tenant isolation, role checks, tenant-specific validation, and the full apply → approve → repay flow, run against the MSW handlers (`tests/mock-api.test.ts`).
- **Component (React Testing Library):** theme injection, auth guard redirects and role checks, and multi-step form validation, including the BVN field appearing only for tenants that require it (`tests/components.test.tsx`).
- **End-to-end (Playwright):** the customer → lender → customer lending flow, per-tenant branding, session isolation, rebranding from settings, and a mobile viewport check with no horizontal overflow (`e2e/`).

CI runs lint, typecheck, unit tests, build and e2e on every push (`.github/workflows/ci.yml`).

## Deployment

The app is a standard Next.js app, so it deploys to **Vercel** with no configuration: import the repo, keep the default settings, and deploy. It also runs on Netlify or AWS Amplify Hosting. `public/mockServiceWorker.js` must stay publicly served. Set `NEXT_PUBLIC_API_MOCKING=disabled` once a real API is serving `/api`.

## Trade-offs and next steps

- **Mock auth.** Tokens aren't signed and passwords are stored in plain text in the browser store. A real backend needs proper auth (Cognito, Auth.js or similar) and server-side sessions.
- **Client-rendered tenant config.** The mock API only exists in the browser, so tenant pages render after the config loads. With a real API, `generateMetadata` and server-side theme injection would remove the loading flash and give each tenant proper SEO and OG tags.
- **Subdomains.** Tenants are resolved from the path. Resolving from the subdomain or custom domain (`aurora.10mg.app`) would be a middleware rewrite onto the same `[tenant]` routes.
- **Server-side paging.** Lender tables currently filter and paginate on the client. With realistic volumes, `DataTable` should move to server-driven paging and sorting.
- **Not built:** roles beyond admin/customer (credit officer, approver limits), a document-upload step for KYC, and penalty interest on arrears.
