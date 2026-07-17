/**
 * useScrollAnimation — IntersectionObserver hook for scroll-triggered animations
 * Adds "visible" class when element enters viewport
 */
import { useEffect, useRef } from "react";

export function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Unobserve after animation to avoid re-triggering
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );

    // Observe the element and all children with animation classes
    const animatedElements = element.querySelectorAll(
      ".scale-reveal, .slide-in-left, .slide-in-right, .fade-up"
    );
    animatedElements.forEach((el) => observer.observe(el));

    // Also observe the root element itself if it has an animation class
    if (
      element.classList.contains("scale-reveal") ||
      element.classList.contains("slide-in-left") ||
      element.classList.contains("slide-in-right") ||
      element.classList.contains("fade-up")
    ) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * useParallax — Simple parallax scroll effect
 */
export function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const scrolled = window.innerHeight - rect.top;
          element.style.transform = `translateY(${scrolled * speed}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return ref;
}

/**
 * useMouseGlow — Mouse-following glow effect on hover
 */
export function useMouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      element.style.setProperty("--mouse-x", `${x}px`);
      element.style.setProperty("--mouse-y", `${y}px`);
    };

    element.addEventListener("mousemove", handleMouseMove);
    return () => element.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return ref;
}
