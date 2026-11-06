import { HttpResponse, http } from "msw";
import { onboardTenantSchema, tenantSettingsSchema } from "@/lib/schemas";
import type { Tenant } from "@/types";
import { createId, db, now, persist, resetDb } from "../db";
import { API, errorResponse, guard, latency, parseBody, resolveTenant } from "./utils";

export const tenantHandlers = [
  http.get(`${API}/tenants`, async () => {
    await latency();
    return HttpResponse.json(db().tenants);
  }),

  http.get(`${API}/tenants/:slug`, async ({ params }) => {
    await latency();
    const resolved = resolveTenant(params.slug);
    if (resolved.error) return resolved.error;
    return HttpResponse.json(resolved.tenant);
  }),

  http.post(`${API}/tenants`, async ({ request }) => {
    await latency();
    const parsed = await parseBody(request, onboardTenantSchema);
    if (parsed.error) return parsed.error;
    const input = parsed.data;
    if (db().tenants.some((tenant) => tenant.slug === input.slug)) {
      return errorResponse(409, "That URL is already taken", { slug: "Another institution already uses this URL" });
    }
    const tenant: Tenant = {
      id: input.slug,
      slug: input.slug,
      name: input.name,
      tagline: `Credit made simple by ${input.name}.`,
      logoUrl: null,
      supportEmail: input.supportEmail,
      branding: { primary: input.primary, accent: input.accent, radius: 0.5, font: "geist" },
      settings: { currency: input.currency, allowEarlyRepayment: true, requireBvn: false, maxActiveLoans: 1 },
      products: [
        {
          id: createId(`${input.slug}-prd`),
          name: "Personal Loan",
          description: "General purpose personal financing.",
          minAmount: 10_000,
          maxAmount: 500_000,
          interestRate: 20,
          tenors: [3, 6, 12],
        },
      ],
      createdAt: now().toISOString(),
    };
    db().tenants.push(tenant);
    db().users.push({
      id: createId(`${input.slug}-usr`),
      tenantId: tenant.id,
      name: input.adminName,
      email: input.adminEmail.toLowerCase(),
      password: input.adminPassword,
      role: "lender_admin",
      customerId: null,
    });
    persist();
    return HttpResponse.json(tenant, { status: 201 });
  }),

  http.patch(`${API}/tenants/:slug`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug, "lender_admin");
    if (auth.error) return auth.error;
    const parsed = await parseBody(request, tenantSettingsSchema);
    if (parsed.error) return parsed.error;
    Object.assign(auth.tenant, parsed.data);
    persist();
    return HttpResponse.json(auth.tenant);
  }),

  http.post(`${API}/demo/reset`, async () => {
    await latency();
    resetDb();
    return HttpResponse.json({ ok: true });
  }),
];
