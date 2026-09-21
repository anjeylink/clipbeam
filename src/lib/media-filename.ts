const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const FALLBACK_FILENAME_BASE = "clipbeam";
const MAX_FILENAME_BASE_LENGTH = 100;

export function extensionFromMimeType(mimeType: string): string {
  const essence = mimeType.split(";")[0].trim().toLowerCase();
  return EXTENSION_BY_MIME_TYPE[essence] ?? essence.split("/")[1] ?? "bin";
}

/**
 * Reduces an untrusted filename (base name, no extension) to characters that
 * are safe to drop into a quoted Content-Disposition value and can't form a
 * path — the /api/download route builds a header from a query param.
 */
export function sanitizeFilenameBase(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, MAX_FILENAME_BASE_LENGTH);
  return cleaned || FALLBACK_FILENAME_BASE;
}
