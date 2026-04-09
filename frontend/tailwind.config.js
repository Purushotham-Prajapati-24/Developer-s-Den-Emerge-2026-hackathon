/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'jetbrains-mono': ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: '#0a0e14',
        surface_container_low: '#0f141a',
        surface_container_highest: '#1b2028',
        surface_bright: '#262d3a',
        primary: '#b6a0ff',
        primary_dim: '#7e51ff',
        secondary: '#00e3fd',
        on_surface: '#f1f3fc',
        on_surface_variant: '#8e96a4',
      },
    },
  },
  plugins: [],
}
