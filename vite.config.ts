import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The repository name is 'my-gulu-app' based on your GitHub Pages URL.
const REPO_NAME = 'my-gulu-app';

export default defineConfig({
  plugins: [react()],
  // This sets the base public path for your app when deployed.
  // It should match the subdirectory where your app is hosted on GitHub Pages.
  base: `/${REPO_NAME}/`,
});
