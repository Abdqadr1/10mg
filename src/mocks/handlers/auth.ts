import { HttpResponse, http } from "msw";
import { loginSchema, registerSchema } from "@/lib/schemas";
import type { Customer, Session } from "@/types";
import { createId, db, now, persist } from "../db";
import type { StoredUser } from "../types";
import { API, errorResponse, guard, issueToken, latency, parseBody, publicUser, resolveTenant } from "./utils";

function session(user: StoredUser): Session {
  return { token: issueToken(user), user: publicUser(user) };
}

export const authHandlers = [
  http.post(`${API}/tenants/:slug/auth/login`, async ({ request, params }) => {
    await latency();
    const resolved = resolveTenant(params.slug);
    if (resolved.error) return resolved.error;
    const parsed = await parseBody(request, loginSchema);
    if (parsed.error) return parsed.error;
    const user = db().users.find(
      (item) => item.tenantId === resolved.tenant.id && item.email === parsed.data.email.toLowerCase(),
    );
    if (!user || user.password !== parsed.data.password) {
      return errorResponse(401, `Incorrect email or password for ${resolved.tenant.name}`);
    }
    return HttpResponse.json(session(user));
  }),

  http.post(`${API}/tenants/:slug/auth/register`, async ({ request, params }) => {
    await latency();
    const resolved = resolveTenant(params.slug);
    if (resolved.error) return resolved.error;
    const parsed = await parseBody(request, registerSchema);
    if (parsed.error) return parsed.error;
    const input = parsed.data;
    const email = input.email.toLowerCase();
    if (db().users.some((user) => user.tenantId === resolved.tenant.id && user.email === email)) {
      return errorResponse(409, "An account with this email already exists", { email: "This email is already registered" });
    }
    const customer: Customer = {
      id: createId(`${resolved.tenant.slug}-cus`),
      tenantId: resolved.tenant.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      phone: input.phone,
      employmentStatus: "employed",
      employer: "",
      monthlyIncome: 0,
      createdAt: now().toISOString(),
    };
    const user: StoredUser = {
      id: createId(`${resolved.tenant.slug}-usr`),
      tenantId: resolved.tenant.id,
      name: `${input.firstName} ${input.lastName}`,
      email,
      password: input.password,
      role: "customer",
      customerId: customer.id,
    };
    db().customers.push(customer);
    db().users.push(user);
    persist();
    return HttpResponse.json(session(user), { status: 201 });
  }),

  http.get(`${API}/tenants/:slug/auth/me`, async ({ request, params }) => {
    await latency();
    const auth = guard(request, params.slug);
    if (auth.error) return auth.error;
    return HttpResponse.json(publicUser(auth.user));
  }),
];
