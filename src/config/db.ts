import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in the .env file.");
    process.exit(1);
}

const db = createClient({
    url,
    authToken,
});

export const initDb = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS User (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'CUSTOMER',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS Product (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                price REAL NOT NULL,
                stock INTEGER DEFAULT 0,
                sold INTEGER DEFAULT 0,
                imageUrl TEXT,
                images TEXT,
                isActive BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS Setting (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('[DB] Turso database connection and structures initialized.');

        // Seed default admin account
        const adminCheck = await db.execute("SELECT * FROM User WHERE email = 'admin@qbit.com'");
        if (adminCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.execute({
                sql: "INSERT INTO User (email, password, role) VALUES (?, ?, 'ADMIN')",
                args: ['admin@qbit.com', hashedPassword]
            });
            console.log('[DB] Default admin seeded (admin@qbit.com / admin123)');
        }

    } catch (error) {
        console.error('[DB] Failed to initialize database structures:', error);
        throw error;
    }
};

export default db;
