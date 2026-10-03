/** Live Connect records must never be overwritten by sandbox onboarding. */
export function connectAccountTable(mode: "test" | "live") {
  return mode === "test" ? "creator_stripe_sandbox_accounts" : "creator_stripe_accounts";
}
