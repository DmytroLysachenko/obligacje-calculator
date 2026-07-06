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

## GitHub Actions Deployment Secrets

The manual `Deploy Cloud Run` workflow requires these repository secrets:

- `DATABASE_URL`
- `AUTH_SECRET`
- `SYNC_SECRET`

Optional until Google OAuth is configured:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

The workflow fails before deployment if the required secrets are missing, so it cannot silently overwrite Cloud Run with empty runtime values.
