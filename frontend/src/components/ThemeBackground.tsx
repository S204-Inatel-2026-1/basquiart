import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const themes = {
  dark: {
    src: '/theme-dark.jpg',
    opacity: 0.55,
    blend: 'luminosity' as const,
  },
  beige: {
    src: '/theme-beige.jpg',
    opacity: 0.22,
    blend: 'multiply' as const,
  },
  white: {
    src: '/theme-white.jpg',
    opacity: 0.45,
    blend: 'multiply' as const,
  },
};

const PARALLAX_SPEED = 0.35;

export const ThemeBackground = () => {
  const { theme } = useTheme();
  const cfg = themes[theme];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const offset = window.scrollY * PARALLAX_SPEED;
      ref.current.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        ref={ref}
        style={{
          position: 'absolute',
          inset: '-30% 0',
          backgroundImage: `url(${cfg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: cfg.opacity,
          mixBlendMode: cfg.blend,
          willChange: 'transform',
        }}
      />
    </div>
  );
};
