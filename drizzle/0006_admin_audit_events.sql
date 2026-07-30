CREATE TABLE IF NOT EXISTS "admin_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" text NOT NULL,
  "actor_email" text,
  "request_id" text,
  "detail" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "admin_audit_events_created_at_idx"
  ON "admin_audit_events" ("created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_events_request_id_idx"
  ON "admin_audit_events" ("request_id");
