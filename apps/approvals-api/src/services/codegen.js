// src/services/codegen.js
// CommonJS version so it works with `require(...)` in app.js

/**
 * issuePublicCode
 *
 * Generates a human-friendly code like:  LV-25-0001, IT-25-0007
 *
 * Rules:
 * - Uses RequestType.code (e.g. "LV", "IT", "PRC")
 * - Uses current year short form (YY), e.g. 2025 -> "25"
 * - Uses a per-scope counter stored in RequestCodeCounter
 *   scope = `${code}-${yy}`  e.g. "LV-25"
 */
async function issuePublicCode(prisma, requestTypeId) {
  // 1) Load the request type + its short code
  const rt = await prisma.requestType.findUnique({
    where: { id: requestTypeId },
    select: { code: true },
  });

  if (!rt || !rt.code) {
    throw new Error(
      `Cannot issue public code: RequestType ${requestTypeId} has no short code (code field is null)`
    );
  }

  const shortCode = rt.code; // e.g. "LV"
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2); // "2025" -> "25"

  // 2) Build scope: "LV-25"
  const scope = `${shortCode}-${yy}`;

  // 3) Increment per-scope counter atomically
  const counter = await prisma.requestCodeCounter.upsert({
    where: { scope },
    update: {
      last: { increment: 1 },
    },
    create: {
      scope,
      last: 1,
    },
  });

  const seq = counter.last; // already incremented
  const seqStr = String(seq).padStart(4, "0"); // 1 -> "0001"

  // 4) Final code: e.g. "LV-25-0001"
  return `${shortCode}-${yy}-${seqStr}`;
}

module.exports = {
  issuePublicCode,
};
