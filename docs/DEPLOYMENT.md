# Countdown Deployment Runbook

This runbook deploys the static site in this repo to:
- Host: `countdown.gaudengalea.com`
- VM: `molly`
- Web root on VM: `/srv/www/countdown/current`
- Log file for analytics: `/home/ubuntu/apps/caddy/data/access-countdown.log`
- Caddy in-container log path: `/data/access-countdown.log`

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
mkdir -p /home/ubuntu/repos
cd /home/ubuntu/repos

if [ -d countdown/.git ]; then
  cd countdown && git pull --ff-only
else
  git clone https://github.com/gauden/countdown.git
  cd countdown
fi

cp ops/caddy/countdown.caddy.snippet /home/ubuntu/apps/caddy/sites/countdown.caddy.snippet

grep -q "import /etc/caddy/countdown.caddy.snippet" /home/ubuntu/apps/caddy/sites/Caddyfile \
  || echo "import /etc/caddy/countdown.caddy.snippet" >> /home/ubuntu/apps/caddy/sites/Caddyfile

# Required bind mount so Caddy container can serve /srv/www/countdown/current.
# Ensure your caddy service has:
#   - /srv/www/countdown:/srv/www/countdown:ro
# Then recreate caddy:
cd /home/ubuntu/apps/caddy
docker compose up -d caddy

docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Notes:
- This host is intentionally public (no Cloudflare Access policy required).
- Do not use the ephemeral GitHub runner workspace (`~/actions-runner/_work/...`) as your ops source path.

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

Install runner as a persistent service (recommended after first successful run):

```bash
cd ~/actions-runner
sudo ./svc.sh install ubuntu
sudo ./svc.sh start
sudo ./svc.sh status
```

## 4) Deploy behavior (automatic)
Workflow file: `.github/workflows/deploy-countdown.yml`

Trigger:
- Every push to `main`

Release strategy:
- Creates `/srv/www/countdown/releases/<timestamp>-<git-sha12>`
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

If add-site fails because log file is missing:

```bash
curl -k -sS --resolve countdown.gaudengalea.com:443:127.0.0.1 "https://countdown.gaudengalea.com/" > /dev/null
ls -l /home/ubuntu/apps/caddy/data/access-countdown.log
```

If log file exists but is unreadable for your user or GoAccess tooling:

```bash
sudo chmod 644 /home/ubuntu/apps/caddy/data/access-countdown.log
```

Option B:
- Use template entry in `ops/goaccess/countdown-site.yaml` and merge manually into `goaccess-sites.yaml`.

## 6) Post-deploy verification
1. Local origin check (bypass DNS): `curl -k -I --resolve countdown.gaudengalea.com:443:127.0.0.1 https://countdown.gaudengalea.com` returns `200`.
2. Cloudflare edge check: `curl -I --resolve countdown.gaudengalea.com:443:<cloudflare_edge_ip> https://countdown.gaudengalea.com` returns `200`.
3. DNS check: `dig +short countdown.gaudengalea.com @1.1.1.1` returns Cloudflare edge IP(s).
4. `index.html` is served from `/srv/www/countdown/current`.
5. `tail -f /home/ubuntu/apps/caddy/data/access-countdown.log` shows requests.
6. `https://webstats.gaudengalea.com/countdown` redirects to login (expected with Cloudflare Access) or renders after auth.
7. New pushes to `main` produce new release directories.
