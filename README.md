# germanbustamante.github.io

Personal site of **Germán De Bustamante Conde** — Android Architect working across iOS, Kotlin
Multiplatform and full-stack development.

**Live:** https://germanbustamante.github.io

It hosts my professional profile, featured projects and technical writing, in English and Spanish.
The case studies are written from real incidents in my own open-source work — for example
[Fuelio](https://github.com/germanbustamante/Fuelio-KMP), a Kotlin Multiplatform app with fully
native UI on Android and iOS.

## Stack

- [Astro](https://astro.build) (static output) with Markdown/MDX content collections
- Tailwind CSS, with light and dark themes
- Built-in i18n routing (`/en/`, `/es/`)
- Open Graph images generated at build time with Satori
- Deployed to GitHub Pages by GitHub Actions on every push to `main`

## Running locally

Requires Node.js 20+ and pnpm.

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # static output in dist/
pnpm preview   # serve the production build
```

## Project layout

```
src/
  content/blog/{en,es}/   Posts and case studies (Markdown)
  data/                   Projects, experience, technologies, social links
  i18n/                   UI strings per section, in English and Spanish
  components/, layouts/   Astro components
  pages/                  Routes (locale-prefixed)
```

## Credits

Originally based on [David Cojocaru's](https://github.com/cojocaru-david) MIT-licensed Astro
template, since heavily rewritten. Licensed under the [MIT License](LICENSE).
