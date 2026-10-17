"use client";
import { track } from "@/lib/analytics/client";
import { signupCampaign } from "@/lib/analytics/campaign";
import Link from "next/link";
import { isCreatorDestination, isCreatorSetupDestination, signupAllowed } from "@/lib/auth/paths";
import { authOrigin } from "@/lib/site";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui";
import { Icon } from "./icon";
export function AuthForm({
  mode,
  configured,
  next = "/account",
  fanCreatorId,
}: {
  mode: "login" | "signup";
  configured: boolean;
  next?: string;
  fanCreatorId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  async function demo(role: "fan" | "creator") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      router.push(
        isCreatorSetupDestination(next) || isCreatorDestination(next)
          ? next
          : data.next,
      );
      router.refresh();
    } catch {
      setError("Could not start the demo. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const supabase = createClient();
    if (!supabase) {
      setBusy(false);
      return;
    }
    try {
      const email = String(data.get("email")).trim();
      const password = String(data.get("password"));
      const campaign = mode === "signup" ? signupCampaign() : null;
      let fanSignupToken: string | null = null;
      if (mode === "signup" && fanCreatorId) {
        const ticketResponse = await fetch("/api/auth/fan-signup-ticket", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId: fanCreatorId }),
        });
        if (!ticketResponse.ok) throw Error("This creator link is unavailable. Return to their profile and try again.");
        const ticket = await ticketResponse.json();
        if (typeof ticket.token !== "string") throw Error("Could not start fan signup. Please try again.");
        fanSignupToken = ticket.token;
      }
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  display_name: String(data.get("name")).trim(),
                  signup_intent: fanCreatorId ? "fan" : "creator",
                  ...(fanSignupToken ? { fan_signup_token: fanSignupToken } : {}),
                  ...(campaign ? {
                    signup_utm_source: campaign.source,
                    signup_utm_medium: campaign.medium,
                    signup_utm_campaign: campaign.campaign,
                  } : {}),
                },
                emailRedirectTo: `${authOrigin(location.origin)}/auth/callback?next=${encodeURIComponent(next)}`,
              },
            });
      if (result.error) throw result.error;
      if (
        mode === "signup" &&
        result.data.user &&
        result.data.user.identities?.length === 0
      ) {
        setError(
          "This email may already have a ReplyPass account. Log in instead, or reset your password if you can’t remember it.",
        );
        return;
      }
      track(mode === "login" ? "login" : "signup_submitted", isCreatorSetupDestination(next) ? "creator" : "fan");
      if (result.data.session) {
        router.push(`/auth/continue?next=${encodeURIComponent(next)}`);
        router.refresh();
      } else {
        setPendingEmail(email);
        setFeedback(
          isCreatorSetupDestination(next)
            ? "Check your email to confirm your account, then continue creator setup."
            : "Check your inbox and spam folder to confirm your account. The confirmation link will bring you back to this creator, where you can write your request and continue to payment—even if you open it on another device.",
        );
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function resendConfirmation() {
    const supabase = createClient();
    if (!supabase || !pendingEmail) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: {
          emailRedirectTo: `${authOrigin(location.origin)}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setFeedback(
        "A new confirmation email is on its way. Check your inbox and spam folder.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setError(
        message.toLowerCase().includes("rate limit")
          ? "Too many confirmation emails were requested. Please wait a few minutes and try again."
          : message || "We couldn’t resend the email. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {isCreatorDestination(next) && (
        <p className="auth-switch">
          <Link href={next}>← Back to {next.split("?")[0].slice(1)}</Link>
        </p>
      )}
      {configured ? (
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <label>
              Your name
              <input name="name" autoComplete="name" maxLength={80} required />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "signup" ? 12 : 1}
              maxLength={128}
              required
            />
            {mode === "signup" && (
              <span className="field-hint">At least 12 characters.</span>
            )}
          </label>
          <Button disabled={busy}>
            {busy
              ? "One moment…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
            <Icon name="arrow" size={18} />
          </Button>
          {mode === "login" && (
            <p className="auth-switch">
              <Link href="/forgot-password">Forgot your password?</Link>
            </p>
          )}
        </form>
      ) : (
        <div className="demo-auth">
          <div className="demo-notice">
            <strong>Explore ReplyPass</strong>
            <p>
              Local demo mode. No real account or password is needed. Your demo
              session stays in this browser.
            </p>
          </div>
          <Button disabled={busy} onClick={() => demo("creator")}>
            Explore creator demo <Icon name="arrow" size={18} />
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => demo("fan")}
          >
            Explore fan demo
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {feedback && (
        <div className="auth-confirmation" role="status">
          <p className="form-success">{feedback}</p>
          {mode === "signup" && pendingEmail && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={resendConfirmation}
            >
              {busy ? "Sending…" : "Resend confirmation email"}
            </Button>
          )}
        </div>
      )}
      <p className="auth-switch">
        {mode === "login" && !signupAllowed(next) ? (
          <>
            Here for a creator? Open their profile link to join.{" "}
            <Link href="/">Become a creator</Link>
          </>
        ) : mode === "login" ? (
          <>
            New here?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>
              {isCreatorSetupDestination(next) ? "Create a creator account" : "Create a fan account to continue"}
            </Link>
          </>
        ) : (
          <>
            Already here?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
          </>
        )}
      </p>
    </>
  );
}
