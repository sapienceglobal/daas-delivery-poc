/**
 * ============================================================================
 * tailwind.config.js
 * ============================================================================
 * Maps every design token onto Tailwind utility classes. Colors resolve to
 * the CSS custom properties in src/styles/tokens.css (not duplicated hex
 * values) so that dark mode — handled entirely by tokens.css via
 * `[data-theme="dark"]` / `.dark` — works automatically for every semantic
 * color utility (bg-background, text-text, border-border, etc.) with zero
 * extra Tailwind config.
 *
 * Non-color scales (fontSize, spacing, borderRadius, boxShadow, zIndex,
 * screens, transitions) are pulled straight from theme.js so this file and
 * theme.js never drift out of sync.
 *
 * RULE FOR THIS CODEBASE: components use ONLY these utility classes
 * (bg-primary-600, text-text-secondary, rounded-lg, shadow-md, z-modal,
 * duration-fast, etc.). No arbitrary values like bg-[#1a1a2e] or text-[22px].
 * ============================================================================
 */

const theme = require('./src/styles/theme.js');

/** Wraps a token name as `rgb(var(--token) / <alpha-value>)`-free direct var()
 * passthrough. Since our tokens.css stores full hex/rgba (not raw rgb triplets),
 * we reference the custom property directly rather than using Tailwind's
 * opacity-composition syntax. */
const cssVar = (name) => `var(--${name})`;

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Fully replace Tailwind's default screens with our token breakpoints.
    screens: theme.screens,

    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      primary: {
        50:  cssVar('color-primary-50'),
        100: cssVar('color-primary-100'),
        200: cssVar('color-primary-200'),
        300: cssVar('color-primary-300'),
        400: cssVar('color-primary-400'),
        500: cssVar('color-primary-500'),
        600: cssVar('color-primary-600'),
        700: cssVar('color-primary-700'),
        800: cssVar('color-primary-800'),
        900: cssVar('color-primary-900'),
        DEFAULT: cssVar('color-primary-600'),
      },
      secondary: {
        50:  cssVar('color-secondary-50'),
        100: cssVar('color-secondary-100'),
        200: cssVar('color-secondary-200'),
        300: cssVar('color-secondary-300'),
        400: cssVar('color-secondary-400'),
        500: cssVar('color-secondary-500'),
        600: cssVar('color-secondary-600'),
        700: cssVar('color-secondary-700'),
        800: cssVar('color-secondary-800'),
        900: cssVar('color-secondary-900'),
        DEFAULT: cssVar('color-secondary-600'),
      },
      accent: {
        50:  cssVar('color-accent-50'),
        100: cssVar('color-accent-100'),
        200: cssVar('color-accent-200'),
        300: cssVar('color-accent-300'),
        400: cssVar('color-accent-400'),
        500: cssVar('color-accent-500'),
        600: cssVar('color-accent-600'),
        700: cssVar('color-accent-700'),
        800: cssVar('color-accent-800'),
        900: cssVar('color-accent-900'),
        DEFAULT: cssVar('color-accent-500'),
      },

      // Semantic — these are the ones components should reach for by default.
      background:      cssVar('color-background'),
      'background-alt': cssVar('color-background-alt'),
      surface:          cssVar('color-surface'),
      card:             cssVar('color-card'),
      border:           cssVar('color-border'),
      muted:            cssVar('color-muted'),
      text: {
        DEFAULT: cssVar('color-text'),
        secondary: cssVar('color-text-secondary'),
      },

      // Status — system feedback only.
      success: {
        DEFAULT: cssVar('color-success'),
        bg: cssVar('color-success-bg'),
      },
      warning: {
        DEFAULT: cssVar('color-warning'),
        bg: cssVar('color-warning-bg'),
      },
      error: {
        DEFAULT: cssVar('color-error'),
        bg: cssVar('color-error-bg'),
      },
      info: {
        DEFAULT: cssVar('color-info'),
        bg: cssVar('color-info-bg'),
      },
    },

    fontFamily: theme.fontFamily, // includes heading/body/mono/script — script added for branded landing pages
    fontSize: theme.fontSize,
    fontWeight: theme.fontWeight,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    boxShadow: {
      none: cssVar('shadow-none'),
      sm:   cssVar('shadow-sm'),
      md:   cssVar('shadow-md'),
      lg:   cssVar('shadow-lg'),
      xl:   cssVar('shadow-xl'),
      '2xl': cssVar('shadow-2xl'),
    },
    transitionDuration: theme.transitionDuration,
    transitionTimingFunction: theme.transitionTimingFunction,
    zIndex: theme.zIndex,

    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
    },
  },
  plugins: [],
};