import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Function form so shared dependencies (e.g. clsx) are not dragged into
        // a route-specific chunk that then gets preloaded on every page.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@tanstack/react-query')) return 'query';
          // Shared utilities must not be hosted inside a lazy route chunk
          // (that creates a static entry -> charts edge and preloads it).
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'ui';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('@radix-ui') || id.includes('/radix-ui/')) return 'ui';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor';
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react/') || id.includes('/scheduler/')) return 'react';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
