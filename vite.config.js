import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // In modalità 'parallel' (npm run dev:parallel) il backend SmartDoc gira su 8081 (profilo local)
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: env.VITE_API_TARGET || 'http://localhost:8081',
        changeOrigin: true,
        // Il backend ammette solo l'origin localhost:5173 (CORS): in 'parallel' il front gira su 5174
        ...(mode === 'parallel' && { headers: { Origin: 'http://localhost:5173' } }),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
}
})
