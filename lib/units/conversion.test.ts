import { describe, it, expect } from "vitest";
import { convert, getBaseUnit } from "./conversion";

describe("getBaseUnit", () => {
  it.each([
    ["g", "g"],
    ["kg", "g"],
    ["oz", "g"],
    ["lb", "g"],
    ["ml", "ml"],
    ["l", "ml"],
    ["fl_oz", "ml"],
    ["tsp", "ml"],
    ["tbsp", "ml"],
    ["cup", "ml"],
  ] as const)("returns base for %s", (unit, base) => {
    expect(getBaseUnit(unit)).toBe(base);
  });

  it("returns null for unknown unit", () => {
    expect(getBaseUnit("piece")).toBeNull();
    expect(getBaseUnit("xyz")).toBeNull();
  });
});

describe("convert", () => {
  it("returns value unchanged for same unit", () => {
    expect(convert(100, "g", "g")).toBe(100);
    expect(convert(2.5, "kg", "kg")).toBe(2.5);
  });

  describe("weight", () => {
    it("g <-> kg", () => {
      expect(convert(1, "kg", "g")).toBe(1000);
      expect(convert(500, "g", "kg")).toBe(0.5);
    });

    it("g <-> oz", () => {
      expect(convert(1, "oz", "g")).toBeCloseTo(28.3495, 3);
      expect(convert(100, "g", "oz")).toBeCloseTo(3.5274, 3);
    });

    it("kg <-> lb", () => {
      expect(convert(1, "lb", "kg")).toBeCloseTo(0.4536, 3);
      expect(convert(1, "kg", "lb")).toBeCloseTo(2.2046, 3);
    });

    it("composed: oz -> kg via g", () => {
      expect(convert(16, "oz", "kg")).toBeCloseTo(0.4536, 3);
    });
  });

  describe("volume", () => {
    it("ml <-> l", () => {
      expect(convert(1, "l", "ml")).toBe(1000);
      expect(convert(250, "ml", "l")).toBe(0.25);
    });

    it("ml <-> fl_oz", () => {
      expect(convert(1, "fl_oz", "ml")).toBeCloseTo(29.5735, 3);
    });

    it("tsp <-> tbsp", () => {
      expect(convert(3, "tsp", "tbsp")).toBeCloseTo(1, 3);
      expect(convert(1, "tbsp", "tsp")).toBeCloseTo(3, 3);
    });

    it("cup <-> ml", () => {
      expect(convert(1, "cup", "ml")).toBe(240);
    });
  });

  describe("errors", () => {
    it("throws on cross-group conversion (weight <-> volume)", () => {
      expect(() => convert(100, "g", "ml")).toThrow(/Cannot convert/);
      expect(() => convert(1, "l", "kg")).toThrow(/Cannot convert/);
    });

    it("throws on unknown unit", () => {
      expect(() => convert(1, "xyz", "g")).toThrow(/Unknown unit/);
      expect(() => convert(1, "g", "abc")).toThrow(/Unknown unit/);
    });
  });
});
