import { Request, Response } from 'express';
import db from '../config/db';

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const result = await db.execute('SELECT * FROM Announcement WHERE isActive = 1 ORDER BY createdAt DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements' });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { content, branch } = req.body;
        if (!content || !branch) return res.status(400).json({ message: 'Content and branch are required' });

        const result = await db.execute({
            sql: 'INSERT INTO Announcement (content, branch) VALUES (?, ?)',
            args: [content, branch]
        });

        res.status(201).json({ id: Number(result.lastInsertRowid), content, branch });
    } catch (error) {
        res.status(500).json({ message: 'Error creating announcement' });
    }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content, branch, isActive } = req.body;
        
        await db.execute({
            sql: 'UPDATE Announcement SET content = ?, branch = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            args: [content, branch, isActive ? 1 : 0, Number(id)]
        });

        res.json({ message: 'Announcement updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating announcement' });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.execute({
            sql: 'UPDATE Announcement SET isActive = 0 WHERE id = ?',
            args: [Number(id)]
        });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement' });
    }
};
