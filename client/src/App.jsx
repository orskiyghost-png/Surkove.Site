import { useEffect, useState } from 'react';
import Silk from './Silk.jsx';
import WarpText from './WarpText.jsx';

const DEFAULT_SILK_COLOR = '#e4e1e8';

export default function App() {
  const [loadedAt, setLoadedAt] = useState('—');
  const [silkColor, setSilkColor] = useState(DEFAULT_SILK_COLOR);

  useEffect(() => {
    const tokenColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--silk-color')
      .trim();
    if (tokenColor) setSilkColor(tokenColor);

    setLoadedAt(new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date()));
  }, []);

  return (
    <div className="page-shell">
      <div className="silk-background" aria-hidden="true">
        <Silk
          color={silkColor}
          sheenColor="#ffffff"
          speed={3.2}
          scale={1}
          rotation={0}
          sheen={0.42}
          depth={0.38}
          glow={0.12}
          noiseIntensity={0.35}
          ripple={0.8}
          wave={0.85}
          mouseInteraction={false}
          clickRipple={false}
          intro
          fade={0.22}
          lightMode
          dpr={1.5}
        />
      </div>
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
