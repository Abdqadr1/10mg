"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMoney, useTenant } from "@/features/tenants/tenant-context";
import { estimateRepayment } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function LoanCalculator({ ctaHref }: { ctaHref: string }) {
  const tenant = useTenant();
  const money = useMoney();
  const [productId, setProductId] = useState(tenant.products[0]?.id ?? "");
  const product = tenant.products.find((item) => item.id === productId) ?? tenant.products[0];
  const [amount, setAmount] = useState(() => Math.round((product.minAmount + product.maxAmount) / 4));
  const [tenor, setTenor] = useState(product.tenors[Math.floor(product.tenors.length / 2)]);

  const selectProduct = (id: string) => {
    const next = tenant.products.find((item) => item.id === id);
    if (!next) return;
    setProductId(id);
    setAmount(Math.min(Math.max(amount, next.minAmount), next.maxAmount));
    if (!next.tenors.includes(tenor)) setTenor(next.tenors[0]);
  };

  const safeAmount = Math.min(Math.max(amount, product.minAmount), product.maxAmount);
  const estimate = estimateRepayment(safeAmount, product.interestRate, tenor);
  const step = product.maxAmount >= 1_000_000 ? 10_000 : product.maxAmount >= 100_000 ? 5_000 : 1_000;
  const href = `${ctaHref}?product=${product.id}&amount=${safeAmount}&tenor=${tenor}`;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Loan product" className="grid grid-cols-2 gap-2">
        {tenant.products.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === product.id}
            onClick={() => selectProduct(item.id)}
            className={cn(
              "rounded-(--radius) border px-3 py-2 text-left text-sm transition-colors",
              item.id === product.id ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
            )}
          >
            <span className="block font-medium">{item.name}</span>
            <span className="text-xs text-muted-foreground">{item.interestRate}% p.a.</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="calc-amount">How much do you need?</Label>
          <span className="text-lg font-semibold tabular-nums">{money(safeAmount)}</span>
        </div>
        <input
          id="calc-amount"
          type="range"
          min={product.minAmount}
          max={product.maxAmount}
          step={step}
          value={safeAmount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{money(product.minAmount, { compact: true })}</span>
          <span>{money(product.maxAmount, { compact: true })}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label id="calc-tenor">Repay over</Label>
        <div role="radiogroup" aria-labelledby="calc-tenor" className="flex flex-wrap gap-2">
          {product.tenors.map((months) => (
            <button
              key={months}
              type="button"
              role="radio"
              aria-checked={months === tenor}
              onClick={() => setTenor(months)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                months === tenor ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {months} {months === 1 ? "month" : "months"}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-(--radius) bg-accent p-3 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">Monthly</dt>
          <dd className="font-semibold text-accent-foreground tabular-nums">{money(estimate.monthlyPayment)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Interest</dt>
          <dd className="font-semibold text-accent-foreground tabular-nums">{money(estimate.totalInterest)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Total</dt>
          <dd className="font-semibold text-accent-foreground tabular-nums">{money(estimate.totalRepayable)}</dd>
        </div>
      </dl>

      <Link href={href} className={cn(buttonVariants({ size: "lg" }), "h-11 w-full text-base")}>
        Apply with these terms
      </Link>
    </div>
  );
}
