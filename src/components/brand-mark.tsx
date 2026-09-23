// The site header's lucide "zap" glyph as a plain <svg>, for the images
// next/og renders (icon, apple-icon, og.png), which can't use Tailwind classes.
const ZAP_PATH =
  "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z";

// Theme colors from globals.css (--primary, --background, --foreground,
// --muted-foreground), in hex because ImageResponse doesn't parse oklch().
export const BRAND_COLORS = {
  primary: "#0b7e74",
  background: "#f0fdfa",
  foreground: "#134e4a",
  muted: "#45556c",
};

export function BrandMark({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ZAP_PATH} />
    </svg>
  );
}
