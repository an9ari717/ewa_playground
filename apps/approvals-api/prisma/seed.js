const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Users
  const [isa, managerAli, directorSara, admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'isa@ewa.local' },
      update: {},
      create: { email: 'isa@ewa.local', name: 'Isa', role: 'EMPLOYEE' },
    }),
    prisma.user.upsert({
      where: { email: 'manager_ali@ewa.local' },
      update: {},
      create: { email: 'manager_ali@ewa.local', name: 'Manager Ali', role: 'MANAGER' },
    }),
    prisma.user.upsert({
      where: { email: 'director_sara@ewa.local' },
      update: {},
      create: { email: 'director_sara@ewa.local', name: 'Director Sara', role: 'DIRECTOR' },
    }),
    prisma.user.upsert({
      where: { email: 'admin@ewa.local' },
      update: {},
      create: { email: 'admin@ewa.local', name: 'Admin', role: 'ADMIN' },
    }),
  ]);

  // Request Type + Steps
  const leave = await prisma.requestType.upsert({
    where: { key: 'LEAVE' },
    update: {},
    create: { key: 'LEAVE', name: 'Leave Request' },
  });

  const defs = [
    { order: 1, requiredRole: 'MANAGER', name: 'Manager Review' },
    { order: 2, requiredRole: 'DIRECTOR', name: 'Director Review' },
  ];
  for (const s of defs) {
    await prisma.approvalStep.upsert({
      where: { typeId_order: { typeId: leave.id, order: s.order } },
      update: { name: s.name, requiredRole: s.requiredRole },
      create: { typeId: leave.id, order: s.order, name: s.name, requiredRole: s.requiredRole },
    });
  }

  // Sample Request
  const request = await prisma.request.create({
    data: {
      typeId: leave.id,
      title: 'Annual Leave - 5 days',
      payload: { from: '2025-10-20', to: '2025-10-24', reason: 'Family' },
      requesterId: isa.id,
      status: 'PENDING',
      history: { create: { step: 'Created', by: 'isa', comment: '' } },
    },
    include: { type: { include: { steps: true } } },
  });

  // Create pending approvals for each step
  const orderedSteps = request.type.steps.sort((a, b) => a.order - b.order);
  for (const st of orderedSteps) {
    await prisma.approval.create({ data: { requestId: request.id, stepId: st.id } });
  }

  console.log('Seed complete:', { requestId: request.id });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
