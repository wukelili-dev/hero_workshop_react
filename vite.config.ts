import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || (id.includes('node_modules/react') && !id.includes('node_modules/react-dom'))) return 'react-vendor';
          if (id.includes('node_modules/framer-motion')) return 'framer-motion';
          if (id.includes('node_modules/@radix-ui')) return 'radix-ui';
          if (id.includes('node_modules/react-icons')) return 'react-icons';
          if (id.includes('node_modules/zustand')) return 'zustand';
          if (id.includes('node_modules/sonner')) return 'sonner';
        },
      },
    },
  },
})
