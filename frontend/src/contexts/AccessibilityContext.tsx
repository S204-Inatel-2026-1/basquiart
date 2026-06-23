import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

export type FontSize = 'normal' | 'large' | 'xl';
export type LetterSpacing = 'normal' | 'wide';
export type LineSpacing = 'normal' | 'relaxed';

interface AccessibilityState {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  underlineLinks: boolean;
  letterSpacing: LetterSpacing;
  lineSpacing: LineSpacing;
  grayscale: boolean;
  focusHighlight: boolean;
  largeCursor: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  setFontSize: (v: FontSize) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setDyslexiaFont: (v: boolean) => void;
  setUnderlineLinks: (v: boolean) => void;
  setLetterSpacing: (v: LetterSpacing) => void;
  setLineSpacing: (v: LineSpacing) => void;
  setGrayscale: (v: boolean) => void;
  setFocusHighlight: (v: boolean) => void;
  setLargeCursor: (v: boolean) => void;
}

const defaults: AccessibilityState = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  dyslexiaFont: false,
  underlineLinks: false,
  letterSpacing: 'normal',
  lineSpacing: 'normal',
  grayscale: false,
  focusHighlight: false,
  largeCursor: false,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  ...defaults,
  setFontSize: () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
  setDyslexiaFont: () => {},
  setUnderlineLinks: () => {},
  setLetterSpacing: () => {},
  setLineSpacing: () => {},
  setGrayscale: () => {},
  setFocusHighlight: () => {},
  setLargeCursor: () => {},
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
    el.setAttribute('data-dyslexia-font', String(state.dyslexiaFont));
    el.setAttribute('data-underline-links', String(state.underlineLinks));
    el.setAttribute('data-letter-spacing', state.letterSpacing);
    el.setAttribute('data-line-spacing', state.lineSpacing);
    el.setAttribute('data-grayscale', String(state.grayscale));
    el.setAttribute('data-focus-highlight', String(state.focusHighlight));
    el.setAttribute('data-large-cursor', String(state.largeCursor));
  }, [state]);

  return (
    <AccessibilityContext.Provider value={{
      ...state,
      setFontSize: (v) => update({ fontSize: v }),
      setHighContrast: (v) => update({ highContrast: v }),
      setReduceMotion: (v) => update({ reduceMotion: v }),
      setDyslexiaFont: (v) => update({ dyslexiaFont: v }),
      setUnderlineLinks: (v) => update({ underlineLinks: v }),
      setLetterSpacing: (v) => update({ letterSpacing: v }),
      setLineSpacing: (v) => update({ lineSpacing: v }),
      setGrayscale: (v) => update({ grayscale: v }),
      setFocusHighlight: (v) => update({ focusHighlight: v }),
      setLargeCursor: (v) => update({ largeCursor: v }),
    }}>
      <MotionConfig reducedMotion={state.reduceMotion ? 'always' : 'never'}>
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
};
