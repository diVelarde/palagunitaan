# Palagunitaan vintage and cultural design guide

## Direction

Aim for an editorial museum catalogue: quiet, tactile, and historical rather than
ornamental or theme-park-like. Use cream paper, restrained rust accents, large
serif headings, fine rules, generous spacing, and carefully captioned
photographs. The page should foreground community knowledge and the sources
behind it.

The requested `docs/prototype/` screenshot directory was not present when this
guide was prepared. This direction therefore follows the supplied design brief;
the exact font choice remains open.

## Colour palette

Use the supplied values exactly in light mode. Dark-mode values are suggested
counterparts and should be used consistently by semantic role.

| Role | Light mode | Dark mode | Use |
|---|---|---|---|
| Paper cream | `#F3DFB1` | `#211A12` | Warm paper surfaces, inset panels |
| Large-area paper tint | `#FBF3DF` | `#17130F` | Main page background |
| Card white | `#FFFFFF` | `#2B241D` | Cards and form surfaces |
| Ink brown | `#52341B` | `#F3DFB1` | Headings and primary text |
| Rust | `#922B05` | `#E8865E` | Primary actions, links, active states |
| Taupe | `#826458` | `#B9A394` | Borders and restrained muted text |
| Antique gold | `#B8860B` | `#E1B84C` | Small decorative accents only |

Antique gold is for timeline dots, map pins, small icons, and fine decorative
marks. Never use it for body text or as the sole way to convey meaning. Pair
icons and status colours with visible text labels.

### Text contrast

Ratios below use the WCAG relative-luminance formula and are rounded to two
decimal places. For normal-size text, **Pass** means at least 4.5:1. Large text
has a 3:1 threshold, but do not rely on the lower threshold for body copy.

| Text / foreground | Background | Ratio | WCAG AA for normal text? | Guidance |
|---|---|---:|---|---|
| Light ink `#52341B` | Large-area tint `#FBF3DF` | 10.18:1 | Pass | Default body and heading pair |
| Light ink `#52341B` | Paper cream `#F3DFB1` | 8.58:1 | Pass | Text on paper panels |
| Light ink `#52341B` | Card white `#FFFFFF` | 11.26:1 | Pass | Text on cards |
| Light rust `#922B05` | Large-area tint `#FBF3DF` | 7.39:1 | Pass | Links and active text |
| Light rust `#922B05` | Paper cream `#F3DFB1` | 6.23:1 | Pass | Links and active text |
| Light rust `#922B05` | Card white `#FFFFFF` | 8.17:1 | Pass | Links and active text |
| White `#FFFFFF` | Rust button `#922B05` | 8.17:1 | Pass | Primary button label |
| Light taupe `#826458` | Large-area tint `#FBF3DF` | 4.85:1 | Pass | Muted text is acceptable |
| Light taupe `#826458` | Paper cream `#F3DFB1` | 4.09:1 | **Fail** | Do not use for normal text; use ink instead |
| Light taupe `#826458` | Card white `#FFFFFF` | 5.37:1 | Pass | Muted text is acceptable |
| White `#FFFFFF` | Hero overlay `#17130F` | 18.48:1 | Pass | Hero copy on a solid overlay field |
| Dark ink `#F3DFB1` | Dark page `#17130F` | 14.08:1 | Pass | Default dark-mode body and headings |
| Dark ink `#F3DFB1` | Dark paper surface `#211A12` | 13.10:1 | Pass | Text on inset surfaces |
| Dark ink `#F3DFB1` | Dark card `#2B241D` | 11.66:1 | Pass | Text on cards |
| Dark rust `#E8865E` | Dark page `#17130F` | 7.04:1 | Pass | Links and active text |
| Dark rust `#E8865E` | Dark paper surface `#211A12` | 6.55:1 | Pass | Links and active text |
| Dark rust `#E8865E` | Dark card `#2B241D` | 5.83:1 | Pass | Links and active text |
| Dark page `#17130F` | Dark rust button `#E8865E` | 7.04:1 | Pass | Dark-mode primary button label |
| Dark taupe `#B9A394` | Dark page `#17130F` | 7.68:1 | Pass | Muted text |
| Dark taupe `#B9A394` | Dark paper surface `#211A12` | 7.15:1 | Pass | Muted text |
| Dark taupe `#B9A394` | Dark card `#2B241D` | 6.36:1 | Pass | Muted text |
| Dark ink `#F3DFB1` | Dark footer `#100D0A` | 14.76:1 | Pass | Footer text |

These are the text/background pairs intended by the tokens above. Do not put
text directly over a photograph and assume a filter guarantees contrast: the
rendered image varies. Place hero copy over a solid or sufficiently opaque
overlay field and verify the final rendered contrast is at least 4.5:1. Gold
is deliberately excluded from the text pairs because it is not a text colour.
The paper texture and edge gradients are tuned to keep muted text above AA at
their strongest light and dark extremes: at least 4.60:1 on the light page,
4.70:1 on a light paper card, 6.87:1 on the dark page, and 5.85:1 on a dark
card.

## Typography

- **Display headings:** use a Google Font serif such as Playfair Display,
  Cormorant Garamond, or Libre Caslon. Choose one family and use it consistently.
- **Body and controls:** use a highly legible humanist sans serif (for example,
  Source Sans 3 or Lato) or a clear text serif. Keep long passages comfortable
  at ordinary reading sizes.
