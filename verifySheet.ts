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
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const tabs = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
        console.log("All Tabs:", tabs);

        for (const tab of tabs) {
            const r = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${tab}!A1:Z`,
            });
            const rData = r.data.values || [];
            console.log(`Tab ${tab} has ${rData.length} rows.`);
            const ords = rData.map((row, i) => ({ i: i + 1, r: row })).filter(x => x.r[0]?.startsWith && x.r[0].startsWith('ORD-'));
            console.log(`Tab ${tab} has ${ords.length} orders. Last order at index:`, ords.slice(-1).map(x => x.i));
        }

    } catch (e) {
        console.error("❌ Failed:", e);
    }
};

run();
