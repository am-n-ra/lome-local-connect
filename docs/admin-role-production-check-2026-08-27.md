
## Neon activation update — 2026-08-27

The Neon connector was restored. The Admin migration was applied to the target branch `br-dawn-hill-am5amy22` of project `wild-moon-30984513` after a successful temporary-branch test. The target schema now exposes the `v2_account_roles_role_check` constraint including `admin`, the `v2_account_roles_admin_active_idx` partial index, and the documented column/table comments.

Neon Auth lookup confirmed `kheirlissi@icloud.com` maps to Omni account `7bd0f09d-a0d1-446c-8c92-2941a6cd37cf`; it was not suspended and had no active Admin role before bootstrap. With user confirmation, the `admin` role was inserted and `admin_role_bootstrap` was recorded in `v2_audit_events` using correlation id `bootstrap-admin-2026-08-27`.

Post-bootstrap verification returned `role=admin`, `status=active`, `revoked_at=null`, `audit_recorded=true`. The capability query returned active roles `admin` and `reviewer`, `not_suspended=true`, and `admin_tools_expected=true`.

A fresh production browser check at `https://omni.sparkafrika.online/` showed the normal map loading state followed by the MapLibre canvas, OpenStreetMap attribution, zoom/location controls, and the existing public map surface. No production blank-map regression was observed. The authenticated Admin UI itself still requires a browser session for visual proof; the server/database role proof is complete.
