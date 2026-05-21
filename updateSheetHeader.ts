import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
require('dotenv').config();

const ORDERS_TAB = '工作表1';

const getSheets = async () => {
    const credentialsPath = path.join(__dirname, 'credentials.json');

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

const run = async () => {
    try {
        const { sheets, spreadsheetId } = await getSheets();

        // Fetch row 1
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${ORDERS_TAB}!A1:Z1`,
        });

        let headers = res.data.values ? res.data.values[0] : [];

        // We expect Remarks to be at index 8 (9th column).
        // Let's set Tuition Branch to index 9 (10th column).
        console.log("Current headers:", headers);

        if (headers.length >= 8) {
            headers[9] = 'Tuition Branch';
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${ORDERS_TAB}!A1:J1`,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [headers] }
            });
            console.log("✅ Successfully updated row 1 of the Google Sheet to include 'Tuition Branch' as the 10th column.");
        } else {
            console.log("⚠️ Could not find enough headers to safely append Tuition Branch.");
        }
    } catch (e) {
        console.error("❌ Failed to update sheet:", e);
    }
};

run();
