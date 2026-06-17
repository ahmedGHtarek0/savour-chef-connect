import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat, Sparkles, Star, TrendingUp, Heart, Activity } from "lucide-react";
import heroVideo from "@/assets/hero-savora.mp4.asset.json";

function FloatingCard({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tx = useSpring(useTransform(mx, [-50, 50], [-15, 15]), { stiffness: 50, damping: 20 });
  const ty = useSpring(useTransform(my, [-50, 50], [-10, 10]), { stiffness: 50, damping: 20 });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-black text-white"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 100);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 100);
      }}
    >
      {/* Video layer */}
      <motion.video
        ref={videoRef}
        src={heroVideo.url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setLoaded(true)}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.08 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        style={{ x: tx, y: ty }}
      />

      {/* Cinematic overlays */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/85" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_20%_30%,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_60%)] opacity-60" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_85%_85%,color-mix(in_oklab,var(--accent)_30%,transparent),transparent_65%)] opacity-50 mix-blend-screen" />
      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:3px_3px]" />

      {/* Loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 -z-10 animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
      )}

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            AI-Powered Home Chef Marketplace
          </motion.div>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            {"Home-Cooked".split("").map((ch, i) => (
              <motion.span
                key={`a${i}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.03, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block"
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            ))}
            <br />
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.9 }}
              className="bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent"
              style={{ backgroundSize: "200% 200%" }}
            >
              Excellence Delivered
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl"
          >
            Connecting talented home chefs with food lovers through an AI-powered marketplace experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="group relative overflow-hidden bg-white px-7 py-6 text-base font-semibold text-black shadow-[0_20px_60px_-15px_rgba(255,255,255,0.5)] hover:bg-white"
            >
              <Link to="/auth">
                <span className="relative z-10 flex items-center gap-2">
                  Explore Foods
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 px-7 py-6 text-base font-semibold text-white backdrop-blur-xl hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth">
                <ChefHat className="mr-2 h-4 w-4" />
                Become a Chef
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-12 flex items-center gap-6 text-xs text-white/70"
          >
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              ))}
              <span className="ml-2">4.9 / 5 from 12k+ reviews</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              2,341 orders being prepared now
            </div>
          </motion.div>
        </motion.div>

        {/* Floating dashboard cards */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <FloatingCard delay={0.6} className="absolute right-[8%] top-[18%] w-64">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-white/60">Live Orders</p>
                <p className="text-xl font-bold">2,341</p>
              </div>
              <div className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">+12%</div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1.1} className="absolute right-[4%] top-[44%] w-72">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60">AI Recommendation</p>
                <p className="truncate text-sm font-semibold">Chef Lina's Truffle Risotto</p>
                <p className="mt-1 text-[11px] text-white/60">98% match · 18 min away</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={1.6} className="absolute right-[14%] top-[70%] w-60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-600">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-white/60">Satisfaction</p>
                <p className="text-xl font-bold">98.4%</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.9} className="absolute left-[2%] top-[58%] w-56">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-white/60">Revenue</p>
                <p className="text-xl font-bold">+34%</p>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.2em] text-white/60"
      >
        Scroll to explore
      </motion.div>
    </section>
  );
}