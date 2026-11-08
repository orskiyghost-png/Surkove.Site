import { useCallback, useEffect, useRef, useState } from 'react';
import SpecularButton from './SpecularButton.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { email: '', password: '', confirmation: '' };
const BUTTON_STYLE = {
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.8 4.2 10 7-.4 1-1.2 2.2-2.4 3.4M6.2 6.3C3.9 7.8 2.5 10 2 12c1.2 2.8 5 7 10 7 1.1 0 2.1-.2 3-.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function RegistrationDialog({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const emailInputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      setMode('register');
      setForm(EMPTY_FORM);
      setShowPassword(false);
      setFeedback(null);
      return undefined;
    }

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => emailInputRef.current?.focus({ preventScroll: true }));

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      ).filter(element => !element.hasAttribute('hidden') && element.getClientRects().length > 0);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused instanceof HTMLElement) {
        window.requestAnimationFrame(() => previouslyFocused.focus({ preventScroll: true }));
      }
    };
  }, [isOpen]);

  const updateField = useCallback((name, value) => {
    setForm(previous => ({ ...previous, [name]: value }));
    setFeedback(null);
  }, []);

  const switchMode = useCallback(() => {
    setMode(previous => (previous === 'register' ? 'login' : 'register'));
    setForm(previous => ({ ...previous, password: '', confirmation: '' }));
    setShowPassword(false);
    setFeedback(null);
  }, []);

  const handleSubmit = event => {
    event.preventDefault();
    const email = form.email.trim();
    if (!email) {
      setFeedback({ type: 'error', text: 'Укажи электронную почту.' });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setFeedback({ type: 'error', text: 'Проверь формат электронной почты.' });
      return;
    }
    if (!form.password) {
      setFeedback({ type: 'error', text: 'Укажи пароль.' });
      return;
    }
    if (mode === 'register' && !form.confirmation) {
      setFeedback({ type: 'error', text: 'Повтори пароль.' });
      return;
    }
    if (mode === 'register' && form.password !== form.confirmation) {
      setFeedback({ type: 'error', text: 'Пароли не совпадают.' });
      return;
    }

    setFeedback({
      type: 'status',
      text: mode === 'register' ? 'Регистрация пока находится в разработке.' : 'Вход пока находится в разработке.'
    });
  };

  if (!isOpen) return null;

  const isRegister = mode === 'register';
  const closeFromBackdrop = event => {
    if (event.target === event.currentTarget) onClose?.();
  };

  return (
    <div className="dialog-backdrop" onPointerDown={closeFromBackdrop}>
      <section
        ref={dialogRef}
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        aria-describedby="auth-description"
        tabIndex={-1}
      >
        <button
          className="auth-dialog__close"
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          <CloseIcon />
        </button>

        <header className="auth-dialog__header">
          <h2 className="auth-dialog__title" id="auth-title">{isRegister ? 'Создать аккаунт' : 'Войти'}</h2>
          <p className="auth-dialog__description" id="auth-description">
            {isRegister ? 'Зарегистрируйся, чтобы пользоваться цифровыми товарами и услугами Surkove.' : 'Войди в аккаунт Surkove.'}
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field" htmlFor="auth-email">
            <span>Электронная почта</span>
            <input
              ref={emailInputRef}
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              value={form.email}
              onChange={event => updateField('email', event.target.value)}
              aria-describedby={feedback?.type === 'error' ? 'auth-feedback' : undefined}
            />
          </label>

          <div className="auth-field">
            <label htmlFor="auth-password">Пароль</label>
            <span className="auth-password-wrap">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                placeholder="Введи пароль"
                value={form.password}
                onChange={event => updateField('password', event.target.value)}
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setShowPassword(visible => !visible)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={showPassword}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </span>
          </div>

          {isRegister && (
            <label className="auth-field" htmlFor="auth-confirmation">
              <span>Повторите пароль</span>
              <input
                id="auth-confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Повтори пароль"
                value={form.confirmation}
                onChange={event => updateField('confirmation', event.target.value)}
              />
            </label>
          )}

          <SpecularButton {...BUTTON_STYLE} size="md" type="submit" className="auth-submit">
            {isRegister ? 'Создать аккаунт' : 'Войти'}
          </SpecularButton>

          {feedback && (
            <p
              className={`auth-feedback auth-feedback--${feedback.type}`}
              id="auth-feedback"
              role={feedback.type === 'error' ? 'alert' : 'status'}
            >
              {feedback.text}
            </p>
          )}
        </form>

        <p className="auth-switch">
          {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <button className="auth-switch__button" type="button" onClick={switchMode}>
            {isRegister ? 'Войти' : 'Создать аккаунт'}
          </button>
        </p>
      </section>
    </div>
  );
}
