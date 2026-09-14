"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhotoMime, PHOTO_MAX_BYTES } from "@/lib/media/image";
import { Button } from "./ui";
import { Icon } from "./icon";

export function PhotoDelivery({ requestId, demo = false, onDemoDelivered }: { requestId: string; demo?: boolean; onDemoDelivered?: () => Promise<void> }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function choose(next?: File) {
    if (!next) return;
    const mime = normalizePhotoMime(next.type);
    if (!mime || next.size > PHOTO_MAX_BYTES) return setError("Choose a JPG, PNG or WebP under 20 MB.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(next); setPreview(URL.createObjectURL(next)); setError("");
  }
  async function deliver() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      if (demo) { await onDemoDelivered?.(); return; }
      const prepared = await fetch("/api/media/photo/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, mime: file.type, bytes: file.size }) });
      const target = await prepared.json();
      if (!prepared.ok) throw Error(target.error);
      const supabase = createClient();
      if (!supabase) throw Error("Secure storage is unavailable.");
      const { error: uploadError } = await supabase.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: target.mime });
      if (uploadError) throw Error("The upload did not finish. Please try again.");
      const response = await fetch("/api/media/photo/deliver", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: target.paymentId, path: target.path, mime: target.mime, bytes: file.size }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Photo delivery failed."); }
    finally { setBusy(false); }
  }
  return <section className="photo-delivery" aria-label="Deliver requested photo">
    {!file ? <label className="photo-picker"><Icon name="camera" size={28}/><strong>Upload requested photo</strong><span>JPG, PNG or WebP · up to 20 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>choose(event.target.files?.[0])}/></label> : <>
      <div className="photo-preview"><Image src={preview} alt="Private delivery preview" fill unoptimized sizes="390px"/></div>
      <p className="delivery-confirmation">Review this photo carefully. Delivering it charges the fan and creates your 85% earning.</p>
      <div className="voice-preview-actions"><Button variant="secondary" disabled={busy} onClick={()=>{URL.revokeObjectURL(preview);setFile(null);setPreview("");}}>Replace photo</Button><Button disabled={busy} onClick={deliver}>{busy?"Delivering securely…":"Deliver photo"}<Icon name="arrow" size={16}/></Button></div>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
