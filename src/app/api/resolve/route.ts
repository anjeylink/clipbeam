import { NextRequest, NextResponse } from "next/server";
import { validatePostUrl, type ParsePostUrlErrorCode } from "@/lib/parse-post-url";
import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { resolveXPost } from "@/lib/server/resolve-x-post";
import { resolveThreadsPost } from "@/lib/server/resolve-threads-post";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { enrichVideoQualitySizes } from "@/lib/server/enrich-video-sizes";
import { toClientMedia } from "@/lib/server/to-client-media";

const STATUS_BY_CODE: Record<ParsePostUrlErrorCode, number> = {
  "invalid-format": 400,
  "not-found": 404,
  "rate-limited": 429,
  unknown: 502,
  "unsupported-post": 422,
  "no-media": 422,
  "multi-media-unsupported": 422,
  "unsupported-media-host": 422,
};

function errorResponse(code: ParsePostUrlErrorCode) {
  return NextResponse.json({ code }, { status: STATUS_BY_CODE[code] });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return errorResponse("invalid-format");
  }

  const validation = validatePostUrl(rawUrl);
  if (!validation.valid) {
    return errorResponse("invalid-format");
  }

  console.log(`[resolve] ${rawUrl} ${new Date().toISOString()}`);

  try {
    const media: ResolvedMedia =
      validation.platform === "x"
        ? await resolveXPost(rawUrl.trim(), validation.x)
        : await resolveThreadsPost(rawUrl.trim(), validation);
    const enriched = await enrichVideoQualitySizes(media);
    return NextResponse.json(toClientMedia(enriched));
  } catch (err) {
    if (err instanceof MediaResolutionError) {
      return errorResponse(err.code);
    }
    return errorResponse("unknown");
  }
}
