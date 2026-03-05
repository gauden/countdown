# countdown

A tiny, static countdown app built with Next.js static export. It runs entirely in the browser and can be shared through URL parameters.

## Run the app

Install dependencies once:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Open `http://localhost:3000`.

Create a static production export:

```bash
npm run build
```

Exported static files are generated in `out/`.

## Create a shareable URL

The app supports a built-in generator:

1. Open the app.
2. Fill in title, target date/time, and unit.
3. Click `Apply`.
4. Click `Copy link`.

The app copies the generated URL to your clipboard.

## URL parameters

Share links are plain query strings:

- `v`: URL schema version (`1` for new links)
- `date`: target datetime (required for countdown display)
- `unit`: `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, or `years`
- `title`: countdown title
- `note`: optional note text
- `link`: optional external URL

Example:

```text
http://localhost:3000/?v=1&title=New%20Year&date=2026-12-31T23:59&unit=days&note=Time%20left&link=https%3A%2F%2Fexample.com
```

If `unit` is omitted, it defaults to `weeks`.
If `date` is missing, the page shows a prompt to set one.

Legacy compatibility:
- If `v=1` is absent, legacy params are mapped automatically:
  - `d -> date`
  - `u -> unit`
  - `t -> title`
  - `n -> note`
  - `l -> link`

## Production deployment

`main` is deployed automatically to `molly` by GitHub Actions using a self-hosted runner.

- Workflow: `.github/workflows/deploy-countdown.yml`
- Deploy script: `ops/deploy/deploy_countdown.sh`
- Caddy snippet: `ops/caddy/countdown.caddy.snippet`
- Runbook: `docs/DEPLOYMENT.md`
