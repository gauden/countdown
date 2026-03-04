# countdown

A tiny, static countdown app that runs entirely in the browser and can be shared through URL parameters.

## Run the app

No build step or dependencies are required.

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Serve locally (recommended)

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Create a shareable URL

The app supports a built-in generator:

1. Open the app.
2. Click `Create Your Own`.
3. Fill in title, target date/time, unit, optional note, and optional link.
4. Click `Create & Copy Link`.

The app copies the generated URL to your clipboard and navigates to it.

## URL parameters

Share links are plain query strings:

- `d`: target datetime (required for countdown display)
- `u`: unit (`seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, `years`)
- `t`: title
- `n`: note
- `l`: external URL for the "Learn More" button

Example:

```text
http://localhost:8000/?d=2026-12-31T23:59&u=days&t=New%20Year&n=Time%20left%20to%202027&l=https%3A%2F%2Fexample.com
```

If `u` is omitted, it defaults to `weeks`.
If `d` is missing, the app opens the generator UI.

## Production deployment

`main` is deployed automatically to `molly` by GitHub Actions using a self-hosted runner.

- Workflow: `.github/workflows/deploy-countdown.yml`
- Deploy script: `ops/deploy/deploy_countdown.sh`
- Caddy snippet: `ops/caddy/countdown.caddy.snippet`
- Runbook: `docs/DEPLOYMENT.md`
