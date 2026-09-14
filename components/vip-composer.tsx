"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizePhotoMime, PHOTO_MAX_BYTES } from "@/lib/media/image";
import { Button } from "./ui";

export type ManagedVipPost = { id: string; body: string; publishedAt: string; hasPhoto: boolean };

export function VipComposer({ enabled, initialPosts = [] }: { enabled: boolean; initialPosts?: ManagedVipPost[] }) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      let media = {};
      if (file) {
        const prep = await fetch("/api/creator/vip/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mime: file.type, bytes: file.size }) });
        const target = await prep.json();
        if (!prep.ok) throw Error(target.error);
        const client = createClient();
        if (!client) throw Error("Storage unavailable.");
        const { error } = await client.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: target.mime });
        if (error) throw Error("Upload failed.");
        media = { path: target.path, mime: target.mime, bytes: file.size };
      }
      const response = await fetch("/api/creator/vip/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, ...media }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setPosts((current) => [{ id: data.id, body, publishedAt: new Date().toISOString(), hasPhoto: !!file }, ...current]);
      setBody("");
      setFile(null);
      setMessage("VIP update published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(postId: string) {
    if (!window.confirm("Delete this VIP update? This cannot be undone.")) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/creator/vip/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
    const data = await response.json();
    if (response.ok) {
      setPosts((current) => current.filter((post) => post.id !== postId));
      setMessage("VIP update deleted.");
    } else setMessage(data.error);
    setBusy(false);
  }

  function choose(next?: File) {
    if (!next) return;
    if (!normalizePhotoMime(next.type) || next.size > PHOTO_MAX_BYTES) {
      setMessage("Choose a JPG, PNG or WebP under 20 MB.");
      return;
    }
    setFile(next);
  }

  return <>
    <form className="vip-composer" onSubmit={publish}>
      <h2>Share a VIP update</h2>
      <p>Only active VIP members can load the full post or photo.</p>
      <textarea placeholder="A little update for your VIPs…" maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} />
      <label className="photo-picker"><strong>{file ? file.name : "Add a private photo"}</strong><span>JPG, PNG or WebP · up to 20 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choose(event.target.files?.[0])} /></label>
      <Button disabled={busy || !enabled || (!body.trim() && !file)}>{busy ? "Working…" : enabled ? "Publish to VIPs" : "Enable VIP to publish"}</Button>
      {message && <p role="status">{message}</p>}
    </form>
    <section className="vip-composer vip-post-manager">
      <h2>Your VIP posts</h2>
      {!posts.length && <p>No VIP updates published yet.</p>}
      {posts.map((post) => <article key={post.id} className="vip-managed-post"><div><strong>{post.hasPhoto ? "Photo update" : "Text update"}</strong><small>{new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small><p>{post.body || "Private photo"}</p></div><button type="button" disabled={busy} onClick={() => remove(post.id)}>Delete</button></article>)}
    </section>
  </>;
}
