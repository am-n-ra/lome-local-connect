# Omni V1 — Vercel and Staging Access Audit

**Date:** 2026-08-19  
**Status:** `partial-blocked`

## Confirmed through the connected Vercel integration

The connected Vercel team is `Kheir's projects`, and the Omni project is `omniview` with project ID `prj_SDtuInsxUeVsrXxmo09R4c56vSJJ`. It is linked to `am-n-ra/lome-local-connect` and the `main` branch. The latest deployment observed is `READY`, target `production`, and built from commit `78078c7` (`docs(omni): block identity repair without staging boundary`). The project domains include `https://omni.sparkafrika.online` and the Vercel aliases.

The latest grouped runtime-error query over the last 24 hours returned no runtime errors. Deployment protection reports SSO protection enabled for all deployments except custom domains, with password protection disabled. This confirms Vercel access and production health observation, but it does not create a staging database or prove that production can safely host identity-repair data.

## Staging conclusion

The deployment inventory exposed only `production` targets for the recent Omni commits; no preview/staging deployment with a distinct target was proven. The local repository environment contains a `DATABASE_URL`, but no `OMNI_E2E_TARGET=staging`, `OMNI_E2E_ALLOW_MUTATION=1`, `OMNI_E2E_SELLER_ID`, `OMNI_E2E_BUYER_ID` or `OMNI_E2E_RUN_ID`. The browser dashboard URL redirected to Vercel login, so environment-variable scopes were not inspected in the browser session.

No Vercel settings, environment variables, deployments, database rows, roles, profiles, facilities or wallet data were changed. The next safe action is to obtain or configure an isolated staging database and, if desired, a Vercel Preview deployment whose Preview variables point only to that staging database. The identity repair remains blocked until both boundaries are explicit.
