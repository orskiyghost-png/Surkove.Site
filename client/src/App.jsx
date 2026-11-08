import { lazy, Suspense } from 'react';

const SlicedWaves = lazy(() => import('./SlicedWaves.jsx'));

export default function App() {
  return (
    <div className="site-shell" aria-hidden="true">
      <Suspense fallback={null}>
        <SlicedWaves
          className="site-sliced-waves"
          color1="#00b886"
          color2="#0098e0"
          color3="#3445ff"
          ribbons={4}
          spacing={28}
          perspective={0.45}
          blur={0.6}
          glow={1}
          position={0.78}
          mouseInteraction={false}
          spread={0.08}
          lightMode
        />
      </Suspense>
    </div>
  );
}
