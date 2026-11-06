import { authHandlers } from "./auth";
import { lenderHandlers } from "./lender";
import { portalHandlers } from "./portal";
import { tenantHandlers } from "./tenants";

export const handlers = [...authHandlers, ...lenderHandlers, ...portalHandlers, ...tenantHandlers];
