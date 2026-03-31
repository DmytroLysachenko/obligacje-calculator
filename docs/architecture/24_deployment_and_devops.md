# 24. Deployment & DevOps

Our infrastructure is designed for high performance, low cost, and zero-downtime updates.

## 1. Hosting Environment
- **Platform:** Vercel (for Next.js).
- **Benefits:** Global Edge Network, Instant Rollbacks, and Built-in Image Optimization.
- **Region:** `fra1` (Frankfurt) to minimize latency for Polish users.

## 2. CI/CD Pipeline (GitHub Actions)
1.  **Lint & Format:** Run Prettier and ESLint.
2.  **Test:** Run Vitest unit tests and Playwright E2E tests.
3.  **Audit:** Run the financial correctness audit.
4.  **Build:** Compile Next.js and the `finance-core` package.
5.  **Preview:** Deploy to a unique "Preview URL" for every Pull Request.
6.  **Deploy:** Push to Production on Merge to `main`.

## 3. Database Management
- **Provider:** Neon (Serverless Postgres) or Supabase.
- **Migration:** Drizzle Kit runs migrations during the build step.
- **Backups:** Daily automated snapshots.

## 4. Monitoring & Observability
- **Error Tracking:** Sentry (captures both frontend and backend errors).
- **Logging:** Logtail or Vercel Logs.
- **Uptime:** BetterStack or Checkly monitoring the `/api/health` endpoint.
- **Analytics:** Plausible Analytics for privacy-conscious usage tracking.

## 5. Caching Strategy
- **Static Assets:** Cached forever on Vercel Edge.
- **Historical Data API:** Stale-While-Revalidate (SWR) with a 24-hour TTL.
- **GUS/NBP Data:** Cached in the database; revalidated only once a day.

## 6. Infrastructure as Code (IaC)
- Any complex cloud resources (e.g., S3 buckets for exports) are managed via Terraform or Pulumi to ensure reproducibility.
