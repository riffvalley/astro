// @ts-check
import { defineConfig } from 'astro/config';

import netlify from '@astrojs/netlify';
import vue from '@astrojs/vue';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: netlify(),
  integrations: [vue()],

  // Este sitio no usa sesiones; sin esto, el adaptador de Netlify activa
  // por defecto un driver de Netlify Blobs que envuelve el fetch global y
  // provocaba "redirect count exceeded" al llamar a la API de WordPress
  // durante el build.
  session: {
    driver: 'memory',
  },

  vite: {
    plugins: [tailwindcss()],
    // HOST_API se usa desde componentes Vue hidratados en el cliente (islas de
    // Astro), así que necesita ir en el bundle del navegador. Por defecto Vite
    // solo expone variables con prefijo PUBLIC_; la añadimos explícitamente.
    envPrefix: ['PUBLIC_', 'HOST_API'],
  },
});