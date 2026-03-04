require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.product.findMany({ where: { isActive: true } })
    .then(r => {
        console.log('OK - products in DB:', r.length);
        p.$disconnect();
    })
    .catch(e => {
        console.error('ERROR:', e.message);
        p.$disconnect();
    });
