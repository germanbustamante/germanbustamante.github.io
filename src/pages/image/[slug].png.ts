import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import InterRegular from '@fontsource/inter/files/inter-latin-400-normal.woff';
import InterBold from '@fontsource/inter/files/inter-latin-700-normal.woff';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

const dimensions = {
  width: 1200,
  height: 630,
};

interface Props {
  title: string;
  pubDate: Date;
  description: string;
  tags: string[];
  language: string;
}

export async function GET(context: APIContext) {
  const { title, pubDate, description, tags, language } = context.props as Props;
  const date = pubDate.toLocaleDateString(language, { dateStyle: 'full' });

  const markup = html`
    <div tw="bg-zinc-900 flex flex-col w-full h-full rounded-lg overflow-hidden shadow-lg text-white border border-zinc-700/50 divide-y divide-zinc-700/50 divide-solid">

      <div tw="flex flex-col w-full h-4/5 p-10 justify-center">
        <div tw="flex text-zinc-400 text-xl">
          ${date}
        </div>
        <div tw="flex text-6xl mb-4 w-full font-bold leading-snug tracking-tight text-transparent bg-teal-400" style="background-clip: text; -webkit-background-clip: text; background: linear-gradient(90deg, rgb(13, 148, 136), rgb(45, 212, 191));">
          ${title}
        </div>
        <div tw="text-zinc-400 text-xl mt-4">${description}</div>
      </div>

      <div tw="w-full h-1/5 border-t border-zinc-700/50 flex p-10 items-center justify-between text-2xl">
      
        <div tw="flex items-center">
          <span tw="ml-3 text-zinc-500">germanbustamante.github.io</span>
        </div>

        <div tw="flex items-center bg-zinc-800/50 rounded-lg px-4 py-2">
          <div tw="flex flex-col ml-4">
            <span tw="text-zinc-400 font-semibold">Germán Bustamante</span>
            <span tw="text-zinc-400 text-sm">@germanbustamante</span>
          </div>
        </div>
      </div>

    </div>
  `;

  const svg = await satori(markup, {
    fonts: [
      {
        name: 'Inter',
        data: Buffer.from(InterRegular),
        weight: 400,
      },
      {
        name: 'Inter',
        data: Buffer.from(InterBold),
        weight: 700,
      },
    ],
    height: dimensions.height,
    width: dimensions.width,
  });

  const image = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: dimensions.width
    },
  }).render();

  return new Response(image.asPng(), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': image.asPng().length.toString(),
      'Surrogate-Key': tags.join(' '),
      'Query-String-Hash': 'image',
      'Cache-Tag': 'image',
      'Keep-Alive': 'timeout=5, max=1000',
      'X-Content-Type-Options': 'nosniff'
    },
  });
}

export async function getStaticPaths() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const posts = await getCollection('blog');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return posts.map((post: { slug: string; data: { title: string; updatedDate?: Date; pubDate: Date; description: string; tags: string[] } }) => {
    const [language, ...slugParts] = post.slug.split('/');
    const actualSlug = slugParts.join('/');

    return {
      params: { slug: actualSlug },
      props: {
        title: post.data.title,
        pubDate: post.data.updatedDate ?? post.data.pubDate,
        description: post.data.description,
        tags: post.data.tags,
        language: language,
      },
    };
  });
}
