import { useEffect, useState } from 'react';
import WarpText from './WarpText.jsx';

export default function App() {
  const [loadedAt, setLoadedAt] = useState('—');

  useEffect(() => {
    setLoadedAt(new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date()));
  }, []);

  return (
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
  );
}
