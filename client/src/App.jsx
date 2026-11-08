import { lazy, Suspense, useEffect, useState } from 'react';

const ColorBends = lazy(() => import('./ColorBends.jsx'));
const BEND_COLORS = ['#5227FF', '#ff00f7', '#7cff67', '#ff0000'];

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();

    if (preference.addEventListener) {
      preference.addEventListener('change', syncPreference);
    } else {
      preference.addListener(syncPreference);
    }

    return () => {
      if (preference.removeEventListener) {
        preference.removeEventListener('change', syncPreference);
      } else {
        preference.removeListener(syncPreference);
      }
    };
  }, []);

  return (
    <div className="site-shell" aria-hidden="true">
      {!reducedMotion && (
        <div className="color-bends-background">
          <Suspense fallback={null}>
            <ColorBends
              className="site-color-bends"
              colors={BEND_COLORS}
              rotation={255}
              speed={0.75}
              scale={0.5}
              frequency={1}
              warpStrength={1}
              mouseInfluence={0.2}
              noise={0.15}
              parallax={1}
              iterations={1}
              intensity={1.5}
              bandWidth={6}
              transparent
              autoRotate={0.55}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
