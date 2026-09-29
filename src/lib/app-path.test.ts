import { describe, expect, it } from "vitest";
import { appPath } from "./app-path";

describe("appPath", () => {
  it("maps the root to the app segment itself, without a trailing slash", () => {
    expect(appPath("/")).toBe("/explorer");
  });

  it("prefixes a page path", () => {
    expect(appPath("/terms")).toBe("/explorer/terms");
  });

  it("keeps a query string", () => {
    expect(appPath("/api/resolve?url=x")).toBe("/explorer/api/resolve?url=x");
  });

  it("rejects a relative path", () => {
    expect(() => appPath("terms")).toThrow();
  });
});
