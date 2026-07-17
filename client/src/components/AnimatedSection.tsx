/**
 * AnimatedSection — Wrapper for scroll-triggered reveal animations
 * Supports: scale-reveal, slide-in-left, slide-in-right, fade-up
 * Uses IntersectionObserver via useScrollAnimation hook
 */
import { motion } from "framer-motion";

type AnimationType = "fade-up" | "slide-in-left" | "slide-in-right" | "scale-reveal";

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

export default function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
  threshold = 0.1,
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: animation === "fade-up" ? 24 : 0,
        x:
          animation === "slide-in-left"
            ? -30
            : animation === "slide-in-right"
              ? 30
              : 0,
        scale: animation === "scale-reveal" ? 0.95 : 1,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggeredContainer — Wrapper for staggered children animations
 */
export function StaggeredContainer({
  children,
  staggerDelay = 80,
  className = "",
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      <motion.div
        variants={{
          visible: {
            transition: {
              staggerChildren: staggerDelay / 1000,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * StaggeredItem — Individual item inside StaggeredContainer
 */
export function StaggeredItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
