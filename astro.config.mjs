import { defineConfig, sharpImageService } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import { readFileSync } from "node:fs";
import mdx from "@astrojs/mdx";
import compressor from "astro-compressor";

export default defineConfig({
  integrations: [tailwind(), sitemap(), mdx(), compressor()],
  image: {
    service: sharpImageService(),
  },
  site: "https://germanbustamante.github.io",
  vite: {
    plugins: [rawFonts([".ttf", ".woff"])],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
      fallbackType: "redirect",
    },
  },
});

// vite plugin to import fonts
function rawFonts(ext) {
  return {
    name: "vite-plugin-raw-fonts",
    transform(_, id) {
      if (ext.some(e => id.endsWith(e))) {
        const buffer = readFileSync(id);
        return {
          code: `export default ${JSON.stringify(buffer)}`,
          map: null
        };
      }
    }
  };
}
