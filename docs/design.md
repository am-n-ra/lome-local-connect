# Omni Design System — authoritative tokens & components (from accepted maquette)

**Source of truth:** `docs/maquette/omni-species-maquette.html` (Species gate, accepted 2026-09-02). All product surfaces must match this file. Neutral design system for mobile-first map UI.

---

## 1. Color tokens

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0F0F0F` | Text, active pills, icons, strong borders |
| `--ink-soft` | `#6B6B6B` | Secondary text, labels, eyebrows |
| `--ink-faint` | `#D8D8D8` | Handles, disabled indicators |
| `--panel` | `#F7F7F7` | Secondary background (inactive pills, panels, empty tiles) |
| `--panel-deep` | `#E6E6E6` | Borders, handles, subtle lines |
| `--white` | `#FFFFFF` | Sheet & card backgrounds |
| `--accent` | `#2E8B6F` | ONLY trust-marking (verified dot, `.status.ok`, discount label) |
| `--accent-soft` | `#EEF4F1` | Trust pill background (.status.ok) |
| `--navpill-bg` | `#111111` | Bottom dock background |

**Rule:** `#2E8B6F` accent is used ONLY for trust state (verified dot in `.hcard` thumbnail, `.status.ok`, `.vmark`, discount `-N% Omni` tag). Everything else is monochrome (ink/panel/white). Never use brand-green/colored buttons.

---

## 2. Typography — Inter

- Font family: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
- Headings `h1` 16px / `h2` 13px / `h3` 11px, h1 tracking -0.4px
- `.eyebrow` 8px uppercase, tracking 1.1px
- Body `.sub` 10px soft, `.tiny` 8.5px
- Labels `.label` 8.5px / 700
- Buttons `.btn` 800, `.status` 800, `.kv b` 800

---

## 3. Geometry & spacing

- **Radius:** `.btn`, `.rolepill`, `.navpill`, `.chip` = 999px; sheets = 24px top corners; cards = 13–16px
- **Sheets:** `.sheet` bottom-anchored (variants: `h-full 64%`, `h-mid 52%`, `h-auto` max 60%, `h-low` max 44%, `peek`), padding `10px 15px 92px`
- **Handle:** `.handle` 40x4px, rounded 4px, `#d8d8d8`
- **Grid:** `.hgrid` scroll-snap x, `.stat/.stat-grid` 2-col, `.plist/.pitem/.kv` vertical

---

## 4. Product components (the ONLY interiors vocabulary)

| Class | Purpose |
|---|---|
| `.rolepill` | Top-center dynamic role chips (dynamic from capability roles) |
| `.navpill` | Bottom 3-button dock (search / center role-specific / menu) |
| `.sheet` + `.handle` | Bottom-sheet container + grab handle |
| `.eyebrow` | Small caps kicker above sheet titles |
| `.status` (`.ok`/`.ink`/`.gray`/`.dash`) | Pills (verified/solid/panel/unclaimed) |
| `.btn`, `.btn.sm`, `.btn.ghost`, `.btn.ok` | Buttons (`.ok` only trust/affirmative) |
| `.btnrow` | Button pair row |
| `.cardbox` | White interior card panel |
| `.field`, `.label`, `.seg` | Form controls (field 32–44px, seg segmented options) |
| `.kv` | Key-value row (first: no top border) |
| `.plist`, `.pitem`, `.pthumb`, `.chk`, `.pr` | Selectable product/facility rows |
| `.hgrid`, `.hcard`, `.thumb`, `.vmark`, `.body` | Results horizontal facility cards |
| `.searchdock`, `.fld`, `.chips`, `.chip` | Search sheet input + filters |
| `.stat`, `.tile`, `.stat-grid` | 2-tile summary tiles (Seller/Admin home) |
| `.icon`, `.mi`, `.menuitem` | Icon row buttons in MENU sheet |

---

## 5. Rules (binding)

1. **`.navpill` + `.rolepill` immutable** — full-map chrome, always visible.
2. **One source of truth per concern** — this file governs all interior markup; legacy components (`omni-sheet`, `glass-*`, `liquid-*`) are aliases replaced with classes above.
3. **Accent is trust-only** — `#2E8B6F/#EEF4F1` ONLY for verified dot, `.status.ok`, `.vmark`, discount tags. All else monochrome.
4. **Search is a sheet** — `.searchdock` inside `.sheet` SEARCH, never a bottom dock element.
5. **Unclaimed = `.dash` pill** — dashed-border pill "Non revendiquée" (no red/green floats).

---

## 6. Class naming — one vocabulary

Production markup must use classes exactly (no aliases, no inline colors):

```
.rolepill .navpill .sheet .h-full .h-mid .h-auto .h-low .peek .handle
.eyebrow .status .ok .ink .gray .dash .btn .btnrow .cardbox .field .label .seg
.hgrid .hcard .thumb .vmark .body .pitem .pthumb .chk .pr .kv
.searchdock .fld .chips .chip .stat .tile .sub .tiny .muted
.icon .mi .menuitem
```
