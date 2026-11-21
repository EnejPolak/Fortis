export type CartLine = {
  variantId: string;
  slug: string;
  quantity: number;
};

export type CartState = {
  lines: CartLine[];
  updatedAt: string;
};

export type HydratedCartLine = CartLine & {
  name: string;
  brand: string;
  imageSrc: string;
  volumeLabel: string;
  unitCents: number;
  lineCents: number;
  maxQuantity: number;
  available: boolean;
};

export const CART_STORAGE_KEY = "fortis.cart.v1";
export const CART_MAX_LINE_QTY = 20;
