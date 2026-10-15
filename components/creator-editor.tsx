"use client";
import type { FollowerCounts } from "@/lib/creators/socials";
import { track, trackXCreatorRegistration } from "@/lib/analytics/client";
import { siteConfig } from "@/lib/site";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, type CreatorDraft } from "@/types/creator";
import { blankCreator, catalog } from "@/lib/creators/catalog";
import { creatorCountries } from "@/lib/creators/countries";
import { validateCreator, centsFromInput } from "@/lib/creators/validation";
import { splitPayment, PLATFORM_FEE_PERCENT } from "@/lib/payments/fees";
import { Button, Price } from "./ui";
import { Icon } from "./icon";
import { paidRequestAvailable } from "@/lib/launch/scope";
export function CreatorEditor({
  initial = blankCreator,
  demo,
  editing = false,
}: {
  initial?: CreatorDraft;
  demo: boolean;
  editing?: boolean;
}) {
  const [draft, setDraft] = useState<CreatorDraft>({
    ...initial,
    pricing:initial.pricing.map(p=>p.kind === "message"&&!demo&&!initial.payoutReady?{...p,enabled:false}:p),
    image: initial.image.startsWith("data:")
      ? "/images/avatar.svg"
      : initial.image,
    profilePhotos: initial.profilePhotos?.length ? initial.profilePhotos : initial.image.includes("/storage/v1/object/public/avatars/") ? [{ url: initial.image, x: 50, y: 50, scale: 100 }] : [],
  });
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState("");
  const [avatar, setAvatar] = useState(
    initial.image.startsWith("data:") ? initial.image : "",
  );
  const router = useRouter();
  function patch<K extends keyof CreatorDraft>(key: K, value: CreatorDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function checkUsername() {
    setAvailability("Checking…");
    try {
      const r = await fetch(
        `/api/creator/username?username=${encodeURIComponent(draft.username)}`,
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setAvailability(
        data.available
          ? "This username is available."
          : "That username is unavailable.",
      );
      return data.available === true;
    } catch {
      setAvailability("Could not check availability. Please try again.");
      return false;
    }
  }
  async function upload(file?: File, photoIndex = 0) {
    if (!file) return;
    if (
      file.size > 2 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG or WebP under 2 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (demo) {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setAvatar(data);
        patch("image", "/images/avatar.svg");
      } else {
        const body = new FormData();
        body.set("image", file);
        const r = await fetch("/api/creator/avatar", { method: "POST", body });
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        setDraft((current) => {
          const profilePhotos = [...(current.profilePhotos || [])];
          profilePhotos[photoIndex] = { url: data.url, x: 50, y: 50, scale: 100 };
          return { ...current, image: photoIndex === 0 ? data.url : current.image, profilePhotos };
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }
  function positionPhoto(index: number, axis: "x" | "y" | "scale", value: number) {
    setDraft((current) => ({
      ...current,
      profilePhotos: (current.profilePhotos || []).map((photo, photoIndex) => photoIndex === index ? { ...photo, [axis]: value } : photo),
    }));
  }
  function removePhoto(index: number) {
    setDraft((current) => {
      const profilePhotos = (current.profilePhotos || []).filter((_, photoIndex) => photoIndex !== index);
      return { ...current, profilePhotos, image: index === 0 ? profilePhotos[0]?.url || "" : current.image };
    });
  }
  function movePhoto(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const profilePhotos = [...(current.profilePhotos || [])];
      const target = index + direction;
      if (target < 0 || target >= profilePhotos.length) return current;
      [profilePhotos[index], profilePhotos[target]] = [profilePhotos[target], profilePhotos[index]];
      return { ...current, profilePhotos, image: profilePhotos[0].url };
    });
  }
  async function next() {
    setError("");
    if (step === 1) {
      const errors = validateCreator(draft);
      const profileErrors = errors.filter((e) => !e.startsWith("Prices"));
      if (profileErrors.length) {
        setError(profileErrors[0]);
        return;
      }
      if (!(await checkUsername())) {
        setError("Choose an available username.");
        return;
      }
    }
    if (step === 3) {
      const errors = validateCreator(draft);
      if (errors.length) {
        setError(errors[0]);
        return;
      }
    }
    if (!demo && !editing) track("creator_onboarding_step", step);
    setStep((s) => Math.min(5, s + 1));
  }
  async function launch() {
    const errors = validateCreator(draft);
    if (errors.length) {
      setError(errors[0]);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/creator/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      if (demo) {
        localStorage.setItem(
          "replypass:creator",
          JSON.stringify({ ...draft, image: avatar || draft.image }),
        );
        window.dispatchEvent(new Event("replypass:change"));
      }
      if (!demo && !editing) track("creator_launch_success");
      if (!demo && !editing && typeof data.xConversionId === "string") {
        trackXCreatorRegistration(data.xConversionId);
      }
      router.push("/creator/dashboard");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const headings = [
    "",
    "Let’s make it yours.",
    "Where can people find you?",
    "Your time. Your price.",
    "Set your own rhythm.",
    "Ready to meet your people?",
  ];
  return (
    <div
      className={`editor-page ${editing ? "editing" : ""}`}
      id={editing ? undefined : "main"}
    >
      <div className="editor-top">
        <span className="eyebrow">
          {editing ? "YOUR PUBLIC PAGE" : "BECOME A CREATOR"}
        </span>
        <span>Step {step} of 5</span>
      </div>
      <div className="step-track" aria-label={`Step ${step} of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= step ? "active" : ""} />
        ))}
      </div>
      {editing && <nav className="editor-section-nav" aria-label="Edit profile sections">
        {[[1,"Basics & photos"],[2,"Links"],[3,"Prices"],[4,"Availability"],[5,"Preview"]].map(([number,label]) => <button key={number} type="button" aria-current={step===number?"step":undefined} onClick={() => setStep(Number(number))}>{label}</button>)}
      </nav>}
      <h1>{headings[step]}</h1>
      <p className="editor-description">
        {
          [
            "",
            "The basics that help your people recognize you.",
            "Optional links. Keep your community connected.",
            "Choose what you offer. Change it whenever you like.",
            "Let fans know how and when you’re available.",
            "Review the main details people will see on your public page.",
          ][step]
        }
      </p>
      {step === 1 && (
        <div className="editor-fields">
          {demo && <div className="avatar-upload">
            <Image
              src={avatar || draft.image || "/images/avatar.svg"}
              alt="Profile preview"
              width={76}
              height={76}
              unoptimized
            />
            <label>
              Profile image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <small>JPG, PNG or WebP · Up to 2 MB</small>
            </label>
          </div>}
          {!demo && <div className="profile-photo-editor">
            <h2>Your profile photos</h2>
            <p className="field-hint">Add up to three photos. Drag the sliders to position each photo as it will appear on your public page. The first photo is your cover.</p>
            <div className="profile-photo-grid">
              {(draft.profilePhotos || []).map((photo, index) => <div className="profile-photo-slot" key={photo.url}>
                <div className="profile-photo-frame"><Image src={photo.url} alt={`Photo ${index + 1} crop preview`} fill unoptimized style={{objectPosition:`${photo.x}% ${photo.y}%`,transform:`scale(${photo.scale / 100})`}} /></div>
                <strong>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</strong>
                <label>Move left or right<input type="range" min="0" max="100" value={photo.x} onChange={(e) => positionPhoto(index,"x",Number(e.target.value))} /></label>
                <label>Move up or down<input type="range" min="0" max="100" value={photo.y} onChange={(e) => positionPhoto(index,"y",Number(e.target.value))} /></label>
                <label>Zoom photo<input type="range" min="100" max="200" value={photo.scale} onChange={(e) => positionPhoto(index,"scale",Number(e.target.value))} /></label>
                <label className="profile-photo-replace">Replace photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0],index)} /></label>
                {index > 0 && <button type="button" onClick={() => movePhoto(index,-1)}>{index === 1 ? "Make cover" : "Move earlier"}</button>}
                {index < (draft.profilePhotos || []).length - 1 && <button type="button" onClick={() => movePhoto(index,1)}>Move later</button>}
                <button type="button" onClick={() => removePhoto(index)}>Remove from page</button>
              </div>)}
            </div>
            {(draft.profilePhotos || []).length < 3 && <label className="profile-photo-add">Add photo {(draft.profilePhotos || []).length + 1}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0],(draft.profilePhotos || []).length)} /></label>}
          </div>}
          <label>
            Display name
            <input
              value={draft.displayName}
              onChange={(e) => patch("displayName", e.target.value)}
              maxLength={80}
              autoComplete="name"
              placeholder="Your name"
            />
          </label>
          <label>
            Username
            <div className="username-field">
              <span>replypass / </span>
              <input
                value={draft.username}
                onChange={(e) => {
                  patch(
                    "username",
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  );
                  setAvailability("");
                }}
                onBlur={checkUsername}
                maxLength={30}
                placeholder="yourname"
                autoComplete="off"
              />
            </div>
            <span className="field-hint" role="status">
              {availability ||
                "3–30 lowercase letters, numbers or underscores."}
            </span>
          </label>
          <label>
            Short bio
            <textarea
              value={draft.bio}
              onChange={(e) => patch("bio", e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="What would you love to talk about?"
            />
          </label>
          <fieldset>
            <legend>
              Categories <span>Choose up to three</span>
            </legend>
            <div className="category-options">
              {categories.map((c) => (
                <button
                  type="button"
                  aria-pressed={draft.categories.includes(c)}
                  key={c}
                  onClick={() =>
                    patch(
                      "categories",
                      draft.categories.includes(c)
                        ? draft.categories.filter((x) => x !== c)
                        : draft.categories.length < 3
                          ? [...draft.categories, c]
                          : draft.categories,
                    )
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Country
            <select
              value={draft.country}
              onChange={(e) => patch("country", e.target.value)}
            >
              {creatorCountries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="editor-fields">
          <p className="field-hint">Links appear beneath your bio. Optional follower counts are shown as creator-provided, with the date you last changed them.</p>
          {Object.entries({
            instagram: "Instagram",
            tiktok: "TikTok",
            youtube: "YouTube",
            twitter: "X / Twitter",
            website: "Website",
          }).map(([key, label]) => (
            <div className="social-editor-row" key={key}><label>
              {label} <span className="optional">Optional</span>
              <input
                type="url"
                value={draft.socials[key as keyof typeof draft.socials]}
                onChange={(e) =>
                  patch("socials", { ...draft.socials, [key]: e.target.value })
                }
                placeholder="https://"
                maxLength={300}
              />
            </label>
            {key !== "website" && <label>Follower count <span className="optional">Optional</span>
              <input type="number" inputMode="numeric" min="0" max="2000000000" step="1"
                value={draft.socialFollowers?.[key as keyof FollowerCounts] ?? ""}
                onChange={e => {
                  const counts = { ...draft.socialFollowers };
                  if (e.target.value === "") delete counts[key as keyof FollowerCounts];
                  else counts[key as keyof FollowerCounts] = Number(e.target.value);
                  patch("socialFollowers", counts);
                }} placeholder="e.g. 12500" />
            </label>}
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <>
          <div className="currency-note">
            Currency <strong>EUR (€)</strong>
            <span>
              All prices include the {PLATFORM_FEE_PERCENT}% platform fee.
            </span>
          </div>
          <div className="pricing-editor">
            {catalog.filter((item) => paidRequestAvailable(item.kind)).map((item) => {
              const price = draft.pricing.find((p) => p.kind === item.kind)!;
              return (
                <div className="price-editor-row" key={item.kind}>
                  <div>
                    <strong>
                      {item.kind === "message"
                        ? "Guaranteed reply"
                        : item.title === "Become VIP"
                          ? "VIP subscription"
                          : item.title}
                    </strong>
                    <span>{item.unit || "Per request"}</span>
                  </div>
                  <label className="price-input">
                    <span className="sr-only">{item.title} price in EUR</span>
                    <span>€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={["vip", "live_chat"].includes(item.kind) ? 100 : 500}
                      defaultValue={price.cents / 100}
                      onChange={(e) =>
                        patch(
                          "pricing",
                          draft.pricing.map((p) =>
                            p.kind === item.kind
                              ? { ...p, cents: centsFromInput(e.target.value) }
                              : p,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      disabled={item.kind === "message" && !demo && !initial.payoutReady}
                      aria-label={`Enable ${item.title}`}
                      checked={price.enabled}
                      onChange={(e) =>
                        patch(
                          "pricing",
                          draft.pricing.map((p) =>
                            p.kind === item.kind
                              ? { ...p, enabled: e.target.checked }
                              : p,
                          ),
                        )
                      }
                    />
                    <span />
                  </label>
                </div>
              );
            })}
          </div>
          <div className="fee-example">
            On a €4 reply <span>Platform €0.60</span>
            <strong>
              You earn <Price cents={splitPayment(400).creatorCents} decimals />
            </strong>
          </div>
        </>
      )}
      {step === 4 && (
        <div className="editor-fields">
          <div className="availability-options">
            {(["online", "away", "offline"] as const).map((status) => (
              <button
                key={status}
                aria-pressed={draft.availability === status}
                onClick={() => patch("availability", status)}
              >
                <i className={`status-dot ${status}`} />
                {status}
              </button>
            ))}
          </div>
          {(
            [
              ["acceptingMessages", "Accepting messages"],
              ["acceptingMedia", "Accepting media requests"],
            ] as const
          ).map(([key, label]) => (
            <div className="setting-row" key={key}>
              <span>{label}</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={draft[key]}
                  onChange={(e) => patch(key, e.target.checked)}
                />
                <span />
              </label>
            </div>
          ))}
          <label>
            Typical reply time <span className="optional">Optional</span>
            <select
              value={draft.replyTime}
              onChange={(e) => patch("replyTime", e.target.value)}
            >
              <option value="">Not specified</option>
              {["~10 minutes", "~1 hour", "within 24 hours"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {step === 5 && (
        <div className="phone-preview">
          <div className="preview-phone-bar">
            {siteConfig.logo}<span className="pink">.</span>
          </div>
          <div className="preview-cover-frame"><Image
            src={avatar || draft.profilePhotos?.[0]?.url || draft.image || "/images/avatar.svg"}
            alt="Your public profile preview"
            fill
            unoptimized
            style={{objectPosition: draft.profilePhotos?.[0] ? `${draft.profilePhotos[0].x}% ${draft.profilePhotos[0].y}%` : undefined, transform: draft.profilePhotos?.[0] ? `scale(${draft.profilePhotos[0].scale / 100})` : undefined}}
          /></div>
          {!!draft.profilePhotos && draft.profilePhotos.length > 1 && <div className="preview-photo-strip">
            {draft.profilePhotos.slice(1).map((photo,index) => <div className="preview-photo-thumb" key={photo.url}><Image src={photo.url} alt={`Additional profile photo ${index + 2}`} fill unoptimized style={{objectPosition:`${photo.x}% ${photo.y}%`,transform:`scale(${photo.scale/100})`}} /></div>)}
          </div>}
          <h2>{draft.displayName}</h2>
          <span className="muted">
            @{draft.username} · {draft.availability}
          </span>
          <p>{draft.bio}</p>
          <p>{creatorCountries.find(([code]) => code === draft.country)?.[1]}</p>
          <p>{draft.categories.join(" · ")}</p>
          <p>{Object.entries(draft.socials).filter(([,url])=>!!url).map(([platform])=>platform).join(" · ")}</p>
          <h3>Choose how we talk.</h3>
          {draft.pricing
            .filter((p) => p.enabled && (p.kind === "message" || p.kind === "vip"))
            .map((p) => (
              <div className="preview-offering" key={p.kind}>
                <span>{catalog.find((c) => c.kind === p.kind)?.title}</span>
                <Price
                  cents={p.cents}
                  unit={catalog.find((c) => c.kind === p.kind)?.unit}
                />
              </div>
            ))}
          <small>{siteConfig.fanPromise}</small>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="editor-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Back
        </Button>
        <Button disabled={busy} onClick={editing || step === 5 ? launch : next}>
          {busy
            ? "Saving…"
            : editing
              ? "Save changes"
              : step === 5
              ? editing
                ? "Save my ReplyPass"
                : "Publish my ReplyPass"
              : "Continue"}
          <Icon name="arrow" size={18} />
        </Button>
      </div>
      {demo && (
        <p className="editor-demo-note">
          Demo mode · Saved in this browser. No payments are enabled.
        </p>
      )}
    </div>
  );
}
