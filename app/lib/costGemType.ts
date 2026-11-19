// Definition of Gem Types and Shapes
export type GemShape = "Round" | "Baguette" | "Fancy" | "Color";

export type GemType =
  | "Diamond (SI)"
  | "Diamond (VS)"
  | "Diamond (VVS)"
  | "CVD <= 1.2mm"
  | "CVD > 1.2mm"
  | "Moissanite"
  | "CZ";

// Price Matrix Structure Mapping [GemType][GemShape] -> Price
export const Gem_PRICE_MATRIX: Record<GemType, Record<GemShape, number>> = {
  "Diamond (SI)": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "Diamond (VS)": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "Diamond (VVS)": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "CVD <= 1.2mm": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "CVD > 1.2mm": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  Moissanite: {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  CZ: {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
};

/**
 * Helper function to lookup Gem price based on type and shape
 * @param type The Gem material type (e.g., 'Daiamond SI', 'CVD')
 * @param shape The shape of the Gem (e.g., 'Round', 'Baguette')
 * @returns The cost rate for the selected combination, or 0 if not found
 */
export const getGemPrice = (type: string, shape: string): number => {
  const normalizedType = type as GemType;
  const normalizedShape = shape as GemShape;

  if (
    Gem_PRICE_MATRIX[normalizedType] &&
    Gem_PRICE_MATRIX[normalizedType][normalizedShape] !== undefined
  ) {
    return Gem_PRICE_MATRIX[normalizedType][normalizedShape];
  }

  return 0;
};

export const getCostByShape: Record<GemType, Record<GemShape, number>> = {
  "Diamond (SI)": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "Diamond (VS)": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "Diamond (VVS)": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "CVD <= 1.2mm": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  "CVD > 1.2mm": {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  Moissanite: {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
  CZ: {
    Round: 2.3,
    Baguette: 2.5,
    Fancy: 2.6,
    Color: 2.7,
  },
};
