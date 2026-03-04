import { Request, Response } from 'express';
import db from '../config/db';
import { appendProductToSheet } from '../config/googleSheets';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const result = await db.execute('SELECT * FROM Product WHERE isActive = 1');
        // raw results need numeric mapping for robust response
        const products = result.rows.map((r: any) => ({
            ...r,
            isActive: Boolean(r.isActive)
        }));
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await db.execute({
            sql: 'SELECT * FROM Product WHERE id = ?',
            args: [Number(id)]
        });
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });

        const product = { ...result.rows[0], isActive: Boolean(result.rows[0].isActive) };
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        console.log('[createProduct] req.body:', JSON.stringify(req.body, null, 2));
        const { name, description, price, stock, imageUrl, images } = req.body;

        if (!name || !description || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Missing required fields: name, description, price, stock' });
        }

        // images is a JSON array of URLs; validate and cap at 10
        let imagesJson: string | null = null;
        if (images && Array.isArray(images)) {
            imagesJson = JSON.stringify(images.slice(0, 10).filter((u: any) => typeof u === 'string' && u.trim()));
        }

        const result = await db.execute({
            sql: `INSERT INTO Product (name, description, price, stock, imageUrl, images)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [name, description, Number(price), Number(stock), imageUrl || '', imagesJson]
        });

        const product = {
            id: Number(result.lastInsertRowid),
            name, description, price: Number(price), stock: Number(stock), imageUrl: imageUrl || '', images: imagesJson
        };

        // Log new product to Google Sheets (non-blocking — product creation always succeeds)
        appendProductToSheet({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
        }).catch((sheetErr) => {
            console.error('[GoogleSheets] Failed to append product to sheet:', sheetErr?.message || sheetErr);
        });

        res.status(201).json(product);
    } catch (error: any) {
        console.error('[createProduct] Error:', error);
        res.status(500).json({ message: 'Error creating product', error: error?.message || String(error) });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, imageUrl, isActive, images } = req.body;

        let imagesJson: string | undefined = undefined;
        if (images !== undefined) {
            imagesJson = Array.isArray(images)
                ? JSON.stringify(images.slice(0, 10).filter((u: any) => typeof u === 'string' && u.trim()))
                : images; // If images is not an array, assume it's already a string (JSON) or null
        }

        const result = await db.execute({
            sql: `UPDATE Product 
                  SET name = ?, description = ?, price = ?, stock = ?, imageUrl = ?, isActive = ?, images = ?, updatedAt = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [name, description, Number(price), Number(stock), imageUrl, isActive ? 1 : 0, imagesJson || null, Number(id)]
        });

        res.json({ message: 'Product updated successfully' });
    } catch (error: any) {
        console.error('[updateProduct] Error:', error);
        res.status(500).json({ message: 'Error updating product', error: error?.message || String(error) });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.execute({
            sql: 'UPDATE Product SET isActive = 0 WHERE id = ?',
            args: [Number(id)]
        });
        res.json({ message: 'Product deleted (deactivated)' });
    } catch (error: any) {
        console.error('[deleteProduct] Error:', error);
        res.status(500).json({ message: 'Error deleting product', error: error?.message || String(error) });
    }
};
