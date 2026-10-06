export type CronBatchOutcome = {
  processed: number;
  paymentAttention: number;
  notificationAttention: number;
};

export function cronBatchOutcome(input: CronBatchOutcome) {
  const attention = input.paymentAttention + input.notificationAttention;
  return {
    body: { ...input, attention },
    run: {
      status: attention ? "failed" : "succeeded",
      processed: input.processed,
      attention,
      error_code: input.paymentAttention
        ? "payment_items_need_attention"
        : input.notificationAttention
          ? "notification_delivery_needs_attention"
          : null,
    },
    // Item-level issues remain visible in the run record and response body,
    // but must not disable the scheduler. Only request-level failures (such
    // as bad credentials or database unavailability) return non-2xx above.
    httpStatus: 200,
  } as const;
}
