const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// helper: create/update a request type and its ordered steps (includes short code)
async function ensureTypeWithSteps({ key, name, code, departmentId, steps }) {
  const type = await prisma.requestType.upsert({
    where: { key },
    update: { name, code, departmentId },
    create: { key, name, code, departmentId },
  });

  // ensure steps (schema has @@unique([typeId, order]))
  for (const s of steps) {
    await prisma.approvalStep.upsert({
      where: {
        typeId_order: {
          typeId: type.id,
          order: s.order,
        },
      },
      update: {
        name: s.name,
        requiredRole: s.requiredRole,
      },
      create: {
        typeId: type.id,
        order: s.order,
        name: s.name,
        requiredRole: s.requiredRole,
      },
    });
  }

  return type;
}

async function main() {
  // 0) Departments (HR, IT, Finance, Admin)
  const [hrDept, itDept, financeDept, adminDept] = await Promise.all([
    prisma.department.upsert({
      where: { name: "HR" },
      update: {},
      create: {
        name: "HR",
        description: "Human Resources Department",
      },
    }),
    prisma.department.upsert({
      where: { name: "IT" },
      update: {},
      create: {
        name: "IT",
        description: "Information Technology Department",
      },
    }),
    prisma.department.upsert({
      where: { name: "Finance" },
      update: {},
      create: {
        name: "Finance",
        description: "Finance and Accounts Department",
      },
    }),
    prisma.department.upsert({
      where: { name: "Admin" },
      update: {},
      create: {
        name: "Admin",
        description: "System Administration",
      },
    }),
  ]);

  // 1) Users (now linked to departments)
  const [employeeOne, managerAli, directorSara, adminUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: "employee@demo.local" },
      update: {
        name: "Employee One",
        role: "EMPLOYEE",
        isActive: true,
        departmentId: hrDept.id,
      },
      create: {
        email: "employee@demo.local",
        name: "Employee One",
        role: "EMPLOYEE",
        isActive: true,
        departmentId: hrDept.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager_ali@demo.local" },
      update: {
        name: "Manager Ali",
        role: "MANAGER",
        isActive: true,
        departmentId: hrDept.id,
      },
      create: {
        email: "manager_ali@demo.local",
        name: "Manager Ali",
        role: "MANAGER",
        isActive: true,
        departmentId: hrDept.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "director_sara@demo.local" },
      update: {
        name: "Director Sara",
        role: "DIRECTOR",
        isActive: true,
        departmentId: hrDept.id,
      },
      create: {
        email: "director_sara@demo.local",
        name: "Director Sara",
        role: "DIRECTOR",
        isActive: true,
        departmentId: hrDept.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@demo.local" },
      update: {
        name: "Admin User",
        role: "ADMIN",
        isActive: true,
        departmentId: adminDept.id,
      },
      create: {
        email: "admin@demo.local",
        name: "Admin User",
        role: "ADMIN",
        isActive: true,
        departmentId: adminDept.id,
      },
    }),
  ]);

  // 2) Shared approval steps
  const commonSteps = [
    { order: 1, requiredRole: "MANAGER", name: "Manager Review" },
    { order: 2, requiredRole: "DIRECTOR", name: "Director Review" },
  ];

  // 3) Request types linked to departments
  const leaveType = await ensureTypeWithSteps({
    key: "LEAVE",
    name: "Leave Request",
    code: "LV",
    departmentId: hrDept.id,     // 🔗 belongs to HR
    steps: commonSteps,
  });

  await ensureTypeWithSteps({
    key: "IT_SUPPORT",
    name: "IT Support",
    code: "IT",
    departmentId: itDept.id,     // 🔗 belongs to IT
    steps: commonSteps,
  });

  await ensureTypeWithSteps({
    key: "PROCUREMENT",
    name: "Procurement",
    code: "PRC",
    departmentId: financeDept.id, // 🔗 belongs to Finance
    steps: commonSteps,
  });

  // 4) Sample request
  const reqRecord = await prisma.request.create({
    data: {
      typeId: leaveType.id,
      title: "Annual Leave - 5 days",
      payload: {
        from: "2025-10-20",
        to: "2025-10-24",
        reason: "Family",
      },
      requesterId: employeeOne.id,
      status: "PENDING",
      isActive: true,
      history: {
        create: {
          step: "Created",
          by: employeeOne.email,
          role: "EMPLOYEE",
          comment: "Initial submission",
        },
      },
    },
    include: {
      type: { include: { steps: true } },
    },
  });

  // 5) Create Approval rows
  const orderedSteps = reqRecord.type.steps.sort((a, b) => a.order - b.order);

  for (const st of orderedSteps) {
    await prisma.approval.create({
      data: {
        requestId: reqRecord.id,
        stepId: st.id,
        approved: null,
        comment: null,
        actedAt: null,
      },
    });
  }

  // 6) Assign approvers
  await prisma.requestAssignee.createMany({
    data: [
      { requestId: reqRecord.id, userId: managerAli.id, stage: "MANAGER", active: true },
      { requestId: reqRecord.id, userId: directorSara.id, stage: "DIRECTOR", active: false },
      { requestId: reqRecord.id, userId: adminUser.id, stage: "ADMIN", active: false },
    ],
  });

  console.log("Seed complete ✅");

  console.table([
    { role: "EMPLOYEE", email: employeeOne.email, id: employeeOne.id, department: "HR" },
    { role: "MANAGER",  email: managerAli.email,  id: managerAli.id,  department: "HR" },
    { role: "DIRECTOR", email: directorSara.email, id: directorSara.id, department: "HR" },
    { role: "ADMIN",    email: adminUser.email,   id: adminUser.id,   department: "Admin" },
  ]);

  console.log("Departments:", {
    HR: hrDept.id,
    IT: itDept.id,
    Finance: financeDept.id,
    Admin: adminDept.id,
  });

  console.log("Example request id:", reqRecord.id);
}

main()
  .catch((e) => {
    console.error("Seed error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
