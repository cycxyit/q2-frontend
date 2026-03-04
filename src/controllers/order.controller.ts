import { Request, Response } from 'express';
import { appendOrderToSheet } from '../config/googleSheets';
import db from '../config/db';

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, totalAmount, remarks, phone, address, customerName } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }
        if (!phone || !address) {
            return res.status(400).json({ message: 'Phone and address are required' });
        }

        // ── Validate stock & deduct ──────────────────────────────────────────
        for (const item of items) {
            const result = await db.execute({
                sql: 'SELECT * FROM Product WHERE id = ?',
                args: [Number(item.productId)]
            });

            if (result.rows.length === 0) {
                return res.status(400).json({ message: `Product "${item.name}" is not available` });
            }

            const product = result.rows[0];

            const isActive = Boolean(product.isActive);
            const stock = Number(product.stock) || 0;

            if (!product || !isActive) {
                return res.status(400).json({ message: `Product "${item.name}" is not available` });
            }
            if (stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for "${product.name}": requested ${item.quantity}, only ${stock} left`
                });
            }
        }

        // Deduct stock and increment sold for all items
        for (const item of items) {
            await db.execute({
                sql: 'UPDATE Product SET stock = stock - ?, sold = sold + ? WHERE id = ?',
                args: [Number(item.quantity), Number(item.quantity), Number(item.productId)]
            });
        }

        // ── Write to Google Sheets ───────────────────────────────────────────
        const itemsFormatted = items.map((item: any) => `${item.name} x${item.quantity}`).join(', ');
        const orderId = `ORD-${Date.now()}`;
        const dateStr = new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });

        const rowData = [
            orderId,
            dateStr,
            customerName || 'Guest',
            phone,
            address,
            itemsFormatted,
            `$${totalAmount}`,
            'New Order',
            remarks || ''
        ];

        try {
            await appendOrderToSheet(rowData);
            console.log(`[Order] ${orderId} written to Google Sheets.`);
        } catch (sheetError: any) {
            console.error('[Order] Google Sheets FAILED:', sheetError?.message || sheetError);
            return res.status(500).json({
                message: `Failed to record order in Sheets: ${sheetError?.message || 'Unknown Sheets error'}`
            });
        }

        res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (error: any) {
        console.error('[createOrder] Unexpected error:', error);
        res.status(500).json({ message: 'Error processing order', error: error?.message || String(error) });
    }
};
