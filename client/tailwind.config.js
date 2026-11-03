/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          navy: '#0b192c',
          sidebar: '#0f172a',
          sidebarHover: '#1e293b',
          sidebarActive: '#1e3a8a',
          primary: '#1d4ed8',
          primaryHover: '#1e40af',
          emerald: '#059669',
          lightBg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          textMuted: '#64748b',
          danger: '#dc2626',
          warning: '#d97706',
          success: '#16a34a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
