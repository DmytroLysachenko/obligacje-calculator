# Cloud Run Private Preview Access

The production preview service is private. Browser access must go through an authenticated Google Cloud identity that has `roles/run.invoker` on the Cloud Run service.

## Fast Local Access

Run:

```bash
pnpm gcp:proxy
```

Then open:

```text
http://localhost:8080
```

This starts:

```bash
gcloud run services proxy obligacje-calculator --project bond-calculator-pl --region europe-central2 --port 8080
```

The proxy uses the active `gcloud` account to authenticate requests to the private Cloud Run service.

## Prerequisites

Authenticate with Google Cloud:

```bash
gcloud auth login
gcloud config set project bond-calculator-pl
```

Your account must have Cloud Run Invoker on the service:

```bash
gcloud run services add-iam-policy-binding obligacje-calculator \
  --project bond-calculator-pl \
  --region europe-central2 \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/run.invoker"
```

## Service Details

- GCP project: `bond-calculator-pl`
- Region: `europe-central2`
- Cloud Run service: `obligacje-calculator`
- Private service URL: `https://obligacje-calculator-ji72nqwtea-lm.a.run.app`

Direct browser access to the service URL returns `403` unless the request carries a valid Google identity token. Use `pnpm gcp:proxy` for manual preview testing.

## Health Checks

With the proxy running:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/readiness
```

Expected current state:

- `/api/health`: `200`
- `/api/readiness`: `503` until Google OAuth credentials are configured
- readiness database check should be `ok`

For the same smoke checks against the private deployed service, run:

```bash
pnpm ops:verify-prod -- --allow-missing-oauth
```

The verifier checks:

- `/api/health`
- `/`
- `/single-calculator`
- `/api/calculation-defaults`
- `/api/readiness`

`--allow-missing-oauth` is valid only while Google OAuth is intentionally not configured. The database readiness check must still pass.

To inspect the active Cloud Run revision without printing secret values, run:

```bash
pnpm ops:cloud-run-status
```

The command prints the service URL, latest ready revision, deployed image, traffic split, and whether each runtime environment variable is set.

## GitHub Actions Deployment Secrets

The manual `Deploy Cloud Run` workflow requires these repository secrets:

- `DATABASE_URL`
- `AUTH_SECRET`
- `SYNC_SECRET`

Optional until Google OAuth is configured:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

The workflow fails before deployment if the required secrets are missing, so it cannot silently overwrite Cloud Run with empty runtime values.

## CI/CD Flow

Use `dev` as the integration branch for ongoing work. Use `main` as the deployable branch.

Recommended flow:

1. branch from `dev` for focused changes
2. merge completed batches back into `dev`
3. open a PR from `dev` to `main` when the batch is ready
4. wait for CI to pass on `main`
5. run the manual `Deploy Cloud Run` workflow from `main`

CI runs on pushes to both `dev` and `main`, and on pull requests. Production deploys are guarded so they only run from `main`.

Recommended GitHub branch protection:

- `main`: require pull request reviews, require CI `quality` and `build`, block force pushes, block direct pushes except emergency admin fixes.
- `dev`: require CI `quality` and `build`, allow feature-branch PR merges, block force pushes.
- Production environment: require manual approval before `Deploy Cloud Run` and `Rollback Cloud Run`.

## Manual Deploy

In GitHub:

1. open `Actions`
2. select `Deploy Cloud Run`
3. choose `Run workflow`
4. select branch `main`

The deploy workflow:

- builds and pushes immutable commit-SHA and `latest` image tags
- uses GitHub Actions cache for Docker layers
- deploys the private Cloud Run service
- runs authenticated production smoke checks with `pnpm ops:verify-prod`
- writes the deployed image and service URL to the workflow summary

## Rollback

List recent revisions:

```bash
gcloud run revisions list \
  --project bond-calculator-pl \
  --region europe-central2 \
  --service obligacje-calculator
```

Then run the GitHub `Rollback Cloud Run` workflow and provide the target revision name. The workflow routes 100 percent of traffic to that revision and runs the same authenticated production verification checks.
