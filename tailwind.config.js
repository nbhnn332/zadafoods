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
          gold: '#DE8B24',
          'gold-light': '#FCF2E3',
        },
        content: {
          primary: '#041914',
          secondary: '#4A4F48',
          muted: '#787F76',
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
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 40px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
