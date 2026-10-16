export type EmailTemplate =
  | "creator_published" | "creator_replies_enabled" | "creator_vip_enabled" | "operational_test"
  | "request_received" | "creator_request_received" | "request_accepted" | "request_declined"
  | "request_expired" | "reply_completed" | "voice_ready" | "photo_ready"
  | "vip_started" | "vip_payment_issue" | "vip_canceled" | "request_nearing_expiry"
  | "payment_completed" | "vip_member_started" | "transfer_issue"
  | "creator_setup" | "creator_setup_reminder" | "creator_page_live";

const copy: Record<EmailTemplate, { subject: string; body: string; action: string }> = {
  creator_published: { subject: "A new ReplyPass creator is live", body: "A creator completed their profile and verified their email. Their public page is live; no routine approval is needed. Review their admin record below.", action: "Review creator" },
  creator_replies_enabled: { subject: "A creator enabled Guaranteed Replies", body: "A creator has enabled Guaranteed Replies with an eligible live Stripe account. Open their admin record to review or manage the account.", action: "Review creator" },
  creator_vip_enabled: { subject: "A creator enabled VIP", body: "A creator has enabled VIP with an eligible live Stripe account. Open their admin record to review or manage the account.", action: "Review creator" },
  operational_test: { subject: "ReplyPass production email test", body: "This is the test notification you requested. No payment or subscription was created.", action: "Open ReplyPass" },
  request_received: { subject: "Your request is secured", body: "Your request has reached the creator.", action: "View request" },
  creator_request_received: { subject: "You have a new paid request", body: "A new secured request is waiting in ReplyPass.", action: "View request" },
  request_accepted: { subject: "Your request was accepted", body: "Your creator has accepted your request.", action: "View request" },
  request_declined: { subject: "Your request was declined", body: "Your payment authorization is being released.", action: "View request" },
  request_expired: { subject: "Your request expired", body: "The request was not completed, so you were not charged.", action: "View request" },
  reply_completed: { subject: "Your reply is ready", body: "Your creator has replied.", action: "Open reply" },
  voice_ready: { subject: "Your voice note is ready", body: "Your private voice-note delivery is ready.", action: "Open delivery" },
  photo_ready: { subject: "Your photo is ready", body: "Your private photo delivery is ready.", action: "Open delivery" },
  vip_started: { subject: "Welcome to VIP", body: "Your ReplyPass VIP membership is active.", action: "View membership" },
  vip_payment_issue: { subject: "Your VIP payment needs attention", body: "Update your payment method to keep VIP access.", action: "Update payment" },
  vip_canceled: { subject: "Your VIP membership was canceled", body: "Your membership remains available through the period shown in ReplyPass.", action: "View membership" },
  request_nearing_expiry: { subject: "A request needs your attention", body: "Open ReplyPass to review the request deadline.", action: "View request" },
  payment_completed: { subject: "An earning was recorded", body: "A completed request has been added to your earnings.", action: "View earnings" },
  vip_member_started: { subject: "You have a new VIP member", body: "A fan joined your ReplyPass VIP membership.", action: "View members" },
  transfer_issue: { subject: "A transfer needs attention", body: "Your earning is recorded while we review its transfer.", action: "View earnings" },
  creator_setup: { subject: "Your ReplyPass creator page is ready to build", body: "Your account is confirmed. Add your photos and bio, choose your page link, then publish when you are happy with it. Once your page is live, put your link in your social media bio and invite your followers to start a conversation with you. Paid Guaranteed Replies and VIP can be set up after publishing.", action: "Create my page" },
  creator_setup_reminder: { subject: "Your ReplyPass page is one step away", body: "Your creator account is ready, but your public page has not been published yet. Create your profile and choose a link you can share with your followers. You can publish your page before setting up payouts.", action: "Finish my page" },
  creator_page_live: { subject: "Your ReplyPass page is live", body: "Your creator page is live. Add the link below to your social media bio. You could say: Have a question for me? Start a conversation on ReplyPass. If you want to offer paid Guaranteed Replies or VIP, complete payout setup in ReplyPass first.", action: "View my page" },
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function renderEmail(template: EmailTemplate, link: string, name?: string) {
  const message = copy[template];
  const firstName = name?.trim().split(/\s+/)[0]?.slice(0, 40);
  const greeting = firstName ? `Hi ${firstName},` : "Hello,";
  const subject = firstName && template === "creator_setup" ? `${firstName}, finish your ReplyPass creator page` : message.subject;
  const setupEmail = template === "creator_setup" || template === "creator_setup_reminder";
  const preferenceUrl = "https://getreplypass.com/account/settings";
  const text = `${greeting}\n\n${message.body}\n\n${message.action}: ${link}\n\nReplyPass · A little closer to the people you follow.\nNeed help? info@getreplypass.com${setupEmail ? `\nManage creator reminders: ${preferenceUrl}` : ""}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f8f9f5;color:#252923;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(message.body.slice(0, 110))}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9f5"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e1e6d9;border-radius:16px"><tr><td style="padding:32px"><div style="font-size:25px;font-weight:750;letter-spacing:-1.4px">replypass<span style="color:#dc4b44">.</span></div><div style="height:1px;background:#e1e6d9;margin:24px 0"></div><p style="font-size:16px;line-height:1.6;margin:0 0 18px">${escapeHtml(greeting)}</p><h1 style="font-size:26px;line-height:1.2;letter-spacing:-.8px;margin:0 0 18px">${escapeHtml(message.subject)}</h1><p style="font-size:16px;line-height:1.65;margin:0 0 26px">${escapeHtml(message.body)}</p><a href="${escapeHtml(link)}" style="display:inline-block;background:#dc4b44;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px">${escapeHtml(message.action)} →</a><p style="font-size:12px;line-height:1.6;color:#65715d;margin:26px 0 0">If the button does not work, copy this link:<br><a href="${escapeHtml(link)}" style="color:#425c39;overflow-wrap:anywhere">${escapeHtml(link)}</a></p></td></tr></table><p style="font-size:12px;color:#65715d;line-height:1.6">ReplyPass · A little closer to the people you follow.<br>Need help? <a href="mailto:info@getreplypass.com" style="color:#425c39">info@getreplypass.com</a></p></td></tr></table></body></html>`;
  const htmlWithPreferences = setupEmail
    ? html.replace("</p></td></tr></table></body></html>", `<br><a href="${preferenceUrl}" style="color:#425c39">Manage creator reminders</a></p></td></tr></table></body></html>`)
    : html;
  return { subject, text, html: htmlWithPreferences };
}
