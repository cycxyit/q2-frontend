import { appendOrderToSheet } from './src/config/googleSheets';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const orderId = `ORD-TEST-${Date.now()}`;
        const rowData = [
            orderId,
            "Now",
            "Test Guest",
            "123",
            "Address",
            "Test Items x1",
            "$10",
            "New Order",
            "Test Remarks",
            "Test Branch"
        ];

        await appendOrderToSheet(rowData);
        console.log("Direct append successful");
    } catch (e) {
        console.error("Failed", e);
    }
}
run();
