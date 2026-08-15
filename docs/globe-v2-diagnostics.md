# Globe v2 diagnostics

The resting map is the real MapLibre globe at zoom approximately 1.10, with facility layers hidden as intended before search. The current requestAnimationFrame rotation increases bearing by approximately +11.48 degrees over 4.2 seconds, or about +2.73 degrees per second. The user reports that this appears as the wrong clockwise direction, so the next implementation will make the product direction explicit and invert the signed velocity to the opposite horizontal direction, then recheck recognizable country movement visually.

At rest, no facility features are rendered and the pin layer is hidden. The next validation must measure each reveal stage, the active boundary level, and rendered facility features after final fitting rather than relying only on result cards.

## V2 live evidence

The v2 resting globe now measures a negative bearing change of approximately 12.04 degrees over 4.2 seconds, reversing the prior positive direction. The fresh `food` search visibly displayed the Continent overlay and a real orange Africa silhouette with an active border/glow; the previous green border was no longer present.

A repeated `rice` search visibly started at the Continent stage. The timed trace later observed Region, Ville / zone, and Votre position stages, with the final map in Mercator mode. The final render contained four facility features, and the final screenshot showed high-contrast orange MapLibre pin icons and labels for Supermarché Leader Price, Leader Price, Brice Frigo, and the other rice result. The diagnostic pin attribute remained stale from the prior run at intermediate samples, so the next cleanup must reset that development-only attribute at reveal start; the actual MapLibre layers were hidden until final rendering and then showed four rendered features.

## Clean post-diagnostics check

After removing the development hooks, the clean `food` search visibly showed the orange Africa highlight with the **Continent** label, then progressed to **Pays** and **Ville / zone** in successive browser captures. The final screen showed the facility result cards and orange map points, but the point presentation was still visually closer to dots than unmistakable map pins. The next correction adds native MapLibre `Marker` elements with an explicit pin shape and click handler, while retaining the data-driven layers for rendering-state verification.

## Native pin result

The final native-marker pass confirmed that the facility markers were mounted but their root element had overridden MapLibre’s absolute positioning. Removing that override made the pins visibly render on the map. The live screenshot now shows orange pin shapes for Heistal Frozen Food and Oriental Fast Food at their geographic locations. Programmatically clicking the Heistal Frozen Food pin opened the correct facility panel, which displayed the expected **Non réclamé** state and claim CTA.
