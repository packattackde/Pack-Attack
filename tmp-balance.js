const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.shop.findMany({ select: { id: true, name: true, coinBalance: true } })
  .then(s => { console.log(JSON.stringify(s, null, 2)); return p.$disconnect(); })
  .catch(e => { console.error(e); return p.$disconnect(); });
