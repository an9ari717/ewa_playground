-- === Add human-friendly code to Request and RequestType, and the counter table ===

-- 1) RequestType.code (short prefix like IT, HR, FIN). Nullable now; we'll backfill then tighten later.
ALTER TABLE "public"."RequestType"
ADD COLUMN IF NOT EXISTS "code" TEXT;

-- unique index for the short code (deferred until after backfill if you prefer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='RequestType_code_key'
  ) THEN
    CREATE UNIQUE INDEX "RequestType_code_key" ON "public"."RequestType"("code");
  END IF;
END$$;

-- 2) Request.publicCode (the readable request id like IT-25-0007). Nullable now; we'll backfill then tighten later.
ALTER TABLE "public"."Request"
ADD COLUMN IF NOT EXISTS "publicCode" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='Request_publicCode_key'
  ) THEN
    CREATE UNIQUE INDEX "Request_publicCode_key" ON "public"."Request"("publicCode");
  END IF;
END$$;

-- 3) Counter table for per-type, per-year sequences (scope = 'IT-25', 'HR-25', ...)
CREATE TABLE IF NOT EXISTS "public"."RequestCodeCounter" (
  "scope" TEXT PRIMARY KEY,
  "last"  INTEGER NOT NULL DEFAULT 0
);
