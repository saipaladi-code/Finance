/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#142B4A',       // Primary: Deep Navy Blue
          blue: '#2563EB',       // Secondary: Professional Blue
          bg: '#F5F7FB',         // Background: Light Grey
          card: '#FFFFFF',       // Cards: White
          success: '#16A34A',    // Success: Green
          warning: '#F59E0B',    // Warning: Orange
          danger: '#DC2626',     // Danger: Red
          text: '#1E293B',       // Text: Dark Slate
        },
        fintech: {
          navy: '#142B4A',
          sidebar: '#142B4A',
          sidebarHover: '#1B375E',
          sidebarActive: '#2563EB',
          primary: '#2563EB',
          primaryHover: '#1D4ED8',
          emerald: '#16A34A',
          lightBg: '#F5F7FB',
          card: '#FFFFFF',
          border: '#E2E8F0',
          textMuted: '#64748B',
          danger: '#DC2626',
          warning: '#F59E0B',
          success: '#16A34A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

