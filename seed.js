/**
 * seed.js — Creates the initial ADMIN user.
 * Run once after `prisma db push` to set up the database.
 *
 * Usage: node seed.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@qbit.com';
const ADMIN_PASSWORD = 'admin123456';

async function main() {
    console.log('Seeding database...\n');

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
        console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
        console.log('To reset the password, delete the user from the database and run this script again.');
        return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'ADMIN',
        }
    });

    console.log('Admin user created successfully!');
    console.log('----------------------------------');
    console.log('Email:   ', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Role:    ', admin.role);
    console.log('ID:      ', admin.id);
    console.log('----------------------------------');
    console.log('Go to the admin login page and sign in with the credentials above.');
    console.log('IMPORTANT: Change the password after first login in a production environment!');
}

main()
    .catch(e => console.error('Seed failed:', e.message))
    .finally(() => prisma.$disconnect());
