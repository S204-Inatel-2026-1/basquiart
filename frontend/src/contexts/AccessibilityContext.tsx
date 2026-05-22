import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FontSize = 'normal' | 'large' | 'xl';

interface AccessibilityState {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  setFontSize: (v: FontSize) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
}

const defaults: AccessibilityState = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  ...defaults,
  setFontSize: () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

const load = (): AccessibilityState => {
  try {
    const saved = localStorage.getItem('basquiart_a11y');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
};

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AccessibilityState>(load);

  const update = (patch: Partial<AccessibilityState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('basquiart_a11y', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-font-size', state.fontSize);
    el.setAttribute('data-contrast', state.highContrast ? 'high' : 'normal');
    el.setAttribute('data-reduce-motion', String(state.reduceMotion));
  }, [state]);

  return (
    <AccessibilityContext.Provider value={{
      ...state,
      setFontSize: (v) => update({ fontSize: v }),
      setHighContrast: (v) => update({ highContrast: v }),
      setReduceMotion: (v) => update({ reduceMotion: v }),
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
