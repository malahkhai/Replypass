"use client";
import { useState } from "react";

export function AdminTestMonitoring() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/system/test-monitoring", { method: "POST" });
      setStatus(response.ok ? "Monitoring provider accepted the test. Confirm it appears in Sentry." : "Monitoring test failed. Check the provider configuration.");
    } catch { setStatus("Monitoring test could not be sent."); }
    finally { setBusy(false); }
  }
  return <div><button className="button" disabled={busy} onClick={send}>{busy ? "Sending…" : "Send monitoring test"}</button><p role="status">{status}</p></div>;
}
