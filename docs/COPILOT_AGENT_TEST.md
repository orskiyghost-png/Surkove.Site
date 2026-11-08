# Copilot Agent Smoke Test

## Architecture

Surkove.Site is a static, single-page frontend application. Vite uses `client/` as its application root and the React plugin to build the UI. The production build writes to `dist/`; `scripts/copy-build.mjs` then copies the generated entry point and assets into the repository root for static hosting.

## Technologies

- React 19.3.1 and React DOM 19.3.1
- Vite 8.3.6 with `@vitejs/plugin-react` 6.2.1
- Motion 14.10.1 (`motion/react`)
- `@fontsource-variable/manrope`
- JavaScript ES modules and CSS
- WebGL 2 effects in `Threads.jsx` and `SpecularButton.jsx`

## Application Entry Points

- `client/index.html` provides the `#root` mount element and loads `/src/main.jsx`.
- `client/src/main.jsx` creates the React root, imports global styles, and renders `App` in `React.StrictMode`.
- `client/src/App.jsx` composes the landing page and lazy-loads the `Threads` background component.

## Frontend Structure

- `client/src/App.jsx`: page composition and registration-dialog state.
- `client/src/RegistrationDialog.jsx`: registration/login dialog and client-side form feedback.
- `client/src/RotatingText.jsx` and `RotatingText.css`: animated rotating text.
- `client/src/SpecularButton.jsx` and `SpecularButton.css`: WebGL 2 specular button effect.
- `client/src/GradientText.jsx` and `GradientText.css`: gradient wordmark text.
- `client/src/Threads.jsx` and `Threads.css`: WebGL 2 animated background.
- `client/src/style.css`: global and page styles.

## Production Build

Command: `npm run build` (runs `vite build --config vite.config.js` followed by `node scripts/copy-build.mjs`).

Result: `npm ci` completed successfully, installing 27 packages; npm reported 0 vulnerabilities. `npm run build` succeeded with Vite 8.3.6, transforming 451 modules and producing 8 files in `dist/`. The build also copied the generated static entry point and assets into the repository root in the isolated test copy. The test used an isolated copy of the clean `main` commit because the copy script overwrites the root `index.html` and generated `assets/surkove-*` files. No site source or generated hosting files in this checkout were changed by the build test.

## Cloud Environment Limitations

This smoke test ran in the agent's cloud workspace at `/workspaces/surkove-site`; it is separate from the user's already-running Codespace. The test did not inspect that other Codespace's filesystem or processes, verify OpenCode on port 4096 there, or test Safari on an iPhone. No production deployment was run.
