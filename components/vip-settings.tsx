"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/analytics/client";
import { Button, Price } from "./ui";
import { vipSplit, type VipPlan } from "@/lib/vip/model";

export function VipSettings({ initial }: { initial: VipPlan | null }) {
  const [p, setP] = useState({
    enabled: initial?.enabled ?? false,
    name: initial?.name ?? "My VIP",
    description: initial?.description ?? "Private posts, exclusive photos and VIP-only updates.",
    publicTeaser: initial?.publicTeaser ?? "",
    benefits: (initial?.benefits ?? ["Private posts", "Exclusive photos", "VIP-only updates", "VIP badge", "Priority fan status"]).join("\n"),
    amountCents: initial?.amountCents ?? 1900,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const wasEnabled = useRef(initial?.enabled ?? false);
  const split = vipSplit(p.amountCents || 100);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/creator/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, benefits: p.benefits.split("\n") }),
      });
      const data = await response.json();
      if (response.ok) {
        if (p.enabled && !wasEnabled.current) track("paid_offer_enabled", "vip");
        wasEnabled.current = p.enabled;
        setMessage("VIP settings saved.");
      } else setMessage(data.error);
    } catch {
      setMessage("Unable to save VIP settings. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="vip-settings-card" onSubmit={save}>
    <label className="setting-row"><span><strong>Enable VIP</strong><small>Stops new joins when disabled; existing memberships continue.</small></span><input type="checkbox" checked={p.enabled} onChange={event => setP({ ...p, enabled: event.target.checked })}/></label>
    <label>Membership name<input value={p.name} maxLength={80} onChange={event => setP({ ...p, name: event.target.value })}/></label>
    <label>Description<textarea value={p.description} maxLength={300} onChange={event => setP({ ...p, description: event.target.value })}/></label>
    <label>Public VIP preview <small>Optional · visible to everyone before joining</small><textarea value={p.publicTeaser} maxLength={500} rows={4} placeholder="Give fans a taste of your VIP space: what you share, how often, and a short sample." onChange={event => setP({ ...p, publicTeaser: event.target.value })}/><small>Write a separate preview here. Your members’ posts stay private.</small></label>
    <label>Benefits <small>One per line</small><textarea value={p.benefits} onChange={event => setP({ ...p, benefits: event.target.value })}/></label>
    <label>Monthly price (€)<input type="number" min="1" max="100" step="0.01" value={p.amountCents / 100} onChange={event => setP({ ...p, amountCents: Math.round(Number(event.target.value) * 100) })}/></label>
    <div className="fee-example">Fan pays <Price cents={split.grossCents}/><span>ReplyPass <Price cents={split.feeCents}/></span><strong>You earn <Price cents={split.creatorCents}/></strong></div>
    <Button disabled={busy}>{busy ? "Saving…" : "Save VIP offering"}</Button>{message && <p role="status">{message}</p>}
  </form>;
}
