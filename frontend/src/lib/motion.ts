const easeOut = [0.22, 1, 0.36, 1] as const;

export const pageMotion = {
  initial: { opacity: 0, y: 14, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(2px)' },
  transition: { duration: 0.32, ease: easeOut },
};

export const panelMotion = {
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.38, ease: easeOut },
};

export const modalBackdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: easeOut },
};

export const modalPanelMotion = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 14, scale: 0.98 },
  transition: { duration: 0.24, ease: easeOut },
};

export const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

export const cardMotion = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: easeOut },
  },
};

export const itemMotion = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: easeOut },
  },
};

export const interactiveCardMotion = {
  whileHover: {
    y: -6,
    scale: 1.01,
    transition: { duration: 0.2, ease: easeOut },
  },
  whileTap: { scale: 0.99 },
};

export const subtleButtonMotion = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
};
