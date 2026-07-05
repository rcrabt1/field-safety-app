## Dashboard data

The Safety Manager dashboard reads a static, pre-generated dataset from
`public/data/observations.json` instead of querying Supabase. That file is
produced by `scripts/generate-demo-dashboard-data.mjs`, which bakes in a
fixed 182-day window ending at a hardcoded date and a deliberate storyline
(one crew's safety trend worsening over time, one PPE item dropping below
target). Re-run that script and commit the output if the dataset ever needs
to change. This keeps the dashboard fast, free of any database dependency,
and identical no matter when someone loads it.

## Supabase keep-alive

The observation form (`/observe`) still submits live to Supabase, so the
free-tier project needs to stay awake for that to succeed. It auto-pauses
after a period of inactivity, so `.github/workflows/supabase-keepalive.yml`
runs every 3 days (`cron: '0 12 */3 * *'`, also triggerable manually via
`workflow_dispatch`) and issues a trivial `select id from observations
limit 1` against the REST API purely to keep the project active. This no
longer affects the dashboard, which doesn't touch Supabase at all.

It reads two repo secrets, `SUPABASE_URL` and `SUPABASE_ANON_KEY` (same
values as `.env`), which must be set once via:

```
gh secret set SUPABASE_URL --repo rcrabt1/field-safety-app --body "https://ihqyhozhgnzbxbgopgea.supabase.co"
gh secret set SUPABASE_ANON_KEY --repo rcrabt1/field-safety-app --body "<anon key from .env>"
```

If a form submission fails because the project is paused, `ObservationForm.jsx`
shows the submission error rather than crashing.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
