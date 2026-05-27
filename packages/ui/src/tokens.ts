/**
 * Design tokens — mirror of docs/03-ui-wireframes/design-tokens.json.
 * Consumed by Tailwind (web) and re-exported as Flutter ThemeData (mobile via Dart codegen).
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#1F3A5F',
      50: '#F0F4F9',
      100: '#D9E2EE',
      200: '#B3C5DD',
      300: '#8DA8CC',
      400: '#5C7FAE',
      500: '#3D5F8E',
      600: '#1F3A5F',
      700: '#172E4B',
      800: '#0F2138',
      900: '#081424',
    },
    accent: {
      DEFAULT: '#FF6B35',
      50: '#FFF4EF',
      100: '#FFE0D2',
      300: '#FFA37A',
      500: '#FF6B35',
      700: '#C24016',
      900: '#7A2509',
    },
    success: { DEFAULT: '#16A34A', bg: '#DCFCE7' },
    warning: { DEFAULT: '#F59E0B', bg: '#FEF3C7' },
    danger: { DEFAULT: '#DC2626', bg: '#FEE2E2' },
    info: { DEFAULT: '#2563EB', bg: '#DBEAFE' },
    verified: { DEFAULT: '#0EA5E9' },
    neutral: {
      0: '#FFFFFF',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
    devanagari: ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    DEFAULT: '8px',
    md: '10px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  boxShadow: {
    xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
    sm: '0 2px 6px rgba(15, 23, 42, 0.06)',
    md: '0 6px 16px rgba(15, 23, 42, 0.08)',
    lg: '0 12px 24px rgba(15, 23, 42, 0.10)',
  },
} as const;

export type Tokens = typeof tokens;
