import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'warm-black': 'var(--warm-black)',
        espresso: 'var(--espresso)',
        caramel: 'var(--caramel)',
        cream: 'var(--cream)',
        white: 'var(--white)',
        stone: 'var(--stone)',
        linen: 'var(--linen)',
        sand: 'var(--sand)',
        peach: 'var(--peach)',
        graphite: 'var(--graphite)',
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        danger: 'var(--danger)',
        'danger-light': 'var(--danger-light)',
        info: 'var(--info)',
        'info-light': 'var(--info-light)',
        instagram: 'var(--instagram)',
        facebook: 'var(--facebook)',
        youtube: 'var(--youtube)',
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
      borderRadius: {
        card: '1.125rem',
        button: '0.75rem',
        tag: '999px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '0' }],
        h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700', letterSpacing: '0' }],
        h2: ['1.375rem', { lineHeight: '1.875rem', fontWeight: '650', letterSpacing: '0' }],
        h3: ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '650', letterSpacing: '0' }],
        h4: ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '650', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0' }],
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        'data-sm': ['1rem', { lineHeight: '1.375rem', fontWeight: '650', letterSpacing: '0' }],
        'data-md': ['1.375rem', { lineHeight: '1.875rem', fontWeight: '700', letterSpacing: '0' }],
        'data-lg': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'data-xl': ['2.5rem', { lineHeight: '2.75rem', fontWeight: '800', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.06)',
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 16px 40px rgba(15, 23, 42, 0.10)',
        // 3D-projection depth scale
        lift: '0 18px 44px -22px rgba(13, 18, 35, 0.26)',
        float: '0 30px 80px -28px rgba(13, 18, 35, 0.34)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.75), 0 24px 60px -28px rgba(13,18,35,0.22)',
        'accent-glow': '0 24px 60px -22px rgba(124, 58, 237, 0.30)',
        'input-focus': '0 0 0 3px color-mix(in srgb, var(--app-accent) 16%, transparent)',
      },
      maxWidth: {
        content: '1440px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'caret-blink': {
          '0%, 70%, 100%': { opacity: '1' },
          '20%, 50%': { opacity: '0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 220ms ease-out both',
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
        'caret-blink': 'caret-blink 1.2s ease-out infinite',
        'pulse-subtle': 'pulse-subtle 2.2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
