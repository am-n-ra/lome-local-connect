# Globe/reveal live validation

Date: 2026-08-14

## Initial idle state

The buyer route still renders the real MapLibre globe projection. Two browser captures several seconds apart showed a visibly different globe bearing/label orientation, confirming that the new continuous horizontal bearing loop is active in the resting state.

## Search started

A fresh authenticated `food` search returned 27 facility cards. Immediately after submission, the map canvas was in the reset/reveal transition and facility cards were already present at the bottom. Further observation is required to confirm each reveal label, boundary pause, final camera framing, and visible facility pins.

## First reveal observation after the repair

After the `food` search, the map progressed from the globe reset to a detailed Lomé/Mercator view. The result cards showed 27 matches, but the browser extraction did not expose a visible Continent/Pays/Région/Ville label, and no visible result pins were apparent in the map capture. The browser console showed no MapLibre error messages. This indicates the reveal state is advancing, but the label/highlight/pin visibility contract still needs explicit runtime instrumentation and likely a source/layer or timing correction.

## Post-fix result

After stabilizing the reveal effect dependency so geolocation/market updates no longer cancel the active sequence, a clean `food` search visibly displayed the **Continent** stage on the globe. Diagnostics later reported **Région** at zoom 8.25 with the facility layers still hidden, confirming that intermediate reveal stages now progress and keep pins hidden.

After the remaining stages completed, diagnostics reported:

- stage: **Votre position**
- projection: **mercator**
- zoom: approximately **14.23**
- facility halo, point, and label layers: **visible**
- rendered facility point features: **6**
- final center: approximately Lomé (`lat 6.1636`, `lng 1.2316`)

The final browser capture visibly showed facility labels such as Heistal Frozen Food, Oriental Fast Food, and Standard food on the map. This confirms that the prior missing-pin behavior was caused by reveal sequencing/cancellation and insufficient layer visibility diagnostics rather than missing facility data.

## Final live check after diagnostics removal

A second search for `rice` completed with four result cards and a fitted Lomé map. The final screenshot showed visible map labels/marker circles for Caprice de femmes, Supermarché Leader Price, Leader Price, and Brice Frigo, confirming that the production code path retains visible pins after the development diagnostics are removed.
