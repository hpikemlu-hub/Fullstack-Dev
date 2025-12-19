import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    root: '.',  // Menentukan root directory secara eksplisit
    
    // In production, use absolute path for proper deployment
    // In development, use relative path
    base: mode === 'production' ? '/' : './',
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development', // Enable sourcemaps in development only
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')  // Eksplisit menentukan entry point dengan path absolut
        }
      }
    },
    
    // Development server configuration
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    
    // Preview server configuration (for testing production build locally)
    preview: {
      port: 4173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')  // Menambahkan alias untuk src directory
      }
    }
  }
})