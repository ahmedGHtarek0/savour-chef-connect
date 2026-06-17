import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { FeaturedChefs } from "@/components/FeaturedChefs";
import { Button } from "@/components/ui/button";
import { HeroVideo } from "@/components/HeroVideo";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  Brain, Sparkles, ShieldCheck, MapPin, Clock, Heart, Star, Quote,
  Utensils, ChefHat, Zap, TrendingUp, Check, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Savora — Home-Cooked Excellence Delivered" },
      { name: "description", content: "AI-powered marketplace connecting talented home chefs with food lovers. Discover, order, and savor authentic homemade meals." },
      { property: "og:title", content: "Savora — Home-Cooked Excellence Delivered" },
      { property: "og:description", content: "AI-powered marketplace connecting talented home chefs with food lovers." },
    ],
  }),
  component: Index,
});

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroVideo />

      {/* AI features */}
      <section className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="container relative mx-auto px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Brain className="h-3.5 w-3.5 text-primary" /> AI-Powered
            </span>
            <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Intelligence in every bite</h2>
            <p className="mt-4 text-lg text-muted-foreground">Our AI engine learns what you love, matches you with the right chef, and predicts the perfect meal — every single time.</p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Smart recommendations", body: "Personalized suggestions powered by taste embeddings and your order history." },
              { icon: Zap, title: "Demand forecasting", body: "Chefs get AI insights on what to cook, when, and how much — zero waste." },
              { icon: ShieldCheck, title: "Trust & safety AI", body: "Automated ID verification, kitchen health checks, and fraud detection." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition"
              >
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-2xl transition group-hover:scale-150" />
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[var(--shadow-elegant)]">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Savora */}
      <section className="border-y border-border/50 bg-card/40 py-28">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="grid items-end gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Why Savora</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">A marketplace built for taste — and for trust.</h2>
            </div>
            <p className="text-muted-foreground md:text-lg">From discovery to delivery, every detail is engineered to feel effortless, premium, and human.</p>
          </motion.div>

          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ChefHat, title: "Verified chefs", body: "Multi-step identity, kitchen, and health verification." },
              { icon: MapPin, title: "Live tracking", body: "Real-time map-based ETAs across your city." },
              { icon: Clock, title: "Fresh-to-order", body: "Cooked when you tap. Never frozen, never resold." },
              { icon: Heart, title: "Loved by locals", body: "12k+ reviews and a 98.4% satisfaction rate." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-3xl border border-border bg-background p-6 transition hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured chefs */}
      <FeaturedChefs />

      {/* Stats */}
      <section className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_70%)]" />
        <div className="container relative mx-auto px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">A marketplace at scale</h2>
            <p className="mt-4 text-muted-foreground">Real numbers. Real chefs. Real food.</p>
          </motion.div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active chefs", to: 4280, suffix: "+" },
              { label: "Orders delivered", to: 1240000, suffix: "+" },
              { label: "Satisfaction", to: 98.4, suffix: "%", decimals: 1 },
              { label: "Revenue paid to chefs", prefix: "$", to: 18.6, suffix: "M+", decimals: 1 },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="rounded-3xl border border-border bg-card p-8 text-center"
              >
                <div className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                  <AnimatedCounter to={s.to} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/50 bg-card/40 py-28">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Loved worldwide</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Stories from our table</h2>
          </motion.div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { name: "Amélie R.", role: "Customer · Paris", body: "It feels like a friend cooked dinner. The AI picks dishes I never would have tried — and I love them every time." },
              { name: "Chef Marco", role: "Home chef · Milan", body: "Savora pays better than any restaurant I've worked in, and the demand forecasting tool changed my whole week." },
              { name: "Priya S.", role: "Customer · London", body: "The packaging, tracking, taste — it all feels designed by someone who genuinely cares. Unreal." },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="relative rounded-3xl border border-border bg-background/80 p-8 backdrop-blur-xl"
              >
                <Quote className="h-8 w-8 text-primary/40" />
                <p className="mt-4 text-base leading-relaxed">{t.body}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-primary-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Membership</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Eat more. Pay less. Live better.</h2>
          </motion.div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { name: "Taste", price: "$0", period: "/forever", features: ["Browse all chefs", "Standard delivery", "Community reviews"], cta: "Start free" },
              { name: "Gourmet", price: "$12", period: "/mo", featured: true, features: ["Free delivery on orders $25+", "Priority AI matching", "Early access to new chefs", "5% loyalty cashback"], cta: "Go Gourmet" },
              { name: "Connoisseur", price: "$29", period: "/mo", features: ["Everything in Gourmet", "Personal taste concierge", "Exclusive chef events", "10% loyalty cashback"], cta: "Become a Connoisseur" },
            ].map((p, i) => (
              <motion.div
                key={p.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className={`relative rounded-3xl border p-8 transition ${p.featured ? "border-primary/60 bg-gradient-to-b from-primary/10 to-card shadow-[var(--shadow-elegant)] md:-translate-y-3" : "border-border bg-card hover:border-primary/30"}`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">Most popular</span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`mt-8 w-full ${p.featured ? "bg-gradient-to-r from-primary to-accent text-primary-foreground" : ""}`} variant={p.featured ? "default" : "outline"}>
                  <Link to="/auth">{p.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-28">
        <div className="container mx-auto px-4">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-12 text-center text-white md:p-20"
          >
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_50%,transparent),transparent_70%)] opacity-60" />
            <motion.div
              animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
              transition={{ duration: 12, repeat: Infinity }}
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 20% 30%, color-mix(in oklab, var(--accent) 60%, transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in oklab, var(--primary) 60%, transparent), transparent 40%)", backgroundSize: "200% 200%" }}
            />
            <div className="relative">
              <Utensils className="mx-auto h-10 w-10 text-amber-300" />
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Your next favorite meal<br />is being plated.</h2>
              <p className="mx-auto mt-6 max-w-xl text-white/70 md:text-lg">Join thousands discovering authentic, AI-curated home cooking from world-class chefs in their neighborhood.</p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-white px-8 py-6 text-base font-semibold text-black hover:bg-white/90">
                  <Link to="/auth">Explore Foods <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 px-8 py-6 text-base font-semibold text-white backdrop-blur hover:bg-white/10 hover:text-white">
                  <Link to="/auth"><ChefHat className="mr-2 h-4 w-4" /> Become a Chef</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
