# Countdown Deployment Runbook

This runbook deploys the static site in this repo to:
- Host: `countdown.gaudengalea.com`
- VM: `molly`
- Web root on VM: `/srv/www/countdown/current`
- Log file for analytics: `/home/ubuntu/apps/caddy/data/access-countdown.log`

## 1) One-time DNS and Cloudflare setup
1. In Cloudflare DNS, create:
- Type: `A`
- Name: `countdown`
- IPv4: `84.8.249.247`
- Proxy status: `Proxied`
2. In Cloudflare SSL/TLS mode, set `Full (strict)`.

## 2) One-time Caddy setup on `molly`
Run on `molly`:

```bash
set -euo pipefail

mkdir -p /srv/www/countdown/releases
cp /path/to/countdown/ops/caddy/countdown.caddy.snippet /home/ubuntu/apps/caddy/sites/countdown.caddy.snippet

grep -q "import /etc/caddy/countdown.caddy.snippet" /home/ubuntu/apps/caddy/sites/Caddyfile \
  || echo "import /etc/caddy/countdown.caddy.snippet" >> /home/ubuntu/apps/caddy/sites/Caddyfile

docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Notes:
- Replace `/path/to/countdown` with the checkout path on `molly`.
- This host is intentionally public (no Cloudflare Access policy required).

## 3) GitHub Actions self-hosted runner on `molly`
A self-hosted runner on `molly` is required because deployment writes directly to `/srv/www/countdown`.

Runner requirements:
- Label includes `self-hosted` (workflow uses `runs-on: self-hosted`)
- Runner user can write to `/srv/www/countdown`
- Runner user can execute `bash`, `rsync`, `ln`, `mv`

Recommended permissions:

```bash
sudo mkdir -p /srv/www/countdown/releases
sudo chown -R ubuntu:ubuntu /srv/www/countdown
sudo chmod -R u=rwX,go=rX /srv/www/countdown
```

## 4) Deploy behavior (automatic)
Workflow file: `.github/workflows/deploy-countdown.yml`

Trigger:
- Every push to `main`

Release strategy:
- Creates `/srv/www/countdown/releases/<git-sha>`
- Updates symlink `/srv/www/countdown/current`
- Keeps latest 10 releases (configurable via `KEEP_RELEASES`)

Rollback:

```bash
cd /srv/www/countdown
ls -1dt releases/*
ln -sfn /srv/www/countdown/releases/<older-release-id> current
```

## 5) GoAccess onboarding for countdown
Use your existing GoAccess infra at `/srv/ops/goaccess`.

Option A (preferred helper):

```bash
cd /srv/ops/goaccess
./bin/add-site.sh \
  --site-id countdown \
  --source-host countdown.gaudengalea.com \
  --log-file /home/ubuntu/apps/caddy/data/access-countdown.log \
  --container-name countdown-goaccess \
  --internal-port 7892 \
  --enabled true
./bin/validate-sites.sh ./goaccess-sites.yaml
./bin/reconcile-goaccess.sh
cp caddy/webstats.caddy.snippet /home/ubuntu/apps/caddy/sites/webstats.caddy.snippet
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Option B:
- Use template entry in `ops/goaccess/countdown-site.yaml` and merge manually into `goaccess-sites.yaml`.

## 6) Post-deploy verification
1. `https://countdown.gaudengalea.com` returns `200`.
2. `index.html` is served from `/srv/www/countdown/current`.
3. `tail -f /home/ubuntu/apps/caddy/data/access-countdown.log` shows requests.
4. `https://webstats.gaudengalea.com/countdown` renders after GoAccess reconcile.
5. New pushes to `main` produce new release directories.
