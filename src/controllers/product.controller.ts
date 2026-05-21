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

        const normalizeUrl = (u: any): string | null => {
            if (typeof u !== 'string') return null;
            let s = u.trim();
            if (!s) return null;
            const first = s[0];
            const last = s[s.length - 1];
            if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`')) {
                s = s.slice(1, -1).trim();
            }
            while (s.endsWith('.')) s = s.slice(0, -1);
            return s || null;
        };

        // images is a JSON array of URLs; validate and cap at 10
        let normalizedImages: string[] = [];
        if (images && Array.isArray(images)) {
            const seen = new Set<string>();
            for (const u of images.slice(0, 10)) {
                const nu = normalizeUrl(u);
                if (!nu) continue;
                if (seen.has(nu)) continue;
                seen.add(nu);
                normalizedImages.push(nu);
            }
        }
        const imagesJson: string | null = normalizedImages.length ? JSON.stringify(normalizedImages) : null;
        const effectiveImageUrl = normalizeUrl(imageUrl) || normalizedImages[0] || '';

        const result = await db.execute({
            sql: `INSERT INTO Product (name, description, price, stock, imageUrl, images)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [name, description, Number(price), Number(stock), effectiveImageUrl, imagesJson]
        });

        const product = {
            id: Number(result.lastInsertRowid),
            name, description, price: Number(price), stock: Number(stock), imageUrl: effectiveImageUrl, images: imagesJson
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

        const normalizeUrl = (u: any): string | null => {
            if (typeof u !== 'string') return null;
            let s = u.trim();
            if (!s) return null;
            const first = s[0];
            const last = s[s.length - 1];
            if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`')) {
                s = s.slice(1, -1).trim();
            }
            while (s.endsWith('.')) s = s.slice(0, -1);
            return s || null;
        };

        let imagesJson: string | null | undefined = undefined;
        let normalizedImages: string[] | undefined = undefined;
        if (images !== undefined) {
            if (Array.isArray(images)) {
                const seen = new Set<string>();
                normalizedImages = [];
                for (const u of images.slice(0, 10)) {
                    const nu = normalizeUrl(u);
                    if (!nu) continue;
                    if (seen.has(nu)) continue;
                    seen.add(nu);
                    normalizedImages.push(nu);
                }
                imagesJson = normalizedImages.length ? JSON.stringify(normalizedImages) : null;
            } else {
                imagesJson = images;
            }
        }

        const effectiveImageUrl =
            normalizeUrl(imageUrl) ||
            (normalizedImages && normalizedImages[0]) ||
            imageUrl ||
            '';

        const result = await db.execute({
            sql: `UPDATE Product 
                  SET name = ?, description = ?, price = ?, stock = ?, imageUrl = ?, isActive = ?, images = ?, updatedAt = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [name, description, Number(price), Number(stock), effectiveImageUrl, isActive ? 1 : 0, imagesJson || null, Number(id)]
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
