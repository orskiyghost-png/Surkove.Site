import { lazy, Suspense } from 'react';
import Threads from './Threads.jsx';

const RotatingText = lazy(() => import('./RotatingText.jsx'));
const DESCRIPTIONS = ['сервисы', 'товары', 'услуги', 'подписки', 'инструменты'];

export default function App() {
  return (
    <div className="site-shell">
      <div className="threads-background" aria-hidden="true">
        <Threads
          color="#52525b"
          lineCount={90}
          thickness={0.6}
          softness={1.3}
          amplitude={1.7}
          distance={0.4}
          waves={1.05}
          speed={0.6}
          split={0.04}
          fray={0.5}
          angle={25}
          taper={0.85}
          brightness={1.4}
          parting={0}
          enableMouseInteraction={false}
          fade={0}
          opacity={1}
        />
      </div>
      <main className="hero-layout">
        <h1 className="hero-lockup">
          <span className="brand-name">Surkove</span>
          <span className="brand-separator" aria-hidden="true">—</span>
          <Suspense fallback={<span className="rotating-fallback">сервисы</span>}>
            <RotatingText
              texts={DESCRIPTIONS}
              effect="blur"
              direction="down"
              highlight={false}
              staggerFrom="center"
              staggerDuration={0.03}
              splitLevelClassName="rotating-word-mask"
              rotationInterval={2400}
              blur={12}
              mainClassName="rotating-word"
            />
          </Suspense>
        </h1>
      </main>
    </div>
  );
}
