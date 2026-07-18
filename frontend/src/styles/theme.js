/**
 * ============================================================================
 * theme.js — JS mirror of tokens.css
 * ============================================================================
 * This is the JS-readable counterpart to tokens.css. It exists so that:
 *   1. tailwind.config.js can map every Tailwind utility class straight onto
 *      the CSS custom properties (so `bg-primary-600` resolves to
 *      `var(--color-primary-600)`, not a duplicated hex value).
 *   2. Any JS/TS code that needs a raw token value (charts, canvas drawing,
 *      inline style calculations, email templates, etc.) has one place to
 *      import from instead of re-typing hex codes.
 *
 * Rule: values below must always match tokens.css exactly. If you change a
 * value in one file, change it in the other in the same commit.
 * ============================================================================
 */

/* --- 1. COLOR PALETTE ----------------------------------------------------- */
/* Primary ("Signal Violet"): primary buttons, links, active states, focus rings */
const primary = {
  50:  '#f1eeff',
  100: '#e4deff',
  200: '#cbc0ff',
  300: '#a99aff',
  400: '#8874ff',
  500: '#6b52ff',
  600: '#4a3aff',
  700: '#3a2acc',
  800: '#2b1f99',
  900: '#1d1466',
};

/* Secondary ("Jade"): secondary buttons, tags, complementary highlights */
const secondary = {
  50:  '#eafbf4',
  100: '#d2f6e7',
  200: '#a6edd0',
  300: '#74deb6',
  400: '#45c99b',
  500: '#22ad82',
  600: '#158a68',
  700: '#106c53',
  800: '#0c5240',
  900: '#083b2e',
};

/* Accent ("Ember"): callouts, badges, sparing decorative highlights */
const accent = {
  50:  '#fff7e8',
  100: '#ffebc2',
  200: '#ffd98a',
  300: '#ffc24d',
  400: '#ffa91f',
  500: '#f58b00',
  600: '#c96e00',
  700: '#9c5400',
  800: '#703d00',
  900: '#4a2800',
};

/* Semantic surfaces & text — light mode defaults; dark mode handled in tokens.css */
const semantic = {
  background:    '#f7f8fa',
  backgroundAlt: '#ffffff', // secondary section background — alternates long pages between white/tinted sections
  surface:       '#ffffff',
  card:          '#ffffff',
  border:        '#e4e7ec',
  muted:         '#98a2b3',
  text:          '#101828',
  textSecondary: '#475467',
};

/* Status colors — system feedback only (toasts, validation, banners, badges) */
const status = {
  success:   '#1fae64',
  successBg: '#eafbf1',
  warning:   '#f5a623',
  warningBg: '#fff8e8',
  error:     '#e5484d',
  errorBg:   '#fdeced',
  info:      '#3b82f6',
  infoBg:    '#eaf2ff',
};

/* --- 2. TYPOGRAPHY ---------------------------------------------------------
 * heading = display/headline copy, body = paragraphs/UI text, mono = code
 * and technical/numeric data.
 */
const fontFamily = {
  heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  body:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  /* No script face at the platform level — branded overrides (e.g.
     lassi-lounge.css) replace --font-script with an actual cursive face. */
  script:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
};

/* Each size ships with its paired line-height and letter-spacing — always
 * use them together, never mix a size from one step with another step's
 * line-height. */
const fontSize = {
  xs:   ['0.75rem',  { lineHeight: '1.333', letterSpacing: '0.01em' }],   // 12px — legal copy, tiny labels
  sm:   ['0.875rem', { lineHeight: '1.429', letterSpacing: '0.005em' }],  // 14px — captions, helper text
  base: ['1rem',     { lineHeight: '1.5',   letterSpacing: '0em' }],      // 16px — default body copy
  lg:   ['1.125rem', { lineHeight: '1.556', letterSpacing: '-0.005em' }], // 18px — lead paragraphs
  xl:   ['1.25rem',  { lineHeight: '1.4',   letterSpacing: '-0.01em' }],  // 20px — card titles
  '2xl': ['1.5rem',  { lineHeight: '1.333', letterSpacing: '-0.015em' }], // 24px — section headings
  '3xl': ['1.875rem',{ lineHeight: '1.2',   letterSpacing: '-0.02em' }],  // 30px — page subheadings
  '4xl': ['2.25rem', { lineHeight: '1.111', letterSpacing: '-0.025em' }], // 36px — page titles
  '5xl': ['3rem',    { lineHeight: '1.083', letterSpacing: '-0.03em' }],  // 48px — hero headlines
};

/* regular = body copy, medium = UI labels/buttons, semibold = subheadings,
 * bold = headings, black = hero/display only. */
