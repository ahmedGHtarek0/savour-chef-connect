import { motion } from "framer-motion";
import heroVideo from "@/assets/hero-cooking.mp4.asset.json";

/**
 * HeroVideo — replaces the previous 3D hero with a real cooking video
 * and floating food emojis for a richer landing experience.
 * Component is still exported as `Hero3D` for compatibility.
 */
export function Hero3D({ className }: { className?: string }) {
  const floaters = [
    { emoji: "🍅", x: "5%", y: "10%", delay: 0 },
    { emoji: "🌿", x: "85%", y: "8%", delay: 0.4 },
    { emoji: "🥖", x: "78%", y: "78%", delay: 0.8 },
    { emoji: "🧄", x: "8%", y: "75%", delay: 1.2 },
    { emoji: "🌶️", x: "92%", y: "45%", delay: 1.6 },
    { emoji: "🥕", x: "2%", y: "45%", delay: 2.0 },
  ];
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-3xl shadow-[var(--shadow-elegant)] ${className ?? ""}`}>
      <video
        src={heroVideo.url}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-primary/15" />
      {floaters.map((f) => (
        <motion.span
          key={f.emoji + f.x}
          className="pointer-events-none absolute text-3xl drop-shadow-lg sm:text-4xl"
          style={{ left: f.x, top: f.y }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: [0, -14, 0, 14, 0],
            opacity: 1,
            rotate: [0, 8, -6, 4, 0],
          }}
          transition={{
            delay: f.delay,
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {f.emoji}
        </motion.span>
      ))}
    </div>
  );
}