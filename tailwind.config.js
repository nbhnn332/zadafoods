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
          DEFAULT: '#FBF8F4',
          subtle: '#F7F3EB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5EFE6',
        },
        brand: {
          primary: '#A67732',
          'primary-hover': '#8E6325',
          'primary-light': '#F4EADA',
          secondary: '#072C20',
          'secondary-hover': '#0C3D2D',
          'secondary-light': '#E9EFEA',
          deep: '#031D16',
          gold: '#A67732',
          'gold-muted': '#D4B574',
          'gold-light': '#FCF2E3',
        },
        content: {
          primary: '#041914',
          secondary: '#4A4F48',
          muted: '#787F76',
          warm: '#77736C',
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
          subtle: '#EAE3D6',
          active: '#072C20',
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
