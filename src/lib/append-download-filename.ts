/**
 * Turns an already-proxied, inline media URL into a save-to-disk attachment
 * by adding the `filename` param /api/download checks for. Kept as a plain
 * client-side function (not a method on ParsedXMedia) since the media
 * object crosses the network as JSON and can't carry methods; the branded
 * filename itself is a UI concern, so it's supplied by the caller rather
 * than baked into the server response.
 */
export function appendDownloadFilename(proxiedUrl: string, filenameBase: string): string {
  const url = new URL(proxiedUrl, "http://placeholder");
  url.searchParams.set("filename", filenameBase);
  return `${url.pathname}${url.search}`;
}
