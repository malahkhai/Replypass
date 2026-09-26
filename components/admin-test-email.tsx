"use client";
import { useState } from "react";
export function AdminTestEmail() {
  const [status,setStatus] = useState("");
  const [busy,setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try { const response = await fetch("/api/admin/system/test-email",{method:"POST"}); const result = await response.json(); setStatus(response.ok ? result.status === "duplicate" ? "A test email was already sent today." : "Email provider accepted the test email. Check your inbox to confirm delivery." : "Test email failed. Check delivery records."); }
    catch { setStatus("Test email could not be sent."); }
    finally { setBusy(false); }
  }
  return <div><button className="button" disabled={busy} onClick={send}>{busy ? "Sending…" : "Send test email to my admin address"}</button><p role="status">{status}</p></div>;
}
