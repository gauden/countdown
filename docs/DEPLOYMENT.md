# Deployment (Project Setup, Public-Safe)

This document captures the reusable deployment pattern for this project without private infrastructure details.

## Variables
Set these values for your environment before running commands:
- `APP_ID` (example: `countdown`)
- `FQDN` (example: `countdown.example.com`)
- `REPO_URL` (this repository URL)
- `REPO_NAME` (this repository name)
- `DEPLOY_ROOT` (example: `/srv/www/${APP_ID}`)
- `CADDY_SITES_DIR` (example: `/path/to/caddy/sites`)
- `CADDY_COMPOSE_DIR` (example: `/path/to/caddy`)
- `CADDY_HOST_DATA_DIR` (example: `/path/to/caddy/data`)
- `GOACCESS_ROOT` (example: `/srv/ops/goaccess`)
- `GOACCESS_PORT` (unique internal port)

## 1) DNS and TLS
1. Create a proxied DNS record for `${FQDN}` pointing to your origin IP.
2. Use strict TLS mode at your edge provider.

## 2) Prepare deployment root on server
```bash
sudo mkdir -p "${DEPLOY_ROOT}/releases"
sudo chown -R "$USER":"$USER" "${DEPLOY_ROOT}"
sudo chmod -R u=rwX,go=rX "${DEPLOY_ROOT}"
```

## 3) Persistent repository checkout for ops tasks
```bash
mkdir -p ~/repos
cd ~/repos
if [ -d "${REPO_NAME}/.git" ]; then
  cd "${REPO_NAME}" && git pull --ff-only
else
  git clone "${REPO_URL}"
  cd "${REPO_NAME}"
fi
```

Do not use CI runner work directories for manual operations.

## 4) Caddy requirements
1. Ensure Caddy can read deployed files via bind mount:
- `${DEPLOY_ROOT}:${DEPLOY_ROOT}:ro`
2. Ensure Caddy sites directory is mounted into the container.
3. Ensure Caddy data directory is mounted to `/data` in the container.

## 5) Apply app snippet
```bash
cp "ops/caddy/${APP_ID}.caddy.snippet" "${CADDY_SITES_DIR}/${APP_ID}.caddy.snippet"

grep -q "import /etc/caddy/${APP_ID}.caddy.snippet" "${CADDY_SITES_DIR}/Caddyfile" \
  || echo "import /etc/caddy/${APP_ID}.caddy.snippet" >> "${CADDY_SITES_DIR}/Caddyfile"

cd "${CADDY_COMPOSE_DIR}"
docker compose up -d caddy
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Snippet contract:
- root: `${DEPLOY_ROOT}/current`
- log path in container: `/data/access-${APP_ID}.log`

## 6) GitHub Actions deploy contract
- Trigger: push to `main`
- Runner: self-hosted
- Script: `ops/deploy/deploy_countdown.sh`
- Deploy behavior:
  - writes `${DEPLOY_ROOT}/releases/<timestamp>-<sha12>`
  - updates `${DEPLOY_ROOT}/current` symlink
  - keeps latest N releases

## 7) GoAccess onboarding
```bash
cd "${GOACCESS_ROOT}"
./bin/add-site.sh \
  --site-id "${APP_ID}" \
  --source-host "${FQDN}" \
  --log-file "${CADDY_HOST_DATA_DIR}/access-${APP_ID}.log" \
  --container-name "${APP_ID}-goaccess" \
  --internal-port "${GOACCESS_PORT}" \
  --enabled true

./bin/validate-sites.sh ./goaccess-sites.yaml
./bin/reconcile-goaccess.sh
```

If log file is missing, seed one request first:
```bash
curl -k -sS --resolve "${FQDN}:443:127.0.0.1" "https://${FQDN}/" > /dev/null
```

If unreadable:
```bash
sudo chmod 644 "${CADDY_HOST_DATA_DIR}/access-${APP_ID}.log"
```

## 8) Verification checklist
1. Local origin test:
```bash
curl -k -I -sS --resolve "${FQDN}:443:127.0.0.1" "https://${FQDN}"
```
2. DNS publication:
```bash
dig +short "${FQDN}" @1.1.1.1
```
3. Edge test via resolved edge IP:
```bash
curl -I -sS --resolve "${FQDN}:443:<EDGE_IP>" "https://${FQDN}"
```
4. Log write check:
```bash
tail -n 1 "${CADDY_HOST_DATA_DIR}/access-${APP_ID}.log"
```
5. Analytics route check:
```bash
curl -k -I -sS --resolve "webstats.example.com:443:127.0.0.1" "https://webstats.example.com/${APP_ID}"
```

## 9) Runner persistence
Run self-hosted runners as services so deploys continue after shell logout.
