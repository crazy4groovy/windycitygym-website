import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import prefetch from "@astrojs/prefetch";

// https://astro.build/config
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  site: 'https://mountainbrothers.ca',
  integrations: [mdx(), sitemap(), prefetch()],
  output: 'server',
  adapter: vercel({
    analytics: true
  }),
});
