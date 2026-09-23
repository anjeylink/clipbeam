// Labels by the short edge, not the literal "height" field — a portrait
// (vertical) video's dimensions are still WxH with width<height (e.g.
// 720x1280), and labeling that "1280p" reads wrong to users used to
// 720p/480p/etc. referring to the shorter edge regardless of orientation.
export function labelForDimensions(width: number, height: number): string {
  return `${Math.min(width, height)}p`;
}
