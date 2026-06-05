import { describe, expect, it } from "vitest";
import {
  buildLocaleList,
  extractLocalePrefix,
  isLocaleSegment,
  normalizeLocale,
  stripLocalePrefix,
  tryNormalizeLocale,
} from "../src/util/locales";

describe("normalizeLocale", () => {
  it("uppercases region", () => {
    expect(normalizeLocale("de-de")).toBe("de-DE");
  });

  it("accepts underscore form", () => {
    expect(normalizeLocale("de_DE")).toBe("de-DE");
  });

  it("accepts language only", () => {
    expect(normalizeLocale("ga")).toBe("ga");
  });

  it("title-cases 4-char script tags", () => {
    expect(normalizeLocale("zh-hans-cn")).toBe("zh-Hans-CN");
  });

  it("rejects malformed input", () => {
    expect(() => normalizeLocale("not a locale!")).toThrow();
    expect(() => normalizeLocale("")).toThrow();
  });

  it("tryNormalizeLocale returns null on error", () => {
    expect(tryNormalizeLocale("xx-XX-!@#")).toBeNull();
    expect(tryNormalizeLocale("de_DE")).toBe("de-DE");
  });
});

describe("buildLocaleList", () => {
  it("always places default first", () => {
    expect(buildLocaleList("fi-FI", ["en-CA", "de-DE"])).toEqual(["fi-FI", "en-CA", "de-DE"]);
  });

  it("dedupes default appearing in configured list", () => {
    expect(buildLocaleList("fi-FI", ["fi-FI", "en-CA"])).toEqual(["fi-FI", "en-CA"]);
  });

  it("dedupes case-variant duplicates", () => {
    expect(buildLocaleList("fi-FI", ["fi_FI", "en-ca", "en-CA"])).toEqual(["fi-FI", "en-CA"]);
  });

  it("skips invalid locales with a warning", () => {
    const list = buildLocaleList("fi-FI", ["not a locale!", "de-DE"]);
    expect(list).toEqual(["fi-FI", "de-DE"]);
  });
});

describe("locale prefix helpers", () => {
  const locales = ["fi-FI", "en-CA", "de-DE"];

  it("isLocaleSegment matches case-insensitively after normalization", () => {
    expect(isLocaleSegment("fi-FI", locales)).toBe(true);
    expect(isLocaleSegment("fi_fi", locales)).toBe(true);
    expect(isLocaleSegment("xx-XX", locales)).toBe(false);
  });

  it("extractLocalePrefix returns first segment when known", () => {
    expect(extractLocalePrefix("en-CA/some/page", locales)).toBe("en-CA");
    expect(extractLocalePrefix("docs/page", locales)).toBeNull();
    expect(extractLocalePrefix("fi-FI", locales)).toBe("fi-FI");
  });

  it("stripLocalePrefix removes the leading locale segment", () => {
    expect(stripLocalePrefix("de-DE/foo/bar", locales)).toBe("foo/bar");
    expect(stripLocalePrefix("docs/page", locales)).toBe("docs/page");
    expect(stripLocalePrefix("de-DE", locales)).toBe("");
  });
});
