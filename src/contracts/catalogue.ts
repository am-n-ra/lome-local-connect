import type { PublicFacility } from "./discovery";

export type PublicFacilityMedia = {
  id: string;
  url: string;
  alt: string;
  kind: "facility" | "product";
};

export type PublicProduct = {
  id: string;
  facilityId: PublicFacility["id"];
  name: string;
  category: string;
  unit: string;
  availability: "publicly_listed" | "availability_unknown";
  media: PublicFacilityMedia[];
};

export type PublicFacilityDetail = PublicFacility & {
  description: string;
  addressLabel: string;
  media: PublicFacilityMedia[];
  catalogueCount: number;
};

export type CatalogueResult = {
  facility: PublicFacilityDetail;
  products: PublicProduct[];
};

export type CatalogueAdapter = (facility: PublicFacility) => Promise<CatalogueResult>;

const fixtureProducts: PublicProduct[] = [
  {
    id: "product-maize-bag",
    facilityId: "fixture-lome-market",
    name: "Maïs en sac",
    category: "Céréales",
    unit: "sac",
    availability: "publicly_listed",
    media: [{ id: "media-maize", url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=640&q=80", alt: "Sacs de maïs", kind: "product" }],
  },
  {
    id: "product-rice-bag",
    facilityId: "fixture-lome-market",
    name: "Riz local",
    category: "Céréales",
    unit: "sac",
    availability: "publicly_listed",
    media: [{ id: "media-rice", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=640&q=80", alt: "Riz conditionné", kind: "product" }],
  },
  {
    id: "product-pharmacy-basic",
    facilityId: "fixture-adewui-pharmacy",
    name: "Produits de santé courants",
    category: "Santé",
    unit: "article",
    availability: "availability_unknown",
    media: [{ id: "media-pharmacy", url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=640&q=80", alt: "Produits de pharmacie", kind: "product" }],
  },
  {
    id: "product-grocery-bulk",
    facilityId: "fixture-beach-grocery",
    name: "Épicerie en vrac",
    category: "Alimentation",
    unit: "lot",
    availability: "publicly_listed",
    media: [{ id: "media-grocery", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=640&q=80", alt: "Produits alimentaires", kind: "product" }],
  },
];

export const mockCatalogue: CatalogueAdapter = async (facility) => {
  const products = fixtureProducts.filter((product) => product.facilityId === facility.id);
  return {
    facility: {
      ...facility,
      description: `Informations publiques disponibles pour ${facility.name}.`,
      addressLabel: `${facility.city}, zone cartographiée`,
      catalogueCount: products.length,
      media: [{ id: `media-${facility.id}`, url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=960&q=80", alt: facility.name, kind: "facility" }],
    },
    products,
  };
};

export function filterPublicProducts(products: PublicProduct[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return products;
  return products.filter((product) => `${product.name} ${product.category}`.toLocaleLowerCase().includes(normalized));
}
