# Omni V2 — Visual Design System

## Brand direction

Omni is a calm, map-first discovery product. The interface should feel like a warm navigation instrument: geographic, premium, legible and quietly alive. The map remains the visual field; product controls float above it in deliberate glass surfaces rather than forming a conventional dashboard.

## Logo-derived palette

The supplied Omni mark establishes a warm ivory/orange identity. Orange is the action and orientation color, never a decorative flood. Deep ink provides contrast, while ivory and pale peach prevent the map from feeling like a generic dark admin tool.

| Token | Value | Use |
|---|---|---|
| `--omni-ink` | `#1C1714` | Primary text and dark chrome |
| `--omni-ink-soft` | `#3A302B` | Secondary text and map controls |
| `--omni-ivory` | `#FFF9F3` | Main glass/sheet surface |
| `--omni-ivory-muted` | `#F6EDE3` | Secondary surface and selected states |
| `--omni-peach` | `#F5D5C0` | Atmosphere, gradients and empty states |
| `--omni-orange` | `#F36A21` | Primary action, logo glow, active pin |
| `--omni-orange-deep` | `#D84D0F` | Hover/pressed action |
| `--omni-blue` | `#2D7FF9` | User exact location only |
| `--omni-line` | `rgba(28,23,20,.14)` | Borders and dividers |
| `--omni-shadow` | `rgba(28,23,20,.18)` | Floating surfaces |

## Spatial contract

The scene occupies the entire viewport. Chrome stays in the safe top zone. The search dock owns the lower center. The result sheet is anchored above the dock with a maximum width and independent scroll. Map controls stay on the lower right with a reserved safe-area offset. No surface may cover another surface’s primary action.

| Zone | Desktop | Mobile |
|---|---|---|
| Top chrome | 1.25rem inset, identity left, utilities right | .75rem inset, compact logo and one utility row |
| Dock | centered, max 42rem, bottom 1.25rem | full-width minus 1rem, bottom safe area |
| Result sheet | bottom-left or centered above dock, max 34rem | full-width bottom sheet above dock |
| Map controls | lower right, independent from sheet | lower right above dock and safe area |
| Facility/catalogue sheet | max 36rem, internal scroll | full-width, max 55vh before expanding |

## Component rules

All surfaces use the same radius family: `1rem` for sheets, `.8rem` for controls and `.65rem` for compact metadata. Primary actions use orange on ivory. Secondary actions use transparent ink with an ink border. Status tags use a tinted background and never rely on color alone. Product media uses consistent 4:3 crops; facility media uses a 16:7 hero crop.

The logo appears in the top chrome as a compact mark with the `Omni` wordmark. It must not appear as a large decorative image inside the map. The mark is also used as the fallback icon for empty/loading states.

## Typography and content

Use a clean system sans stack with tight display headings and relaxed body copy. Interface labels are sentence case. Search language is direct: “Que cherchez-vous ?”, “Rechercher dans cette zone”, “Voir le catalogue”. Avoid technical phrases such as `source-backed` in primary user-facing copy; source and lifecycle information belongs in secondary metadata.

## Motion

The globe rotates slowly only while idle. Surface transitions are short and opacity/translate based. Map movement must never move the dock or focus the mobile viewport unexpectedly. Reduced-motion users receive a static globe with no loss of information.

## S1/S2 visual definition of done

At 320, 375, 768 and 1280 px, the user sees a coherent Omni identity, a readable map scene, a non-overlapping dock, visible map controls, a stable result sheet, a clear facility detail and a catalogue whose product cards have consistent media, spacing and selection feedback. No horizontal overflow or clipped primary action is allowed.
