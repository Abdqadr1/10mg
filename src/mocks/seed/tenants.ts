import type { Tenant } from "@/types";

export const SEED_TENANTS: Omit<Tenant, "createdAt">[] = [
  {
    id: "aurora",
    slug: "aurora",
    name: "Aurora Bank",
    tagline: "Considered credit for growing households.",
    logoUrl: "/logos/aurora.svg",
    supportEmail: "support@aurorabank.demo",
    branding: { primary: "#0b6e4f", accent: "#f2c14e", radius: 0.375, font: "serif" },
    settings: { currency: "NGN", allowEarlyRepayment: true, requireBvn: true, maxActiveLoans: 2 },
    products: [
      {
        id: "aurora-personal",
        name: "Personal Loan",
        description: "Flexible financing for life's big moments.",
        minAmount: 100_000,
        maxAmount: 5_000_000,
        interestRate: 24,
        tenors: [3, 6, 12, 18],
      },
      {
        id: "aurora-salary",
        name: "Salary Advance",
        description: "Bridge the gap until payday.",
        minAmount: 50_000,
        maxAmount: 750_000,
        interestRate: 18,
        tenors: [1, 3],
      },
    ],
  },
  {
    id: "kudi",
    slug: "kudi",
    name: "Kudi Microfinance",
    tagline: "Small loans. Big moves. Zero paperwork.",
    logoUrl: "/logos/kudi.svg",
    supportEmail: "hello@kudi.demo",
    branding: { primary: "#6d28d9", accent: "#f472b6", radius: 1, font: "rounded" },
    settings: { currency: "NGN", allowEarlyRepayment: false, requireBvn: false, maxActiveLoans: 2 },
    products: [
      {
        id: "kudi-boost",
        name: "Business Boost",
        description: "Working capital for market traders and SMEs.",
        minAmount: 20_000,
        maxAmount: 1_000_000,
        interestRate: 32,
        tenors: [3, 6, 9],
      },
      {
        id: "kudi-quick",
        name: "Quick Cash",
        description: "Instant micro-loan for emergencies.",
        minAmount: 5_000,
        maxAmount: 100_000,
        interestRate: 36,
        tenors: [1, 3],
      },
    ],
  },
  {
    id: "harbor",
    slug: "harbor",
    name: "Harbor Credit",
    tagline: "Asset finance for East Africa's builders.",
    logoUrl: "/logos/harbor.svg",
    supportEmail: "care@harborcredit.demo",
    branding: { primary: "#1e3a8a", accent: "#38bdf8", radius: 0.625, font: "geist" },
    settings: { currency: "KES", allowEarlyRepayment: true, requireBvn: false, maxActiveLoans: 3 },
    products: [
      {
        id: "harbor-asset",
        name: "Asset Finance",
        description: "Equipment and vehicle financing.",
        minAmount: 50_000,
        maxAmount: 3_000_000,
        interestRate: 16,
        tenors: [12, 24, 36],
      },
      {
        id: "harbor-school",
        name: "School Fees Loan",
        description: "Spread term fees across the school year.",
        minAmount: 10_000,
        maxAmount: 400_000,
        interestRate: 14,
        tenors: [3, 6, 9],
      },
    ],
  },
];

export const DEMO_PASSWORD = "demo1234";

export function demoCredentials(slug: string) {
  return {
    admin: { email: `admin@${slug}.demo`, password: DEMO_PASSWORD },
    customer: { email: `customer@${slug}.demo`, password: DEMO_PASSWORD },
  };
}
