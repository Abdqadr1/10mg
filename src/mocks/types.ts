import type { Customer, LoanApplication, LoanRecord, Repayment, Tenant, User } from "@/types";

export interface StoredUser extends User {
  password: string;
}

export type ApplicationRecord = Omit<LoanApplication, "customerName" | "productName">;

export type RepaymentRecord = Omit<Repayment, "customerName">;

export interface DbState {
  version: number;
  tenants: Tenant[];
  users: StoredUser[];
  customers: Customer[];
  applications: ApplicationRecord[];
  loans: LoanRecord[];
  repayments: RepaymentRecord[];
}
