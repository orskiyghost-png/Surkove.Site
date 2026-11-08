import { lazy, Suspense, useCallback, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import RotatingText from './RotatingText.jsx';
import SpecularButton from './SpecularButton.jsx';
import RegistrationDialog from './RegistrationDialog.jsx';
import GradientText from './GradientText.jsx';

const Threads = lazy(() => import('./Threads.jsx'));
const rotatingWords = ['цифровые товары', 'онлайн-услуги', 'новые решения'];

const specularButtonProps = {
  radius: 18,
  tint: '#111114',
  tintOpacity: 0.96,
  blur: 0,
  textColor: '#FFFFFF',
  lineColor: '#FFFFFF',
  baseColor: '#67676E',
  intensity: 0.85,
  idleIntensity: 0.18,
  shineSize: 9,
  shineFade: 32,
  thickness: 1,
  glow: 0.65,
  followMouse: true,
  proximity: 180,
  autoAnimate: false
};

function ArrowIcon() {
  return (
    <svg className="cta-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const openRegistration = useCallback(() => setRegistrationOpen(true), []);
  const closeRegistration = useCallback(() => setRegistrationOpen(false), []);

  return (
    <div className="site-shell" id="home">
      <div className="site-background" aria-hidden="true">
        <Suspense fallback={null}>
          <Threads
            className="site-threads"
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
        </Suspense>
      </div>

      <div className="site-content" aria-hidden={registrationOpen} inert={registrationOpen}>
        <header className="site-header">
          <span className="wordmark" aria-hidden="true">
            <GradientText
              colors={['#000000', '#ffffff']}
              animationSpeed={3}
              variant="flow"
              glow={0.4}
            >
              Surkove
            </GradientText>
          </span>
        </header>

        <main className="hero-content" aria-labelledby="hero-title">
          <h1 className="hero-title" id="hero-title">
            <span className="hero-title__rotating">
              <RotatingText
                texts={rotatingWords}
                effect="blur"
                direction="up"
                blur={12}
                rotationInterval={3000}
                staggerDuration={0.025}
                staggerFrom="center"
                splitBy="characters"
                loop={true}
                auto={!prefersReducedMotion}
                highlight={false}
                animateLayout={false}
                animatePresenceMode="wait"
                animatePresenceInitial={false}
                mainClassName="hero-rotating"
                splitLevelClassName="hero-rotating__word"
                elementLevelClassName="hero-rotating__letter"
              />
            </span>
          </h1>

          <p className="hero-description">
            Цифровые товары и услуги для работы, творчества и повседневных задач. Находи полезные инструменты, выбирай подходящие решения и открывай новые возможности вместе с Surkove.
          </p>

          <SpecularButton
            {...specularButtonProps}
            size="lg"
            type="button"
            className="hero-cta"
            onClick={openRegistration}
            aria-haspopup="dialog"
            aria-expanded={registrationOpen}
          >
            Начать <ArrowIcon />
          </SpecularButton>
        </main>
      </div>

      <RegistrationDialog isOpen={registrationOpen} onClose={closeRegistration} />
    </div>
  );
}
