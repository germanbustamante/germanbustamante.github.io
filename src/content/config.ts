import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ({ image }: { image: () => z.ZodType<any> }) =>
    z.object({
      title: z.string().max(80).min(10),
      hero: image(),
      heroAlt: z.string(),
      description: z.string().max(220).min(110),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
      tags: z.array(z.string()),
      language: z.string(),
      // Set when a post is a project-specific case study (e.g. "fuelio") rather than a general
      // technical article — lets a project card link to its own posts without a second collection
      // to maintain.
      project: z.string().optional(),
    }),
});

export const collections = {
  blog: blogCollection,
};
