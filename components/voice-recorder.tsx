"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeVoiceMime, VOICE_MAX_BYTES, VOICE_MAX_DURATION_MS } from "@/lib/media/audio";
import { Button } from "./ui";
import { Icon } from "./icon";

type Recording = { blob: Blob; url: string; durationMs: number; mime: string };

function displayTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function supportedMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((mime) => MediaRecorder.isTypeSupported(mime)) || "";
}

async function durationOf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<number>((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => Number.isFinite(audio.duration) ? resolve(Math.round(audio.duration * 1000)) : reject();
      audio.onerror = reject;
    });
  } finally { URL.revokeObjectURL(url); }
}

export function VoiceRecorder({ requestId, demo = false, onDemoDelivered }: { requestId: string; demo?: boolean; onDemoDelivered?: () => Promise<void> }) {
  const router = useRouter();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voice, setVoice] = useState<Recording | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const next = Date.now() - startedAt.current;
      setElapsed(next);
      if (next >= VOICE_MAX_DURATION_MS) recorder.current?.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    if (voice) URL.revokeObjectURL(voice.url);
  }, [voice]);

  function clearVoice() {
    if (voice) URL.revokeObjectURL(voice.url);
    setVoice(null);
    setElapsed(0);
    setError("");
  }

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is unavailable on this browser. Choose an audio file instead.");
      return;
    }
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mimeType = supportedMime();
      const next = new MediaRecorder(microphone, mimeType ? { mimeType } : undefined);
      stream.current = microphone;
      recorder.current = next;
      chunks.current = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = () => {
        const durationMs = Math.min(Date.now() - startedAt.current, VOICE_MAX_DURATION_MS);
        const blob = new Blob(chunks.current, { type: next.mimeType || chunks.current[0]?.type || "audio/webm" });
        microphone.getTracks().forEach((track) => track.stop());
        stream.current = null;
        setRecording(false);
        if (blob.size > VOICE_MAX_BYTES) setError("That recording is larger than 20 MB. Record a shorter note.");
        else setVoice({ blob, url: URL.createObjectURL(blob), durationMs, mime: blob.type });
      };
      startedAt.current = Date.now();
      setElapsed(0);
      setRecording(true);
      next.start(500);
    } catch {
      setError("Microphone access was not allowed. You can enable it in browser settings or choose an audio file.");
    }
  }

  async function choose(file?: File) {
    if (!file) return;
    setError("");
    const mime = normalizeVoiceMime(file.type);
    if (!mime || file.size > VOICE_MAX_BYTES) {
      setError("Choose a WebM, M4A, MP3, OGG or WAV file under 20 MB.");
      return;
    }
    try {
      const durationMs = await durationOf(file);
      if (durationMs < 1000 || durationMs > VOICE_MAX_DURATION_MS) throw Error();
      clearVoice();
      setVoice({ blob: file, url: URL.createObjectURL(file), durationMs, mime });
    } catch { setError("Choose a voice note between 1 second and 5 minutes."); }
  }

  async function deliver() {
    if (!voice) return;
    setBusy(true);
    setError("");
    try {
      if (demo) {
        await onDemoDelivered?.();
        setBusy(false);
        return;
      }
      const mime = normalizeVoiceMime(voice.mime);
      if (!mime) throw Error("This recording format is not supported.");
      const prepared = await fetch("/api/media/voice/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, mime, bytes: voice.blob.size, durationMs: voice.durationMs }),
      });
      const target = await prepared.json();
      if (!prepared.ok) throw Error(target.error);
      const supabase = createClient();
      if (!supabase) throw Error("Secure storage is unavailable.");
      const { error: uploadError } = await supabase.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, voice.blob, { contentType: target.mime });
      if (uploadError) throw Error("The upload did not finish. Please try again.");
      const completed = await fetch("/api/media/voice/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: target.paymentId, path: target.path, mime: target.mime, bytes: voice.blob.size, durationMs: voice.durationMs }),
      });
      const result = await completed.json();
      if (!completed.ok) throw Error(result.error);
      clearVoice();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Voice note delivery failed. Your recording is still available to retry.");
    } finally { setBusy(false); }
  }

  return (
    <section className="voice-recorder" aria-label="Record voice note">
      {!voice && !recording && (
        <>
          <button type="button" className="voice-record-button" onClick={start} aria-label="Start recording">
            <Icon name="mic" size={28} /><span>Tap to record</span><small>Up to 5 minutes</small>
          </button>
          <label className="voice-file-fallback">
            Or choose an audio file
            <input type="file" accept="audio/webm,audio/mp4,audio/mpeg,audio/ogg,audio/wav,.m4a,.mp3" onChange={(event) => void choose(event.target.files?.[0])} />
          </label>
        </>
      )}
      {recording && (
        <div className="voice-recording" role="status" aria-live="polite">
          <span className="recording-dot" /><strong>Recording</strong>
          <div className="voice-wave" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
          <time>{displayTime(elapsed)} / 5:00</time>
          <Button type="button" onClick={() => recorder.current?.stop()}>Stop recording</Button>
        </div>
      )}
      {voice && (
        <div className="voice-preview">
          <div><strong>Preview your voice note</strong><span>{displayTime(voice.durationMs)} · {(voice.blob.size / 1024 / 1024).toFixed(1)} MB</span></div>
          <audio controls preload="metadata" src={voice.url}>Your browser cannot play this recording.</audio>
          <div className="voice-preview-actions">
            <Button type="button" variant="secondary" disabled={busy} onClick={clearVoice}>Delete & re-record</Button>
            <Button type="button" disabled={busy} onClick={deliver}>{busy ? "Delivering securely…" : "Deliver voice note"}<Icon name="arrow" size={16} /></Button>
          </div>
          <p><Icon name="shield" size={14} /> Delivery completes the request and starts payment capture.</p>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
