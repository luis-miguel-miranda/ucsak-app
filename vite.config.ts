import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/static/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: './static/', // Change output directory
    sourcemap: true,
    emptyOutDir: true,
    assetsDir: "", // Customize assets directory
    manifest: true, // Generate manifest file
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // configure: (proxy, _options) => {
        //   proxy.on('proxyReq', (proxyReq, req, _res) => {
        //     console.log(`[vite-proxy] Sending request ${req.method} ${req.url} to target ${proxyReq.host}${proxyReq.path}`);
        //   });
        //    proxy.on('proxyRes', (proxyRes, req, _res) => {
        //     console.log(`[vite-proxy] Received response ${proxyRes.statusCode} for ${req.url}`);
        //   });
        //   proxy.on('error', (err, req, _res) => {
        //     console.error(`[vite-proxy] Error for ${req.url}:`, err);
        //   });
        // },
      },
    },
  },
})); 