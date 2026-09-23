import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "./url-base64-to-uint8array";

describe("urlBase64ToUint8Array", () => {
  it("decodes unpadded base64url, including - and _", () => {
    // 0xfb 0xff 0xbf is "+/+/" in base64 and "-_-_" in base64url.
    expect(Array.from(urlBase64ToUint8Array("-_-_"))).toEqual([0xfb, 0xff, 0xbf]);
  });

  it("restores missing padding", () => {
    expect(Array.from(urlBase64ToUint8Array("AQI"))).toEqual([1, 2]);
    expect(Array.from(urlBase64ToUint8Array("AQ"))).toEqual([1]);
  });
});
