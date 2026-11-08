import { lazy, Suspense, useEffect, useState } from 'react';
import WarpText from './WarpText.jsx';

const ColorBends = lazy(() => import('./ColorBends.jsx'));
const BEND_COLORS = ['#674c92', '#4d3c63', '#8a6bb5', '#574273'];

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export default function App() {
  const [loadedAt, setLoadedAt] = useState('—');
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    setLoadedAt(new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date()));
  }, []);

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
    <div className="site-shell">
      {!reducedMotion && (
        <div className="color-bends-background" aria-hidden="true">
          <Suspense fallback={null}>
            <ColorBends
              className="site-color-bends"
              colors={BEND_COLORS}
              rotation={248}
              speed={0.28}
              scale={0.72}
              frequency={1}
              warpStrength={0.82}
              mouseInfluence={0}
              noise={0.045}
              parallax={0}
              iterations={1}
              intensity={1.15}
              bandWidth={2.3}
              transparent
              autoRotate={0.045}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>
      )}
      <main>
        <p className="brand">SURKOVE / SITE CHECK</p>
        <span className="status"><span className="dot" aria-hidden="true" />Страница загружена</span>
        <h1 className="hero-heading">
          <span className="visually-hidden">Сайт работает</span>
          <WarpText
            text="Сайт работает"
            color="currentColor"
            warpStrength={0.075}
            warpScale={1.7}
            speed={0.4}
            lens="bulge"
            pointerInfluence={0.42}
            pointerStrength={0.32}
            refraction={0.018}
            chromatic={0.2}
            idleDrift={0.16}
            ripple
            clickRipple
            intro
            fontSize="clamp(43px, 9vw, 88px)"
            fontWeight={650}
            letterSpacing="-0.065em"
            style={{ height: 'clamp(112px, 18vw, 188px)' }}
          />
        </h1>
        <p className="description">Тестовая страница успешно открылась. HTML, стили и JavaScript загружены.</p>
        <div className="details">Время проверки: <time id="loaded-at">{loadedAt}</time></div>
      </main>
    </div>
  );
}
