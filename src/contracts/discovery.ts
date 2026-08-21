export type DiscoveryBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
};

export type PublicFacility = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  source: "osm" | "public_registry";
  status: "unclaimed" | "certified" | "unconfirmed" | "confirmed";
  city: string;
  productCount: number;
};

export type DiscoveryResult = {
  facilities: PublicFacility[];
  clusters: Array<{ id: string; latitude: number; longitude: number; count: number }>;
  bounds: DiscoveryBounds;
};

export type DiscoveryAdapter = (input: {
  query: string;
  bounds: DiscoveryBounds;
}) => Promise<DiscoveryResult>;

const fixtures: PublicFacility[] = [
  {
    id: "fixture-lome-market",
    name: "Marché central",
    category: "Marché",
    latitude: 6.1316,
    longitude: 1.2228,
    source: "osm",
    status: "unclaimed",
    city: "Lomé",
    productCount: 12,
  },
  {
    id: "fixture-adewui-pharmacy",
    name: "Pharmacie Adéwui",
    category: "Pharmacie",
    latitude: 6.1688,
    longitude: 1.2317,
    source: "public_registry",
    status: "unconfirmed",
    city: "Lomé",
    productCount: 5,
  },
  {
    id: "fixture-beach-grocery",
    name: "Épicerie du boulevard",
    category: "Épicerie",
    latitude: 6.1269,
    longitude: 1.2515,
    source: "osm",
    status: "confirmed",
    city: "Lomé",
    productCount: 8,
  },
];

export const mockDiscovery: DiscoveryAdapter = async ({ query, bounds }) => {
  const normalized = query.trim().toLocaleLowerCase();
  const facilities = fixtures.filter((facility) => {
    const inBounds =
      facility.longitude >= bounds.west &&
      facility.longitude <= bounds.east &&
      facility.latitude >= bounds.south &&
      facility.latitude <= bounds.north;
    const matchesQuery =
      normalized.length === 0 ||
      `${facility.name} ${facility.category} ${facility.city}`.toLocaleLowerCase().includes(normalized);
    return inBounds && matchesQuery;
  });

  return {
    facilities,
    clusters:
      bounds.zoom < 8 && facilities.length > 1
        ? [
            {
              id: "cluster-lome",
              latitude: facilities.reduce((sum, item) => sum + item.latitude, 0) / facilities.length,
              longitude: facilities.reduce((sum, item) => sum + item.longitude, 0) / facilities.length,
              count: facilities.length,
            },
          ]
        : [],
    bounds,
  };
};
