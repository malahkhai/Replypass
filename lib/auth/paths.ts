import { isCreatorProfilePath } from "../creators/paths.ts";
const creatorRequest =
  /^\/@?[a-z0-9_]{3,30}(?:\?interaction=(?:message|live_chat|voice_note|photo|video|vip))?$/;
const creatorSetup = /^\/creator\/apply(?:\?username=[a-z0-9_]{3,30})?$/;
export function isCreatorSetupDestination(next: string | null | undefined) {
  return !!next && creatorSetup.test(next);
}
export function isCreatorDestination(
  next: string | null | undefined,
): next is string {
  return !!next && creatorRequest.test(next) && isCreatorProfilePath(next.split("?")[0]);
}
export function safeNext(next: string | null | undefined) {
  return next &&
    (isCreatorSetupDestination(next) ||
      /^\/(creator\/dashboard|account|reset-password)$/.test(next) ||
      isCreatorDestination(next))
    ? next
    : "/account";
}
export function signupAllowed(next: string | null | undefined) {
  return isCreatorSetupDestination(next) || isCreatorDestination(next);
}
