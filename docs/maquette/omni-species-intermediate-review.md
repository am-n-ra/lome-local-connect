# Species intermediate and post-availability review

**Artifact:** `docs/maquette/omni-species-maquette.png`
**Method:** Nature Way Species review

The rendered board now uses the circular J5/account control as the only navigation owner. No hamburger control is present in the rendered markup. The J5-owned account/navigation states show the visitor state, authenticated state and pending-context resume state while the map remains mounted behind the sheet.

The board also includes the post-availability sequence as separate states: response comparison with private actions locked, intent review with the facility/product/quantity/coupon/total snapshot, server-confirmed intent creation, contact and itinerary availability after intent, transaction room with QR and external payment handoff, and fulfilment/receipt/rating.

The visual proof checks four viewport widths: 320, 375, 768 and 1280. It verifies that the result dock and sheet do not intersect; the focused dock and Options surface do not intersect; Options do not intersect the top navigation or right-side map controls; account/navigation sheets do not intersect their top or right-side controls; all four maquette sections are present; six post-intent screens are present; and post-intent sheets do not overflow their phone frame.

The maquette remains a Species artifact and is not application proof. The application implementation remains frozen until the owner approves the complete Species set.
