import { defineConfig } from 'astro/config';

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/sharks-n-fish" before
// you add a custom domain, empty after). Locally it's just "/".
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  devToolbar: { enabled: false },
});
