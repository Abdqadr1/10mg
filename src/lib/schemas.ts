import { z } from "zod";
import type { Tenant } from "@/types";
import { isHexColor } from "@/lib/theme";

export const RESERVED_SLUGS = ["platform", "api", "admin", "login", "_next"];
export const TENOR_OPTIONS = [1, 3, 6, 9, 12, 18, 24, 36];

const hexColor = z.string().refine(isHexColor, { error: "Use a 6-digit hex colour, e.g. #0b6e4f" });
const phone = z.string().regex(/^\+?[0-9\s-]{10,16}$/, { error: "Enter a valid phone number" });

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address" }),
  password: z.string().min(6, { error: "Password must be at least 6 characters" }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, { error: "First name is required" }),
    lastName: z.string().trim().min(2, { error: "Last name is required" }),
    email: z.email({ error: "Enter a valid email address" }),
    phone,
    password: z.string().min(8, { error: "Use at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const EMPLOYMENT_STATUSES = ["employed", "self_employed", "business_owner", "student", "unemployed"] as const;

export const applicationBaseSchema = z.object({
  productId: z.string().min(1, { error: "Choose a loan product" }),
  amount: z.number({ error: "Enter an amount" }).positive({ error: "Enter an amount" }),
  tenorMonths: z.number({ error: "Choose a tenor" }).int(),
  purpose: z.string().trim().min(10, { error: "Tell us a bit more (at least 10 characters)" }).max(300),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES, { error: "Choose your employment status" }),
  employer: z.string().trim().max(80),
  monthlyIncome: z.number({ error: "Enter your monthly income" }).positive({ error: "Enter your monthly income" }),
  bvn: z.string().trim(),
  consent: z.boolean().refine((value) => value, { error: "You must accept the terms to continue" }),
});
export type ApplicationInput = z.infer<typeof applicationBaseSchema>;

export function createApplicationSchema(tenant: Pick<Tenant, "products" | "settings">) {
  return applicationBaseSchema.superRefine((data, ctx) => {
    const product = tenant.products.find((item) => item.id === data.productId);
    if (!product) {
      ctx.addIssue({ code: "custom", path: ["productId"], message: "Choose a loan product" });
      return;
    }
    if (data.amount < product.minAmount || data.amount > product.maxAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: `Amount must be between ${product.minAmount.toLocaleString()} and ${product.maxAmount.toLocaleString()}`,
      });
    }
    if (!product.tenors.includes(data.tenorMonths)) {
      ctx.addIssue({ code: "custom", path: ["tenorMonths"], message: "Choose one of the available tenors" });
    }
    const needsEmployer = data.employmentStatus === "employed" || data.employmentStatus === "business_owner";
    if (needsEmployer && data.employer.length < 2) {
      ctx.addIssue({ code: "custom", path: ["employer"], message: "Employer or business name is required" });
    }
    if (tenant.settings.requireBvn && !/^\d{11}$/.test(data.bvn)) {
      ctx.addIssue({ code: "custom", path: ["bvn"], message: "BVN must be exactly 11 digits" });
    }
  });
}

export const loanProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(2, { error: "Product name is required" }).max(40),
    description: z.string().trim().max(140),
    minAmount: z.number({ error: "Required" }).positive({ error: "Must be greater than 0" }),
    maxAmount: z.number({ error: "Required" }).positive({ error: "Must be greater than 0" }),
    interestRate: z.number({ error: "Required" }).min(0, { error: "Cannot be negative" }).max(100, { error: "Max 100%" }),
    tenors: z.array(z.number().int().positive()).min(1, { error: "Select at least one tenor" }),
  })
  .refine((product) => product.maxAmount > product.minAmount, {
    error: "Maximum must be greater than minimum",
    path: ["maxAmount"],
  });

export const tenantSettingsSchema = z.object({
  name: z.string().trim().min(2, { error: "Institution name is required" }).max(60),
  tagline: z.string().trim().max(120),
  supportEmail: z.email({ error: "Enter a valid support email" }),
  logoUrl: z.string().nullable(),
  branding: z.object({
    primary: hexColor,
    accent: hexColor,
    radius: z.number().min(0).max(1.5),
    font: z.enum(["geist", "serif", "rounded"]),
  }),
  settings: z.object({
    currency: z.enum(["NGN", "KES", "GHS", "USD"]),
    allowEarlyRepayment: z.boolean(),
    requireBvn: z.boolean(),
    maxActiveLoans: z.number().int().min(1, { error: "At least 1" }).max(5, { error: "At most 5" }),
  }),
  products: z.array(loanProductSchema).min(1, { error: "Offer at least one loan product" }),
});
export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;

export const onboardTenantSchema = z.object({
  name: z.string().trim().min(2, { error: "Institution name is required" }).max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Lowercase letters, numbers and dashes only" })
    .min(3, { error: "At least 3 characters" })
    .max(30)
    .refine((slug) => !RESERVED_SLUGS.includes(slug), { error: "This URL is reserved" }),
  primary: hexColor,
  accent: hexColor,
  currency: z.enum(["NGN", "KES", "GHS", "USD"]),
  supportEmail: z.email({ error: "Enter a valid email" }),
  adminName: z.string().trim().min(2, { error: "Admin name is required" }),
  adminEmail: z.email({ error: "Enter a valid email" }),
  adminPassword: z.string().min(8, { error: "Use at least 8 characters" }),
});
export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>;

export const REPAYMENT_METHODS = ["card", "bank_transfer", "direct_debit"] as const;

export function createRepaymentSchema(maxAmount: number) {
  return z.object({
    amount: z
      .number({ error: "Enter an amount" })
      .positive({ error: "Enter an amount greater than 0" })
      .max(maxAmount + 0.004, { error: `You can pay at most ${maxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} right now` }),
    method: z.enum(REPAYMENT_METHODS),
  });
}
export type RepaymentInput = z.infer<ReturnType<typeof createRepaymentSchema>>;

export const decisionSchema = z
  .object({
    action: z.enum(["start_review", "approve", "reject"]),
    note: z.string().trim().max(240),
  })
  .refine((data) => data.action !== "reject" || data.note.length >= 5, {
    error: "Give the applicant a reason (at least 5 characters)",
    path: ["note"],
  });
export type DecisionInput = z.infer<typeof decisionSchema>;
