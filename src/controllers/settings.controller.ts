import { Request, Response } from 'express';
import db from '../config/db';

export const getSetting = async (req: Request, res: Response) => {
    try {
        const key = req.params.key as string;
        const result = await db.execute({
            sql: 'SELECT * FROM Setting WHERE key = ?',
            args: [key]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Setting not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('[getSetting] Error:', error);
        res.status(500).json({ message: 'Error fetching setting' });
    }
};

export const upsertSetting = async (req: Request, res: Response) => {
    try {
        const key = req.params.key as string;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ message: 'Missing value field' });
        }

        await db.execute({
            sql: `
                INSERT INTO Setting (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP
            `,
            args: [key, value]
        });

        res.json({ key, value });
    } catch (error: any) {
        console.error('[upsertSetting] Error:', error);
        res.status(500).json({ message: 'Error updating setting', error: error?.message || String(error) });
    }
};
