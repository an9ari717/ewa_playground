// src/services/inbox.service.js
export async function getInbox({ prisma, role, userId }) {
  const stage = String(role).toUpperCase(); // "MANAGER" | "DIRECTOR" | "ADMIN"

  return prisma.requestAssignee.findMany({
    where: {
      active: true,          // only current assignee
      stage,                 // match role's stage
      userId,                // assigned to this approver
      request: {
        isActive: true,      // request still in-flight
        status: { in: ['PENDING', 'IN_REVIEW'] }
      }
    },
    orderBy: { id: 'asc' },
    include: {
      request: true          // include request details for the UI
    }
  });
}
