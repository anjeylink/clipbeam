import { NextRequest, NextResponse } from "next/server";
import { validateXUrl, type ParseXUrlErrorCode } from "@/lib/parse-x-url";
import { computeSyndicationToken } from "@/lib/server/twitter-token";
import { mapTweetJsonToMedia, TweetResolutionError } from "@/lib/server/map-tweet-to-media";
import { resolveShortLink, ShortLinkResolutionError } from "@/lib/server/resolve-short-link";
import { enrichVideoQualitySizes } from "@/lib/server/enrich-video-sizes";
import { toClientMedia } from "@/lib/server/to-client-media";

function errorResponse(code: ParseXUrlErrorCode, status: number) {
  return NextResponse.json({ code }, { status });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return errorResponse("invalid-format", 400);
  }

  const initialValidation = validateXUrl(rawUrl);
  if (!initialValidation.valid) {
    return errorResponse("invalid-format", 400);
  }

  let resolvedUrl = rawUrl.trim();
  let validation = initialValidation;

  if (validation.format === "short-link") {
    try {
      resolvedUrl = await resolveShortLink(resolvedUrl);
    } catch (err) {
      if (err instanceof ShortLinkResolutionError) {
        return errorResponse("invalid-format", 400);
      }
      return errorResponse("unknown", 502);
    }
    validation = validateXUrl(resolvedUrl);
    if (!validation.valid || validation.format !== "direct" || !validation.statusId) {
      return errorResponse("invalid-format", 400);
    }
  }

  const statusId = validation.statusId;
  if (!statusId) {
    return errorResponse("invalid-format", 400);
  }

  const token = computeSyndicationToken(statusId);
  const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${statusId}&token=${token}`;

  let res: Response;
  try {
    res = await fetch(syndicationUrl, { next: { revalidate: 300 } });
  } catch {
    return errorResponse("unknown", 502);
  }

  if (res.status === 404) {
    return errorResponse("not-found", 404);
  }
  if (res.status === 429) {
    return errorResponse("rate-limited", 429);
  }
  if (!res.ok) {
    return errorResponse("unknown", 502);
  }

  let tweetJson: unknown;
  try {
    tweetJson = await res.json();
  } catch {
    return errorResponse("unknown", 502);
  }

  try {
    const media = mapTweetJsonToMedia(tweetJson, resolvedUrl);
    const enriched = await enrichVideoQualitySizes(media);
    return NextResponse.json(toClientMedia(enriched));
  } catch (err) {
    if (err instanceof TweetResolutionError) {
      return errorResponse(err.code, 422);
    }
    return errorResponse("unknown", 500);
  }
}
