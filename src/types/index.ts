export type Role = "lender_admin" | "customer";

export type FontKey = "geist" | "serif" | "rounded";

export type CurrencyCode = "NGN" | "KES" | "GHS" | "USD";

export interface Branding {
  primary: string;
  accent: string;
  radius: number;
  font: FontKey;
}

export interface PlatformSettings {
  currency: CurrencyCode;
  allowEarlyRepayment: boolean;
  requireBvn: boolean;
  maxActiveLoans: number;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  tenors: number[];
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  supportEmail: string;
  branding: Branding;
  settings: PlatformSettings;
  products: LoanProduct[];
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  customerId: string | null;
}

export interface Session {
  token: string;
  user: User;
}

export type EmploymentStatus = "employed" | "self_employed" | "business_owner" | "student" | "unemployed";

export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentStatus: EmploymentStatus;
  employer: string;
  monthlyIncome: number;
  createdAt: string;
}

export interface CustomerSummary extends Customer {
  activeLoans: number;
  totalBorrowed: number;
  outstanding: number;
}

export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected";

export interface LoanApplication {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  amount: number;
  tenorMonths: number;
  interestRate: number;
  purpose: string;
  monthlyIncome: number;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  loanId: string | null;
}

export type LoanStatus = "active" | "overdue" | "repaid";

export interface LoanRecord {
  id: string;
  tenantId: string;
  customerId: string;
  applicationId: string;
  productId: string;
  principal: number;
  interestRate: number;
  tenorMonths: number;
  disbursedAt: string;
  amountPaid: number;
}

export interface Loan extends LoanRecord {
  customerName: string;
  productName: string;
  status: LoanStatus;
  monthlyPayment: number;
  totalRepayable: number;
  outstanding: number;
  amountDueNow: number;
  nextDueDate: string | null;
  paidInstallments: number;
}

export type InstallmentStatus = "paid" | "partial" | "overdue" | "due" | "upcoming";

export interface Installment {
  index: number;
  dueDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  paid: number;
  status: InstallmentStatus;
}

export interface LoanDetail extends Loan {
  schedule: Installment[];
  repayments: Repayment[];
  application: LoanApplication;
}

export type RepaymentMethod = "card" | "bank_transfer" | "direct_debit";

export interface Repayment {
  id: string;
  tenantId: string;
  loanId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: RepaymentMethod;
  reference: string;
  paidAt: string;
}

export interface MonthlyPoint {
  month: string;
  disbursed: number;
  collected: number;
}

export interface DashboardStats {
  totalCustomers: number;
  pendingApplications: number;
  approvedLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalDisbursed: number;
  outstandingBalance: number;
  totalCollected: number;
  repaymentRate: number;
  approvalRate: number;
  series: MonthlyPoint[];
  recentApplications: LoanApplication[];
  recentRepayments: Repayment[];
}

export interface ApplicationReview {
  application: LoanApplication;
  customer: Customer;
  estimate: { monthlyPayment: number; totalRepayable: number; totalInterest: number };
  debtToIncome: number;
  existingLoans: Loan[];
  previousApplications: LoanApplication[];
}

export interface CustomerOverview {
  customer: Customer;
  loans: Loan[];
  applications: LoanApplication[];
}

export interface ApiErrorBody {
  message: string;
  fieldErrors?: Record<string, string>;
}
