# Design — Riff Valley 2.0

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre
atmospheric

## Theme route
custom (tuned) — anchored on the brand's existing colours, not invented. The
accent coral is the site's historic `rv-pink` (`#e46e8a`); the canvas hue is
the historic `rv-navy` (`#00021f`), both converted to OKLCH and disciplined
under Hallmark's chroma caps. Vibe: *"revista sónica nocturna, coral cálido,
precisión editorial."*

Two polarities ship — **dark is the default identity**, light is an opt-in
alternate for daytime reading, not a parallel theme. Same accent hue, same
navy anchor hue, inverted lightness. Toggled via a `.light` class on `<html>`
(inverted from the old `.dark`-class convention — atmospheric is dark-first).

## Macrostructure family
- **Discovery pages** (Home, category archives): **Ecosystem Index** — no
  hero, a short positioning line, then rails (Destacado / Lo último / Por
  género). Archives use a single rail; Home uses all three.
- **Content pages** (single post, static WP page): **Long Document** — prose,
  single column, 65ch measure, section heads inline, no marketing chrome.

## Typography
- Display: **Geist**, weight 800, tight tracking (`-0.02em`) — headings,
  card titles, section heads.
- Body: **Geist**, weight 400 — same family as display (one family, two
  weights, per the 2+1 rule's "same family at different weights" clause).
- Outlier: **Skaters** (already licensed, self-hosted `/fonts/Skaters.woff2`)
  — exactly two slots: the header wordmark and the footer mastwordmark.
  Never a third slot.
- Type scale anchor: 1.25 ratio, `--text-display: clamp(2.25rem, 4vw + 1rem, 3.75rem)`
  (capped below the default 5.25rem ceiling — WP post titles are dynamic and
  often long; a smaller display ceiling keeps real titles from wrapping ugly).
- Weight contrast: display 800 vs body 400 — 400-unit gap, reads intentional.

## Spacing
4-point named scale (`--space-3xs` … `--space-4xl`), values in `tokens.css`.
Pages use named tokens only, never raw px.

## Motion
- Easings: `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in`
  `cubic-bezier(0.7, 0, 0.84, 0)`, `--ease-in-out` `cubic-bezier(0.65, 0, 0.35, 1)`.
- Reveal pattern: one orchestrated stagger on the homepage rails only
  (DOM-index delay, capped ~500ms total). Content pages: no reveal, the
  article is just there.
- Reduced-motion fallback: opacity-only, ≤150ms, everywhere.
- No sliding/looping gradient bars, no shadow-glow on dark cards, no
  scroll-triggered fade on every section.

## Microinteractions stance
- Silent success (search results just appear/update).
- Hover delay 0ms (no tooltips on this site); focus rings appear instantly,
  never transitioned.
- Card hover = elevation step (paper → paper-2) + 1–2px lift, never a
  coloured glow shadow (dark-canvas ban).

## CTA voice
- Primary in-content action: **C3 typographic link** — "Ver todo →",
  "Leer crónica →" — underline + arrow, accent colour, no filled button.
- The only filled-accent surfaces on the whole site: the active nav
  underline, focus rings, category tag chips, and the search panel's
  highlight mark. Accent stays under 5% of any viewport footprint.
- No marketing CTAs — this is a content site, not a SaaS funnel. There is no
  "Sign up" button anywhere.

## Nav — N1b Canonical SaaS three-section (dense, real destinations)
Wordmark hard-left (Skaters + mark) · centred cluster of 5 links, three with
hover/focus dropdowns (Artículos, Novedades, Crónicas) · right cluster holds
search, theme toggle, and a plain "Contacto" text link. Frosts on scroll
(transparent at rest since the canvas is already dark, gains a hairline
border + blur past ~24px scroll). All original WP taxonomy links are
preserved — 9 under Artículos, 5 under Novedades (incl. Listas de Spotify,
folded in from the old standalone top-level item), 2 under Crónicas.

## Footer — Ft1 Mast-headed
Single band: Skaters wordmark + real tagline ("Comunidad de música metal,
rock, hardcore y mucho más") → one inline row of section links + social
links, hairline-separated, no boxed columns → copyright line in muted type.
No 4-column AI-footer grid.

## Per-page allowances
- Discovery pages (Home) MAY use the Tier-A CSS bloom canvas (two fixed
  coral radial blooms + faint grain) — dark mode only, suppressed in light
  mode.
- Category archive pages: same rail card language, no bloom canvas (keeps
  focus on the listing).
- Content pages MUST NOT use any enrichment — typography and the post's own
  real featured photography carry the page.

## What pages MUST share
- The wordmark (mark + Skaters logotype, solid ink colour — no gradient text).
- The single coral accent and its ≤5% footprint discipline.
- Geist (display+body) + Skaters (outlier, 2 slots only).
- The CTA voice (C3 typographic links, no filled buttons except state chips).
- Section heading rhythm: a plain label heading in Geist 700–800, small
  tracked caps for the rail/eyebrow-style tag only when the tag is genuinely
  a rail name ("Destacado", "Lo último") — never a numeral, never paired
  two-column with the heading (gate 54).
- Nav (N1b) and footer (Ft1) — global components, identical on every route.

## What pages MAY differ on
- Rail composition and count on discovery pages (Home ships 3 rails;
  category archives ship 1).
- The bloom canvas (Home only).

## Colour — dark (default)

```css
:root {
  --color-paper:      oklch(13% 0.016 264);
  --color-paper-2:     oklch(17% 0.018 264);
  --color-paper-3:     oklch(21% 0.020 264);
  --color-ink:         oklch(94% 0.008 264);
  --color-ink-2:       oklch(74% 0.010 264);
  --color-rule:        oklch(30% 0.016 264);
  --color-rule-2:      oklch(24% 0.016 264);
  --color-muted:       oklch(58% 0.012 264);
  --color-accent:      oklch(68% 0.150 8);
  --color-accent-2:    oklch(58% 0.140 8);
  --color-accent-ink:  oklch(14% 0.020 8);
  --color-focus:       oklch(72% 0.190 8);
}
```

## Colour — light (opt-in, `.light` class)

```css
:root.light {
  --color-paper:      oklch(97% 0.010 264);
  --color-paper-2:     oklch(94% 0.012 264);
  --color-paper-3:     oklch(90% 0.014 264);
  --color-ink:         oklch(18% 0.020 264);
  --color-ink-2:       oklch(38% 0.016 264);
  --color-rule:        oklch(84% 0.014 264);
  --color-rule-2:      oklch(88% 0.012 264);
  --color-muted:       oklch(48% 0.014 264);
  --color-accent:      oklch(58% 0.170 8);
  --color-accent-2:    oklch(50% 0.160 8);
  --color-accent-ink:  oklch(99% 0.006 8);
  --color-focus:       oklch(54% 0.200 8);
}
```

Axes (dark, the default identity): **dark / geometric-sans / warm**
(accent hue 8°, chroma 0.15 — within the 0.12–0.20 custom clamp).

## Enrichment
Home hero band: **Tier A pure CSS** — two fixed-attached radial coral
blooms (`color-mix(in oklch, var(--color-accent) 14%, transparent)` at
~25% viewport footprint each, no animation) + SVG `feTurbulence` grain at
0.05 opacity. Dark mode only; disabled entirely under `.light`.

## Exports

Drop-in formats for re-using this design system in other projects.

### tokens.css
See [`tokens.css`](tokens.css) at the project root — the full token set
(colour × 2 polarities, font, space, text, ease, dur, radius, z) in portable
form. Not imported by the Astro build directly (Tailwind v4's `@theme` block
lives in `src/styles/global.css`, which owns the canonical copy) — this file
exists purely so the palette can be copy-pasted into another project.

### Tailwind v4 `@theme`
```css
@theme {
  --color-paper:   oklch(13% 0.016 264);
  --color-ink:     oklch(94% 0.008 264);
  --color-accent:  oklch(68% 0.150 8);
  --font-display:  "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-body:     "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-outlier:  "Skaters", var(--font-display);
  --spacing-md:    1rem;
  --text-md:       1.25rem;
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`
```json
{
  "color": {
    "paper":  { "$value": "oklch(13% 0.016 264)", "$type": "color" },
    "ink":    { "$value": "oklch(94% 0.008 264)", "$type": "color" },
    "accent": { "$value": "oklch(68% 0.150 8)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Geist", "$type": "fontFamily" },
    "body":    { "$value": "Geist", "$type": "fontFamily" },
    "outlier": { "$value": "Skaters", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables
```css
:root {
  --background:         13% 0.016 264;
  --foreground:         94% 0.008 264;
  --primary:            68% 0.150 8;
  --primary-foreground: 14% 0.020 8;
  --muted:              21% 0.020 264;
  --muted-foreground:   58% 0.012 264;
  --border:             30% 0.016 264;
  --input:               30% 0.016 264;
  --ring:                72% 0.190 8;
  --radius:              10px;
}
```
