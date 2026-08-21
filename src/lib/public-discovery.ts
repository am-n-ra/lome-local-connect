export type DiscoveryFacility = { id: string; name: string; category: string; lng: number; lat: number };
export type DiscoveryBounds = [west: number, south: number, east: number, north: number];

export function discoverInBounds(facilities: DiscoveryFacility[], bounds: DiscoveryBounds | null, query = "") {
  const normalized = query.trim().toLocaleLowerCase();
  return facilities.filter((facility) => {
    const inLatitude = !bounds || (facility.lat >= bounds[1] && facility.lat <= bounds[3]);
    const crossesDateLine = Boolean(bounds && bounds[0] > bounds[2]);
    const inLongitude = !bounds || (crossesDateLine ? facility.lng >= bounds[0] || facility.lng <= bounds[2] : facility.lng >= bounds[0] && facility.lng <= bounds[2]);
    const matchesQuery = !normalized || `${facility.name} ${facility.category}`.toLocaleLowerCase().includes(normalized);
    return inLatitude && inLongitude && matchesQuery;
  });
}
