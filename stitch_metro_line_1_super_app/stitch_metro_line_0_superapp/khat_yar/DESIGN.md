---
name: Khat-Yar
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#424751'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#737783'
  outline-variant: '#c2c6d3'
  surface-tint: '#255dad'
  primary: '#00346f'
  on-primary: '#ffffff'
  primary-container: '#004a99'
  on-primary-container: '#9bbdff'
  inverse-primary: '#abc7ff'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#720009'
  on-tertiary: '#ffffff'
  tertiary-container: '#9d0011'
  on-tertiary-container: '#ffa59d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#abc7ff'
  on-primary-fixed: '#001b3f'
  on-primary-fixed-variant: '#00458f'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#930010'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display-lg:
    fontFamily: Vazirmatn
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Vazirmatn
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Vazirmatn
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Vazirmatn
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Vazirmatn
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Vazirmatn
    fontSize: 26px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-stakes transit operations, prioritizing reliability, authority, and instantaneous legibility. The brand personality is institutional and disciplined, reflecting the critical nature of Metro Line 1 infrastructure.

The visual style follows a **Corporate / Modern** approach with **Industrial** undertones. It utilizes structured layouts, high-contrast ratios, and a systematic hierarchy to ensure that train operators and administrative staff can interpret complex data in high-pressure or low-light environments (such as tunnels). The aesthetic is functional and utilitarian, stripping away unnecessary ornamentation to focus on operational efficiency.

## Colors
The palette is anchored by **Metro Blue** (#004A99), a deep, authoritative blue that signals stability and trust. **Transit Yellow** (#FFD700) serves as the functional secondary color, reserved for high-visibility alerts, warnings, and active status indicators.

For the dark mode interface—critical for tunnel operations—the system flips to a high-contrast black-to-slate scale to minimize screen glare and eye strain.
- **Primary:** Metro Blue for primary actions and navigation.
- **Secondary:** Transit Yellow for attention-focusing elements.
- **Tertiary:** Signal Red (#D32F2F) exclusively for emergency (SOS) and critical system failures.
- **Neutrals:** A range of cool grays designed to differentiate data tiers in complex tables and dashboards.

## Typography
This design system uses **Vazirmatn** (the modern successor to Vazir) for its exceptional RTL (Persian) legibility and professional tone. It provides the clarity required for dense administrative data.

For specialized technical data, such as train telemetry or station IDs, **JetBrains Mono** is utilized for its distinct character separation, preventing misread values in high-speed monitoring. 

- **Alignment:** Right-to-Left (RTL) is the primary orientation.
- **Hierarchy:** Heavily weighted headlines for quick scanning of dashboard sections.
- **Data Display:** Use `data-mono` for all numerical telemetry and technical identifiers.

## Layout & Spacing
The design system employs a **Fixed Grid** model for administrative desktops to maintain data alignment, and a **Fluid Grid** for mobile operational tablets.

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters.
- **Tablet/Operator Console:** 8-column grid, fluid width, 16px gutters. 
- **Rhythm:** A 4px baseline grid ensures tight vertical alignment for data-heavy tables.
- **Safe Zones:** Increased touch targets (minimum 48px) are mandatory for operator-facing interfaces to account for vibration in moving vehicles.

## Elevation & Depth
Elevation is handled through **Tonal Layers** rather than soft shadows to maintain high contrast and clarity.

- **Base Layer:** The primary application background.
- **Surface Layer:** Cards and widgets used to group operational data. These use a 1px solid border (Metro Blue at 10% opacity) instead of shadows.
- **Overlay Layer:** Modals and emergency alerts. These use a heavy 40% opacity black backdrop blur (glassmorphism) to ensure the operator's focus is entirely on the critical message.
- **Dark Mode:** In dark mode, elevation is communicated by shifting surface colors from a deep charcoal to a slightly lighter slate.

## Shapes
The shape language is **Soft** but geometric. A consistent `0.25rem` (4px) radius is applied to most UI elements (inputs, buttons, cards) to maintain a modern, professional look without feeling "playful."

- **Small elements:** 4px radius (Standard).
- **Large containers:** 8px radius (Large).
- **Status Indicators:** Circular (Full round) for system health dots to differentiate them from interactive elements.

## Components
This design system defines specialized components for transit administration:

- **Buttons:** Primary buttons are solid Metro Blue. Secondary buttons use a thick 2px outline. **SOS Buttons** are oversized, Tertiary Red, and require a "long-press" or "swipe-to-activate" interaction to prevent accidental triggers.
- **Dashboard Widgets:** Modular containers for metrics like "Trains in Motion" or "Power Load." Must include a clear label and a secondary "Trend" indicator.
- **Data Tables:** Highly condensed. Use alternating row stripes (Zebra striping) for readability. Headers must remain "sticky" during scroll.
- **Status Indicators:** Use a combination of color (Green/Yellow/Red) and iconography (Check/Warning/X) to ensure accessibility for colorblind users and visibility in low-light.
- **Input Fields:** Heavy borders (2px) when focused, using Metro Blue to clearly indicate active data entry points.
- **Chips:** Used for filtering station names or train IDs. Use a rectangular shape with the 4px radius to distinguish from rounded action buttons.