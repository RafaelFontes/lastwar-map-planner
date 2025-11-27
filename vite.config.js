import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isAdminBuild = process.env.VITE_ADMIN_BUILD === 'true';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: isAdminBuild
        ? { admin: resolve(__dirname, 'admin.html') }
        : { main: resolve(__dirname, 'index.html') },
    },
    outDir: isAdminBuild ? 'dist-admin' : 'dist',
  },
})
