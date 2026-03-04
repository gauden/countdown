# TODO

## Completed: README URL Guidance
- [x] Define README sections for running the app and shareable URLs.
- [x] Keep instructions aligned with static, no-build architecture.
- [x] Update README with local run instructions.
- [x] Add shareable URL generation and query parameter guidance.
- [x] Review instructions for clarity and correctness against current codebase.

## Phase 1: Deployment Planning
- [x] Confirm production host path on `molly` (`/srv/www/countdown`).
- [x] Confirm Cloudflare strategy (proxied DNS + Full strict SSL + public access).
- [x] Confirm GitHub deployment mode (self-hosted runner on `molly`).
- [x] Document deployment and rollback flow in repository guides.

## Phase 2: Deployment Implementation
- [x] Add GitHub Actions workflow for deploy-on-main using self-hosted runner.
- [x] Add idempotent deploy script with release directories and `current` symlink.
- [x] Add Caddy site snippet for `countdown.gaudengalea.com` with dedicated JSON logs.
- [x] Add GoAccess onboarding artifact for `site_id: countdown`.

## Phase 3: Verification
- [x] Validate deploy script syntax and executable permissions.
- [x] Validate workflow YAML and trigger configuration.
- [x] Validate documentation consistency in README and `guides/`.
- [x] Provide operator checklist for DNS, Caddy import/reload, and GoAccess reconcile.
