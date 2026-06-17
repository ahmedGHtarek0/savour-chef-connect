import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Standardized page header — title, optional eyebrow + description, optional actions slot.
 * Responsive: stacks on mobile, grid on sm+ to keep action chips aligned without clipping.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:mb-8"
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            {eyebrow}
          </div>
        )}
        <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}