import { motion } from "framer-motion";

/** Polished full-screen loader with animated chef-hat dots. */
export function AppLoader({ label = "Preparing your kitchen…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-20 w-20">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border-4 border-accent/20 border-b-accent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-0 flex items-center justify-center text-2xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            👨‍🍳
          </motion.span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}