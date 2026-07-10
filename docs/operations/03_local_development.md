# Local Development Workflow

WSL 2 with Docker Desktop WSL integration is the recommended local development
path. Windows-native `pnpm` commands remain supported as a fallback, but Linux
filesystem paths inside WSL give more predictable file watching and Docker
volume behavior.

## Recommended WSL Setup

1. Clone or move the repository under the WSL filesystem, for example
   `~/projects/obligacje-calculator`.
2. Enable Docker Desktop integration for the selected WSL distribution.
3. Install Taskfile from <https://taskfile.dev> or use the equivalent commands
   shown in `Taskfile.yml`.
4. Run:

```bash
task setup
task dev
```

The default Compose stack starts:

- `app` on `http://localhost:3000`
- local Postgres on `localhost:5432`
- named volumes for `node_modules`, `.next`, and database storage

## Host Fallback

For Windows-native or direct host work:

```bash
corepack enable
HUSKY=0 pnpm install --frozen-lockfile
pnpm dev
```

Use `.env.example` as the no-secret template. Do not commit `.env`,
`.env.local`, Neon connection strings, OAuth secrets, or Cloud Run credentials.

## Common Tasks

```bash
task dev:container      # Compose app + local Postgres
task dev:host           # Next.js directly on the host
task db:up              # local Postgres only
task db:migrate         # apply Drizzle schema to local Postgres
task db:seed            # seed local reference data
task smoke:container    # verify local app routes
task docker:build       # production Dockerfile build
task gcp:proxy          # authenticated private Cloud Run preview
```

`task db:reset-local` is destructive by design: it removes the local Compose
database volume and reapplies the schema. Use it only for local throwaway data.

## Local Smoke Checks

With the Compose app running:

```bash
task smoke:container
```

The smoke script checks:

- `/`
- `/single-calculator`
- `/api/health`
- `/api/calculation-defaults`

Run the broader browser gate with:

```bash
task smoke
```
