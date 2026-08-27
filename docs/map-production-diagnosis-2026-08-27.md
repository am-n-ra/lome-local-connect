
## UX debt ring observation — 2026-08-27 14:36 UTC

After commit `77a343c` was pushed to `omni-v2-rebuild`, GitHub reported the Vercel Preview check as completed/success. A fresh navigation to https://omni.sparkafrika.online/ showed the map canvas and controls immediately in the DOM, while the visible status initially remained `Chargement de la carte`. The screenshot still showed a predominantly white canvas during the observed initial window; final tile rendering was not yet confirmed in this single observation. The account orb was anonymous (`J5`) in the sandbox browser, so Admin menu visibility could not be tested without an authenticated browser session.

The new code now keeps the canvas visible during loading, only renders the user-position overlay once `mapStatus=ready`, applies a grayscale/contrast filter to the raster fallback, retries account capabilities after session synchronization delays, restores the `admin-roles` Auth return path, and embeds `FieldPilotLocationMap` in Seller facility creation. Further production proof must wait for final tile settle and an authenticated Admin session.
