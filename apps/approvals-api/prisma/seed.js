const { PrismaClient, Role, RequestStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 1. Create / upsert users (no passwordHash for now)
  const [employeeOne, managerAli, directorSara, adminUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'employee@demo.local' },
      update: {
        name: 'Employee One',
        role: 'EMPLOYEE',
        isActive: true,
      },
      create: {
        email: 'employee@demo.local',
        name: 'Employee One',
        role: 'EMPLOYEE',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager_ali@demo.local' },
      update: {
        name: 'Manager Ali',
        role: 'MANAGER',
        isActive: true,
      },
      create: {
        email: 'manager_ali@demo.local',
        name: 'Manager Ali',
        role: 'MANAGER',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'director_sara@demo.local' },
      update: {
        name: 'Director Sara',
        role: 'DIRECTOR',
        isActive: true,
      },
      create: {
        email: 'director_sara@demo.local',
        name: 'Director Sara',
        role: 'DIRECTOR',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@demo.local' },
      update: {
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        email: 'admin@demo.local',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      },
    }),
  ]);

  // 2. Make sure we have a RequestType (example: LEAVE)
  const leaveType = await prisma.requestType.upsert({
    where: { key: 'LEAVE' },
    update: {},
    create: {
      key: 'LEAVE',
      name: 'Leave Request',
    },
  });

  // 3. Ensure approval steps for that type:
  // order 1 -> MANAGER, order 2 -> DIRECTOR
  const stepDefs = [
    { order: 1, requiredRole: 'MANAGER', name: 'Manager Review' },
    { order: 2, requiredRole: 'DIRECTOR', name: 'Director Review' },
  ];

  for (const s of stepDefs) {
    await prisma.approvalStep.upsert({
      where: {
        // this works because schema.prisma has @@unique([typeId, order])
        typeId_order: {
          typeId: leaveType.id,
          order: s.order,
        },
      },
      update: {
        name: s.name,
        requiredRole: s.requiredRole,
      },
      create: {
        typeId: leaveType.id,
        order: s.order,
        name: s.name,
        requiredRole: s.requiredRole,
      },
    });
  }

  // 4. Create one sample request by the employee
  const reqRecord = await prisma.request.create({
    data: {
      typeId: leaveType.id,
      title: 'Annual Leave - 5 days',
      payload: {
        from: '2025-10-20',
        to: '2025-10-24',
        reason: 'Family',
      },
      requesterId: employeeOne.id,
      status: 'PENDING',
      isActive: true,
      history: {
        create: {
          step: 'Created',
          by: employeeOne.email,
          role: 'EMPLOYEE',
          comment: 'Initial submission',
        },
      },
    },
    include: {
      type: {
        include: {
          steps: true,
        },
      },
    },
  });

  // 5. Create Approval rows for each step (approved = null for now)
  const orderedSteps = reqRecord.type.steps.sort((a, b) => a.order - b.order);

  for (const st of orderedSteps) {
    await prisma.approval.create({
      data: {
        requestId: reqRecord.id,
        stepId: st.id,
        // approverId will be filled when that stage actually acts
        approved: null,
        comment: null,
        actedAt: null,
      },
    });
  }

  // 6. Create RequestAssignee records to control inbox visibility
  // Manager is active now. Director and Admin are waiting.
  await prisma.requestAssignee.createMany({
    data: [
      {
        requestId: reqRecord.id,
        userId: managerAli.id,
        stage: 'MANAGER',
        active: true, // manager should currently see it
      },
      {
        requestId: reqRecord.id,
        userId: directorSara.id,
        stage: 'DIRECTOR',
        active: false,
      },
      {
        requestId: reqRecord.id,
        userId: adminUser.id,
        stage: 'ADMIN',
        active: false,
      },
    ],
  });

  console.log('Seed complete ✅');
  console.table([
    {
      role: 'EMPLOYEE',
      email: employeeOne.email,
      id: employeeOne.id,
    },
    {
      role: 'MANAGER',
      email: managerAli.email,
      id: managerAli.id,
    },
    {
      role: 'DIRECTOR',
      email: directorSara.email,
      id: directorSara.id,
    },
    {
      role: 'ADMIN',
      email: adminUser.email,
      id: adminUser.id,
    },
  ]);

  console.log('Example request id:', reqRecord.id);
}

main()
  .catch((e) => {
    console.error('Seed error ❌', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
