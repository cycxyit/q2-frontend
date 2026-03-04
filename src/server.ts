import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import settingsRoutes from './routes/settings.routes';
import { initDb } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 🛡️ Global Crash Prevention Helpers
// ==========================================
process.on('uncaughtException', (err) => {
    console.error('🔥 [CRITICAL] Uncaught Exception:', err);
    // Keep the process alive or gracefully shut down
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep the process alive so other API requests don't get ERR_CONNECTION_REFUSED
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'OK', message: 'E-commerce API is running' });
});

app.get('/', (req: express.Request, res: express.Response) => {
    res.json({ message: 'Qbit E-commerce API is Active. Welcome to the backend!' });
});

// Create database tables asynchronously (Serverless safe)
initDb().catch(err => {
    console.error('Failed to initialize database:', err);
});

// Start the server locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running locally on port ${PORT}`);
    });
}

// ⚠️ REQUIRED FOR VERCEL SERVERLESS: Export the Express app
export default app;
