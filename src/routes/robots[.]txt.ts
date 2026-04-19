import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://mens-corner.lovable.app";

const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
