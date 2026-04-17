import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">This page is off the map</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-gradient-gold px-6 py-3 text-xs uppercase-track text-gold-foreground shadow-gold"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Men's Corner — Mindset, Finance, Fitness, Purpose" },
      { name: "description", content: "A premium publication for the modern man. Sharp ideas on mindset, finance, fitness, and purpose." },
      { name: "author", content: "Men's Corner" },
      { property: "og:title", content: "Men's Corner — Mindset, Finance, Fitness, Purpose" },
      { property: "og:description", content: "A premium publication for the modern man. Sharp ideas on mindset, finance, fitness, and purpose." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0c0a07" },
      { name: "twitter:title", content: "Men's Corner — Mindset, Finance, Fitness, Purpose" },
      { name: "twitter:description", content: "A premium publication for the modern man. Sharp ideas on mindset, finance, fitness, and purpose." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/39714739-3bbc-4ee9-9a75-fd6bb53e3956" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/39714739-3bbc-4ee9-9a75-fd6bb53e3956" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Barlow:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { location } = useRouterState();
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname === "/auth";

  return (
    <AuthProvider>
      {!isAdmin && <SiteHeader />}
      <main className="min-h-screen">
        <Outlet />
      </main>
      {!isAdmin && <SiteFooter />}
      <Toaster theme="dark" position="top-center" />
    </AuthProvider>
  );
}
