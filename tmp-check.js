const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const assigned = await p.order.findMany({
    where: { assignedShopId: { not: null } },
    include: {
      assignedShop: { select: { id: true, name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  console.log("ASSIGNED ORDERS:", assigned.length);
  for (const o of assigned) {
    console.log(
      " Order", o.id.slice(-8),
      "| Status:", o.status,
      "| Shop:", o.assignedShop?.name,
      "| Customer:", o.shippingName,
      "| Assigned:", o.assignedAt
    );
  }
  const allOrders = await p.order.count();
  const pendingOrders = await p.order.count({ where: { status: "PENDING" } });
  console.log("TOTAL ORDERS:", allOrders, "| PENDING:", pendingOrders);
  await p.$disconnect();
})();
