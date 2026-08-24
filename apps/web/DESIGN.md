---
name: Titan Cockpit
colors:
  surface: '#1b110a'
  surface-dim: '#1b110a'
  surface-bright: '#43372e'
  surface-container-lowest: '#150c06'
  surface-container-low: '#241911'
  surface-container: '#281d15'
  surface-container-high: '#33281f'
  surface-container-highest: '#3f3229'
  on-surface: '#f3dfd1'
  on-surface-variant: '#ddc1ae'
  inverse-surface: '#f3dfd1'
  inverse-on-surface: '#3a2e25'
  outline: '#a48c7a'
  outline-variant: '#564334'
  surface-tint: '#ffb77c'
  primary: '#ffb77c'
  on-primary: '#4d2700'
  primary-container: '#ff8e04'
  on-primary-container: '#623300'
  inverse-primary: '#904d00'
  secondary: '#fcb882'
  on-secondary: '#4d2700'
  secondary-container: '#6c3e11'
  on-secondary-container: '#ecab75'
  tertiary: '#86cfff'
  on-tertiary: '#00344c'
  tertiary-container: '#00b6fe'
  on-tertiary-container: '#004462'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#ffb77c'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6d3900'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#fcb882'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#693c0f'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#86cfff'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#004c6d'
  background: '#1b110a'
  on-background: '#f3dfd1'
  surface-variant: '#3f3229'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Raleway
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Raleway
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  code-snippet:
    fontFamily: Quicksand
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  sidebar-width: 280px
  activity-bar-width: 72px
  gutter: 16px
  container-padding: 24px
  stack-gap: 8px
---

## Brand & Style

The design system is engineered for high-performance communication, blending the aesthetics of a high-end streaming cockpit with the precision of developer tools. It targets "pro-gamers" and tech-enthusiasts who value focus, immersion, and speed. 

The visual style is **Corporate / Modern** mixed with **Glassmorphism**. It utilizes deep, earthy foundations to reduce eye strain during long sessions, contrasted by vibrant "Neon Pulse" and "Amber Ember" accents that signal interactable elements and active states. The mood is authoritative and premium—moving away from the "toy-like" playfulness of casual apps toward a tool that feels like a professional hardware interface with a sophisticated, warm-toned tech aesthetic.

## Colors

The palette is anchored in a "Tactical Warmth" philosophy, moving away from pure blacks toward rich, organic dark tones.
- **Base Surfaces:** Use `#847469` (Muted Umber) as the neutral foundation for surfaces, providing a softer but still high-contrast dark mode experience.
- **Containers:** Use `#a26b3b` (Burnished Bronze) for sidebars and secondary containers to create a rugged, metallic structural differentiation.
- **Accents:** `#ff8e04` (Amber Ember) is reserved strictly for primary actions, notifications, and active navigation states. `#00b6fe` (Neon Pulse) provides high-visibility tertiary highlights.
- **Overlays:** Use semi-transparent variants of the neutral palette with a `blur(12px)` backdrop to maintain the glassmorphism feel without sacrificing legibility.

## Typography

This design system uses a triple-font hierarchy to establish a "tech-forward" persona:
1. **Hanken Grotesk (Headlines):** High-impact, sharp, and modern. Used for page titles and significant headings.
2. **Raleway (UI & Body):** An elegant, geometric sans-serif that provides a unique character to chat messages and general UI controls. It ensures maximum readability with a distinct stylistic edge.
3. **Quicksand (Technical Labels):** An approachable yet clean font used for metadata, timestamps, and "system" labels (e.g., "OWNER", "MODERATOR") to reinforce the streaming cockpit aesthetic.

All labels should use uppercase with slight tracking (`letter-spacing`) to differentiate them from standard body text.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high-density spacing. It mimics a dashboard environment where screen real estate is optimized for information.

- **Desktop:** A three-pane architecture. A narrow 72px "Activity Bar" for server/app icons, a 280px "Navigation Sidebar" for channels/lists, and a fluid "Main Content" area.
- **Tablet:** The navigation sidebar becomes a collapsible drawer.
- **Mobile:** Single-column view focusing on the chat/stage, with navigation accessible via a bottom tab bar or hamburger menu.

Spacing uses a 4px baseline. Components within the chat stream should feel tight (8px gaps), while main structural elements use 24px margins to provide visual breathing room.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism** rather than traditional shadows.
- **Level 0 (Background):** The deepest neutral layer based on the muted foundation.
- **Level 1 (Sidebar/Containers):** `#a26b3b` (Bronze). Raised slightly above the background.
- **Level 2 (Cards/Inputs):** Standard interactable surfaces using subtle tonal shifts.
- **Level 3 (Popovers/Modals):** Semi-transparent surfaces with a `20px` background blur and a `1px` subtle border in a light highlight. 

Shadows, when used (e.g., on primary buttons), should be tight and high-intensity, using the primary amber color at low opacity to create a "glow" effect rather than a traditional drop shadow.

## Shapes

The shape language balances modern softness with structural rigidity. 
- **Standard UI (Buttons, Inputs, Cards):** Use `0.5rem` (8px) for a professional, "tooled" look.
- **Large Containers (Modals, Panels):** Use `1rem` (16px) to define major sections of the UI.
- **Avatar/Icons:** Use `0.75rem` (12px) or full circles for status indicators.

Avoid sharp corners to keep the interface feeling premium, but avoid pill-shapes except for specific "Status" chips.

## Components

### Buttons
- **Primary:** Background `#ff8e04`, text high-contrast, bold weight. On hover, apply a slight outer glow.
- **Secondary:** Transparent background with a `1px` border of `#ff8e04`. Text matches border color.
- **Ghost:** No background or border. Text is neutral, turning amber on hover.

### Input Fields
- **Default:** Background derived from the secondary bronze palette, border `1px solid` matching the outline-variant. 
- **Active:** Border changes to `#ff8e04` or `#00b6fe` with a subtle inner glow. Labels use `Quicksand` at 12px.

### Chips & Badges
- **Role Badges:** Small rectangular boxes with a `1px` solid border colored by role (e.g., amber for Owner, bronze for Moderator). Text in `Quicksand` all-caps.

### Cards & Chat Messages
- **Messages:** No border or background by default. On hover, the entire message block receives a subtle highlight background to indicate focus.
- **Cards:** Used for user profiles or stream previews. Utilize Level 2 elevation with a `1px` top-border highlight.

### Sidebars
- Use a `1px` vertical divider to separate the activity bar from the channel list. Active channels are indicated by a vertical amber bar (4px wide) on the left edge.