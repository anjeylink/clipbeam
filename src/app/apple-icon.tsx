import { ImageResponse } from "next/og";
import { BRAND_COLORS, BrandMark } from "@/components/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so this one is a full-bleed square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.primary,
        }}
      >
        <BrandMark size={112} color="#ffffff" />
      </div>
    ),
    size,
  );
}
