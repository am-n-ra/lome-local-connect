export type Product = {
  id: string;
  facilityId: string;
  name: string;
  category: string;
  unit: string;
  priceLabel: string;
  availabilityLabel: string;
  imageUrl?: string;
};

const PRODUCTS: Product[] = [
  { id: "prod-lome-tomato", facilityId: "fac-lome-market", name: "Fresh tomatoes", category: "Produce", unit: "crate", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
  { id: "prod-lome-rice", facilityId: "fac-lome-market", name: "Parboiled rice", category: "Staples", unit: "50 kg bag", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
  { id: "prod-accra-plantain", facilityId: "fac-accra-market", name: "Plantain", category: "Produce", unit: "bunch", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
  { id: "prod-kumasi-cocoa", facilityId: "fac-kumasi-hub", name: "Cocoa beans", category: "Wholesale", unit: "tonne", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
  { id: "prod-cotonou-onion", facilityId: "fac-cotonou-hall", name: "Yellow onions", category: "Produce", unit: "sack", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
  { id: "prod-lagos-cassava", facilityId: "fac-lagos-yard", name: "Cassava", category: "Produce", unit: "bag", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
  { id: "prod-nairobi-maize", facilityId: "fac-nairobi-market", name: "Maize grain", category: "Staples", unit: "bag", priceLabel: "Price on request", availabilityLabel: "Ask availability" },
];

export function listCatalogue(facilityId: string): Product[] {
  return PRODUCTS.filter((product) => product.facilityId === facilityId);
}

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === productId);
}
