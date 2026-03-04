import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────
// The Google Sheet only has one tab: "工作表1" (default Chinese name).
// Orders go to: 工作表1 (the existing tab)
// Products go to: 产品 (auto-created if missing)
//
// If you rename tabs in Google Sheets, update ORDERS_TAB and PRODUCTS_TAB below.
// ─────────────────────────────────────────────────────────
const ORDERS_TAB = '工作表1';
const PRODUCTS_TAB = '产品';

const getSheets = async () => {
    const credentialsPath = path.join(__dirname, '../../credentials.json');

    if (!fs.existsSync(credentialsPath)) {
        throw new Error('Missing credentials.json. Please follow README setup instructions.');
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
        throw new Error('Missing SPREADSHEET_ID in .env file');
    }

    return { sheets, spreadsheetId };
};

/**
 * Ensure a sheet tab with the given title exists.
 * If it doesn't exist, it will be created automatically.
 */
const ensureTabExists = async (
    sheets: any,
    spreadsheetId: string,
    tabTitle: string
) => {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTabs: string[] = spreadsheet.data.sheets.map(
        (s: any) => s.properties.title
    );

    if (!existingTabs.includes(tabTitle)) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: tabTitle },
                        },
                    },
                ],
            },
        });
        console.log(`[GoogleSheets] Created new tab: "${tabTitle}"`);
    }
};

/**
 * Appends a new order row to the Orders tab ("工作表1").
 * Columns: [OrderID, Date, UserEmail, Phone, Address, Items, TotalAmount, Status, Remarks]
 */
export const appendOrderToSheet = async (values: any[]) => {
    const { sheets, spreadsheetId } = await getSheets();

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${ORDERS_TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });

    console.log('[GoogleSheets] ✅ Order row appended to sheet successfully.');
};

/**
 * Appends a new product row to the Products tab ("产品").
 * Columns: [ID, Name, Description, Price, Stock, DateAdded]
 * Auto-creates the "产品" tab if it does not exist.
 */
export const appendProductToSheet = async (product: {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
}) => {
    const { sheets, spreadsheetId } = await getSheets();

    await ensureTabExists(sheets, spreadsheetId, PRODUCTS_TAB);

    const dateStr = new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${PRODUCTS_TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                product.id,
                product.name,
                product.description,
                `$${product.price}`,
                product.stock,
                dateStr,
            ]],
        },
    });

    console.log(`[GoogleSheets] ✅ Product "${product.name}" (ID: ${product.id}) appended to "${PRODUCTS_TAB}" tab.`);
};
