/**
 * X's public syndication endpoint (cdn.syndication.twimg.com) requires a
 * `token` query param derived from the tweet id. This is unofficial and
 * undocumented — the endpoint tolerates an incorrect token (verified: it
 * still returns 200 with valid data), so this is not a strict auth check,
 * just a formality the endpoint currently expects. Isolated in its own file
 * so a future change to the formula is a one-line patch.
 */
export function computeSyndicationToken(statusId: string): string {
  return ((Number(statusId) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}
