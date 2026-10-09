"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

type Props = {
  endpoint: string;
  action: string;
  label: string;
  confirm?: string;
  reason?: boolean;
  variant?: "default" | "danger";
};

export function AdminAction({ endpoint, action, label, confirm, reason = false, variant = "default" }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason && note.trim().length < 3) {
      setError("Add a reason of at least 3 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: note.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Action failed.");
      dialog.current?.close();
      setNote("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-action">
    <button className={variant === "danger" ? "admin-action-danger" : undefined} type="button" onClick={() => { setError(""); dialog.current?.showModal(); }}>{label}</button>
    <dialog className="admin-action-dialog" ref={dialog} aria-labelledby={headingId}>
      <form onSubmit={run}>
        <h2 id={headingId}>{label}</h2>
        <p>{confirm || `Apply “${label}” to this record?`}</p>
        {reason && <label>Reason <span>Required for the audit log</span><textarea value={note} onChange={event => setNote(event.target.value)} minLength={3} required rows={3} /></label>}
        {error && <p className="admin-dialog-error" role="alert">{error}</p>}
        <div className="admin-dialog-actions"><button type="button" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button><button className={variant === "danger" ? "admin-dialog-danger" : undefined} type="submit" disabled={busy}>{busy ? "Working…" : label}</button></div>
      </form>
    </dialog>
  </div>;
}
