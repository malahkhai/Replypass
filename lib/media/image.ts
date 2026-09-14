export const PHOTO_MAX_BYTES = 20 * 1024 * 1024;

export type PhotoMime = "image/jpeg" | "image/png" | "image/webp";

export function normalizePhotoMime(value: string): PhotoMime | null {
  const mime = value.trim().toLowerCase();
  return (["image/jpeg", "image/png", "image/webp"] as const).find((item) => item === mime) || null;
}

export function photoExtension(mime: PhotoMime) {
  return mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
}

export function validPhotoSignature(bytes: Uint8Array, mime: PhotoMime) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png")
    return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}
