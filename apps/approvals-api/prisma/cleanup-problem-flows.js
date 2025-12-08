// prisma/cleanup-problem-flows.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanForKey(key) {
  console.log(`\n--- Cleaning approvals for request type: ${key} ---`);

  let rt = await prisma.requestType.findUnique({
    where: { key },
    include: { steps: true },
  });

  // Fallback: if LEAVE_REQUEST key is wrong, try finding by name
  if (!rt && key === "LEAVE_REQUEST") {
    console.log(
      `No request type found with key ${key}, trying name "Leave Request"...`
    );
    rt = await prisma.requestType.findFirst({
      where: { name: "Leave Request" },
      include: { steps: true },
    });
  }

  if (!rt) {
    console.log(`No request type found for key ${key} (or matching name).`);
    return;
  }

  const stepIds = rt.steps.map((s) => s.id);
  if (stepIds.length === 0) {
    console.log(`Request type ${rt.key} has no steps, nothing to clean.`);
    return;
  }

  console.log(`Cleaning steps for ${rt.key} (${rt.name}):`, stepIds);

  const deletedApprovals = await prisma.approval.deleteMany({
    where: {
      stepId: { in: stepIds },
    },
  });

  console.log(
    `Deleted ${deletedApprovals.count} approval(s) linked to ${rt.key} steps.`
  );
}

async function main() {
  // 👇 change these keys if yours are different
  const keysToClean = ["IT_SUPPORT", "LEAVE_REQUEST"];

  for (const key of keysToClean) {
    await cleanForKey(key);
  }

  console.log("\nDone. You can now edit those flows from the UI.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
