export const VOICE_MAX_BYTES = 20 * 1024 * 1024;
export const VOICE_MAX_DURATION_MS = 5 * 60 * 1000;
export const VOICE_MIN_DURATION_MS = 1000;

export const voiceMimeTypes = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
] as const;

export type VoiceMime = (typeof voiceMimeTypes)[number];

export function normalizeVoiceMime(value: string): VoiceMime | null {
  const base = value.toLowerCase().split(";", 1)[0].trim();
  return voiceMimeTypes.includes(base as VoiceMime) ? (base as VoiceMime) : null;
}

export function validVoiceSignature(bytes: Uint8Array, mime: VoiceMime) {
  if (bytes.length < 12) return false;
  if (mime === "audio/webm")
    return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (mime === "audio/mp4")
    return String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  if (mime === "audio/ogg")
    return String.fromCharCode(...bytes.slice(0, 4)) === "OggS";
  if (mime === "audio/wav")
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WAVE";
  return (
    String.fromCharCode(...bytes.slice(0, 3)) === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  );
}

export function voiceExtension(mime: VoiceMime) {
  return {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
  }[mime];
}
