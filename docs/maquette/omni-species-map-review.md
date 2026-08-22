# Species map-state review

The rendered board now includes a dedicated map section with seven explicit states: idle globe, local fullscreen map, selected cluster, facility trust markers, selected facility focus, route after confirmed intent and map recovery/return.

The map states retain the Canva composition language: full pale geographic field, upper-left Acheter/Vendre switch, upper-right J5/account control, right-side map controls and bottom search dock. The globe state is sparse and includes source-backed pin/cluster communication without implying supply. The local state shows several points and a cluster. The selected-cluster state explains density and zoom. The trust state provides a visible legend for unclaimed, certified/unconfirmed and confirmed markers. The focus state uses a restrained selected-marker halo and callout. The route state draws a route only in a confirmed transaction context and returns to the transaction room. The recovery state restores the prior transaction/map context without recreating the operation.

This is a visual Species artifact, not evidence that live map tiles, clustering, trust status or routing are implemented. The implementation gate remains closed until the map-state contract and its dependencies are approved.

## S28–S34 acceptance details

S28 shows the idle globe with slow interruptible movement and sparse public pins/clusters. S29 shows the local fullscreen map after an explicit location/manual exploration/search reveal. S30 shows a selected cluster with count and zoom/expand meaning only. S31 shows unclaimed, certified/unconfirmed and confirmed marker treatments with a legend. S32 shows one selected facility with a restrained halo and a recoverable prior context. S33 shows the protected route only after a confirmed purchase intent, with return to the transaction room. S34 shows camera, query, facility, product and transaction context restored after interruption.

The rendered maquette keeps the map as the full phone scene and retains the reference top row, right-side controls and bottom dock. No marker style claims stock or availability. No route is visible on public or pre-intent states. The map state is now a first-class Species branch rather than a decorative background assumption.
