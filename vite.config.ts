import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: This MUST be your GitHub repository name.
// For your URL https://str1006.github.io/my-gulu-app/, the repo name is 'my-gulu-app'.
const REPO_NAME = 'my-gulu-app';

export default defineConfig({
  plugins: [react()],
  // The 'base' property defines the public base path when served in production.
  // It ensures all asset paths (JS, CSS, images, manifest, service worker)
  // are prefixed with '/my-gulu-app/'.
  base: `/${REPO_NAME}/`,
});
