/** The only products exposed or newly sold in the controlled V1 launch. */
export const launchProducts = {
  guaranteedReply: true,
  vip: true,
  voiceNote: false,
  photoRequest: false,
  videoRequest: false,
  liveChat: false,
  tips: false,
} as const;

export function paidRequestAvailable(kind: string) {
  return kind === "message" && launchProducts.guaranteedReply;
}
