/**
 * testLiveOrder.js — End-to-end live test of POST /api/orders
 * This hits the ACTUAL running Express server on port 5000.
 * Run: node testLiveOrder.js
 */

const runTest = async () => {
    const body = JSON.stringify({
        items: [{ productId: 1, name: 'Test Watch', quantity: 2, price: 120 }],
        totalAmount: 240,
        customerName: 'Test Customer',
        phone: '98765432',
        address: '123 Test Street, HK',
        remarks: 'Live API test order'
    });

    console.log('Sending POST /api/orders...\n');

    const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });

    const text = await response.text();
    console.log('HTTP Status:', response.status);
    console.log('Response:', text);

    if (response.status === 201) {
        console.log('\n✅ ORDER SUCCESS — Check Google Sheet "工作表1" for new row!');
    } else {
        console.log('\n❌ ORDER FAILED — See response above for details.');
    }
};

runTest().catch(e => console.error('Test error:', e.message));
