"use client";
import { creatorPath } from "@/lib/creators/paths";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, Price } from "./ui";

export type MembershipView = {
  id: string;
  name: string;
  creatorName: string;
  creatorHandle: string;
  creatorImage: string;
  amountCents: number;
  currency: string;
  status: string;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const endedStatuses = new Set(["canceled", "cancelled", "expired", "incomplete_expired"]);

function isPastMembership(membership: MembershipView) {
  return endedStatuses.has(membership.status);
}

function statusLabel(membership: MembershipView) {
  if (membership.status === "past_due") return "Payment needs attention";
  if (membership.cancelAtPeriodEnd) return "Ending soon";
  if (membership.status === "trialing") return "Free trial";
  if (membership.status === "active") return "Active";
  return membership.status.replaceAll("_", " ");
}

function MembershipCard({ membership, past = false }: { membership: MembershipView; past?: boolean }) {
  const date = membership.periodEnd
    ? new Date(membership.periodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className={`membership-card${past ? " membership-card-past" : ""}`}>
      <Image
        src={membership.creatorImage || "/images/avatar.svg"}
        alt=""
        width={60}
        height={60}
        unoptimized
        className="membership-avatar"
      />
      <div className="membership-card-main">
        <div className="membership-card-title">
          <Link href={`${creatorPath(membership.creatorHandle)}`} className="membership-name">
            {membership.name}
          </Link>
          <span className={`membership-status${membership.cancelAtPeriodEnd ? " is-ending" : ""}${membership.status === "past_due" ? " is-attention" : ""}`}>
            {past ? "Past membership" : statusLabel(membership)}
          </span>
        </div>
        <p className="membership-creator">with {membership.creatorName}</p>
        {!past && date && (
          <p className="membership-period">
            {membership.cancelAtPeriodEnd ? "Access ends" : membership.status === "past_due" ? "Billing period ends" : "Next renewal"} · {date}
          </p>
        )}
        {past && date && <p className="membership-period">Ended · {date}</p>}
      </div>
      <Price cents={membership.amountCents} currency={membership.currency} unit="/ month" />
    </article>
  );
}

export function MembershipList({ memberships }: { memberships: MembershipView[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = memberships.filter((membership) => !isPastMembership(membership));
  const past = memberships.filter(isPastMembership);

  async function manage() {
    setBusy(true);
    const response = await fetch("/api/vip/portal", { method: "POST" });
    const data = await response.json();
    if (response.ok) location.assign(data.url);
    else {
      setError(data.error);
      setBusy(false);
    }
  }

  if (!memberships.length) {
    return (
      <div className="membership-empty">
        <span className="membership-empty-mark" aria-hidden="true">♡</span>
        <h2>Your people are one link away.</h2>
        <p>When you join a creator’s VIP membership, you’ll find your updates and billing details here.</p>
        <Link href="/" className="membership-browse-link">Explore ReplyPass <span aria-hidden="true">↗</span></Link>
      </div>
    );
  }

  return (
    <div className="membership-list">
      {current.length > 0 && (
        <section className="membership-section" aria-labelledby="current-memberships-heading">
          <div className="membership-section-heading">
            <div>
              <h2 id="current-memberships-heading">Your memberships</h2>
              <p>Your access and renewal details, all in one place.</p>
            </div>
            <Button onClick={manage} disabled={busy} variant="secondary" className="membership-manage-button">
              {busy ? "Opening Stripe…" : "Manage billing"}
            </Button>
          </div>
          <div className="membership-cards">
            {current.map((membership) => <MembershipCard key={membership.id} membership={membership} />)}
          </div>
          <p className="membership-billing-note">Payments and cancellations are securely managed by Stripe.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
        </section>
      )}

      {past.length > 0 && (
        <section className="membership-section membership-history" aria-labelledby="past-memberships-heading">
          <div className="membership-section-heading">
            <div>
              <h2 id="past-memberships-heading">Past memberships</h2>
              <p>Your previous creator memberships.</p>
            </div>
          </div>
          <div className="membership-cards">
            {past.map((membership) => <MembershipCard key={membership.id} membership={membership} past />)}
          </div>
        </section>
      )}
    </div>
  );
}
