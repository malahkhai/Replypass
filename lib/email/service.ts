import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";
import { captureException, logEvent } from "@/lib/observability/log";

export type EmailTemplate = "request_received"|"request_accepted"|"request_declined"|"request_expired"|"reply_completed"|"voice_ready"|"photo_ready"|"vip_started"|"vip_payment_issue"|"vip_canceled"|"request_nearing_expiry"|"payment_completed"|"vip_member_started"|"transfer_issue";
type EmailInput = { recipientId: string; to: string; template: EmailTemplate; eventKey: string; link: string };

const copy: Record<EmailTemplate,{subject:string;body:string}> = {
  request_received:{subject:"Your request is secured",body:"Your request has reached the creator."},
  request_accepted:{subject:"Your request was accepted",body:"Your creator has accepted your request."},
  request_declined:{subject:"Your request was declined",body:"Your payment authorization is being released."},
  request_expired:{subject:"Your request expired",body:"The request was not completed, so you were not charged."},
  reply_completed:{subject:"Your reply is ready",body:"Your creator has replied."},
  voice_ready:{subject:"Your voice note is ready",body:"Your private voice-note delivery is ready."},
  photo_ready:{subject:"Your photo is ready",body:"Your private photo delivery is ready."},
  vip_started:{subject:"Welcome to VIP",body:"Your ReplyPass VIP membership is active."},
  vip_payment_issue:{subject:"Your VIP payment needs attention",body:"Update your payment method to keep VIP access."},
  vip_canceled:{subject:"Your VIP membership was canceled",body:"Your membership remains available through the period shown in ReplyPass."},
  request_nearing_expiry:{subject:"A request needs your attention",body:"Open ReplyPass to review the request deadline."},
  payment_completed:{subject:"An earning was recorded",body:"A completed request has been added to your earnings."},
  vip_member_started:{subject:"You have a new VIP member",body:"A fan joined your ReplyPass VIP membership."},
  transfer_issue:{subject:"A transfer needs attention",body:"Your earning is recorded while we review its transfer."},
};

export async function sendTransactionalEmail(input: EmailInput) {
  const db = serviceDatabase();
  const existing = await db.from("email_delivery_events").select("status").eq("event_key",input.eventKey).maybeSingle();
  if (existing.data?.status === "sent") return { status: "duplicate" as const };
  const provider = process.env.EMAIL_PROVIDER;
  const endpoint = process.env.EMAIL_API_URL;
  const key = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!provider || !endpoint || !key || !from) {
    const status = process.env.NODE_ENV === "production" ? "failed" : "skipped";
    await db.from("email_delivery_events").upsert({recipient_id:input.recipientId,event_key:input.eventKey,template:input.template,status,last_error_code:"provider_unconfigured",attempts:1},{onConflict:"event_key"});
    logEvent(status === "failed" ? "error" : "info",{event:"email_delivery",status,error_code:"provider_unconfigured"});
    return { status } as const;
  }
  try {
    const message=copy[input.template];
    const response=await fetch(endpoint,{method:"POST",headers:{authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({from,to:input.to,subject:message.subject,text:`${message.body}\n\n${input.link}`})});
    if(!response.ok) throw Error(`provider_${response.status}`);
    const result=await response.json() as {id?:string};
    await db.from("email_delivery_events").upsert({recipient_id:input.recipientId,event_key:input.eventKey,template:input.template,status:"sent",provider_message_id:result.id||null,attempts:1},{onConflict:"event_key"});
    return {status:"sent" as const};
  } catch(error) {
    await db.from("email_delivery_events").upsert({recipient_id:input.recipientId,event_key:input.eventKey,template:input.template,status:"failed",last_error_code:"provider_error",attempts:1},{onConflict:"event_key"});
    captureException(error,{event:"email_delivery",status:"failed"});
    return {status:"failed" as const};
  }
}
