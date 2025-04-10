import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              500: '#0ea5e9',
              600: '#0284c7',
            },
          },
        },
      },
    }),
  ],
})

