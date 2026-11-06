# Mock API reference

The app talks to a REST API under `/api`. In this submission, [Mock Service Worker](https://mswjs.io) answers those requests: it intercepts them in the browser, or in Node during tests. The application code doesn't know it's talking to a mock. To switch to a real backend, remove the worker and serve the same contract from the server.

- **Handlers:** [`src/mocks/handlers/`](../src/mocks/handlers)
- **Data store:** [`src/mocks/db.ts`](../src/mocks/db.ts). It's an in-memory store that persists to `localStorage` under the key `10mg-credit-db`.
- **Seed:** [`src/mocks/seed/`](../src/mocks/seed). It's deterministic (faker seed `2026`), with dates relative to when the seed runs.
- **Validation:** the same Zod schemas as the forms ([`src/lib/schemas.ts`](../src/lib/schemas.ts)). Invalid bodies return `422` with `fieldErrors`.

## Conventions

| Concern | Behaviour |
| --- | --- |
| Tenancy | Every tenant-scoped route starts with `/api/tenants/:slug`. Handlers only ever read records whose `tenantId` matches. |
| Auth | `Authorization: Bearer mock.<base64 userId>`, issued by `login` and `register`. |
| 401 | Missing or unknown token. The client clears that tenant's session. |
| 403 | The token belongs to another tenant, or to the wrong role. |
| 404 | Unknown tenant or record, including records that belong to another customer. |
| 409 | Business-rule conflict, such as an existing pending application, the loan limit being reached, or the application having already been decided. |
| 422 | Validation failure: `{ message, fieldErrors: { "field.path": "message" } }` |
| Latency | 250–600 ms in the browser, so loading states are visible. 0 ms in tests. |

## Endpoints

### Platform

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/tenants` | — | List institutions |
| POST | `/api/tenants` | — | Onboard an institution and its first admin (`OnboardTenantInput`) |
| GET | `/api/tenants/:slug` | — | Public tenant config: branding, products, policies |
| PATCH | `/api/tenants/:slug` | lender_admin | Update white-label settings (`TenantSettingsInput`) |
| POST | `/api/demo/reset` | — | Restore the seed data |

### Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/tenants/:slug/auth/login` | `{ email, password }` → `Session` |
| POST | `/api/tenants/:slug/auth/register` | Creates a customer and user → `Session` |
| GET | `/api/tenants/:slug/auth/me` | Current user |

### Lender console (`lender_admin`)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/lender/dashboard` | `DashboardStats`: KPIs, 6-month series, recent activity |
| GET | `/lender/applications` | `LoanApplication[]` |
| GET | `/lender/applications/:id` | `ApplicationReview`: estimate, debt-to-income, history |
| POST | `/lender/applications/:id/decision` | `{ action: "start_review" \| "approve" \| "reject", note }`. Approving disburses a loan. |
| GET | `/lender/customers` | `CustomerSummary[]` |
| GET | `/lender/customers/:id` | `CustomerOverview` |
| GET | `/lender/loans` | `Loan[]` |
| GET | `/lender/loans/:id` | `LoanDetail`: schedule and repayments |
| GET | `/lender/repayments` | `Repayment[]` |

### Customer portal (`customer`)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/me/overview` | `CustomerOverview` |
| POST | `/me/applications` | Validated against the tenant's products and policies |
| GET | `/me/loans/:id` | `LoanDetail` (own loans only) |
| POST | `/me/loans/:id/repayments` | `{ amount, method }`. The amount is capped by the tenant's early-repayment policy. |
| GET | `/me/repayments` | `Repayment[]` |

All paths in the last two tables are relative to `/api/tenants/:slug`. The entity types are in [`src/types/index.ts`](../src/types/index.ts).

## Derived loan state

The store only keeps `principal`, `interestRate`, `tenorMonths`, `disbursedAt` and `amountPaid` for each loan. Everything else is computed on read by [`summarizeLoan`](../src/lib/finance.ts), so the data can't drift out of sync:

- **Schedule:** an amortised schedule with monthly compounding. The last instalment absorbs any rounding.
- **Instalment status:** payments are allocated to instalments in order, giving `paid`, `partial`, `overdue`, `due` or `upcoming`.
- **Loan status:** `repaid` when the outstanding balance is 0. `overdue` when any instalment is past due and unpaid. `active` otherwise.
- **`amountDueNow`:** arrears plus the next instalment. When early repayment is disabled, this is the most a customer can pay.

## Seed data

Each tenant has 24 customers, about 35 applications (including 5 pending), the loans for approved applications, and a repayment history with some missed instalments.

| Tenant | Currency | Look | Notable policy |
| --- | --- | --- | --- |
| `aurora` – Aurora Bank | NGN | Deep green, serif, square corners | BVN required |
| `kudi` – Kudi Microfinance | NGN | Purple, rounded font, pill corners | No early repayment |
| `harbor` – Harbor Credit | KES | Navy, Geist | Up to 3 open loans |

Demo logins for each tenant (password `demo1234`):

- `admin@<slug>.demo`: lender admin
- `customer@<slug>.demo`: a customer with one repaid loan and one active loan
