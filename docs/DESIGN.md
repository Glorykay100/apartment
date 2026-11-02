# Yahsab Luxury Apartments & Suites — Design System & Brand Identity

---

## 1. Brand Concept & Creative Philosophy

**Brand Name:** Yahsab Luxury Apartments & Suites  
**Tagline:** *Refined Comfort, Rooted Hospitality*  
**Locations:** High-Level & Old GRA, Makurdi | Guzape & Wuse II, Abuja, Nigeria  
**Currency:** Nigerian Naira (`₦`) | **Timezone:** `Africa/Lagos` (WAT, UTC+1)

Yahsab is conceived as a boutique hospitality retreat tailored for business travelers, relocating families, digital nomads, and vacationers seeking privacy, serene architecture, and uncompromising infrastructure in Nigeria.

### Originality & Anti-Plagiarism Guardrails
* **No Direct Copying:** Visual hierarchies and section clarity are inspired by world-class boutique hotels, but all copy, unit titles, photography curation, and layout compositions are 100% original.
* **Authentic Nigerian Reality:** Features highlight real local priorities—guaranteed 24/7 dual solar/hybrid power with silent diesel generators, treated borehole water filtration, Starlink high-speed internet, private perimeter security with biometric access, and on-demand local chef services.

---

## 2. Color Palette & Semantic Tokens

Our palette reflects the natural earth, river sand, and lush vegetation of central Nigeria, combined with architectural charcoal and warm terracotta.

| Token | Hex Value | Role | CSS Variable |
|---|---|---|---|
| **Background (Sand)** | `#FBF9F5` | Default canvas background | `--bg-sand` |
| **Surface (Warm Ivory)** | `#F5F2EA` | Card surfaces, secondary bands | `--surface-card` |
| **Surface Hover** | `#EFE9DC` | Interactive element hover | `--surface-hover` |
| **Deep Forest (Primary)** | `#132B22` | Brand anchor, header bars, solid CTAs | `--brand-deep` |
| **Deep Forest Hover** | `#0D1E17` | Hover state for primary buttons | `--brand-deep-hover` |
| **Terracotta (Accent)** | `#C25E3B` | Badges, active tabs, highlight accents | `--accent-terracotta` |
| **Terracotta Hover** | `#AB4F30` | Hover state for accent items | `--accent-hover` |
| **Text Primary (Obsidian)**| `#191D1B` | High contrast body and headings | `--text-primary` |
| **Text Muted (Clay)** | `#646A66` | Supporting descriptions, timestamps | `--text-muted` |
| **Border / Divider** | `#E5DFD3` | Subtle 1px structural dividers | `--border-subtle` |
| **Success State** | `#226E4A` | Confirmed bookings, available dates | `--color-success` |
| **Error / Alert** | `#BD3A3A` | Date conflicts, failed payments | `--color-error` |

---

## 3. Typography Scale

Pairing an editorial, characterful serif for titles with a geometric, legible humanist sans for metadata and body copy.

* **Editorial Display (Serif):** `Fraunces` or `Playfair Display` (font-serif)
* **Body & System UI (Sans):** `Plus Jakarta Sans` or `DM Sans` (font-sans)

| Level | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display 1** | `48px - 64px` | 600 SemiBold | `1.1` | `-0.02em` | Homepage Hero Titles |
| **Heading 1** | `36px - 42px` | 600 SemiBold | `1.15` | `-0.015em` | Page Headings, Listing Titles |
| **Heading 2** | `26px - 30px` | 600 SemiBold | `1.25` | `-0.01em` | Section Titles, Modal Headers |
| **Heading 3** | `20px - 22px` | 500 Medium | `1.3` | `0` | Card Titles, Drawer Subheads |
| **Eyebrow Label** | `12px` | 700 Bold | `1.0` | `+0.18em` | Uppercase category tags |
| **Body Large** | `18px` | 400 Regular | `1.6` | `0` | Introductions, lead paragraphs |
| **Body Base** | `15px - 16px` | 400 Regular | `1.55` | `0` | Default body and specifications |
| **Caption / Fine** | `13px` | 400 Regular | `1.4` | `+0.01em` | Disclaimers, footer links |

---

## 4. Layout & Spacing Rules

* **Container Max Width:** `1280px` (`max-w-7xl`) for page content; `1440px` for hero and edge banners.
* **Section Padding:** `py-20` to `py-28` on desktop; `py-14` on mobile for generous breathing room.
* **Asymmetrical Rhythms:** Instead of repeated symmetrical 3-column rows, alternate between 60/40 visual showcases, full-bleed immersive imagery, and staggered editorial grids.
* **Borders & Dividers:** Always crisp `1px border-[#E5DFD3]`. Never heavy drop shadows.
* **Border Radii:** Soft architectural corners—`rounded-2xl` (`16px`) for cards, `rounded-xl` (`12px`) for buttons, `rounded-lg` (`8px`) for inputs.

---

## 5. Iconography & Photography Guidelines

* **Icons:** Exclusively [Lucide Icons](https://lucide.dev/). Stroke width `1.75px` or `2px`. Never use emoji icons in UI buttons or navigation.
* **Photography:** Real boutique interior and architectural photography. Warm ambient lighting, natural linen, African hardwood accents, minimalist kitchens, and immaculate bathrooms.
* **Aspect Ratios:** Standardized at `16:10` for card thumbnails and `3:2` or `4:3` for detail hero collages.
