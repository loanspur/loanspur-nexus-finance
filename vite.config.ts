import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // CRITICAL: Add this for development SPA routing
    historyApiFallback: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'radix-core': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-popover'],
          'radix-form': ['@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-label', '@radix-ui/react-switch'],
          'radix-navigation': ['@radix-ui/react-tabs', '@radix-ui/react-accordion', '@radix-ui/react-navigation-menu', '@radix-ui/react-menubar'],
          'radix-overlay': ['@radix-ui/react-toast', '@radix-ui/react-tooltip', '@radix-ui/react-hover-card', '@radix-ui/react-context-menu'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          'icons': ['lucide-react'],
          'date': ['date-fns', 'react-day-picker'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  // CRITICAL: Add this for production builds
  preview: {
    port: 8080,
    host: "::",
  },
}));
