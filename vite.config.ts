import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The 'base' property is essential for GitHub Pages.
  // It must match your repository name exactly.
  base: "/my-gulu-app/",
})