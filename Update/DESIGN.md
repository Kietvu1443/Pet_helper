---
name: PetHelper Admin
colors:
  surface: '#f8faf5'
  surface-dim: '#d9dbd6'
  surface-bright: '#f8faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4ef'
  surface-container: '#edeee9'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e1e3de'
  on-surface: '#191c1a'
  on-surface-variant: '#414942'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#f0f1ec'
  outline: '#717971'
  outline-variant: '#c0c9bf'
  surface-tint: '#376848'
  primary: '#00220f'
  on-primary: '#ffffff'
  primary-container: '#023a1e'
  on-primary-container: '#72a580'
  inverse-primary: '#9dd3ab'
  secondary: '#376848'
  on-secondary: '#ffffff'
  secondary-container: '#b6ecc4'
  on-secondary-container: '#3b6d4c'
  tertiary: '#0d1e31'
  on-tertiary: '#ffffff'
  tertiary-container: '#233347'
  on-tertiary-container: '#8b9bb4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b9efc6'
  primary-fixed-dim: '#9dd3ab'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#1e5032'
  secondary-fixed: '#b9efc6'
  secondary-fixed-dim: '#9ed3ac'
  on-secondary-fixed: '#00210f'
  on-secondary-fixed-variant: '#1e5032'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f8faf5'
  on-background: '#191c1a'
  surface-variant: '#e1e3de'
  surface-gradient-start: '#f0f4f1'
  surface-gradient-end: '#f7f9f7'
  status-pending-bg: '#fffbeb'
  status-pending-text: '#b45309'
  status-approved-bg: '#f0fdf4'
  status-approved-text: '#15803d'
  status-error-bg: '#fef2f2'
  status-error-text: '#b91c1c'
  sidebar-glass: rgba(255, 255, 255, 0.7)
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '800'
    lineHeight: '1.4'
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 2.5rem
  grid-gap: 1.5rem
  panel-internal: 2rem
  section-margin: 2rem
  sidebar-width: 260px
---

## Brand & Style
The brand personality is **Professional, Organic, and Compassionate**. It combines a systematic administrative interface with a soft, nature-inspired palette reflecting its pet-care mission. 

The design style is **Modern Corporate with Glassmorphic accents**. It utilizes a "soft-shell" layout where the primary navigation resides in a translucent, blurred sidebar, while the main content area sits on high-clarity white surfaces. The aesthetic avoids harsh transitions, favoring subtle gradients and depth over flat minimalism to create a welcoming yet efficient environment for system administrators.

## Colors
The palette is rooted in **Forest Greens** and **Slate Neutrals**. 
- **Primary Green (#023a1e)**: Used for high-emphasis actions, active states, and brand identifiers.
- **Secondary Green (#1f5133)**: Used in gradients and supporting icons to provide depth.
- **Neutral Slates**: Used for secondary text (#64748b) and meta-information (#94a3b8).
- **Functional Colors**: A strictly defined set of semantic colors for status chips (Amber for pending, Emerald for approved, Rose for rejected/error).

Backgrounds utilize a very soft three-point linear gradient to prevent visual fatigue during long admin sessions.

## Typography
The system relies exclusively on **Inter** to maintain a clean, utilitarian feel. 
- **Headlines**: Use heavy weights (800) and tight letter-spacing to create a strong visual anchor for panels.
- **Body Text**: Optimized for readability with a slightly larger line-height (1.6) and a darker slate color to reduce contrast harshness against white backgrounds.
- **Labels**: Specialized uppercase tracking for "Stat Labels" and "Table Headers" provides a clear structural distinction from interactive data.

## Layout & Spacing
The layout follows a **Fixed Sidebar / Fluid Content** model.
- **Grid**: A standard 12-column grid logic is applied within the main panel, though content primarily flows in 2 or 3-column "Stats Grids".
- **Breakpoints**: 
  - **Desktop (>1024px)**: Sidebar is sticky on the left.
  - **Mobile/Tablet**: Sidebar transforms into a horizontal scrolling navigation bar at the top of the viewport.
- **Padding**: Generous internal padding (32px - 40px) is used within panels to emphasize the "clean dashboard" aesthetic.

## Elevation & Depth
Depth is communicated through **Tonal Layering and Soft Shadows**.
- **Level 0 (Background)**: Subtle green/grey gradient.
- **Level 1 (Sidebar)**: Glassmorphic surface using `backdrop-filter: blur(20px)` and a thin semi-transparent white border.
- **Level 2 (Main Panels)**: Solid white with a very diffused, low-opacity shadow (`0 10px 40px rgba(0, 0, 0, 0.04)`).
- **Level 3 (Interactive Cards)**: Floating effect on hover using a slightly more aggressive shadow and vertical translation (-4px).
- **Level 4 (Modals)**: High-contrast depth with a dark backdrop blur (`rgba(15, 23, 42, 0.4)`) to isolate focus.

## Shapes
The shape language is defined by **High-Radius Squircles**.
- **Primary Containers**: 24px corner radius for sidebars and main panels.
- **Intermediate Elements**: 18px - 20px for cards and quick-action buttons.
- **Small Elements**: 12px - 14px for navigation buttons and table rows.
- **Functional Elements**: 8px for status chips to maintain a tighter, more "tag-like" appearance.
- **Pills**: 9999px for status badges to denote high-visibility state information.

## Components
- **Buttons**:
  - *Active Nav*: Features a linear gradient from Primary to Secondary green with a distinct shadow.
  - *Tool Buttons*: Light grey (#f8fafc) with a subtle border; they should feel integrated into the header rather than standing out.
  - *Action Buttons*: High-saturation solid backgrounds (Emerald for Approve, Rose for Reject).
- **Stats Cards**: Feature a top-right icon container and bottom-aligned metadata chips. They should always have a 1px border that darkens slightly on hover.
- **Tables**: Use a "Separated Row" style where each `<tr>` has a background color and rounded ends, rather than a solid grid, creating a lighter visual footprint.
- **Status Pills**: Compact badges with low-opacity backgrounds and high-contrast text for immediate legibility.
- **Quick Action Grid**: Large, centered icons with bold labels, serving as an "at-a-glance" navigation shortcut within the dashboard.