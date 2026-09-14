export const VIP_FEE_BPS = 1500;
export const VIP_ELIGIBLE_STATUSES = ["active", "trialing"] as const;
export function vipSplit(grossCents: number, feeBps = VIP_FEE_BPS) {
  if (!Number.isSafeInteger(grossCents) || grossCents <= 0) throw Error("Invalid amount.");
  const feeCents = Math.floor((grossCents * feeBps + 5000) / 10000);
  return { grossCents, feeCents, creatorCents: grossCents - feeCents, feeBps };
}
export function vipAccessEligible(status: string, periodEnd?: string | null, now = Date.now()) {
  return VIP_ELIGIBLE_STATUSES.includes(status as (typeof VIP_ELIGIBLE_STATUSES)[number]) && (!periodEnd || Date.parse(periodEnd) > now);
}
export type VipPlan = { id:string; creatorId:string; name:string; description:string; benefits:string[]; amountCents:number; currency:string; enabled:boolean };
