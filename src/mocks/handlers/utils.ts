import { HttpResponse, delay } from "msw";
import type { z } from "zod";
import type { Role, Tenant } from "@/types";
import { db, findTenant } from "../db";
import type { StoredUser } from "../types";

export const API = "*/api";

export function latency() {
  return delay(process.env.NODE_ENV === "test" ? 0 : 250 + Math.round(Math.random() * 350));
}

export function errorResponse(status: number, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json({ message, fieldErrors }, { status });
}

export function issuesToFieldErrors(issues: z.core.$ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: errorResponse(400, "Request body must be valid JSON"), data: null } as const;
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: errorResponse(422, "Please correct the highlighted fields", issuesToFieldErrors(result.error.issues)), data: null } as const;
  }
  return { error: null, data: result.data as z.infer<T> } as const;
}

export function issueToken(user: StoredUser) {
  return `mock.${btoa(user.id)}`;
}

export function publicUser(user: StoredUser) {
  const { password: _password, ...rest } = user;
  return rest;
}

type Failure = { error: Response };

export function resolveTenant(slug: string | readonly string[] | undefined): Failure | { error: null; tenant: Tenant } {
  const tenant = typeof slug === "string" ? findTenant(slug) : null;
  return tenant ? { error: null, tenant } : { error: errorResponse(404, "Institution not found") };
}

export function authenticate(request: Request, tenant: Tenant, role?: Role): Failure | { error: null; user: StoredUser } {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token.startsWith("mock.")) return { error: errorResponse(401, "You need to sign in") };
  let userId: string;
  try {
    userId = atob(token.slice(5));
  } catch {
    return { error: errorResponse(401, "Your session is invalid. Please sign in again.") };
  }
  const user = db().users.find((item) => item.id === userId);
  if (!user) return { error: errorResponse(401, "Your session has expired. Please sign in again.") };
  if (user.tenantId !== tenant.id) return { error: errorResponse(403, "You do not have access to this institution") };
  if (role && user.role !== role) return { error: errorResponse(403, "You do not have permission to do that") };
  return { error: null, user };
}

export function guard(request: Request, slug: string | readonly string[] | undefined, role?: Role): Failure | { error: null; tenant: Tenant; user: StoredUser } {
  const resolved = resolveTenant(slug);
  if (resolved.error) return resolved;
  const auth = authenticate(request, resolved.tenant, role);
  if (auth.error) return auth;
  return { error: null, tenant: resolved.tenant, user: auth.user };
}
