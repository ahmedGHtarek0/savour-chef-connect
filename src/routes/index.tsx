import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Hero3D } from "@/components/Hero3D";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ChefHat, MapPin, Sparkles, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Savora — Authentic home-chef food delivery" },
      { name: "description", content: "Discover talented home chefs in your neighborhood. Order authentic homemade meals with real-time tracking." },
      { property: "og:title", content: "Savora — Home-chef food delivered" },
      { property: "og:description", content: "A multi-vendor marketplace for authentic home cooking." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:py-20 lg:grid-cols-2 lg:gap-12 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("app.tagline")}
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
                {t("hero.title")}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90">
                <Link to="/auth">{t("hero.cta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">{t("hero.cta2")}</Link>
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[420px] md:h-[520px]"
          >
            <Hero3D className="relative" />
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: ChefHat, title: "Verified home chefs", body: "Every chef is identity-verified and kitchen-rated for safety and quality." },
            { icon: MapPin, title: "Live tracking", body: "Real-time delivery tracking with map-based ETAs across your city." },
            { icon: Heart, title: "Loved by neighbors", body: "Membership perks, group orders, and community-driven discovery." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
