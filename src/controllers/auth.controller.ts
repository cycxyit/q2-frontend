import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        const existingUser = await db.execute({
            sql: 'SELECT * FROM User WHERE email = ?',
            args: [email]
        });
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'; // Need to protect logic if real setup, but let's allow setting via body for demo.

        const result = await db.execute({
            sql: 'INSERT INTO User (email, password, role) VALUES (?, ?, ?)',
            args: [email, hashedPassword, userRole]
        });

        res.status(201).json({ message: 'User registered successfully', userId: result.lastInsertRowid?.toString() });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await db.execute({
            sql: 'SELECT * FROM User WHERE email = ?',
            args: [email]
        });
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password as string);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.json({ token, role: user.role, email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = await db.execute({
            sql: 'SELECT id, email, role, createdAt FROM User WHERE id = ?',
            args: [req.user.id]
        });
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
