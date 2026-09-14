"use client";
import { track } from "@/lib/analytics/client";
import { useRouter } from "next/navigation";
import { useRequestDraft } from "./request-draft";
import { useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button, Price, Badge } from "./ui";
import { Icon } from "./icon";
import type { PublicCreator } from "@/types/creator";
const stripePromise =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_")
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;
type Quote = {
  id: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
};
export function SecuredCheckout({
  creator,
  authenticated,
  kind = "message",
}: {
  creator: PublicCreator;
  authenticated: boolean;
  kind?: "message" | "voice_note" | "photo";
}) {
  const router = useRouter();
  const { message, setMessage } = useRequestDraft(creator.handle, kind);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function prepare(e: React.FormEvent) {
    e.preventDefault();
    if (!authenticated) {
      router.push(
        `/signup?next=${encodeURIComponent(`/${creator.handle}?interaction=${kind}`)}`,
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fingerprint = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(message.trim()),
          ),
        ),
      )
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
      const key = `replypass:attempt:${creator.id}:${kind}`;
      let saved;
      try {
        saved = JSON.parse(sessionStorage.getItem(key) || "null");
      } catch {}
      const attemptKey =
        saved?.fingerprint === fingerprint
          ? saved.attemptKey
          : crypto.randomUUID();
      sessionStorage.setItem(key, JSON.stringify({ fingerprint, attemptKey }));
      const r = await fetch("/api/payments/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId: creator.id, attemptKey, message, kind }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setQuote(data);
      track("checkout_started", kind);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (!stripePromise)
    return (
      <p role="alert">
        Test payment setup is unavailable. No payment was submitted.
      </p>
    );
  return (
    <div className="checkout-form">
      <Badge>STRIPE TEST MODE</Badge>
      {!quote ? (
        <form onSubmit={prepare} className="auth-form">
          <p>
            {kind === "voice_note"
              ? `Tell ${creator.name.split(" ")[0]} what you'd like them to talk about. Your payment method is only charged when your voice note is delivered.`
              : kind === "photo"
                ? `Describe the photo you'd like. Your payment method is only charged after ${creator.name.split(" ")[0]} delivers it.`
                : `You’re requesting a guaranteed reply. We’ll temporarily reserve the price. You’re only charged if ${creator.name.split(" ")[0]} replies.`}
          </p>
          <label>
            {kind === "voice_note" ? `What would you like ${creator.name.split(" ")[0]} to say or talk about?` : kind === "photo" ? "What kind of photo would you like?" : "What do you want to say?"}
            <textarea
              required
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={kind === "photo" ? "A photo from your trip to Tokyo…" : undefined}
            />
          </label>
          <Button disabled={busy}>
            {busy ? "Checking availability…" : "Continue to payment"}
          </Button>
        </form>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: quote.clientSecret,
            appearance: {
              theme: "stripe",
              variables: { colorPrimary: "#d6483c", borderRadius: "14px" },
            },
          }}
        >
          <Confirmation quote={quote} name={creator.name.split(" ")[0]} kind={kind} />
        </Elements>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/${creator.handle}?interaction=${kind}`)}`}
          >
            Sign in
          </Link>
        </p>
      )}
      <p className="checkout-footnote">
        {kind === "message" ? "No reply = no charge." : "No delivery = no charge."} Requests must follow ReplyPass Community Guidelines. Creators can decline requests they’re uncomfortable with.
      </p>
    </div>
  );
}
function Confirmation({ quote, name, kind }: { quote: Quote; name: string; kind: "message" | "voice_note" | "photo" }) {
  const stripe = useStripe(),
    elements = useElements();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reserved, setReserved] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [expires, setExpires] = useState(""),
    [walletsAvailable, setWalletsAvailable] = useState(false);
  async function confirmReservation(walletFailure?: () => void) {
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    try {
      if (!confirmed) {
        const result = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: `${location.origin}/account/requests` },
          redirect: "if_required",
        });
        if (result.error) {
          walletFailure?.();
          throw Error(
            result.error.message ||
              "Your card could not be authorized. No request was sent.",
          );
        }
        setConfirmed(true);
      }
      const response = await fetch(`/api/payments/reply/${quote.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok || !result.secured)
        throw Error(
          result.error ||
            "We are checking your reservation. Check your requests before starting another payment.",
        );
      setExpires(result.expiresAt);
      setReserved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await confirmReservation();
  }
  if (reserved)
    return (
      <div className="checkout-done" role="status">
        <h3>Request sent ✓</h3>
        <p>
          <Price cents={quote.amountCents} currency={quote.currency} /> has been
          temporarily reserved. You haven’t been charged.
        </p>
        <p>
          {name} has until {new Date(expires).toLocaleString()} to {kind === "message" ? "accept and reply" : "accept your request"}. If
          they don’t, the reservation will be released automatically.
        </p>
        <strong>{kind === "message" ? "No reply = no charge." : "No delivery = no charge."}</strong>
        <Link className="button" href="/account/requests">
          View my requests
        </Link>
      </div>
    );
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="checkout-reservation-note">
        <Icon name="shield" size={19} />
        <p>
          We’ll temporarily reserve{" "}
          <Price cents={quote.amountCents} currency={quote.currency} />. You’re
          only charged if {name} {kind === "voice_note" ? "delivers the voice note" : kind === "photo" ? "delivers the photo" : "replies"}.
        </p>
      </div>
      <div className="wallet-checkout">
        {walletsAvailable && <strong>Fast checkout</strong>}
        <ExpressCheckoutElement
          options={{
            buttonHeight: 52,
            buttonType: { applePay: "buy", googlePay: "buy" },
            layout: { maxColumns: 1, maxRows: 2, overflow: "never" },
            paymentMethods: {
              applePay: "auto",
              googlePay: "auto",
              link: "never",
              amazonPay: "never",
              paypal: "never",
              klarna: "never",
            },
          }}
          onReady={({ availablePaymentMethods }) =>
            setWalletsAvailable(
              Boolean(
                availablePaymentMethods?.applePay ||
                  availablePaymentMethods?.googlePay,
              ),
            )
          }
          onConfirm={(event) =>
            void confirmReservation(() =>
              event.paymentFailed({
                reason: "fail",
                message:
                  "We couldn’t authorize this payment. Please try again.",
              }),
            )
          }
        />
      </div>
      {walletsAvailable && (
        <div className="checkout-divider">
          <span>or pay by card</span>
        </div>
      )}
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "never", googlePay: "never" },
        }}
      />
      <Button disabled={!stripe || busy}>
        {busy ? (
          "Checking reservation…"
        ) : confirmed ? (
          "Check reservation"
        ) : (
          <>
            {kind === "voice_note" ? "Request voice note" : kind === "photo" ? "Request photo" : "Request reply"} —{" "}
            <Price cents={quote.amountCents} currency={quote.currency} />
          </>
        )}
      </Button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
