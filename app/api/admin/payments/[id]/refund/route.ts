import { getViewer } from "@/lib/auth/session";
import { readJson, fail } from "@/lib/http";
import { replyService } from "@/lib/stripe/service";
import { serviceDatabase } from "@/lib/stripe/server";
import { auditAdmin } from "@/lib/admin/repository";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo || viewer.role !== "admin")
    return fail("Admin required.", 403);
  const limited = await enforceRateLimit(request, "admin", viewer.id);
  if (limited) return limited;
  try {
    const { reason } = await readJson(request);
    if (typeof reason !== "string" || reason.trim().length < 3)
      return fail("A refund reason is required.");
    const id = (await params).id;
    const service = replyService();
    const before = await service.store.get(id);
    if (before.payment_state === "authorized")
      return fail("Cancel this authorization; it has not been captured.", 409);
    if (before.payment_state !== "captured")
      return fail("Only captured payments are refundable.", 409);
    const key = `admin-refund:${id}`;
    const db = serviceDatabase();
    const { data: existing } = await db.from("refund_records").select("status").eq("idempotency_key", key).maybeSingle();
    if (existing) return fail("This refund was already requested.", 409);
    await db.from("refund_records").insert({reply_payment_id:id,initiated_by:viewer.id,reason:reason.trim(),amount_cents:before.gross_cents,currency:before.currency,idempotency_key:key,status:"pending"});
    const p = await service.engine.refund(id, viewer.id);
    await db.from("refund_records").update({status:p.payment_state==="refunded"?"succeeded":"needs_review",stripe_refund_id:p.stripe_refund_id,stripe_reversal_id:p.stripe_reversal_id}).eq("idempotency_key",key);
    await auditAdmin(viewer.id,"payment.refund","reply_payment",id,{reason:reason.trim(),amount_cents:before.gross_cents});
    return Response.json({ state: p.payment_state });
  } catch {
    return fail(
      "Refund requires reconciliation. No additional charge was created.",
      409,
    );
  }
}
