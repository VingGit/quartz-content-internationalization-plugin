import { describe, expect, it } from "vitest";
import {
  getOptions,
  isInitialized,
  resetOptionsForTesting,
  setOptions,
} from "../src/util/state";

describe("state singleton", () => {
  it("returns defaults before initialization", () => {
    resetOptionsForTesting();
    const opts = getOptions();
    expect(opts.locales).toEqual([]);
    expect(opts.hideUnavailableLocales).toBe(false);
    expect(isInitialized()).toBe(false);
  });

  it("merges partial options preserving previous values", () => {
    resetOptionsForTesting();
    setOptions({ locales: ["en-CA"] });
    setOptions({ rtlLocales: ["ar-SA"] });
    const opts = getOptions();
    expect(opts.locales).toEqual(["en-CA"]);
    expect(opts.rtlLocales).toEqual(["ar-SA"]);
    expect(isInitialized()).toBe(true);
  });

  it("setOptions() with no args still marks initialized", () => {
    resetOptionsForTesting();
    setOptions();
    expect(isInitialized()).toBe(true);
  });

  it("explicit empty array overrides previous list", () => {
    resetOptionsForTesting();
    setOptions({ locales: ["en-CA", "de-DE"] });
    setOptions({ locales: [] });
    expect(getOptions().locales).toEqual([]);
  });
});