const fontWeight = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  black:    '900',
};

/* --- 3. SPACING SCALE -------------------------------------------------------
 * Base unit = 4px. Use for margin/padding/gap — never hardcode raw px for
 * layout spacing anywhere else.
 */
const spacing = {
  0:  '0px',    // no spacing / reset
  1:  '0.25rem',  // 4px  — icon-to-label gaps, tight inline spacing
  2:  '0.5rem',   // 8px  — small gaps between related elements
  3:  '0.75rem',  // 12px — form field internal padding
  4:  '1rem',     // 16px — default component padding/gap
  5:  '1.25rem',  // 20px — card padding
  6:  '1.5rem',   // 24px — section internal spacing
  8:  '2rem',     // 32px — spacing between stacked cards
  10: '2.5rem',   // 40px — spacing between form groups
  12: '3rem',     // 48px — spacing between distinct page blocks
  16: '4rem',     // 64px — section vertical padding (mobile)
  20: '5rem',     // 80px — section vertical padding (tablet)
  24: '6rem',     // 96px — section vertical padding (desktop)
  32: '8rem',     // 128px — hero vertical padding
  40: '10rem',    // 160px — large hero/landing spacing
  48: '12rem',    // 192px — max page-section spacing
  64: '16rem',    // 256px — rare, full-bleed marketing sections
};

/* --- 4. BORDER RADIUS -------------------------------------------------------
 * sm/md for inputs & buttons, lg/xl for cards & modals, 2xl for hero/feature
 * panels, full for pills/avatars/dots.
 */
const borderRadius = {
  none: '0px',
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  '2xl': '24px',
  full: '9999px',
};

/* --- 5. SHADOWS (light mode values; dark mode overridden via tokens.css) --- */
const boxShadow = {
  none: 'none',
  sm: '0 1px 2px rgba(16, 24, 40, 0.05)',
  md: '0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
  lg: '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
  xl: '0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)',
  '2xl': '0 24px 48px -12px rgba(16, 24, 40, 0.18)',
};

/* Dark-mode shadow values — reference only; applied automatically via the
 * `[data-theme="dark"]`/`.dark` CSS custom-property overrides in tokens.css.
 * Exposed here in case JS-driven canvas/SVG rendering needs them directly. */
const boxShadowDark = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.40)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.45), 0 2px 4px -2px rgba(0, 0, 0, 0.30)',
  lg: '0 12px 16px -4px rgba(0, 0, 0, 0.50), 0 4px 6px -2px rgba(0, 0, 0, 0.30)',
  xl: '0 20px 24px -4px rgba(0, 0, 0, 0.55), 0 8px 8px -4px rgba(0, 0, 0, 0.30)',
  '2xl': '0 24px 48px -12px rgba(0, 0, 0, 0.65)',
};

/* --- 6. TRANSITIONS ---------------------------------------------------------
 * fast for micro-interactions, base for standard UI transitions, slow for
 * larger layout shifts (modals, page transitions).
 */
const transitionDuration = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
};

const transitionTimingFunction = {
  linear: 'linear',
  in:     'cubic-bezier(0.4, 0, 1, 1)',
  out:    'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/* --- 7. Z-INDEX SCALE -------------------------------------------------------
 * Use the named layer for its exact purpose only — never invent a one-off
 * z-index value in a component.
 */
const zIndex = {
  base:     '0',
  dropdown: '1000',
  sticky:   '1100',
  overlay:  '1200',
  modal:    '1300',
  toast:    '1400',
};

/* --- 8. BREAKPOINTS ---------------------------------------------------------
 * sm = large phones/phablets, md = tablets (portrait), lg = tablets
 * (landscape)/small laptops, xl = laptops/desktops, 2xl = large monitors.
 */
const screens = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
};

/* ============================================================================
 * Assembled export — consumed directly by tailwind.config.js
 * ============================================================================
 */
const theme = {
  colors: {
    primary,
    secondary,
    accent,
    background: semantic.background,
    'background-alt': semantic.backgroundAlt,
    surface: semantic.surface,
    card: semantic.card,
    border: semantic.border,
    muted: semantic.muted,
    text: semantic.text,
    'text-secondary': semantic.textSecondary,
    success: status.success,
    'success-bg': status.successBg,
    warning: status.warning,
    'warning-bg': status.warningBg,
    error: status.error,
    'error-bg': status.errorBg,
    info: status.info,
    'info-bg': status.infoBg,
  },
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  boxShadow,
  boxShadowDark, // not consumed by Tailwind directly — reference for JS-driven rendering
  transitionDuration,
  transitionTimingFunction,
  zIndex,
  screens,
};

module.exports = theme;
module.exports.default = theme;