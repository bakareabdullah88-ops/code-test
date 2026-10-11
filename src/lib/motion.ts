import type { Transition, Variants } from 'motion/react';

/** The one spring used for UI movement (DESIGN.md section 3.6). */
export const spring: Transition = { type: 'spring', stiffness: 300, damping: 30 };

/** Page entrance: children rise 10px and fade in, 50ms apart. Under reduced motion MotionConfig drops the transform. */
export const staggerParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
export const staggerChild: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: spring } };
