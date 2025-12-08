// CommonJS backfill script (no ESM imports)
// Run: node scripts/backfill_publiccode.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Local copy of the generator (same logic, CJS-friendly)
async function issuePublicCodeLocal(tx, requestTypeId) {
  // 1) get short code from RequestType (e.g., IT/LV/PRC)
  const type = await tx.requestType.findUnique({
    where: { id: requestTypeId },
    select: { code: true },
  });
  if (!type || !type.code) {
    throw new Error("RequestType.code is missing for typeId=" + requestTypeId);
  }

  // 2) scope "IT-25"
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const scope = `${type.code}-${yy}`;

  // 3) atomic increment of RequestCodeCounter
  const rows = await tx.$queryRawUnsafe(
    `
    INSERT INTO "public"."RequestCodeCounter"("scope","last")
    VALUES ($1, 1)
    ON CONFLICT ("scope")
    DO UPDATE SET "last" = "public"."RequestCodeCounter"."last" + 1
    RETURNING "last";
    `,
    scope
  );

  const last = Array.isArray(rows) ? rows[0]?.last : rows?.last;
  if (!last) throw new Error("Failed to increment RequestCodeCounter for scope " + scope);

  const nnnn = String(last).padStart(4, "0");
  return `${type.code}-${yy}-${nnnn}`;
}

async function run() {
  const missing = await prisma.request.findMany({
    where: { publicCode: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, typeId: true },
  });

  console.log(`Found ${missing.length} requests missing publicCode.`);
  let i = 0;

  for (const r of missing) {
    i++;
    try {
      // use a transaction per row to keep counters consistent if something fails
      const code = await prisma.$transaction(async (tx) => {
        const publicCode = await issuePublicCodeLocal(tx, r.typeId);
        await tx.request.update({
          where: { id: r.id },
          data: { publicCode },
        });
        return publicCode;
      });

      console.log(`[${i}/${missing.length}] ${r.id} → ${code}`);
    } catch (err) {
      console.error(`[${i}] Failed for ${r.id}: ${err.message}`);
    }
  }

  console.log("Backfill complete ✅");
}

run()
  .catch((e) => {
    console.error("Script error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
