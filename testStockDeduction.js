/**
 * testStockDeduction.js — Tests that stock is properly deducted when ordering.
 * Run: node testStockDeduction.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Find first active product
    const product = await prisma.product.findFirst({ where: { isActive: true } });
    if (!product) { console.error('No products in DB! Add a product first.'); return; }

    console.log(`Testing with product: "${product.name}" (ID: ${product.id})`);
    console.log(`Stock BEFORE order: ${product.stock}  |  Sold BEFORE: ${product.sold ?? 'N/A (field missing?)'}`);
    console.log('');

    // 2. POST order to live API
    const body = JSON.stringify({
        items: [{ productId: product.id, name: product.name, quantity: 1, price: product.price }],
        totalAmount: product.price,
        customerName: 'Stock Test',
        phone: '12341234',
        address: 'Test Address',
        remarks: 'Stock deduction test'
    });

    const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    const data = await res.json();
    console.log('Order API response:', res.status, JSON.stringify(data));
    console.log('');

    // 3. Re-fetch product from DB to verify stock changed
    const after = await prisma.product.findUnique({ where: { id: product.id } });
    console.log(`Stock AFTER  order: ${after.stock}  |  Sold AFTER: ${after.sold ?? 'N/A'}`);

    if (after.stock < product.stock) {
        console.log('\n✅ Stock deduction WORKS!');
    } else {
        console.log('\n❌ Stock was NOT deducted — check backend controller.');
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
