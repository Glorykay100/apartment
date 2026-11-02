import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FDFCF9',
          100: '#FBF9F5',
          200: '#F5F2EA',
          300: '#EBE5D8',
          400: '#DDD4C0',
          500: '#C5B79A',
        },
        forest: {
          800: '#1A382D',
          900: '#132B22',
          950: '#0B1A14',
        },
        terracotta: {
          400: '#D87A5A',
          500: '#C25E3B',
          600: '#A84C2C',
        },
        charcoal: {
          700: '#3A403D',
          800: '#262B28',
          900: '#191D1B',
        },
        linen: {
          DEFAULT: '#E5DFD3',
          dark: '#D5CDBC',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 2px 8px -2px rgba(19, 43, 34, 0.05)',
        elevated: '0 12px 32px -4px rgba(19, 43, 34, 0.08)',
        modal: '0 24px 60px -12px rgba(19, 43, 34, 0.16)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
