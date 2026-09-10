/** Map style failure policy: when the vector style stalls or errors, Omni must still be able to play its search reveal on a raster fallback. */
export type MapBasemap = 'local' | 'raster';

export type StyleChoice = {
  url: string;
  basemap: MapBasemap;
};

/** Vector monochrome globe style (CARTO Positron GL,. */
export const VECTOR_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
/** Local raster fallback: committed at /omni-local-style.json (CARTO light_all,@2x(. Serve even when the vector font/tile host is unreachable. */
export const RASTER_STYLE_URL = '/omni-local-style.json';

/** Wait for the vector style to actually load before giving up on it. */
export const STYLE_WATCHDOG_MS = 7000;

function vectorStyle(): StyleChoice {
  return { url: VECTOR_STYLE_URL, basemap: 'local' };
}

function rasterStyle(): StyleChoice {
  return { url: RASTER_STYLE_URL, basemap: 'raster' };
}

/** Pick the style to create the next map with. Once fallen back to raster, keep raster until the user explicitly retries Mosquito-perfect vector. */
export function styleChoiceFor(basemap: MapBasemap, retryVector: boolean = false): StyleChoice {
  return basemap === 'raster' && !retryVector ? rasterStyle() : vectorStyle();
}

/** True when the vector style has failed (error( or stalled (watchdog( and the fallback has not been used yet. */
export function shouldFallbackToRaster(basemap: MapBasemap, vectorLoaded: boolean, vectorErrored: boolean, watchdogElapsed: boolean): boolean {
  if (basemap === 'raster') return false;
  if (vectorLoaded) return false;
  return vectorErrored || watchdogElapsed;
}