## No backend

This app has no database and no server. Both experiences run entirely
client-side:

- The Safety Manager dashboard reads a static, pre-generated dataset from
  `public/data/observations.json`. That file is produced by
  `scripts/generate-demo-dashboard-data.mjs`, which bakes in a fixed
  182-day window ending at a hardcoded date and a deliberate storyline
  (one crew's safety trend worsening over time, one PPE item dropping
  below target). Re-run that script and commit the output if the dataset
  ever needs to change.
- The Field Supervisor observation form doesn't persist anything. Submitting
  simulates a brief round trip and shows a success state, but no data is
  saved anywhere.

This used to run on Supabase (a live Postgres table the form wrote to and a
keep-alive GitHub Action to stop the free-tier project from pausing). That's
been removed since nothing in the app read from the database anymore once
the dashboard moved to a static file, so the live backend had no remaining
job worth the upkeep.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