- **Suggested scale:** body 16px / 1.65 line-height; small supporting text
  14px / 1.5; H1 48–64px / 1.05–1.15; H2 32–40px / 1.15; H3 22–28px / 1.25.
  Scale headings down responsively without allowing them to dominate narrow
  screens.
- Use sentence case, moderate font weights, and clear hierarchy. Avoid extended
  all-caps text and overly tight tracking.

## Layout and rhythm

- Separate major sections with a **1px horizontal rule** in taupe at restrained
  opacity. Let whitespace, not boxes, establish most section boundaries.
- Use generous vertical spacing: approximately 64–96px between major desktop
  sections and 32–56px on smaller screens, adjusting to content density.
- Keep long-form text to about **65 characters per line** (roughly 60–70ch).
- Use a clear reading column alongside wider image or catalogue layouts where
  useful. Preserve comfortable page gutters on mobile.
- Use outlined buttons for secondary actions. Reserve filled rust buttons for
  the primary action; keep focus indicators conspicuous and keyboard-visible.
- Use a dark ink footer (`#211A12` in light mode; `#100D0A` in dark mode) with
  light, readable text and fine top rule.
- Avoid heavy shadows, dense borders, and unnecessary card grids. Let imagery,
  typography, and alignment provide structure.

## Textures and motifs

- Use the `--paper-texture` token in `client/src/index.css` for the lightweight,
  seamless SVG grain and warm edge gradient on Landing, About, Browse, Timeline,
  and Blog page backgrounds. Use `--paper-card-texture` or the
  `.paper-texture-card` helper for a lighter grain on public paper cards.
  `.paper-texture` applies the page treatment where a page needs an explicit
  helper class. Keep the texture behind content; it is disabled for increased
  contrast and forced-colour preferences. Do not apply it to maps, forms, or
  dense dashboard, admin, and validator screens.
- An optional Bicolano weaving-inspired pattern may be used as a section
  divider. Treat it as a respectful, restrained motif, not a generic cultural
  decoration; use it only when its source and meaning are understood.
- Double-line borders may frame a feature panel, quotation, or catalogue
  feature. Use them sparingly with thin taupe lines and generous inner padding.

## Image treatment

- Use a restrained sepia treatment, for example
  `sepia(0.28) saturate(0.82) contrast(1.04)`. Keep original colour available
  where it carries cultural meaning or improves legibility.
- For a hero image, use a dark ink overlay around 55–65% as a starting point,
  with a stronger gradient behind the copy if needed. The image should remain
  visible; the text must sit on a stable dark field and pass contrast checks.
- Place captions on a cream caption plate with ink text. Include attribution,
  context, and any required consent or source details; do not make captions
  depend on hover.
- Prefer documentary images with context and permission over generic stock
  imagery. Avoid cropping people or culturally significant objects in a way
  that changes their meaning.

## Components

### Cards

Use white cards in light mode and the dark-card surface in dark mode. Keep
corners modest, borders thin and taupe, and shadows absent or very soft. A
catalogue card should prioritize its title, place or source context, and
verification state rather than decorative chrome.

### Verification badges

Style badges as small archive stamps: compact, outlined or lightly filled,
with a legible label and an optional icon. Suggested accents are rust for
**Verified**, taupe for **Unverified**, and antique gold for **Disputed**.
Always print the status word; never rely on colour alone. Use ink text on a
light badge surface in light mode, and ink-coloured light text on a dark badge
surface in dark mode. Keep the gold accent to a border, icon, or small mark,
not the label text.

### Buttons

- Primary: filled rust with white text in light mode; dark-mode rust with
  dark-page text.
- Secondary: transparent or surface-coloured with a 1px ink/taupe outline.
- Destructive actions: clearly named and visually distinct, without relying
  only on red colouring.
- Include visible hover, pressed, disabled, and keyboard focus states. Meet the
  same text contrast requirements in each state.

### Forms

Use persistent visible labels, clear helper text, and generous spacing.
Inputs should have a white/light card surface in light mode and a dark-card
surface in dark mode, with a visible taupe border and a distinct focus ring.
Show errors in text next to the relevant control; do not communicate validation
with colour alone.

### Filter bar

Keep search and filters in a calm, aligned row on wide screens and a clear
stack on narrow screens. Label every control, preserve visible selected
values, and provide an obvious way to clear filters. Use thin rules rather
than a heavy enclosing panel.

## Do and don't

### Do

- Do use the cream-and-ink palette, generous whitespace, thin rules, and
  editorial serif headings to create a quiet historical mood.
- Do identify sources, contributors, places, and verification state clearly.
- Do keep status badges text-labelled and maintain accessible contrast.
- Do use cultural motifs only with care, context, and respect.
- Do preserve readable line lengths, responsive spacing, and visible focus
  states.

### Don't

- Don't use antique gold for body text or as the only cue for status.
- Don't put taupe normal-size text on `#F3DFB1`; its 4.09:1 contrast fails AA.
- Don't place white text over an uncontrolled photograph without checking the
  final contrast.
- Don't add faux-aged stains, distressed type, ornate flourishes, or dense
  borders that make the archive feel theatrical or hard to use.
- Don't use generic Bicolano-inspired patterning as decoration without
  understanding its source and cultural context.
- Don't imply that a visual treatment or badge proves a historical claim.
