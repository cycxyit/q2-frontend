/**
 * testOrderSheet.js — Tests that an order row can be appended to Google Sheets.
 * Run: node testOrderSheet.js
 */
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const ORDERS_TAB = '工作表1';

async function testWrite() {
    console.log('=== Google Sheets Order Write Test ===\n');

    const credentialsPath = path.join(__dirname, 'credentials.json');
    console.log('credentials.json path:', credentialsPath);
    console.log('exists:', fs.existsSync(credentialsPath));
    console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID);
    console.log('ORDERS_TAB:', ORDERS_TAB);
    console.log('');

    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 1. List all tabs first
    const spr = await sheets.spreadsheets.get({ spreadsheetId: process.env.SPREADSHEET_ID });
    const tabs = spr.data.sheets.map(s => s.properties.title);
    console.log('Sheet tabs found:', tabs);
    console.log('Target tab exists?', tabs.includes(ORDERS_TAB));
    console.log('');

    // 2. Attempt to write
    const testRow = [
        'ORD-TEST-9999',
        new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }),
        'test@test.com',
        '98765432',
        'Test Address HK',
        'Test Watch x1, Headphones x2',
        '$549',
        'New Order',
        'Automated test'
    ];

    console.log('Writing row:', testRow);
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `${ORDERS_TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [testRow] },
    });

    console.log('\n✅ SUCCESS — Order row written to Google Sheets!');
    console.log(`Check the "${ORDERS_TAB}" tab in your spreadsheet.`);
}

testWrite().catch(e => {
    console.error('\n❌ FAILED:', e.message);
    if (e.errors) console.error('Details:', JSON.stringify(e.errors, null, 2));
});
