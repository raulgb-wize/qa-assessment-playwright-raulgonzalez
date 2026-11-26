/**
 * Model Context Protocol (MCP) Custom Tool: Inventory Pricing Calculator
 *
 * Implements catalog inspection, product filtering, dynamic tax & total calculations,
 * price surge modeling, and out-of-stock item handling for Swag Labs / SauceDemo e-commerce flows.
 */

export interface InventoryProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  category?: string;
}

export type SortOrder = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export interface InventoryPricingInput {
  /** Array of product names selected for purchase. */
  productNames?: string[];
  /** Optional minimum price filter. */
  minPrice?: number;
  /** Optional maximum price filter. */
  maxPrice?: number;
  /** Sorting criteria. */
  sortBy?: SortOrder;
  /** Sales tax rate (default is 0.08 for 8%). */
  taxRate?: number;
  /** Dynamic price overrides (e.g. price surges). */
  priceOverrides?: Record<string, number>;
  /** If true, out-of-stock products are excluded from calculation. */
  excludeOutOfStock?: boolean;
  /** List of product names marked out-of-stock. */
  outOfStockProducts?: string[];
  /** Custom catalog for API mocking scenarios. */
  customCatalog?: InventoryProduct[];
}

export interface InventoryPricingResult {
  selectedItems: InventoryProduct[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  formattedSubtotal: string;
  formattedTax: string;
  formattedTotal: string;
  rawSubtotalString: string;
  rawTaxString: string;
  rawTotalString: string;
  isSurgePricingApplied: boolean;
  outOfStockItemsExcluded: string[];
}

/** Standard Sauce Labs inventory baseline catalog */
export const STANDARD_INVENTORY: InventoryProduct[] = [
  {
    id: 'sauce-labs-backpack',
    name: 'Sauce Labs Backpack',
    description:
      'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
    price: 29.99,
    inStock: true,
  },
  {
    id: 'sauce-labs-bike-light',
    name: 'Sauce Labs Bike Light',
    description:
      'A red light for your bike with 3 lighting modes. 1000 lumens, 200m beam distance, battery life 10hrs.',
    price: 9.99,
    inStock: true,
  },
  {
    id: 'sauce-labs-bolt-t-shirt',
    name: 'Sauce Labs Bolt T-Shirt',
    description:
      'Get your testing superhero on with the Sauce Labs bolt T-shirt. 100% ringspun combed cotton.',
    price: 15.99,
    inStock: true,
  },
  {
    id: 'sauce-labs-fleece-jacket',
    name: 'Sauce Labs Fleece Jacket',
    description:
      "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
    price: 49.99,
    inStock: true,
  },
  {
    id: 'sauce-labs-onesie',
    name: 'Sauce Labs Onesie',
    description: "Rib snap suit with baby's comfort and cuteness in mind.",
    price: 7.99,
    inStock: true,
  },
  {
    id: 'test.allthethings()-t-shirt-(red)',
    name: 'Test.allTheThings() T-Shirt (Red)',
    description:
      'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to log some tests.',
    price: 15.99,
    inStock: true,
  },
];

/**
 * Rounds a floating point number to two decimal places safely.
 */
export function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates item subtotal, tax (8%), and grand total for selected products.
 *
 * Implements deterministic calculation matching Swag Labs / SauceDemo accounting rules:
 * - Subtotal: sum of unit prices of in-stock items
 * - Tax: round(Subtotal * taxRate)
 * - Total: Subtotal + Tax
 */
export function calculatePricing(input: InventoryPricingInput = {}): InventoryPricingResult {
  const {
    productNames,
    minPrice,
    maxPrice,
    sortBy,
    taxRate = 0.08,
    priceOverrides = {},
    excludeOutOfStock = true,
    outOfStockProducts = [],
    customCatalog,
  } = input;

  const catalog = (customCatalog || STANDARD_INVENTORY).map((item) => {
    const isOverride = Object.prototype.hasOwnProperty.call(priceOverrides, item.name);
    const updatedPrice = isOverride ? priceOverrides[item.name] : item.price;
    const isOutOfStock = outOfStockProducts.includes(item.name) || !item.inStock;

    return {
      ...item,
      price: updatedPrice,
      inStock: !isOutOfStock,
    };
  });

  const outOfStockExcluded: string[] = [];

  // Filter items
  let filtered = catalog.filter((item) => {
    // Out-of-stock check
    if (!item.inStock) {
      if (excludeOutOfStock) {
        if (!productNames || productNames.includes(item.name)) {
          outOfStockExcluded.push(item.name);
        }
        return false;
      }
    }

    // Name filter if specific products requested
    if (productNames && productNames.length > 0) {
      if (!productNames.includes(item.name)) {
        return false;
      }
    }

    // Price bounds
    if (minPrice !== undefined && item.price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && item.price > maxPrice) {
      return false;
    }

    return true;
  });

  // Sort if requested
  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
      }
    });
  }

  // Preserve duplicate items if productNames contains duplicates
  const finalItems: InventoryProduct[] = [];
  if (productNames && productNames.length > 0) {
    for (const name of productNames) {
      const match = filtered.find((p) => p.name === name);
      if (match) {
        finalItems.push(match);
      }
    }
  } else {
    finalItems.push(...filtered);
  }

  const subtotalRaw = finalItems.reduce((acc, curr) => acc + curr.price, 0);
  const subtotal = roundToTwoDecimals(subtotalRaw);
  const tax = roundToTwoDecimals(subtotal * taxRate);
  const total = roundToTwoDecimals(subtotal + tax);

  const isSurgePricingApplied = Object.keys(priceOverrides).length > 0;

  return {
    selectedItems: finalItems,
    itemCount: finalItems.length,
    subtotal,
    tax,
    total,
    taxRate,
    formattedSubtotal: `Item total: $${subtotal.toFixed(2)}`,
    formattedTax: `Tax: $${tax.toFixed(2)}`,
    formattedTotal: `Total: $${total.toFixed(2)}`,
    rawSubtotalString: `$${subtotal.toFixed(2)}`,
    rawTaxString: `$${tax.toFixed(2)}`,
    rawTotalString: `$${total.toFixed(2)}`,
    isSurgePricingApplied,
    outOfStockItemsExcluded: outOfStockExcluded,
  };
}

/**
 * MCP Tool Handler format (returns standard MCP CallToolResult structure)
 */
export function executeInventoryPricingTool(input: InventoryPricingInput): {
  content: Array<{ type: 'text'; text: string }>;
} {
  const result = calculatePricing(input);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
