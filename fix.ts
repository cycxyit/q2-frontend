import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
require('dotenv').config();

const ORDERS_TAB = '工作表1';

const getSheets = async () => {
    const credentialsPath = path.join(__dirname, 'credentials.json');
    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    return { sheets, spreadsheetId: process.env.SPREADSHEET_ID };
};

const run = async () => {
    try {
        const { sheets, spreadsheetId } = await getSheets();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${ORDERS_TAB}!A1:Z`,
        });
        const rows = res.data.values || [];

        // Find rows starting with 'ORD-' placed after row 1000
        const orphaned = rows.map((r, i) => ({ index: i + 1, row: r })).filter(x => x.index > 500 && x.row[0]?.startsWith && x.row[0].startsWith('ORD-'));

        if (orphaned.length > 0) {
            console.log(`Found ${orphaned.length} orphaned orders at the bottom of the sheet! Moving them up...`);

            // clear them first, so append puts them at top
            for (const order of orphaned) {
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: `${ORDERS_TAB}!A${order.index}:Z${order.index}`
                });
            }

            for (const order of orphaned) {
                let newRow = [...order.row];
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `${ORDERS_TAB}!A1`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: { values: [newRow] }
                });
            }
            console.log("✅ Moved orphaned orders back to the top area.");
        } else {
            console.log("No orphaned orders found.");
        }
    } catch (e) {
        console.error("❌ Failed:", e);
    }
};

run();
