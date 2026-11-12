/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--color-page-bg, #FBF8F4)',
          subtle: 'var(--color-section-bg, #F7F3EB)',
        },
        surface: {
          DEFAULT: 'var(--color-surface, #FFFFFF)',
          muted: 'var(--color-surface-subtle, #F5EFE6)',
        },
        brand: {
          primary: 'var(--color-primary, #A67732)',
          'primary-hover': 'var(--color-primary-hover, #8E6325)',
          'primary-light': 'var(--color-badge-bg, #F4EADA)',
          secondary: 'var(--color-secondary, #072C20)',
          'secondary-hover': 'var(--color-primary-hover, #0C3D2D)',
          'secondary-light': 'var(--color-surface-subtle, #E9EFEA)',
          deep: 'var(--color-footer-bg, #031D16)',
          gold: 'var(--color-accent, #A67732)',
          'gold-muted': 'var(--color-accent, #D4B574)',
          'gold-light': 'var(--color-surface-subtle, #FCF2E3)',
        },
        content: {
          primary: 'var(--color-heading, #041914)',
          secondary: 'var(--color-text, #4A4F48)',
          muted: 'var(--color-text-muted, #787F76)',
          warm: 'var(--color-text-muted, #77736C)',
        },
        status: {
          discount: '#D32F2F',
          'discount-bg': '#FAD3D1',
          success: '#1D6331',
          'success-bg': '#EAF4ED',
          warning: '#B45309',
          'warning-bg': '#FEF3C7',
        },
        border: {
          subtle: 'var(--color-border, #EAE3D6)',
          active: 'var(--color-primary, #072C20)',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '18px',
        'btn': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 4px rgba(0, 0, 0, 0.04)',
        '2xs': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 40px rgba(0, 0, 0, 0.12)',
        'nav': '0 -2px 12px rgba(0, 0, 0, 0.06)',
        'card': '0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
