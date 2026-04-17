import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Men's Corner" },
      { name: "description", content: "A premium publication for the modern man. Our story, mission, and editorial principles." },
      { property: "og:title", content: "About — Men's Corner" },
      { property: "og:description", content: "A premium publication for the modern man." },
      { property: "og:image", content: "/seed/hero-purpose.jpg" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "about_content").maybeSingle()
      .then(({ data }) => setContent(data?.value ?? ""));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <p className="uppercase-track text-xs text-gold">Our story</p>
        <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">
          A publication for the <span className="text-gradient-gold">modern man</span>
        </h1>
      </div>

      <div className="gold-divider my-12" />

      <div className="prose-luxury">
        {content ? content.split("\n").map((p, i) => <p key={i}>{p}</p>) : (
          <>
            <p>Men's Corner is a premium publication for the modern man — covering mindset, finance, fitness, and purpose.</p>
          </>
        )}

        <h2>The mission</h2>
        <p>
          We exist for one reason: to help men become more capable.
          Not louder. Not richer for its own sake. More capable — of building, leading,
          loving, and leaving something behind that mattered.
        </p>

        <h2>What we publish</h2>
        <p>
          Sharp, well-researched essays. No clickbait. No empty motivation.
          Every piece is built to be re-read, marked up, and applied.
        </p>

        <blockquote>
          A man should be able to defend his family, build something useful, read a serious book,
          and stand alone with his thoughts. We write for that man.
        </blockquote>

        <h2>The editorial code</h2>
        <ul>
          <li><strong>Substance over volume.</strong> One essay per week, not seven.</li>
          <li><strong>Truth over comfort.</strong> We will not flatter you.</li>
          <li><strong>Craft over speed.</strong> We rewrite until it's right.</li>
        </ul>
      </div>
    </div>
  );
}
