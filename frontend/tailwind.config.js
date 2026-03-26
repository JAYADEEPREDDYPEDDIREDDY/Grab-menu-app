/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--hue, 250), 20%, 8%)',
        surface: 'hsl(var(--hue, 250), 20%, 12%)',
        'surface-hover': 'hsl(var(--hue, 250), 20%, 18%)',
        accent: 'hsl(var(--hue, 250), 80%, 65%)',
        'accent-hover': 'hsl(var(--hue, 250), 80%, 75%)',
        border: 'hsl(var(--hue, 250), 20%, 18%)',
      }
    },
  },
  plugins: [],
}
