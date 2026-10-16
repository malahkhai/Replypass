import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";
import { captureException, logEvent } from "@/lib/observability/log";
import { renderEmail, type EmailTemplate } from "./templates";

export type { EmailTemplate } from "./templates";
type EmailInput = { recipientId: string; to: string; template: EmailTemplate; eventKey: string; link: string; name?: string };

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
    const message=renderEmail(input.template,input.link,input.name);
    const response=await fetch(endpoint,{method:"POST",headers:{authorization:`Bearer ${key}`,"content-type":"application/json","Idempotency-Key":input.eventKey},body:JSON.stringify({from,to:input.to,...message}),signal:AbortSignal.timeout(10000)});
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
