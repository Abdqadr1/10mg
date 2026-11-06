import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RequireAuth } from "@/features/auth/require-auth";
import { ApplicationForm } from "@/features/portal/application-form";
import { db } from "@/mocks/db";
import { useAuthStore } from "@/stores/auth-store";
import { renderWithTenant } from "./render";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/aurora/lender",
}));

describe("TenantThemeScope", () => {
  it("applies the tenant's brand tokens to the document", () => {
    renderWithTenant(<p>content</p>, "kudi");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--primary")).toBe("#6d28d9");
    expect(style.getPropertyValue("--radius")).toBe("1rem");
    expect(style.getPropertyValue("--font-sans")).toBe("var(--font-rounded)");
  });
});

describe("RequireAuth", () => {
  it("redirects anonymous visitors to the tenant login", async () => {
    renderWithTenant(
      <RequireAuth role="lender_admin">
        <p>secret</p>
      </RequireAuth>,
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/aurora/login?next=%2Faurora%2Flender"));
  });

  it("blocks customers from the lender console", () => {
    const user = db().users.find((item) => item.tenantId === "aurora" && item.role === "customer")!;
    useAuthStore.getState().setSession("aurora", { token: "mock.x", user });
    renderWithTenant(
      <RequireAuth role="lender_admin">
        <p>secret</p>
      </RequireAuth>,
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.getByText("You don't have access to this area")).toBeInTheDocument();
  });
});

describe("ApplicationForm", () => {
  const customer = () => db().customers.find((item) => item.tenantId === "aurora")!;

  it("blocks progress when the amount is outside the product range", async () => {
    const user = userEvent.setup();
    renderWithTenant(<ApplicationForm customer={customer()} initial={{}} onSubmitted={vi.fn()} />);
    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "50");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/Amount must be between/)).toBeInTheDocument();
    expect(screen.queryByLabelText("What is the loan for?")).not.toBeInTheDocument();
  });

  it("requires a BVN for tenants that enforce it", async () => {
    const user = userEvent.setup();
    renderWithTenant(<ApplicationForm customer={customer()} initial={{}} onSubmitted={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(await screen.findByLabelText("What is the loan for?"), "Expanding my tailoring shop");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText("BVN must be exactly 11 digits")).toBeInTheDocument();
  });

  it("hides the BVN field for tenants that do not require it", async () => {
    const user = userEvent.setup();
    const kudiCustomer = db().customers.find((item) => item.tenantId === "kudi")!;
    renderWithTenant(<ApplicationForm customer={kudiCustomer} initial={{}} onSubmitted={vi.fn()} />, "kudi");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByLabelText("What is the loan for?");
    expect(screen.queryByLabelText(/BVN/)).not.toBeInTheDocument();
  });
});
