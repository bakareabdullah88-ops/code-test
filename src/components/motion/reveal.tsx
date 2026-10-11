import type { ReactNode } from 'react';
import { motion } from 'motion/react';

/** Fades and lifts content into place the first time it scrolls into view. Honours reduced motion through MotionConfig. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ type: 'spring', stiffness: 220, damping: 26, delay }}>
      {children}
    </motion.div>
  );
}
