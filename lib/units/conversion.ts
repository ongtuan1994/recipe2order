export type WeightUnit = "g" | "kg" | "oz" | "lb";
export type VolumeUnit = "ml" | "l" | "fl_oz" | "tsp" | "tbsp" | "cup";
export type Unit = WeightUnit | VolumeUnit;

const WEIGHT_TO_G: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  fl_oz: 29.5735,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 240,
};

export function getBaseUnit(unit: string): "g" | "ml" | null {
  if (unit in WEIGHT_TO_G) return "g";
  if (unit in VOLUME_TO_ML) return "ml";
  return null;
}

export function convert(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;

  const fromBase = getBaseUnit(fromUnit);
  const toBase = getBaseUnit(toUnit);

  if (!fromBase || !toBase) {
    throw new Error(`Unknown unit: ${!fromBase ? fromUnit : toUnit}`);
  }
  if (fromBase !== toBase) {
    throw new Error(`Cannot convert ${fromUnit} (${fromBase}) to ${toUnit} (${toBase})`);
  }

  const table = fromBase === "g" ? WEIGHT_TO_G : VOLUME_TO_ML;
  const inBase = value * table[fromUnit as keyof typeof table];
  return inBase / table[toUnit as keyof typeof table];
}
