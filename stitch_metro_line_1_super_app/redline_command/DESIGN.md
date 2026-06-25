---
name: Redline Command
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#5d3f3b'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#926f6a'
  outline-variant: '#e7bdb7'
  surface-tint: '#c00205'
  primary: '#bc0004'
  on-primary: '#ffffff'
  primary-container: '#e1271c'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a9'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5d5c5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#767474'
  on-tertiary-container: '#f7feff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930002'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Vazirmatn
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg-mobile:
    fontFamily: Vazirmatn
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Vazirmatn
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Vazirmatn
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Vazirmatn
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  touch-target-min: 48px
---

## Brand & Style

This design system is engineered for the high-stakes, high-velocity environment of the Tehran Metro Line 1 operations. The brand personality is **Authoritative, Precise, and Resilient**. It prioritizes functional utility over decorative flair, ensuring that personnel can make split-second decisions under stress.

The visual style is **Industrial Corporate**. It blends the structural rigidity of a government institution with the clean, systematic efficiency of modern enterprise software. 
- **High Contrast:** Essential for legibility in varied lighting conditions (from bright outdoor platforms to dimly lit tunnels).
- **Functional Density:** Information is packed efficiently but remains scannable through clear typographic hierarchy.
- **RTL-First:** Built from the ground up to support Persian (Farsi) reading patterns, ensuring alignment and flow are native to the user.

## Colors

The palette is anchored by the iconic Tehran Metro Line 1 Red, used strategically for primary actions and critical branding elements. 

- **Primary Red (#EE3124):** Used for key calls-to-action, line identifiers, and active navigation states.
- **Deep Charcoal (#2D2D2D):** Used for headers, sidebars, and primary text to ground the interface in professionalism.
- **Background Tiers:** The system defaults to a light gray surface to reduce glare, with a high-contrast Rich Black available for night-shift operations.
- **Semantic Accents:** Success, Warning, and Emergency colors follow international transit standards. The Emergency Red is distinct from the Brand Red to ensure critical alerts are never mistaken for standard UI elements.

## Typography

This design system utilizes **Vazirmatn**, a typeface specifically optimized for Persian legibility on digital screens. It provides a balanced stroke weight that remains clear even at small sizes in data-heavy tables.

- **Scale:** A tight scale is used to maximize vertical space. 
- **Monospaced Data:** For technical values like train IDs, timestamps, and signal codes, **JetBrains Mono** is used to ensure digit alignment in live-tracking tables.
- **Alignment:** All text follows RTL (Right-to-Left) alignment. Numbers (Arabic/Persian numerals) should be rendered consistently based on the specific regional setting of the terminal.

## Layout & Spacing

The layout is based on a **4px baseline grid** to maintain industrial precision. 

- **Mobile Operations:** Uses a single-column fluid layout with a focus on "thumb-zone" interactivity. Key navigation is placed at the bottom.
- **Desktop Admin:** Uses a 12-column fixed grid with a collapsible side navigation. 
- **Data Density:** In admin panels, padding is reduced to "Compact" levels (8px) to allow more rows in data tables. In mobile personnel views, padding is increased to "Touch" levels (16px) for ease of use while moving.

## Elevation & Depth

To maintain a professional and "flat" industrial feel, this design system avoids heavy shadows. Instead, it uses **Tonal Layering** and **High-Contrast Outlines**.

- **Surface Levels:** The background is #F8F9FA. Content cards use #FFFFFF with a 1px border of #E0E0E0.
- **Active Elevation:** Only the most critical floating elements (like Emergency Buttons or active Modal dialogs) use a sharp, low-blur shadow to indicate they are "above" the operational flow.
- **Interactivity:** Buttons use a subtle inner-shadow when pressed to provide immediate tactile feedback, mimicking physical industrial switches.

## Shapes

The design system employs **Soft (0.25rem)** roundedness. This "near-sharp" approach communicates the seriousness of a technical environment while remaining modern.

- **Buttons:** Standard buttons use a 4px radius. 
- **Emergency Controls:** Large-scale emergency buttons are strictly circular or use a much higher radius (Pill-shaped) to distinguish them instantly from routine operational inputs.
- **Status Indicators:** Small circular pips are used for real-time connectivity and signal status.

## Components

### Buttons
- **Primary:** Solid #EE3124 with white text. High-contrast.
- **Secondary:** Outlined #2D2D2D. 
- **Emergency:** Massive, full-width red buttons with 24px icon sizes and haptic feedback triggers.

### Data Tables
- **Header:** Sticky headers with Deep Charcoal backgrounds and white text.
- **Rows:** Zebra-striping (#F1F1F1) for rapid horizontal scanning across technical metrics.
- **Live Cells:** Flashing "Pulse" animations (2s duration) for cells containing real-time shifting data (e.g., Train ETA).

### Persian Calendar & Inputs
- **Date Pickers:** Custom RTL Solar Hijri (Jalali) calendars.
- **Fields:** Inset borders with clear labels. Focused states use a 2px Primary Red border.

### Status Indicators
- **Track Map:** A simplified, thick-stroke (4px) line map showing real-time train positions as directional arrows.
- **System Health:** A persistent top-bar utility showing Radio, Network, and Server status using semantic color pips.

### Secure Messaging
- Chat bubbles aligned right for the user and left for Central Command, using high-contrast typography for readability in high-glare environments.