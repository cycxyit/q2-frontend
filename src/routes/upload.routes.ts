import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save files to the `img` folder in the backend root
        cb(null, path.join(__dirname, '../../img'));
    },
    filename: (req, file, cb) => {
        // Generate a unique filename: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

// Endpoint to handle multiple image uploads at once (up to 10)
router.post('/', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }

        const files = req.files as Express.Multer.File[];

        // Map the saved files to their publicly accessible URLs
        const fileUrls = files.map(file => {
            return `http://localhost:5000/img/${file.filename}`;
        });

        res.status(200).json({
            message: 'Files uploaded successfully',
            urls: fileUrls
        });
    } catch (error: any) {
        console.error('[Upload] Error:', error);
        res.status(500).json({ message: 'Error uploading files', error: error?.message });
    }
});

export default router;
