import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Delays mounting until after hydration. Some shaders error on slower devices
 * when their uniform images aren't fully loaded yet, so give them a moment.
 */
export function useMounted(delay = 400) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return mounted;
}

export function useInView<T extends Element>(rootMargin = "200px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {
        rootMargin,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}

/**
 * Absolutely positioned container that only mounts its shader while on screen,
 * keeping the number of live WebGL contexts (and GPU work) low.
 */
export function ShaderLayer({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const mounted = useMounted();

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={style}
    >
      {mounted && inView && (
        <div className="absolute inset-0 animate-fd-fade-in duration-1000">
          {children}
        </div>
      )}
    </div>
  );
}
