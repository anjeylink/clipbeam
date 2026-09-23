import type { ParsePostUrlErrorCode } from "@/lib/parse-post-url";

/**
 * Thrown by a Platform resolver (and toClientMedia) to end resolution with
 * a specific client-facing error code; /api/resolve maps the code to an
 * HTTP status.
 */
export class MediaResolutionError extends Error {
  readonly code: ParsePostUrlErrorCode;

  constructor(code: ParsePostUrlErrorCode) {
    super(code);
    this.name = "MediaResolutionError";
    this.code = code;
  }
}
