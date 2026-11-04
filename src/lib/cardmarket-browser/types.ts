export type ShippingAddressInput = {
  name: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  extra?: string;
};

export type CartSummary = {
  itemCount: number;
  totalLabel: string | null;
  url: string;
};

export type SelectedListing = {
  seller: string | null;
  itemLocation: string | null;
  salesCount: number | null;
  priceLabel: string | null;
};

export type PrepareCartResult = {
  cart: CartSummary;
  addedFrom?: string;
  shippingApplied: boolean;
  selectedListing?: SelectedListing;
};
