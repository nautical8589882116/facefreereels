/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand palette ──────────────────────────────────
        'warm-black': '#1A1714',
        espresso: '#2C2420',
        caramel: '#C4814B',
        cream: '#F5F0EB',
        stone: '#8C8178',
        linen: '#E8E0D8',
        sand: '#D4C9BF',
        peach: '#F0D5C0',
        graphite: '#3D3832',
        success: '#2D8F5A',
        'success-light': '#E6F4EC',
        warning: '#D4942A',
        'warning-light': '#FDF3E2',
        danger: '#C4453A',
        'danger-light': '#FDECEB',
        info: '#4A7FB5',
        'info-light': '#E8F0F8',
        instagram: '#E4405F',
        facebook: '#1877F2',
        youtube: '#FF0000',

        // ── shadcn/ui semantic tokens ──────────────────────
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        h1: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h3: ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        h4: ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.375rem' }],
        caption: ['0.75rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xs: '0.25rem',
        button: '0.5rem',
        tag: '0.375rem',
        card: '0.75rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(26, 23, 20, 0.04)',
        card: '0 1px 3px rgba(26, 23, 20, 0.06), 0 1px 2px rgba(26, 23, 20, 0.04)',
        'card-hover': '0 4px 16px rgba(26, 23, 20, 0.08), 0 2px 6px rgba(26, 23, 20, 0.04)',
        'input-focus': '0 0 0 3px rgba(196, 129, 75, 0.15)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'caret-blink': {
          '0%, 70%, 100%': { opacity: '1' },
          '20%, 50%': { opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
